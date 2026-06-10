package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.service.CreadiScoreConstants;
import com.creaditn.creaditnbackend.service.CreadiScoreService;
import com.creaditn.creaditnbackend.service.AdminNotificationService;
import com.creaditn.creaditnbackend.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OverdueInstallmentScheduler {

    private final InstallmentRepository installmentRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final CreadiScoreService creadiScoreService;
    private final AdminNotificationService adminNotificationService;

    /**
     * Runs every night at midnight to check for overdue installments.
     */
    @Scheduled(cron = "0 0 0 * * *")
    public void checkOverdueInstallments() {
        processOverdueInstallments(null, LocalDate.now());
    }

    @Transactional
    public int processOverdueInstallments(Long targetUserId, LocalDate asOfDate) {
        LocalDate processingDate = asOfDate == null ? LocalDate.now() : asOfDate;
        log.info("Running overdue installment check through {} for user {}...", processingDate, targetUserId);
        List<Installment> overdueInstallments = installmentRepository
                .findByStatusAndDueDateBefore(InstallmentStatus.PENDING, processingDate)
                .stream()
                .filter(installment -> targetUserId == null
                        || installment.getCreditRequest().getUser().getId().equals(targetUserId))
                .toList();

        for (Installment installment : overdueInstallments) {
            installment.setStatus(InstallmentStatus.OVERDUE);
            installment.setPenalty(installment.getAmount().multiply(BigDecimal.valueOf(0.05)));

            User user = installment.getCreditRequest().getUser();
            Long userId = user.getId();
            if (!Boolean.TRUE.equals(installment.getLatePenaltyApplied())) {
                int trustBonus = user.getPaymentTrustBonus() == null ? 0 : user.getPaymentTrustBonus();
                trustBonus -= CreadiScoreConstants.PAYMENT_TRUST_LATE_MALUS;
                user.setPaymentTrustBonus(Math.max(CreadiScoreConstants.PAYMENT_TRUST_BONUS_MIN, trustBonus));
                installment.setLatePenaltyApplied(true);
                userRepository.save(user);
                creadiScoreService.calculateScore(userId);
            }
            notificationService.sendNotification(userId,
                    "Installment Overdue",
                    "Your installment of " + installment.getAmount() + " DT due on "
                            + installment.getDueDate() + " is overdue. A 5% penalty has been applied.",
                    NotificationType.INSTALLMENT_OVERDUE);
            adminNotificationService.notifyInstallmentOverdue(installment);
        }

        installmentRepository.saveAll(overdueInstallments);
        log.info("Marked {} installments as overdue.", overdueInstallments.size());
        return overdueInstallments.size();
    }

}
