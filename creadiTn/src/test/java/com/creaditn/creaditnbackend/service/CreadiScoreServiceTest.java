package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.repository.CreadiScoreRepository;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
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

    @Mock
    private FinancialProfileRepository financialProfileRepository;

    @Test
    void perfectCustomerScoresOneThousand() {
        User user = verifiedUser(1L, 15_000.0, LocalDateTime.now().minusYears(6));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(15_000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusMonths(13));
        KycDocument document = strongDocument(user, 0);
        List<Installment> installments = paidInstallments(user, 25, 0);

        mockScoreInputs(user, profile, document, installments);
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(1L)).thenReturn(List.of());

        var response = service().calculateScore(1L);

        assertThat(response.getScore()).isEqualTo(1000);
        assertThat(response.getScoreStatus()).isEqualTo(ScoreStatus.COMPLETE);
        assertThat(response.getKycScore()).isEqualTo(150);
        assertThat(response.getFinancialScore()).isEqualTo(250);
        assertThat(response.getPaymentBehaviorScore()).isEqualTo(400);
        assertThat(response.getStabilityScore()).isEqualTo(100);
        assertThat(response.getRiskScore()).isEqualTo(100);
        verify(creadiScoreRepository).save(any());
    }

    @Test
    void scoreNeverExceedsOneThousand() {
        User user = verifiedUser(2L, 50_000.0, LocalDateTime.now().minusYears(10));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(50_000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(5));
        KycDocument document = strongDocument(user, 0);
        List<Installment> installments = paidInstallments(user, 80, 0);

        mockScoreInputs(user, profile, document, installments);
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(2L)).thenReturn(List.of());

        assertThat(service().calculateScore(2L).getScore()).isEqualTo(1000);
    }

    @Test
    void paymentScoreModifierChangesDisplayedScoreByTenPoints() {
        User user = verifiedUser(20L, 2000.0, LocalDateTime.now().minusYears(2));
        FinancialProfile profile = profile(
                user,
                BigDecimal.valueOf(2000),
                EmploymentStatus.FULL_TIME,
                LocalDateTime.now().minusYears(1)
        );
        mockScoreInputs(user, profile, strongDocument(user, 0), List.of());
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(20L)).thenReturn(List.of());

        int before = service().calculateScore(20L).getScore();
        user.setPaymentScoreModifier(10);
        int after = service().calculateScore(20L).getScore();

        assertThat(after).isEqualTo(before + 10);
    }

    @Test
    void scoreNeverBelowZeroEvenWithSevereLateHistory() {
        User user = verifiedUser(3L, 500.0, LocalDateTime.now().minusMonths(1));
        user.setKycFailedAttempts(20);
        FinancialProfile profile = profile(user, BigDecimal.valueOf(500), EmploymentStatus.UNEMPLOYED, LocalDateTime.now().minusMonths(1));
        KycDocument document = strongDocument(user, 80);
        List<Installment> installments = overdueInstallments(user, 5, 120);

        mockScoreInputs(user, profile, document, installments);
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(3L)).thenReturn(List.of());

        assertThat(service().calculateScore(3L).getScore()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void kycNotVerifiedIsIncompleteAndDoesNotSaveScore() {
        User user = verifiedUser(4L, 1800.0, LocalDateTime.now().minusYears(1));
        user.setKycStatus(KycStatus.PENDING);
        FinancialProfile profile = profile(user, BigDecimal.valueOf(1800), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusMonths(8));

        mockScoreInputs(user, profile, null, List.of());

        var response = service().calculateScore(4L);

        assertThat(response.getScore()).isNull();
        assertThat(response.getScoreStatus()).isEqualTo(ScoreStatus.INCOMPLETE);
        verify(creadiScoreRepository, never()).save(any());
    }

    @Test
    void fraudFlagBlocksScore() {
        User user = verifiedUser(5L, 1800.0, LocalDateTime.now().minusYears(1));
        user.setKycFraudFlag(true);
        FinancialProfile profile = profile(user, BigDecimal.valueOf(1800), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusMonths(8));

        mockScoreInputs(user, profile, strongDocument(user, 0), List.of());

        var response = service().calculateScore(5L);

        assertThat(response.getScore()).isNull();
        assertThat(response.getScoreStatus()).isEqualTo(ScoreStatus.BLOCKED);
        assertThat(response.getRisk()).isEqualTo(RiskLevel.CRITICAL);
        verify(creadiScoreRepository, never()).save(any());
    }

    @Test
    void missingSalaryIsIncomplete() {
        User user = verifiedUser(6L, null, LocalDateTime.now().minusYears(1));

        mockScoreInputs(user, null, strongDocument(user, 0), List.of());

        var response = service().calculateScore(6L);

        assertThat(response.getScore()).isNull();
        assertThat(response.getScoreStatus()).isEqualTo(ScoreStatus.INCOMPLETE);
    }

    @Test
    void excellentPayerBeatsHighIncomeBadPayer() {
        User excellentPayer = verifiedUser(7L, 2000.0, LocalDateTime.now().minusYears(3));
        FinancialProfile excellentProfile = profile(excellentPayer, BigDecimal.valueOf(2000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(2));
        User badPayer = verifiedUser(8L, 15_000.0, LocalDateTime.now().minusYears(3));
        FinancialProfile badProfile = profile(badPayer, BigDecimal.valueOf(15_000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(2));

        mockScoreInputs(excellentPayer, excellentProfile, strongDocument(excellentPayer, 0), paidInstallments(excellentPayer, 18, 0));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(7L)).thenReturn(List.of());
        mockScoreInputs(badPayer, badProfile, strongDocument(badPayer, 0), overdueInstallments(badPayer, 18, 100));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(8L)).thenReturn(List.of());

        var excellent = service().calculateScore(7L);
        var bad = service().calculateScore(8L);

        assertThat(excellent.getScore()).isGreaterThan(bad.getScore());
        assertThat(excellent.getPaymentBehaviorScore()).isGreaterThan(bad.getPaymentBehaviorScore());
    }

    @Test
    void latePaymentsReduceScore() {
        User user = verifiedUser(9L, 3000.0, LocalDateTime.now().minusYears(3));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(3000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(2));

        mockScoreInputs(user, profile, strongDocument(user, 0), paidInstallments(user, 12, 0));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(9L)).thenReturn(List.of());
        int onTimeScore = service().calculateScore(9L).getPaymentBehaviorScore();

        mockScoreInputs(user, profile, strongDocument(user, 0), paidInstallments(user, 12, 40));
        int lateScore = service().calculateScore(9L).getPaymentBehaviorScore();

        assertThat(lateScore).isLessThan(onTimeScore);
    }

    @Test
    void dtiAffectsScoreCorrectly() {
        User user = verifiedUser(10L, 1000.0, LocalDateTime.now().minusYears(2));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(1000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(1));

        mockScoreInputs(user, profile, strongDocument(user, 0), pendingInstallments(user, BigDecimal.valueOf(100)));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(10L)).thenReturn(List.of());
        assertThat(service().calculateScore(10L).getDtiPoints()).isEqualTo(80);

        mockScoreInputs(user, profile, strongDocument(user, 0), pendingInstallments(user, BigDecimal.valueOf(450)));
        assertThat(service().calculateScore(10L).getDtiPoints()).isEqualTo(10);
    }

    @Test
    void buyingPowerUsesSalaryEmploymentDtiAndScoreOnly() {
        User user = verifiedUser(12L, 1500.0, LocalDateTime.now().minusYears(3));
        user.setMaritalStatus("MARRIED");
        user.setNumberOfChildren(3);
        FinancialProfile profile = profile(user, BigDecimal.valueOf(1500), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(1));
        List<Installment> installments = new java.util.ArrayList<>(paidInstallments(user, 4, 0));
        installments.addAll(pendingInstallments(user, BigDecimal.valueOf(300)));

        mockScoreInputs(user, profile, strongDocument(user, 0), installments);
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(12L)).thenReturn(List.of());

        var response = service().calculateScore(12L);

        assertThat(response.getLevel()).isEqualTo(ScoreLevel.GOOD);
        assertThat(response.getDtiPoints()).isEqualTo(65);
        assertThat(Math.round(response.getMaxCreditLimit())).isEqualTo(2119);
    }

    @Test
    void buyingPowerSnapshotSeparatesLimitOutstandingAvailableAndUsage() {
        User user = verifiedUser(13L, 1500.0, LocalDateTime.now().minusYears(3));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(1500), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(1));
        List<Installment> installments = new java.util.ArrayList<>(paidInstallments(user, 4, 0));
        installments.addAll(pendingInstallments(user, BigDecimal.valueOf(129)));

        mockScoreInputs(user, profile, strongDocument(user, 0), installments);

        var buyingPower = service().computeBuyingPowerForUser(13L);

        assertThat(buyingPower.buyingPowerLimit()).isGreaterThan(0);
        assertThat(buyingPower.outstandingBalance()).isEqualTo(129);
        assertThat(buyingPower.availableCredit()).isEqualTo(buyingPower.buyingPowerLimit() - 129);
        assertThat(buyingPower.usedPercent()).isEqualTo(
                java.math.BigDecimal.valueOf(129 / buyingPower.buyingPowerLimit() * 100)
                        .setScale(2, java.math.RoundingMode.HALF_UP)
                        .doubleValue()
        );
    }

    @Test
    void activeCreditReducesAvailableBalanceWithoutReducingApprovedBuyingPower() {
        User user = verifiedUser(17L, 2000.0, LocalDateTime.now().minusYears(3));
        FinancialProfile profile = profile(
                user,
                BigDecimal.valueOf(2000),
                EmploymentStatus.FULL_TIME,
                LocalDateTime.now().minusYears(1)
        );
        KycDocument document = strongDocument(user, 0);
        CreadiScore approvedScore = CreadiScore.builder()
                .user(user)
                .totalScore(800)
                .level(ScoreLevel.GOOD)
                .risk(RiskLevel.MODERATE)
                .build();

        when(userRepository.findById(17L)).thenReturn(Optional.of(user));
        when(financialProfileRepository.findByUserId(17L)).thenReturn(Optional.of(profile));
        when(kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(17L)).thenReturn(Optional.of(document));
        when(creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(17L)).thenReturn(Optional.of(approvedScore));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(17L)).thenReturn(List.of(approvedScore));
        when(installmentRepository.findByCreditRequestUserId(17L))
                .thenReturn(List.of())
                .thenReturn(pendingInstallments(user, new BigDecimal("1223.20")));

        var beforePurchase = service().computeBuyingPowerForUser(17L);
        var afterPurchase = service().computeBuyingPowerForUser(17L);

        assertThat(afterPurchase.buyingPowerLimit()).isEqualTo(beforePurchase.buyingPowerLimit());
        assertThat(afterPurchase.outstandingBalance()).isEqualTo(1223.20);
        assertThat(afterPurchase.availableCredit()).isEqualTo(
                BigDecimal.valueOf(beforePurchase.buyingPowerLimit())
                        .subtract(new BigDecimal("1223.20"))
                        .setScale(2, java.math.RoundingMode.HALF_UP)
                        .doubleValue()
        );
    }

    @Test
    void payingOneCreditDoesNotLowerLimitWhileAnotherCreditIsActive() {
        User user = verifiedUser(18L, 1500.0, LocalDateTime.now().minusYears(3));
        user.setPaymentTrustBonus(200);
        FinancialProfile profile = profile(
                user,
                BigDecimal.valueOf(1500),
                EmploymentStatus.FULL_TIME,
                LocalDateTime.now().minusYears(1)
        );
        KycDocument document = strongDocument(user, 0);
        CreadiScore latestLowerScore = CreadiScore.builder()
                .user(user)
                .totalScore(661)
                .level(ScoreLevel.MEDIUM)
                .risk(RiskLevel.HIGH)
                .build();
        CreadiScore approvedGoodScore = CreadiScore.builder()
                .user(user)
                .totalScore(741)
                .level(ScoreLevel.GOOD)
                .risk(RiskLevel.MODERATE)
                .build();

        when(userRepository.findById(18L)).thenReturn(Optional.of(user));
        when(financialProfileRepository.findByUserId(18L)).thenReturn(Optional.of(profile));
        when(kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(18L)).thenReturn(Optional.of(document));
        when(creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(18L))
                .thenReturn(Optional.of(latestLowerScore));
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(18L))
                .thenReturn(List.of(latestLowerScore, approvedGoodScore));
        when(installmentRepository.findByCreditRequestUserId(18L))
                .thenReturn(pendingInstallments(user, new BigDecimal("1223.20")));

        var balance = service().computeBuyingPowerForUser(18L);

        assertThat(balance.buyingPowerLimit()).isEqualTo(2468.00);
        assertThat(balance.outstandingBalance()).isEqualTo(1223.20);
        assertThat(balance.availableCredit()).isEqualTo(1244.80);
    }

    @Test
    void paymentTrustBonusIsAppliedAndCapped() {
        User bonusUser = verifiedUser(14L, 15_000.0, LocalDateTime.now().minusYears(6));
        bonusUser.setPaymentTrustBonus(250);
        FinancialProfile bonusProfile = profile(bonusUser, BigDecimal.valueOf(15_000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(2));
        mockScoreInputs(bonusUser, bonusProfile, strongDocument(bonusUser, 0), paidInstallments(bonusUser, 30, 0));

        var bonusSnapshot = service().computeBuyingPowerForUser(14L);

        assertThat(bonusSnapshot.paymentTrustBonus()).isEqualTo(200);
        assertThat(bonusSnapshot.buyingPowerLimit()).isEqualTo(8000);

        User malusUser = verifiedUser(15L, 1500.0, LocalDateTime.now().minusYears(3));
        malusUser.setPaymentTrustBonus(-350);
        FinancialProfile malusProfile = profile(malusUser, BigDecimal.valueOf(1500), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(1));
        mockScoreInputs(malusUser, malusProfile, strongDocument(malusUser, 0), paidInstallments(malusUser, 4, 0));

        var malusSnapshot = service().computeBuyingPowerForUser(15L);

        assertThat(malusSnapshot.paymentTrustBonus()).isEqualTo(-300);
        assertThat(malusSnapshot.buyingPowerLimit()).isGreaterThanOrEqualTo(0);
    }

    @Test
    void availableCreditNeverBelowZero() {
        User user = verifiedUser(16L, 500.0, LocalDateTime.now().minusYears(1));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(500), EmploymentStatus.STUDENT, LocalDateTime.now().minusMonths(6));
        mockScoreInputs(user, profile, strongDocument(user, 0), pendingInstallments(user, BigDecimal.valueOf(10_000)));

        var buyingPower = service().computeBuyingPowerForUser(16L);

        assertThat(buyingPower.availableCredit()).isZero();
        assertThat(buyingPower.buyingPowerLimit()).isLessThanOrEqualTo(8000);
    }

    @Test
    void componentCapsAreRespected() {
        User user = verifiedUser(11L, 20_000.0, LocalDateTime.now().minusYears(10));
        FinancialProfile profile = profile(user, BigDecimal.valueOf(20_000), EmploymentStatus.FULL_TIME, LocalDateTime.now().minusYears(3));
        KycDocument document = strongDocument(user, 0);
        List<Installment> installments = paidInstallments(user, 60, 0);

        mockScoreInputs(user, profile, document, installments);
        when(creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(11L)).thenReturn(List.of());

        var response = service().calculateScore(11L);

        assertThat(response.getKycScore()).isLessThanOrEqualTo(150);
        assertThat(response.getFinancialScore()).isLessThanOrEqualTo(250);
        assertThat(response.getPaymentBehaviorScore()).isLessThanOrEqualTo(400);
        assertThat(response.getStabilityScore()).isLessThanOrEqualTo(100);
        assertThat(response.getRiskScore()).isLessThanOrEqualTo(100);
    }

    @Test
    void badgeAssignmentIsCorrect() {
        CreadiScoreService service = service();
        assertThat(service.determineBadge(1000)).isEqualTo("GOLD");
        assertThat(service.determineBadge(760)).isEqualTo("SILVER");
        assertThat(service.determineBadge(620)).isEqualTo("BRONZE");
        assertThat(service.determineBadge(500)).isNull();
    }

    @Test
    void riskLabelAssignmentIsCorrect() {
        CreadiScoreService service = service();
        assertThat(service.determineRisk(900)).isEqualTo(RiskLevel.LOW);
        assertThat(service.determineRisk(760)).isEqualTo(RiskLevel.MODERATE);
        assertThat(service.determineRisk(620)).isEqualTo(RiskLevel.HIGH);
        assertThat(service.determineRisk(420)).isEqualTo(RiskLevel.VERY_HIGH);
        assertThat(service.determineRisk(250)).isEqualTo(RiskLevel.CRITICAL);
    }

    private User verifiedUser(Long id, Double salary, LocalDateTime createdAt) {
        return User.builder()
                .id(id)
                .createdAt(createdAt)
                .kycSubmittedAt(createdAt.plusDays(1))
                .kycStatus(KycStatus.VERIFIED)
                .kycFraudFlag(false)
                .kycFailedAttempts(0)
                .paymentScoreModifier(0)
                .monthlySalary(salary)
                .maritalStatus("MARRIED")
                .numberOfChildren(0)
                .build();
    }

    private FinancialProfile profile(User user, BigDecimal salary, EmploymentStatus employmentStatus, LocalDateTime createdAt) {
        return FinancialProfile.builder()
                .user(user)
                .monthlySalary(salary)
                .salaryDay(25)
                .employmentStatus(employmentStatus)
                .riskLevel(RiskLevel.LOW)
                .createdAt(createdAt)
                .updatedAt(createdAt)
                .build();
    }

    private KycDocument strongDocument(User user, int fraudRiskScore) {
        return KycDocument.builder()
                .user(user)
                .status(KycStatus.VERIFIED)
                .faceMatchScore(1.0)
                .livenessScore(1.0)
                .providerConfidence(1.0)
                .spoofDetected(false)
                .fraudRiskScore(fraudRiskScore)
                .build();
    }

    private List<Installment> paidInstallments(User user, int count, int daysLate) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> {
                    LocalDate dueDate = LocalDate.now().minusMonths(count - i);
                    return installment(user, dueDate, InstallmentStatus.PAID, dueDate.plusDays(daysLate), BigDecimal.valueOf(100));
                })
                .toList();
    }

    private List<Installment> overdueInstallments(User user, int count, int daysOverdue) {
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> installment(user, LocalDate.now().minusDays(daysOverdue + i), InstallmentStatus.OVERDUE, null, BigDecimal.valueOf(100)))
                .toList();
    }

    private List<Installment> pendingInstallments(User user, BigDecimal amount) {
        return List.of(installment(user, LocalDate.now().plusDays(10), InstallmentStatus.PENDING, null, amount));
    }

    private Installment installment(User user, LocalDate dueDate, InstallmentStatus status, LocalDate paidDate, BigDecimal amount) {
        return Installment.builder()
                .creditRequest(CreditRequest.builder().id(99L).user(user).build())
                .dueDate(dueDate)
                .status(status)
                .paidDate(paidDate == null ? null : paidDate.atStartOfDay())
                .amount(amount)
                .penalty(BigDecimal.ZERO)
                .build();
    }

    private void mockScoreInputs(User user, FinancialProfile profile, KycDocument document, List<Installment> installments) {
        when(userRepository.findById(user.getId())).thenReturn(Optional.of(user));
        mockLatestScoreInputs(user, profile, document, installments);
    }

    private void mockLatestScoreInputs(User user, FinancialProfile profile, KycDocument document, List<Installment> installments) {
        when(financialProfileRepository.findByUserId(user.getId())).thenReturn(Optional.ofNullable(profile));
        when(kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())).thenReturn(Optional.ofNullable(document));
        when(installmentRepository.findByCreditRequestUserId(user.getId())).thenReturn(installments);
    }

    private CreadiScoreService service() {
        return new CreadiScoreService(
                userRepository,
                creadiScoreRepository,
                installmentRepository,
                kycDocumentRepository,
                financialProfileRepository
        );
    }
}
