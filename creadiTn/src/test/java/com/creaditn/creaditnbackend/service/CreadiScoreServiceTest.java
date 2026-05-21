package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.KycStatus;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.repository.CreadiScoreRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CreadiScoreServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CreadiScoreRepository creadiScoreRepository;

    @Mock
    private InstallmentRepository installmentRepository;

    @Mock
    private KycDocumentRepository kycDocumentRepository;

    @Test
    void calculateScoreClampsBehaviorAndPenalizesUnknownDependents() {
        User user = User.builder()
                .id(9L)
                .createdAt(LocalDateTime.now().minusHours(2))
                .kycSubmittedAt(LocalDateTime.now())
                .kycStatus(KycStatus.VERIFIED)
                .kycFraudFlag(false)
                .kycFailedAttempts(0)
                .paymentScoreModifier(500)
                .monthlySalary(2200.0)
                .maritalStatus("SINGLE")
                .numberOfChildren(null)
                .build();
        when(userRepository.findById(9L)).thenReturn(Optional.of(user));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(9L)).thenReturn(List.of());
        when(installmentRepository.findByCreditRequestUserIdAndStatus(any(), any())).thenReturn(List.of());

        var response = service().calculateScore(9L);

        assertThat(response.getBehaviorScore()).isEqualTo(200);
        assertThat(response.getChildrenScore()).isEqualTo(25);
        assertThat(response.getBehaviorAnalysis()).isNotBlank();
        assertThat(response.getImprovementTips()).contains("Complete your profile for better score");
        verify(creadiScoreRepository).save(any());
    }

    @Test
    void getLatestScoreCalculatesWhenMissing() {
        User user = User.builder()
                .id(9L)
                .createdAt(LocalDateTime.now())
                .kycStatus(KycStatus.NOT_SUBMITTED)
                .kycFraudFlag(false)
                .paymentScoreModifier(0)
                .build();
        when(creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(9L)).thenReturn(Optional.empty());
        when(userRepository.findById(9L)).thenReturn(Optional.of(user));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(9L)).thenReturn(List.of());

        var response = service().getLatestScore(9L);

        assertThat(response.getUserId()).isEqualTo(9L);
        verify(creadiScoreRepository).save(any());
    }

    @Test
    void calculateScoreUsesUserSpecificRiskData() {
        User strongUser = User.builder()
                .id(1L)
                .createdAt(LocalDateTime.now().minusHours(5))
                .kycSubmittedAt(LocalDateTime.now().minusHours(1))
                .kycStatus(KycStatus.VERIFIED)
                .kycFraudFlag(false)
                .kycFailedAttempts(0)
                .paymentScoreModifier(40)
                .monthlySalary(2600.0)
                .maritalStatus("MARRIED")
                .numberOfChildren(0)
                .build();
        User riskyUser = User.builder()
                .id(2L)
                .createdAt(LocalDateTime.now().minusDays(20))
                .kycSubmittedAt(LocalDateTime.now().minusDays(1))
                .kycStatus(KycStatus.REJECTED)
                .kycFraudFlag(true)
                .kycFailedAttempts(4)
                .paymentScoreModifier(-60)
                .monthlySalary(450.0)
                .maritalStatus("SINGLE")
                .numberOfChildren(3)
                .build();
        when(userRepository.findById(1L)).thenReturn(Optional.of(strongUser));
        when(userRepository.findById(2L)).thenReturn(Optional.of(riskyUser));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(any())).thenReturn(List.of());
        when(installmentRepository.findByCreditRequestUserIdAndStatus(any(), any())).thenReturn(List.of());

        var strongScore = service().calculateScore(1L);
        var riskyScore = service().calculateScore(2L);

        assertThat(strongScore.getScore()).isGreaterThan(riskyScore.getScore());
        assertThat(strongScore.getKycScore()).isEqualTo(240);
        assertThat(riskyScore.getKycScore()).isZero();
        assertThat(strongScore.getSalaryScore()).isGreaterThan(riskyScore.getSalaryScore());
        assertThat(strongScore.getBehaviorScore()).isGreaterThan(riskyScore.getBehaviorScore());
        assertThat(strongScore.getScoreFactors()).isNotEmpty();
    }

    private CreadiScoreService service() {
        return new CreadiScoreService(userRepository, creadiScoreRepository, installmentRepository, kycDocumentRepository);
    }
}
