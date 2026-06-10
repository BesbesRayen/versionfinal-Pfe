package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.FinancialProfileRequest;
import com.creaditn.creaditnbackend.entity.CardStatus;
import com.creaditn.creaditnbackend.entity.EmploymentStatus;
import com.creaditn.creaditnbackend.entity.FinancialProfile;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.RiskLevel;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.repository.CardRepository;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class FinancialProfileServiceTest {

    @Mock
    private FinancialProfileRepository financialProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CardRepository cardRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private CreadiScoreService creadiScoreService;

    @InjectMocks
    private FinancialProfileService service;

    @Test
    void createOrUpdateRejectsSalaryBelowMinimum() {
        mockEligibleUser();

        assertThatThrownBy(() -> service.createOrUpdate(7L, request("99.99")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("between 100 and 15000");
    }

    @Test
    void createOrUpdateRejectsSalaryAboveMaximum() {
        mockEligibleUser();

        assertThatThrownBy(() -> service.createOrUpdate(7L, request("15000.01")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("between 100 and 15000");
    }

    @Test
    void createOrUpdateAcceptsSalaryAtRangeBoundaries() {
        User user = mockEligibleUser();
        when(financialProfileRepository.findByUserId(7L)).thenReturn(Optional.empty());

        var minResult = service.createOrUpdate(7L, request("100.00"));

        assertThat(minResult.getMonthlySalary()).isEqualByComparingTo("100.00");
        assertThat(minResult.getRiskLevel()).isEqualTo(RiskLevel.HIGH);

        FinancialProfile existingProfile = FinancialProfile.builder()
                .user(user)
                .monthlySalary(BigDecimal.valueOf(100))
                .salaryDay(25)
                .employmentStatus(EmploymentStatus.FULL_TIME)
                .riskLevel(RiskLevel.HIGH)
                .build();
        when(financialProfileRepository.findByUserId(7L)).thenReturn(Optional.of(existingProfile));

        var maxResult = service.createOrUpdate(7L, request("15000.00"));

        assertThat(maxResult.getMonthlySalary()).isEqualByComparingTo("15000.00");
        assertThat(maxResult.getRiskLevel()).isEqualTo(RiskLevel.LOW);
        verify(financialProfileRepository, times(2)).save(any(FinancialProfile.class));
        verify(creadiScoreService, times(2)).calculateScore(7L);
        verify(notificationService, times(2)).sendNotification(
                eq(7L),
                eq("Financial profile updated"),
                any(),
                eq(NotificationType.CREDIT_APPROVED)
        );
    }

    private User mockEligibleUser() {
        User user = User.builder()
                .id(7L)
                .firstName("Rayen")
                .lastName("Test")
                .email("rayen@example.com")
                .build();
        when(userRepository.findById(7L)).thenReturn(Optional.of(user));
        when(cardRepository.existsByUserIdAndStatus(7L, CardStatus.ACTIVE)).thenReturn(true);
        return user;
    }

    private FinancialProfileRequest request(String salary) {
        return FinancialProfileRequest.builder()
                .monthlySalary(new BigDecimal(salary))
                .salaryDay(25)
                .employmentStatus(EmploymentStatus.FULL_TIME)
                .build();
    }
}
