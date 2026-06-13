package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.PaymentRequest;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.PaymentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.security.JwtUtil;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceTrustBonusTest {

    @Mock private PaymentRepository paymentRepository;
    @Mock private UserRepository userRepository;
    @Mock private InstallmentService installmentService;
    @Mock private NotificationService notificationService;
    @Mock private CardService cardService;
    @Mock private CreadiScoreService creadiScoreService;
    @Mock private WalletService walletService;
    @Mock private TransactionService transactionService;
    @Mock private InstallmentRepository installmentRepository;
    @Mock private JwtUtil jwtUtil;
    @Mock private MonthlyCreditCapacityService monthlyCreditCapacityService;

    @Test
    void onTimePaymentAddsTenDtBonus() {
        User user = user(1L, 0);
        Installment installment = installment(user, 10L, LocalDate.now().plusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(user, installment);

        service().makePayment(1L, new PaymentRequest(10L, BigDecimal.valueOf(43), "CARD"));

        assertThat(user.getPaymentTrustBonus()).isEqualTo(10);
        assertThat(user.getPaymentScoreModifier()).isEqualTo(10);
    }

    @Test
    void manualPaymentWithInsufficientBalanceIsRejectedWithoutRecordingPayment() {
        User user = user(6L, 0);
        Installment installment = installment(user, 60L, LocalDate.now().plusDays(1), InstallmentStatus.PENDING, false);
        when(userRepository.findById(6L)).thenReturn(Optional.of(user));
        when(installmentService.getInstallmentEntity(60L)).thenReturn(installment);
        doThrow(new BadRequestException("Insufficient wallet balance"))
                .when(walletService).debit(6L, BigDecimal.valueOf(43));

        assertThatThrownBy(() -> service().makePayment(
                6L, new PaymentRequest(60L, BigDecimal.valueOf(43), "CARD")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Insufficient wallet balance");

        verify(paymentRepository, never()).save(any());
        verify(installmentService, never()).markAsPaid(anyLong());
        verify(transactionService, never()).record(anyLong(), any(), anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void latePaymentSubtractsTwentyDtMalus() {
        User user = user(2L, 0);
        Installment installment = installment(user, 20L, LocalDate.now().minusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(user, installment);

        service().makePayment(2L, new PaymentRequest(20L, BigDecimal.valueOf(43), "CARD"));

        assertThat(user.getPaymentTrustBonus()).isEqualTo(-20);
        assertThat(user.getPaymentScoreModifier()).isEqualTo(-20);
        assertThat(installment.getLatePenaltyApplied()).isTrue();
    }

    @Test
    void lateMalusIsNotAppliedTwiceForSameInstallment() {
        User user = user(3L, 0);
        Installment installment = installment(user, 30L, LocalDate.now().minusDays(1), InstallmentStatus.OVERDUE, true);
        mockPayment(user, installment);

        service().makePayment(3L, new PaymentRequest(30L, BigDecimal.valueOf(43), "CARD"));

        assertThat(user.getPaymentTrustBonus()).isZero();
    }

    @Test
    void trustBonusCapsAreRespected() {
        User positive = user(4L, 195);
        Installment onTime = installment(positive, 40L, LocalDate.now().plusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(positive, onTime);
        service().makePayment(4L, new PaymentRequest(40L, BigDecimal.valueOf(43), "CARD"));
        assertThat(positive.getPaymentTrustBonus()).isEqualTo(200);

        User negative = user(5L, -295);
        Installment late = installment(negative, 50L, LocalDate.now().minusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(negative, late);
        service().makePayment(5L, new PaymentRequest(50L, BigDecimal.valueOf(43), "CARD"));
        assertThat(negative.getPaymentTrustBonus()).isEqualTo(-300);
    }

    @Test
    void scoreIsNotUpdatedWhileAnotherInstallmentInTheMonthIsUnpaid() {
        User user = user(7L, 0);
        Installment installment = installment(
                user, 70L, LocalDate.now().plusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(user, installment);
        when(monthlyCreditCapacityService.isMonthSettled(eq(7L), any())).thenReturn(false);

        service().makePayment(7L, new PaymentRequest(70L, BigDecimal.valueOf(43), "CARD"));

        verify(creadiScoreService, never()).calculateScore(7L);
    }

    @Test
    void scoreIsUpdatedAfterTheLastInstallmentInTheMonthIsPaid() {
        User user = user(8L, 0);
        Installment installment = installment(
                user, 80L, LocalDate.now().plusDays(1), InstallmentStatus.PENDING, false);
        mockPayment(user, installment);
        when(monthlyCreditCapacityService.isMonthSettled(eq(8L), any())).thenReturn(true);

        service().makePayment(8L, new PaymentRequest(80L, BigDecimal.valueOf(43), "CARD"));

        verify(creadiScoreService).calculateScore(8L);
    }

    private void mockPayment(User user, Installment installment) {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        when(installmentService.getInstallmentEntity(installment.getId())).thenReturn(installment);
        when(paymentRepository.save(any(Payment.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(installmentRepository.findByCreditRequestId(installment.getCreditRequest().getId())).thenReturn(List.of(installment));
    }

    private User user(Long id, int paymentTrustBonus) {
        return User.builder()
                .id(id)
                .email("user" + id + "@example.com")
                .firstName("Test")
                .lastName("User")
                .paymentScoreModifier(0)
                .paymentTrustBonus(paymentTrustBonus)
                .build();
    }

    private Installment installment(User user, Long id, LocalDate dueDate, InstallmentStatus status, boolean latePenaltyApplied) {
        return Installment.builder()
                .id(id)
                .creditRequest(CreditRequest.builder().id(id + 100).user(user).productName("Test").build())
                .dueDate(dueDate)
                .amount(BigDecimal.valueOf(43))
                .penalty(BigDecimal.ZERO)
                .status(status)
                .latePenaltyApplied(latePenaltyApplied)
                .build();
    }

    private PaymentService service() {
        return new PaymentService(
                paymentRepository,
                userRepository,
                installmentService,
                notificationService,
                cardService,
                creadiScoreService,
                walletService,
                transactionService,
                installmentRepository,
                jwtUtil,
                monthlyCreditCapacityService
        );
    }
}
