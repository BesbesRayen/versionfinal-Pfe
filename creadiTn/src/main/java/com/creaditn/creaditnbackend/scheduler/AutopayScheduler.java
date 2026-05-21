package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.Payment;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.entity.UserWallet;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.repository.UserWalletRepository;
import com.creaditn.creaditnbackend.service.CardService;
import com.creaditn.creaditnbackend.service.CreadiScoreService;
import com.creaditn.creaditnbackend.service.NotificationService;
import com.creaditn.creaditnbackend.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

@Component
@RequiredArgsConstructor
@Slf4j
public class AutopayScheduler {

    private final InstallmentRepository installmentRepository;
    private final PaymentRepository paymentRepository;
    private final UserRepository userRepository;
    private final UserWalletRepository userWalletRepository;
    private final CardService cardService;
    private final NotificationService notificationService;
    private final TransactionService transactionService;
    private final CreadiScoreService creadiScoreService;

    /**
     * Runs every day at 08:00 AM.
     * For users with autopay=TRUE, auto-pays any installments due today or earlier.
     */
    @Scheduled(cron = "0 0 8 * * *")
    @Transactional
    public void processAutopayments() {
        processDueAutopayments(null, LocalDate.now());
    }

    @Transactional
    public int processAutopaymentsForUser(Long userId) {
        return processDueAutopayments(userId, LocalDate.now());
    }

    @Transactional
    public int processAutopaymentsForUser(Long userId, LocalDate asOfDate) {
        return processDueAutopayments(userId, asOfDate);
    }

    private int processDueAutopayments(Long targetUserId, LocalDate asOfDate) {
        LocalDate processingDate = asOfDate != null ? asOfDate : LocalDate.now();
        log.info("[AutopayScheduler] Running autopay job for due date {}...", processingDate);
        AtomicInteger paidCount = new AtomicInteger(0);

        List<Installment> dueInstallments = installmentRepository
                .findByStatusInAndDueDateLessThanEqual(
                        List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE),
                        processingDate);

        for (Installment installment : dueInstallments) {
            Long userId = installment.getCreditRequest().getUser().getId();
            if (targetUserId != null && !targetUserId.equals(userId)) continue;

            User user = userRepository.findById(userId).orElse(null);
            if (user == null) continue;
            if (!Boolean.TRUE.equals(user.getAutopay())) continue;

            try {
                cardService.getDefaultActiveCard(userId);
            } catch (RuntimeException ex) {
                notificationService.sendNotification(userId,
                        "Autopay Failed",
                        "Add an active default payment card to auto-pay installment due on " + installment.getDueDate(),
                        NotificationType.PAYMENT_REMINDER);
                log.warn("[AutopayScheduler] User {} has no active default card for installment {}", userId, installment.getId());
                continue;
            }

            BigDecimal penalty = installment.getPenalty() != null ? installment.getPenalty() : BigDecimal.ZERO;
            BigDecimal total = installment.getAmount().add(penalty);
            UserWallet wallet = userWalletRepository.findByUserId(userId)
                    .orElseGet(() -> UserWallet.builder()
                            .userId(userId)
                            .balance(BigDecimal.ZERO)
                            .build());

            // The wallet is a hidden simulated settlement account. For autopay,
            // an active default card authorizes topping it up before deduction.
            if (wallet.getBalance() == null || wallet.getBalance().compareTo(total) < 0) {
                wallet.setBalance(total);
            }

            wallet.setBalance(wallet.getBalance().subtract(total));
            userWalletRepository.save(wallet);

            installment.setStatus(InstallmentStatus.PAID);
            installment.setPaidDate(LocalDateTime.now());
            installmentRepository.save(installment);

            String ref = "AUTO-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
            paymentRepository.save(Payment.builder()
                    .user(user)
                    .installment(installment)
                    .amount(total)
                    .transactionReference(ref)
                    .paymentMethod("AUTO_CARD")
                    .build());
            transactionService.record(userId, total, "PAYMENT", "SUCCESS",
                    "Autopay - installment due " + installment.getDueDate(), ref);

            int modifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
            user.setPaymentScoreModifier(modifier + 10);
            userRepository.save(user);
            creadiScoreService.calculateScore(userId);

            notificationService.sendNotification(userId,
                    "Autopay Successful",
                    "Auto-payment of " + total + " TND processed for installment due " + installment.getDueDate() + ". Ref: " + ref,
                    NotificationType.PAYMENT_CONFIRMED);
            paidCount.incrementAndGet();

            log.info("[AutopayScheduler] Auto-paid installment {} for user {} - {} TND", installment.getId(), userId, total);
        }

        log.info("[AutopayScheduler] Autopay job completed.");
        return paidCount.get();
    }
}
