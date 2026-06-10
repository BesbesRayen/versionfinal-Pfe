package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.PaymentDto;
import com.creaditn.creaditnbackend.dto.PayAllResponse;
import com.creaditn.creaditnbackend.dto.PaymentRequest;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final InstallmentService installmentService;
    private final NotificationService notificationService;
    private final CardService cardService;
    private final CreadiScoreService creadiScoreService;
    private final WalletService walletService;
    private final TransactionService transactionService;
    private final InstallmentRepository installmentRepository;
    private final JwtUtil jwtUtil;

    @Transactional
    public PaymentDto makePayment(Long userId, PaymentRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Installment installment = installmentService.getInstallmentEntity(request.getInstallmentId());

        if (installment.getStatus() == InstallmentStatus.PAID) {
            throw new BadRequestException("Installment already paid");
        }

        if (!installment.getCreditRequest().getUser().getId().equals(userId)) {
            throw new BadRequestException("This installment does not belong to you");
        }

        cardService.getDefaultActiveCard(userId);

        BigDecimal penalty = installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO;
        BigDecimal expectedAmount = installment.getAmount().add(penalty);
        // If no amount supplied (mobile quick-pay), use the actual installment amount
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) == 0) {
            request.setAmount(expectedAmount);
        }
        if (request.getAmount().compareTo(expectedAmount) != 0) {
            throw new BadRequestException("Payment amount must exactly match installment and penalty");
        }

        walletService.debit(userId, request.getAmount());

        String txRef = "TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();

        Payment payment = Payment.builder()
                .user(user)
                .installment(installment)
                .amount(request.getAmount())
                .transactionReference(txRef)
                .paymentMethod(request.getPaymentMethod())
                .build();

        boolean paidLate = isLatePayment(installment);
        applyTrustImpact(user, installment, paidLate);

        paymentRepository.save(payment);
        installmentService.markAsPaid(installment.getId());

        // Record transaction
        transactionService.record(userId, request.getAmount(), "PAYMENT", "SUCCESS",
                "Installment payment", txRef);

        creadiScoreService.calculateScore(userId);

        notificationService.sendNotification(userId,
                "Payment Confirmed",
                "Payment of " + request.getAmount() + " DT confirmed. Receipt: " + receiptNumber(payment),
                NotificationType.PAYMENT_CONFIRMED);

        return mapToDto(payment);
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getUserPayments(Long userId) {
        return paymentRepository.findByUserIdOrderByPaidAtDesc(userId)
                .stream().map(this::mapToDto).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentDto> getUserReceipts(Long userId) {
        return getUserPayments(userId);
    }

    @Transactional
    public PayAllResponse collectOutstandingInstallmentsForAdmin(Long userId) {
        return payAllInstallmentsInternal(userId, null, "ADMIN_CARD", "ADMIN_COLLECTION",
                "Admin debt collection", "Outstanding installments collected by admin");
    }

    @Transactional
    public PayAllResponse payAllInstallments(Long userId) {
        return payAllInstallmentsInternal(userId, null, "CARD", "PAYMENT",
                "Bulk installment payment", "All your due installments have been paid successfully.");
    }

    @Transactional
    public PayAllResponse payCreditInstallments(Long userId, Long creditRequestId) {
        List<Installment> installments = installmentRepository.findByCreditRequestId(creditRequestId)
                .stream()
                .filter(installment -> installment.getCreditRequest().getUser().getId().equals(userId))
                .filter(installment -> installment.getStatus() != InstallmentStatus.PAID)
                .toList();
        if (installments.isEmpty()) {
            throw new ResourceNotFoundException("No unpaid installments found for this credit");
        }
        return payAllInstallmentsInternal(userId, installments, "CARD", "PAYMENT",
                "Credit installment payment", "All installments for this purchase have been paid successfully.");
    }

    private PayAllResponse payAllInstallmentsInternal(
            Long userId,
            List<Installment> requestedInstallments,
            String paymentMethod,
            String transactionType,
            String transactionDescription,
            String notificationMessage
    ) {
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        List<Installment> unpaidInstallments = requestedInstallments == null
                ? installmentService.getUserUnpaidInstallments(userId)
                : requestedInstallments;
        if (unpaidInstallments.isEmpty()) {
            return PayAllResponse.builder()
                .paidInstallments(0)
                .totalPaidAmount(BigDecimal.ZERO)
                .debtBefore(BigDecimal.ZERO)
                .debtAfter(BigDecimal.ZERO)
                .build();
        }

        BigDecimal debtBefore = unpaidInstallments.stream()
            .map(i -> i.getAmount().add(i.getPenalty() != null ? i.getPenalty() : BigDecimal.ZERO))
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        cardService.getDefaultActiveCard(userId);

        if (!"ADMIN_COLLECTION".equals(transactionType)) {
            walletService.debit(userId, debtBefore);
        }

        List<Payment> payments = unpaidInstallments.stream()
            .map(installment -> Payment.builder()
                .user(user)
                .installment(installment)
                .amount(installment.getAmount().add(installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO))
                .transactionReference("TXN-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase())
                .paymentMethod(paymentMethod)
                .build())
            .toList();

        unpaidInstallments.forEach(installment -> applyTrustImpact(user, installment, isLatePayment(installment)));

        paymentRepository.saveAll(payments);
        int paidCount = installmentService.markAllAsPaid(unpaidInstallments);

        // Record bulk transaction
        String bulkRef = "TXN-ALL-" + java.util.UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        transactionService.record(userId, debtBefore, transactionType, "SUCCESS",
                transactionDescription + " ("+paidCount+" installments)", bulkRef);

        creadiScoreService.calculateScore(userId);

        notificationService.sendNotification(
            userId,
            "All Installments Paid",
            notificationMessage,
            NotificationType.PAYMENT_CONFIRMED
        );

        return PayAllResponse.builder()
            .paidInstallments(paidCount)
            .totalPaidAmount(debtBefore)
            .debtBefore(debtBefore)
            .debtAfter(BigDecimal.ZERO)
            .build();
    }

    @Transactional(readOnly = true)
    public PaymentDto getPaymentByReference(String reference, Long userId) {
        Payment payment = paymentRepository.findByTransactionReference(reference)
                .orElseThrow(() -> new ResourceNotFoundException("Payment not found"));
        if (!payment.getUser().getId().equals(userId)) {
            throw new ResourceNotFoundException("Payment not found");
        }
        return mapToDto(payment);
    }

    private PaymentDto mapToDto(Payment p) {
        Installment installment = p.getInstallment();
        CreditRequest creditRequest = installment.getCreditRequest();
        return PaymentDto.builder()
                .id(p.getId())
                .userId(p.getUser().getId())
                .installmentId(installment.getId())
                .amount(p.getAmount())
                .transactionReference(p.getTransactionReference())
                .paymentMethod(p.getPaymentMethod())
                .paidAt(p.getPaidAt())
                .productName(creditRequest.getProductName() == null ? "Financement CreadiTN" : creditRequest.getProductName())
                .receiptNumber(receiptNumber(p))
                .receiptDownloadUrl("/api/payments/receipt/" + p.getId()
                        + "?token=" + jwtUtil.generateReceiptToken(p.getId(), p.getUser().getId()))
                .status("PAID")
                .installmentNumber(resolveInstallmentNumber(installment))
                .automaticPayment(isAutomaticPayment(p.getPaymentMethod()))
                .build();
    }

    private String receiptNumber(Payment payment) {
        String year = payment.getPaidAt() == null ? String.valueOf(java.time.Year.now().getValue()) : String.valueOf(payment.getPaidAt().getYear());
        return "RCPT-" + year + "-" + String.format("%06d", payment.getId() == null ? 0 : payment.getId());
    }

    private boolean isAutomaticPayment(String paymentMethod) {
        if (paymentMethod == null) {
            return false;
        }
        String normalized = paymentMethod.toUpperCase();
        return normalized.contains("AUTO") || normalized.contains("SUBSCRIPTION");
    }

    private int resolveInstallmentNumber(Installment installment) {
        List<Installment> installments = installmentRepository.findByCreditRequestId(installment.getCreditRequest().getId())
                .stream()
                .sorted(Comparator.comparing(Installment::getDueDate).thenComparing(Installment::getId))
                .toList();

        for (int i = 0; i < installments.size(); i++) {
            if (installments.get(i).getId().equals(installment.getId())) {
                return i + 1;
            }
        }

        return 1;
    }

    private boolean isLatePayment(Installment installment) {
        return installment.getStatus() == InstallmentStatus.OVERDUE || installment.getDueDate().isBefore(LocalDate.now());
    }

    private void applyTrustImpact(User user, Installment installment, boolean late) {
        int trustBonus = user.getPaymentTrustBonus() == null ? 0 : user.getPaymentTrustBonus();
        if (late) {
            if (!Boolean.TRUE.equals(installment.getLatePenaltyApplied())) {
                trustBonus -= CreadiScoreConstants.PAYMENT_TRUST_LATE_MALUS;
                installment.setLatePenaltyApplied(true);
            }
        } else {
            trustBonus += CreadiScoreConstants.PAYMENT_TRUST_ON_TIME_BONUS;
        }

        user.setPaymentTrustBonus(Math.max(
                CreadiScoreConstants.PAYMENT_TRUST_BONUS_MIN,
                Math.min(CreadiScoreConstants.PAYMENT_TRUST_BONUS_MAX, trustBonus)
        ));
        userRepository.save(user);
    }
}
