package com.creaditn.creaditnbackend.scheduler;

import com.creaditn.creaditnbackend.entity.Card;
import com.creaditn.creaditnbackend.entity.CardStatus;
import com.creaditn.creaditnbackend.entity.CardType;
import com.creaditn.creaditnbackend.entity.CreditRequest;
import com.creaditn.creaditnbackend.entity.Installment;
import com.creaditn.creaditnbackend.entity.InstallmentStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AutopaySchedulerTest {

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserWalletRepository userWalletRepository;

    @Mock
    private CardService cardService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private CreadiScoreService creadiScoreService;

    @Test
    void processAutopaymentsPaysDueInstallmentAndDeductsWallet() {
        User user = user(true);
        UserWallet wallet = wallet("500.00");
        Installment installment = installment(user, "120.00", "5.00");

        when(installmentRepository.findByStatusInAndDueDateLessThanEqual(
                eq(List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)),
                any(LocalDate.class)))
                .thenReturn(List.of(installment));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userWalletRepository.findByUserId(7L)).thenReturn(Optional.of(wallet));
        when(cardService.getDefaultActiveCard(7L)).thenReturn(card(user));

        scheduler().processAutopayments();

        assertThat(wallet.getBalance()).isEqualByComparingTo("375.00");
        assertThat(installment.getStatus()).isEqualTo(InstallmentStatus.PAID);
        assertThat(installment.getPaidDate()).isNotNull();
        assertThat(user.getPaymentScoreModifier()).isEqualTo(13);

        verify(userWalletRepository).save(wallet);
        verify(installmentRepository).save(installment);
        verify(paymentRepository).save(argThat(payment ->
                payment.getUser().equals(user)
                        && payment.getInstallment().equals(installment)
                        && payment.getAmount().compareTo(new BigDecimal("125.00")) == 0
                        && "AUTO_CARD".equals(payment.getPaymentMethod())));
        verify(userRepository).save(user);
        verify(creadiScoreService).calculateScore(7L);
        verify(transactionService).record(eq(7L), eq(new BigDecimal("125.00")), eq("PAYMENT"), eq("SUCCESS"), contains("Autopay"), startsWith("AUTO-"));
        verify(notificationService).sendNotification(eq(7L), eq("Autopay Successful"), contains("125.00"), eq(NotificationType.PAYMENT_CONFIRMED));
    }

    @Test
    void processAutopaymentsTopsUpHiddenWalletWhenDefaultCardIsActive() {
        User user = user(true);
        UserWallet wallet = wallet("50.00");
        Installment installment = installment(user, "120.00", "0.00");

        when(installmentRepository.findByStatusInAndDueDateLessThanEqual(
                eq(List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)),
                any(LocalDate.class)))
                .thenReturn(List.of(installment));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(userWalletRepository.findByUserId(7L)).thenReturn(Optional.of(wallet));
        when(cardService.getDefaultActiveCard(7L)).thenReturn(card(user));

        scheduler().processAutopayments();

        assertThat(wallet.getBalance()).isEqualByComparingTo("0.00");
        assertThat(installment.getStatus()).isEqualTo(InstallmentStatus.PAID);

        verify(userWalletRepository).save(wallet);
        verify(installmentRepository).save(installment);
        verify(paymentRepository).save(any());
        verify(transactionService).record(eq(7L), eq(new BigDecimal("120.00")), eq("PAYMENT"), eq("SUCCESS"), contains("Autopay"), startsWith("AUTO-"));
    }

    @Test
    void processAutopaymentsSkipsUsersWithoutAutopayEnabled() {
        User user = user(false);
        Installment installment = installment(user, "120.00", "0.00");

        when(installmentRepository.findByStatusInAndDueDateLessThanEqual(
                eq(List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)),
                any(LocalDate.class)))
                .thenReturn(List.of(installment));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));

        scheduler().processAutopayments();

        assertThat(installment.getStatus()).isEqualTo(InstallmentStatus.PENDING);
        verifyNoInteractions(userWalletRepository);
        verifyNoInteractions(cardService);
        verifyNoInteractions(transactionService);
        verifyNoInteractions(notificationService);
    }

    @Test
    void processAutopaymentsSkipsAndNotifiesWhenDefaultCardIsMissing() {
        User user = user(true);
        Installment installment = installment(user, "120.00", "0.00");

        when(installmentRepository.findByStatusInAndDueDateLessThanEqual(
                eq(List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)),
                any(LocalDate.class)))
                .thenReturn(List.of(installment));
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(cardService.getDefaultActiveCard(7L)).thenThrow(new RuntimeException("Add a payment method"));

        scheduler().processAutopayments();

        assertThat(installment.getStatus()).isEqualTo(InstallmentStatus.PENDING);
        verifyNoInteractions(userWalletRepository);
        verifyNoInteractions(paymentRepository);
        verify(notificationService).sendNotification(eq(7L), eq("Autopay Failed"), contains("active default payment card"), eq(NotificationType.PAYMENT_REMINDER));
    }

    @Test
    void processAutopaymentsForUserUsesProvidedProcessingDateForTesting() {
        LocalDate juneThird = LocalDate.of(2026, 6, 3);

        when(installmentRepository.findByStatusInAndDueDateLessThanEqual(
                eq(List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE)),
                eq(juneThird)))
                .thenReturn(List.of());

        int paidCount = scheduler().processAutopaymentsForUser(7L, juneThird);

        assertThat(paidCount).isZero();
        verify(installmentRepository).findByStatusInAndDueDateLessThanEqual(
                List.of(InstallmentStatus.PENDING, InstallmentStatus.OVERDUE),
                juneThird);
    }

    private AutopayScheduler scheduler() {
        return new AutopayScheduler(
                installmentRepository,
                paymentRepository,
                userRepository,
                userWalletRepository,
                cardService,
                notificationService,
                transactionService,
                creadiScoreService
        );
    }

    private User user(boolean autopay) {
        return User.builder()
                .id(7L)
                .autopay(autopay)
                .paymentScoreModifier(3)
                .build();
    }

    private Card card(User user) {
        return Card.builder()
                .id(4L)
                .user(user)
                .cardNumber("encrypted")
                .last4("1111")
                .expiryDate("12/30")
                .cardholderName("TEST USER")
                .type(CardType.VISA)
                .isDefault(true)
                .status(CardStatus.ACTIVE)
                .build();
    }

    private UserWallet wallet(String balance) {
        return UserWallet.builder()
                .id(3L)
                .userId(7L)
                .balance(new BigDecimal(balance))
                .build();
    }

    private Installment installment(User user, String amount, String penalty) {
        return Installment.builder()
                .id(99L)
                .creditRequest(CreditRequest.builder().id(11L).user(user).build())
                .dueDate(LocalDate.now())
                .amount(new BigDecimal(amount))
                .penalty(new BigDecimal(penalty))
                .status(InstallmentStatus.PENDING)
                .build();
    }
}
