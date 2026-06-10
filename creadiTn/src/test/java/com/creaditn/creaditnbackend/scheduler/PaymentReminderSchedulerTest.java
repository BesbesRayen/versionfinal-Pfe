package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.service.NotificationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PaymentReminderSchedulerTest {

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private NotificationService notificationService;

    @Test
    void sendsRemindersOneAndTwoDaysBeforeDeadline() {
        LocalDate today = LocalDate.now();
        Installment dueInTwoDays = installment(today.plusDays(2), "Laptop", "300.00");
        Installment dueTomorrow = installment(today.plusDays(1), "Phone", "150.00");

        when(installmentRepository.findByStatusAndDueDate(InstallmentStatus.PENDING, today.plusDays(2)))
                .thenReturn(List.of(dueInTwoDays));
        when(installmentRepository.findByStatusAndDueDate(InstallmentStatus.PENDING, today.plusDays(1)))
                .thenReturn(List.of(dueTomorrow));

        new PaymentReminderScheduler(installmentRepository, notificationService).sendDueDateReminders();

        verify(notificationService).sendNotification(
                eq(7L),
                eq("Payment reminder"),
                contains("is due in 2 days"),
                eq(NotificationType.PAYMENT_REMINDER)
        );
        verify(notificationService).sendNotification(
                eq(7L),
                eq("Payment reminder"),
                contains("is due tomorrow"),
                eq(NotificationType.PAYMENT_REMINDER)
        );
    }

    private Installment installment(LocalDate dueDate, String productName, String amount) {
        User user = User.builder().id(7L).build();
        CreditRequest creditRequest = CreditRequest.builder()
                .user(user)
                .productName(productName)
                .build();
        return Installment.builder()
                .creditRequest(creditRequest)
                .dueDate(dueDate)
                .amount(new BigDecimal(amount))
                .status(InstallmentStatus.PENDING)
                .build();
    }
}
