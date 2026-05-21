package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.repository.CreditRequestRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CreditServiceTest {

    @Mock
    private CreditRequestRepository creditRequestRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private InstallmentService installmentService;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CreadiScoreService creadiScoreService;

    @Mock
    private CardService cardService;

    @Mock
    private FinancialProfileService financialProfileService;

    @Test
    void creditBalanceUsesRemainingPrincipalOnly() {
        User user = User.builder().id(5L).build();
        CreditRequest request = CreditRequest.builder()
                .id(44L)
                .user(user)
                .totalAmount(BigDecimal.valueOf(600))
                .downPayment(BigDecimal.valueOf(120))
                .numberOfInstallments(3)
                .status(CreditRequestStatus.APPROVED)
                .build();
        List<Installment> installments = List.of(
                installment(request, 1L, "2026-01-01", InstallmentStatus.PAID),
                installment(request, 2L, "2026-02-01", InstallmentStatus.PENDING),
                installment(request, 3L, "2026-03-01", InstallmentStatus.PENDING)
        );

        when(userRepository.findById(5L)).thenReturn(Optional.of(user));
        when(creadiScoreService.computeCreditLimitForUser(5L)).thenReturn(1000.0);
        when(creditRequestRepository.findByUserIdAndStatus(5L, CreditRequestStatus.APPROVED)).thenReturn(List.of(request));
        when(installmentRepository.findByCreditRequestId(44L)).thenReturn(installments);

        var balance = service().getCreditBalance(5L);

        assertThat(balance.getUsedCredit()).isEqualTo(320.0);
        assertThat(balance.getAvailableCredit()).isEqualTo(680.0);
    }

    private CreditService service() {
        return new CreditService(
                creditRequestRepository,
                userRepository,
                installmentRepository,
                installmentService,
                notificationService,
                creadiScoreService,
                cardService,
                financialProfileService
        );
    }

    private Installment installment(CreditRequest request, Long id, String dueDate, InstallmentStatus status) {
        return Installment.builder()
                .id(id)
                .creditRequest(request)
                .dueDate(LocalDate.parse(dueDate))
                .amount(BigDecimal.valueOf(160))
                .status(status)
                .penalty(BigDecimal.ZERO)
                .build();
    }
}
