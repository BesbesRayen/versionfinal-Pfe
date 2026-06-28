package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CreditRequestDto;
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
import java.time.YearMonth;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

    @Mock
    private MonthlyCreditCapacityService monthlyCreditCapacityService;

    @Test
    void creditBalanceUsesTheCurrentCalendarMonth() {
        LocalDate calculationDate = LocalDate.now();
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
        when(creadiScoreService.computeBuyingPowerForUser(5L)).thenReturn(new CreadiScoreService.BuyingPowerSnapshot(
                1000.0,
                0.0,
                1000.0,
                320.0,
                680.0,
                32.0,
                BigDecimal.valueOf(160),
                LocalDate.parse("2026-02-01")
        ));
        when(monthlyCreditCapacityService.getSnapshot(
                5L,
                YearMonth.from(calculationDate),
                calculationDate
        ))
                .thenReturn(new MonthlyCreditCapacityService.MonthlyCapacitySnapshot(
                        YearMonth.from(calculationDate),
                        new BigDecimal("2000.00"),
                        new BigDecimal("500.00"),
                        new BigDecimal("1500.00"),
                        false,
                        null
                ));
        var balance = service().getCreditBalance(5L, calculationDate);

        assertThat(balance.getUsedCredit()).isEqualTo(320.0);
        assertThat(balance.getOutstandingBalance()).isEqualTo(320.0);
        assertThat(balance.getAvailablePrincipalCredit()).isEqualTo(680.0);
        assertThat(balance.getAvailableCredit()).isEqualTo(680.0);
        assertThat(balance.getBuyingPowerLimit()).isEqualTo(1000.0);
        assertThat(balance.getUsedPercent()).isEqualTo(32.0);
        assertThat(balance.getMonthlyCommittedAmount()).isEqualByComparingTo("500.00");
        assertThat(balance.getAvailableMonthlyCapacity()).isEqualByComparingTo("1500.00");
        assertThat(balance.getMonthlyCapacityMonth()).isEqualTo(YearMonth.from(calculationDate).toString());
        verify(monthlyCreditCapacityService).getSnapshot(
                5L,
                YearMonth.from(calculationDate),
                calculationDate
        );
    }

    @Test
    void creditApprovalUsesMonthlyInstallmentsInsteadOfRemainingPrincipal() {
        User user = User.builder()
                .id(8L)
                .kycStatus(KycStatus.VERIFIED)
                .build();
        FinancialProfile profile = FinancialProfile.builder()
                .user(user)
                .monthlySalary(new BigDecimal("1500.00"))
                .salaryDay(27)
                .employmentStatus(EmploymentStatus.FULL_TIME)
                .build();
        CreditRequestDto dto = CreditRequestDto.builder()
                .totalAmount(new BigDecimal("1529.00"))
                .downPayment(new BigDecimal("305.80"))
                .numberOfInstallments(3)
                .productName("PC")
                .build();

        when(userRepository.findById(8L)).thenReturn(Optional.of(user));
        when(cardService.hasActiveCard(8L)).thenReturn(true);
        when(cardService.getDefaultActiveCard(8L)).thenReturn(Card.builder().id(2L).user(user).build());
        when(financialProfileService.isCompleted(8L)).thenReturn(true);
        when(financialProfileService.getRequiredEntity(8L)).thenReturn(profile);
        when(creditRequestRepository.save(any(CreditRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var response = service().createCreditRequest(8L, dto);

        assertThat(response.getStatus()).isEqualTo(CreditRequestStatus.APPROVED);
        assertThat(response.getFinancedAmount()).isEqualByComparingTo("1223.20");
        assertThat(response.getMonthlyAmount()).isEqualByComparingTo("407.73");
        verify(monthlyCreditCapacityService).validateNewCredit(
                eq(8L),
                eq(List.of(
                        new BigDecimal("407.73"),
                        new BigDecimal("407.73"),
                        new BigDecimal("407.74")
                )),
                any(LocalDate.class)
        );
        verify(installmentService).generateInstallments(any(CreditRequest.class));
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
                financialProfileService,
                monthlyCreditCapacityService
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
