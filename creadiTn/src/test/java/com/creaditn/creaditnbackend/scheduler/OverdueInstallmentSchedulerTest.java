package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.service.AdminNotificationService;
import com.creaditn.creaditnbackend.service.CreadiScoreService;
import com.creaditn.creaditnbackend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OverdueInstallmentSchedulerTest {

    @Mock
    private InstallmentRepository installmentRepository;
    @Mock
    private NotificationService notificationService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private CreadiScoreService creadiScoreService;
    @Mock
    private AdminNotificationService adminNotificationService;

    @Test
    void dueDateIsNotLateButFollowingDayCreatesNotification() {
        LocalDate dueDate = LocalDate.of(2026, 8, 27);
        User user = User.builder()
                .id(1L)
                .paymentTrustBonus(20)
                .paymentScoreModifier(10)
                .build();
        Installment installment = Installment.builder()
                .id(307L)
                .creditRequest(CreditRequest.builder().id(81L).user(user).build())
                .dueDate(dueDate)
                .amount(new BigDecimal("407.74"))
                .penalty(BigDecimal.ZERO)
                .status(InstallmentStatus.PENDING)
                .latePenaltyApplied(false)
                .build();

        when(installmentRepository.findByStatusAndDueDateGreaterThanEqual(
                InstallmentStatus.OVERDUE, dueDate
        )).thenReturn(List.of());
        when(installmentRepository.findByStatusAndDueDateBefore(
                InstallmentStatus.PENDING, dueDate
        )).thenReturn(List.of());

        assertThat(scheduler().processOverdueInstallments(1L, dueDate)).isZero();
        verify(notificationService, never()).sendNotification(
                eq(1L),
                eq("Installment Overdue"),
                contains("overdue"),
                eq(NotificationType.INSTALLMENT_OVERDUE)
        );

        LocalDate followingDay = dueDate.plusDays(1);
        when(installmentRepository.findByStatusAndDueDateGreaterThanEqual(
                InstallmentStatus.OVERDUE, followingDay
        )).thenReturn(List.of());
        when(installmentRepository.findByStatusAndDueDateBefore(
                InstallmentStatus.PENDING, followingDay
        )).thenReturn(List.of(installment));

        assertThat(scheduler().processOverdueInstallments(1L, followingDay)).isEqualTo(1);
        assertThat(installment.getStatus()).isEqualTo(InstallmentStatus.OVERDUE);
        assertThat(installment.getPenalty()).isEqualByComparingTo("20.3870");
        verify(notificationService).sendNotification(
                eq(1L),
                eq("Installment Overdue"),
                contains("2026-08-27"),
                eq(NotificationType.INSTALLMENT_OVERDUE)
        );
        verify(adminNotificationService).notifyInstallmentOverdue(installment);
    }

    private OverdueInstallmentScheduler scheduler() {
        return new OverdueInstallmentScheduler(
                installmentRepository,
                notificationService,
                userRepository,
                creadiScoreService,
                adminNotificationService
        );
    }
}
