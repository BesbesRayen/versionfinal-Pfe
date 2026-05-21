package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.*;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CreditRequestRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreditService {

    private final CreditRequestRepository creditRequestRepository;
    private final UserRepository userRepository;
    private final InstallmentRepository installmentRepository;
    private final InstallmentService installmentService;
    private final NotificationService notificationService;
    private final CreadiScoreService creadiScoreService;
    private final CardService cardService;
    private final FinancialProfileService financialProfileService;

    public CreditSimulationResponse simulate(CreditSimulationRequest request) {
        return simulate(request, null);
    }

    public CreditSimulationResponse simulate(CreditSimulationRequest request, Long userId) {
        CreditCalculator.validateInstallmentDuration(request.getNumberOfInstallments());

        BigDecimal requiredDownPayment = CreditCalculator.requiredDownPayment(request.getTotalAmount());
        BigDecimal effectiveDownPayment = request.getDownPayment().max(requiredDownPayment);
        BigDecimal principal = CreditCalculator.calculatePrincipal(request.getTotalAmount(), effectiveDownPayment);
        if (principal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Down payment must be less than total amount");
        }

        BigDecimal interestAmount = CreditCalculator.calculateInterestAmount(
                request.getTotalAmount(),
                effectiveDownPayment,
                request.getNumberOfInstallments()
        );
        BigDecimal interestRate = CreditCalculator.getInterestRate(request.getNumberOfInstallments());
        BigDecimal totalRepayable = principal.add(interestAmount);
        List<BigDecimal> repaymentSchedule = CreditCalculator.calculateRepaymentSchedule(
                request.getTotalAmount(),
                effectiveDownPayment,
                request.getNumberOfInstallments()
        );
        LocalDate firstDueDate = CreditCalculator.calculateFirstDueDate(resolveSalaryDay(userId));

        return CreditSimulationResponse.builder()
                .totalAmount(request.getTotalAmount())
                .downPayment(effectiveDownPayment)
                .remainingAmount(principal)
                .interestAmount(interestAmount)
                .interestRate(interestRate)
                .totalRepayable(totalRepayable)
                .numberOfInstallments(request.getNumberOfInstallments())
                .monthlyAmount(repaymentSchedule.get(0))
                .schedule(buildPreviewSchedule(repaymentSchedule, firstDueDate))
                .build();
    }

    @Transactional
    public CreditRequestResponse createCreditRequest(Long userId, CreditRequestDto dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        CreditCalculator.validateInstallmentDuration(dto.getNumberOfInstallments());

        if (user.getKycStatus() != KycStatus.VERIFIED) {
            throw new BadRequestException("KYC must be approved before requesting credit");
        }

        if (!cardService.hasActiveCard(userId)) {
            throw new BadRequestException("Add a payment method");
        }
        cardService.getDefaultActiveCard(userId);

        if (!financialProfileService.isCompleted(userId)) {
            throw new BadRequestException("Complete your financial profile");
        }

        BigDecimal requiredDownPayment = CreditCalculator.requiredDownPayment(dto.getTotalAmount());
        if (dto.getDownPayment().compareTo(requiredDownPayment) < 0) {
            throw new BadRequestException("A 20% down payment is required");
        }

        BigDecimal principal = CreditCalculator.calculatePrincipal(dto.getTotalAmount(), dto.getDownPayment());
        if (principal.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Down payment must be less than total amount");
        }

        List<BigDecimal> repaymentSchedule = CreditCalculator.calculateRepaymentSchedule(
                dto.getTotalAmount(),
                dto.getDownPayment(),
                dto.getNumberOfInstallments()
        );
        BigDecimal monthly = repaymentSchedule.get(0);
        BigDecimal interestAmount = CreditCalculator.calculateInterestAmount(
                dto.getTotalAmount(),
                dto.getDownPayment(),
                dto.getNumberOfInstallments()
        );
        BigDecimal interestRate = CreditCalculator.getInterestRate(dto.getNumberOfInstallments());
        BigDecimal totalPayable = principal.add(interestAmount);

        CreditBalanceResponse balance = getCreditBalance(userId);
        BigDecimal availableCredit = BigDecimal.valueOf(balance.getAvailableCredit());

        if (availableCredit.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Aucun credit disponible. Completez votre KYC et renseignez votre salaire.");
        }
        if (principal.compareTo(availableCredit) > 0) {
            throw new BadRequestException("Requested amount exceeds your available credit of " + availableCredit.intValue() + " TND");
        }

        CreditRequestStatus status = determineStatus(userId);

        CreditRequest request = CreditRequest.builder()
                .user(user)
                .productName(dto.getProductName())
                .totalAmount(dto.getTotalAmount())
                .downPayment(dto.getDownPayment())
                .financedAmount(principal)
                .interestAmount(interestAmount)
                .interestRate(interestRate)
                .totalPayable(totalPayable)
                .numberOfInstallments(dto.getNumberOfInstallments())
                .monthlyAmount(monthly)
                .status(status)
                .build();

        creditRequestRepository.save(request);

        if (status == CreditRequestStatus.APPROVED) {
            installmentService.generateInstallments(request);
            notificationService.sendNotification(userId,
                    "Credit Approved", "Your credit request of " + dto.getTotalAmount() + " DT has been approved.",
                    NotificationType.CREDIT_APPROVED);
        }

        return mapToResponse(request);
    }

    @Transactional
    public CreditRequestResponse approveCreditRequest(Long requestId) {
        CreditRequest request = creditRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));

        if (request.getStatus() == CreditRequestStatus.APPROVED) {
            installmentService.generateInstallments(request);
            return mapToResponse(request);
        }

        request.setStatus(CreditRequestStatus.APPROVED);
        creditRequestRepository.save(request);

        installmentService.generateInstallments(request);

        notificationService.sendNotification(request.getUser().getId(),
                "Credit Approved", "Your credit request has been approved.",
                NotificationType.CREDIT_APPROVED);

        return mapToResponse(request);
    }

    @Transactional
    public CreditRequestResponse rejectCreditRequest(Long requestId) {
        CreditRequest request = creditRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));

        request.setStatus(CreditRequestStatus.REJECTED);
        creditRequestRepository.save(request);

        notificationService.sendNotification(request.getUser().getId(),
                "Credit Rejected", "Your credit request has been rejected.",
                NotificationType.CREDIT_REJECTED);

        return mapToResponse(request);
    }

    public List<CreditRequestResponse> getUserCreditRequests(Long userId) {
        return creditRequestRepository.findByUserId(userId)
                .stream().map(this::mapToResponse).toList();
    }

    public List<CreditRequestResponse> getPendingRequests() {
        return creditRequestRepository.findByStatus(CreditRequestStatus.PENDING)
                .stream().map(this::mapToResponse).toList();
    }

    public List<CreditRequestResponse> getAllRequests() {
        return creditRequestRepository.findAll()
                .stream().map(this::mapToResponse).toList();
    }

    public CreditRequestResponse getCreditRequest(Long id) {
        CreditRequest request = creditRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Credit request not found"));
        return mapToResponse(request);
    }

    public CreditBalanceResponse getCreditBalance(Long userId) {
        userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        double totalLimit = creadiScoreService.computeCreditLimitForUser(userId);
        BigDecimal usedPrincipal = creditRequestRepository.findByUserIdAndStatus(userId, CreditRequestStatus.APPROVED)
                .stream()
                .map(this::calculateRemainingPrincipal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        double usedCredit = usedPrincipal.doubleValue();
        double available = Math.max(0, totalLimit - usedCredit);

        return CreditBalanceResponse.builder()
                .totalLimit(totalLimit)
                .usedCredit(usedCredit)
                .availableCredit(available)
                .build();
    }

    public BigDecimal calculateRemainingPrincipal(CreditRequest request) {
        BigDecimal totalPrincipal = CreditCalculator.calculatePrincipal(request.getTotalAmount(), request.getDownPayment());
        List<Installment> installments = installmentRepository.findByCreditRequestId(request.getId())
                .stream()
                .sorted(Comparator.comparing(Installment::getDueDate)
                        .thenComparing(Installment::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();

        if (installments.isEmpty()) {
            return totalPrincipal;
        }

        List<BigDecimal> principalSchedule = CreditCalculator.calculatePrincipalSchedule(
                request.getTotalAmount(),
                request.getDownPayment(),
                request.getNumberOfInstallments()
        );

        BigDecimal paidPrincipal = BigDecimal.ZERO;
        for (int i = 0; i < installments.size() && i < principalSchedule.size(); i++) {
            if (installments.get(i).getStatus() == InstallmentStatus.PAID) {
                paidPrincipal = paidPrincipal.add(principalSchedule.get(i));
            }
        }

        return totalPrincipal.subtract(paidPrincipal).max(BigDecimal.ZERO);
    }

    private CreditRequestStatus determineStatus(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() == KycStatus.VERIFIED
                && cardService.hasActiveCard(userId)
                && financialProfileService.isCompleted(userId)) {
            return CreditRequestStatus.APPROVED;
        }
        return CreditRequestStatus.REJECTED;
    }

    private CreditRequestResponse mapToResponse(CreditRequest r) {
        return CreditRequestResponse.builder()
                .id(r.getId())
                .userId(r.getUser().getId())
                .productName(r.getProductName())
                .totalAmount(r.getTotalAmount())
                .downPayment(r.getDownPayment())
                .financedAmount(r.getFinancedAmount())
                .interestAmount(r.getInterestAmount())
                .interestRate(r.getInterestRate())
                .totalPayable(r.getTotalPayable())
                .numberOfInstallments(r.getNumberOfInstallments())
                .monthlyAmount(r.getMonthlyAmount())
                .status(r.getStatus())
                .createdAt(r.getCreatedAt())
                .build();
    }

    private List<InstallmentPlanItemDto> buildPreviewSchedule(List<BigDecimal> amounts, LocalDate firstDueDate) {
        return java.util.stream.IntStream.range(0, amounts.size())
                .mapToObj(index -> InstallmentPlanItemDto.builder()
                        .installmentId(null)
                        .dueDate(firstDueDate.plusMonths(index))
                        .amount(amounts.get(index))
                        .status(InstallmentStatus.PENDING)
                        .build())
                .toList();
    }

    private Integer resolveSalaryDay(Long userId) {
        if (userId == null) {
            return null;
        }

        try {
            return financialProfileService.getRequiredEntity(userId).getSalaryDay();
        } catch (BadRequestException | ResourceNotFoundException ignored) {
            return null;
        }
    }
}

