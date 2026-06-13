package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CreadiScoreResponse;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CreadiScoreRepository;
import com.creaditn.creaditnbackend.repository.FinancialProfileRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import com.creaditn.creaditnbackend.util.CreditCalculator;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.Normalizer;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class CreadiScoreService {

    private final UserRepository userRepository;
    private final CreadiScoreRepository creadiScoreRepository;
    private final InstallmentRepository installmentRepository;
    private final KycDocumentRepository kycDocumentRepository;
    private final FinancialProfileRepository financialProfileRepository;

    public CreadiScoreResponse calculateScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        KycDocument document = kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        FinancialProfile profile = financialProfileRepository.findByUserId(userId).orElse(null);
        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        Eligibility eligibility = determineEligibility(user, document, profile);

        if (eligibility.status() != ScoreStatus.COMPLETE) {
            return buildIneligibleResponse(userId, user, profile, installments, eligibility);
        }

        ScoreBreakdown breakdown = calculateBreakdown(user, document, profile, installments);
        int totalScore = clamp(
                breakdown.kycScore()
                        + breakdown.financialScore()
                        + breakdown.paymentBehaviorScore()
                        + breakdown.stabilityScore()
                        + breakdown.riskScore()
                        + paymentScoreModifier(user),
                0,
                CreadiScoreConstants.TOTAL_SCORE_MAX
        );

        ScoreLevel level = determineLevel(totalScore);
        RiskLevel risk = determineRisk(totalScore);
        String badge = determineBadge(totalScore);
        String reason = generateReason(totalScore, breakdown);
        List<String> tips = generateImprovementTips(breakdown);
        List<String> factors = generateScoreFactors(breakdown);
        BuyingPowerSnapshot buyingPower = computeBuyingPower(user, profile, installments, totalScore, true);

        CreadiScore entity = CreadiScore.builder()
                .user(user)
                .totalScore(totalScore)
                .kycScore(breakdown.kycScore())
                .salaryScore(breakdown.financialScore())
                .maritalScore(0)
                .childrenScore(0)
                .behaviorScore(breakdown.paymentBehaviorScore())
                .level(level)
                .risk(risk)
                .reason(reason)
                .badge(badge)
                .build();
        creadiScoreRepository.save(entity);

        return buildResponse(
                userId,
                user,
                ScoreStatus.COMPLETE,
                totalScore,
                level,
                risk,
                reason,
                breakdown,
                factors,
                badge,
                buyingPower,
                tips,
                entity.getCreatedAt()
        );
    }

    @Transactional(readOnly = true)
    public CreadiScoreResponse getLatestScore(Long userId) {
        CreadiScore cs = creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (cs == null) {
            return calculateScore(userId);
        }

        User user = cs.getUser();
        KycDocument document = kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        FinancialProfile profile = financialProfileRepository.findByUserId(userId).orElse(null);
        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        Eligibility eligibility = determineEligibility(user, document, profile);

        if (eligibility.status() != ScoreStatus.COMPLETE) {
            return buildIneligibleResponse(userId, user, profile, installments, eligibility);
        }

        ScoreBreakdown breakdown = calculateBreakdown(user, document, profile, installments);
        int totalScore = clamp(
                breakdown.kycScore()
                        + breakdown.financialScore()
                        + breakdown.paymentBehaviorScore()
                        + breakdown.stabilityScore()
                        + breakdown.riskScore()
                        + paymentScoreModifier(user),
                0,
                CreadiScoreConstants.TOTAL_SCORE_MAX
        );
        ScoreLevel level = determineLevel(totalScore);
        RiskLevel risk = determineRisk(totalScore);
        String reason = generateReason(totalScore, breakdown);
        String badge = determineBadge(totalScore);
        return buildResponse(
                userId,
                user,
                ScoreStatus.COMPLETE,
                totalScore,
                level,
                risk,
                reason,
                breakdown,
                generateScoreFactors(breakdown),
                badge,
                computeBuyingPower(user, profile, installments, totalScore, true),
                generateImprovementTips(breakdown),
                cs.getCreatedAt()
        );
    }

    private Eligibility determineEligibility(User user, KycDocument document, FinancialProfile profile) {
        if (Boolean.TRUE.equals(user.getKycFraudFlag())) {
            return new Eligibility(ScoreStatus.BLOCKED, "Credit score blocked because fraud signals were detected on the account.");
        }
        if (document != null && Boolean.TRUE.equals(document.getSpoofDetected())) {
            return new Eligibility(ScoreStatus.BLOCKED, "Credit score blocked because spoofing was detected during identity verification.");
        }
        if (document != null && document.getFraudRiskScore() != null
                && document.getFraudRiskScore() >= CreadiScoreConstants.CRITICAL_FRAUD_RISK_SCORE) {
            return new Eligibility(ScoreStatus.BLOCKED, "Credit score blocked because identity fraud risk is critical.");
        }
        if (user.getKycStatus() != KycStatus.VERIFIED) {
            return new Eligibility(ScoreStatus.INCOMPLETE, "Complete identity verification before your credit score can be calculated.");
        }
        if (monthlySalary(user, profile) <= 0) {
            return new Eligibility(ScoreStatus.INCOMPLETE, "Add a valid monthly salary before your credit score can be calculated.");
        }
        return new Eligibility(ScoreStatus.COMPLETE, "Credit score calculated.");
    }

    private CreadiScoreResponse buildIneligibleResponse(
            Long userId,
            User user,
            FinancialProfile profile,
            List<Installment> installments,
            Eligibility eligibility
    ) {
        List<String> tips = new ArrayList<>();
        if (user.getKycStatus() != KycStatus.VERIFIED) {
            tips.add("Complete KYC verification to unlock your credit score");
        }
        if (monthlySalary(user, profile) <= 0) {
            tips.add("Complete your financial profile with a valid monthly salary");
        }
        if (eligibility.status() == ScoreStatus.BLOCKED) {
            tips.add("Contact support to review the blocked identity or fraud signal");
        }

        ScoreBreakdown empty = ScoreBreakdown.empty();
        return buildResponse(
                userId,
                user,
                eligibility.status(),
                null,
                null,
                eligibility.status() == ScoreStatus.BLOCKED ? RiskLevel.CRITICAL : null,
                eligibility.reason(),
                empty,
                List.of(eligibility.reason()),
                null,
                computeBuyingPower(user, profile, installments, null, true),
                tips,
                LocalDateTime.now()
        );
    }

    private ScoreBreakdown calculateBreakdown(
            User user,
            KycDocument document,
            FinancialProfile profile,
            List<Installment> installments
    ) {
        // REAL CREDIT SCORING LOGIC
        int kycScore = computeKycScore(document);

        // REAL CREDIT SCORING LOGIC
        int salaryPoints = computeSalaryPoints(monthlySalary(user, profile));
        int dtiPoints = computeDtiPoints(monthlyDebt(installments), monthlySalary(user, profile));
        int incomeStabilityPoints = computeIncomeStabilityPoints(profile, user);
        int financialScore = clamp(
                salaryPoints + dtiPoints + incomeStabilityPoints,
                0,
                CreadiScoreConstants.FINANCIAL_SCORE_MAX
        );

        // REAL CREDIT SCORING LOGIC
        PaymentMetrics paymentMetrics = paymentMetrics(installments);
        int onTimePoints = (int) Math.round(CreadiScoreConstants.ON_TIME_POINTS_MAX * paymentMetrics.onTimeRate());
        int recentPoints = (int) Math.round(CreadiScoreConstants.RECENT_PAYMENT_POINTS_MAX * paymentMetrics.recentOnTimeRate());
        int historyPoints = computePaymentHistoryPoints(paymentMetrics.historyMonths());
        int positiveHistoryPoints = Math.min(
                CreadiScoreConstants.POSITIVE_PAYMENT_POINTS_MAX,
                paymentMetrics.paidCount() * CreadiScoreConstants.POSITIVE_PAYMENT_POINTS_PER_INSTALLMENT
        );
        int latePenaltyPoints = Math.min(CreadiScoreConstants.LATE_PAYMENT_PENALTY_MAX, paymentMetrics.latePenalty());
        int paymentBehaviorScore = clamp(
                onTimePoints + recentPoints + historyPoints + positiveHistoryPoints - latePenaltyPoints,
                0,
                CreadiScoreConstants.PAYMENT_BEHAVIOR_SCORE_MAX
        );

        // REAL CREDIT SCORING LOGIC
        int accountAgePoints = computeAccountAgePoints(user);
        int employmentPoints = computeEmploymentPoints(profile);
        int loyaltyPoints = computeLoyaltyPoints(user);
        int stabilityScore = clamp(
                accountAgePoints + employmentPoints + loyaltyPoints,
                0,
                CreadiScoreConstants.STABILITY_SCORE_MAX
        );

        // REAL CREDIT SCORING LOGIC
        int riskScore = computeRiskScore(user, document);

        return new ScoreBreakdown(
                kycScore,
                financialScore,
                paymentBehaviorScore,
                stabilityScore,
                riskScore,
                salaryPoints,
                dtiPoints,
                incomeStabilityPoints,
                onTimePoints,
                recentPoints,
                historyPoints,
                positiveHistoryPoints,
                latePenaltyPoints,
                accountAgePoints,
                employmentPoints,
                loyaltyPoints
        );
    }

    private int computeKycScore(KycDocument document) {
        int score = CreadiScoreConstants.KYC_VERIFIED_BASE;
        if (document == null) {
            return score;
        }
        score += scaledMetric(document.getFaceMatchScore(), CreadiScoreConstants.KYC_FACE_MATCH_MAX);
        score += scaledMetric(document.getLivenessScore(), CreadiScoreConstants.KYC_LIVENESS_MAX);
        score += scaledMetric(document.getProviderConfidence(), CreadiScoreConstants.KYC_PROVIDER_CONFIDENCE_MAX);
        score += Boolean.FALSE.equals(document.getSpoofDetected()) ? CreadiScoreConstants.KYC_NO_SPOOF_POINTS : 0;
        return clamp(score, 0, CreadiScoreConstants.KYC_SCORE_MAX);
    }

    private int computeSalaryPoints(double salary) {
        if (salary <= 0) {
            return 0;
        }
        double cappedSalary = Math.min(salary, CreadiScoreConstants.SALARY_CAP);
        return clamp(
                (int) Math.round(CreadiScoreConstants.SALARY_POINTS_MAX * Math.sqrt(cappedSalary / CreadiScoreConstants.SALARY_CAP)),
                0,
                CreadiScoreConstants.SALARY_POINTS_MAX
        );
    }

    private int computeDtiPoints(double totalMonthlyDebt, double salary) {
        if (salary <= 0) {
            return 0;
        }
        double dti = totalMonthlyDebt / salary;
        if (dti <= 0.10) return 80;
        if (dti <= 0.20) return 65;
        if (dti <= 0.30) return 50;
        if (dti <= 0.40) return 30;
        if (dti <= 0.50) return 10;
        return 0;
    }

    private int computeIncomeStabilityPoints(FinancialProfile profile, User user) {
        long months = monthsSince(profile == null ? user.getCreatedAt() : profile.getCreatedAt(), LocalDateTime.now());
        if (months >= 12) return 50;
        if (months >= 6) return 35;
        if (months >= 3) return 20;
        return 0;
    }

    private int computePaymentHistoryPoints(long months) {
        if (months >= 24) return 60;
        if (months >= 12) return 40;
        if (months >= 6) return 20;
        if (months >= 3) return 10;
        return 0;
    }

    private int computeAccountAgePoints(User user) {
        long months = monthsSince(user.getCreatedAt(), LocalDateTime.now());
        if (months >= 36) return 40;
        if (months >= 24) return 30;
        if (months >= 12) return 20;
        if (months >= 6) return 10;
        return 0;
    }

    private int computeEmploymentPoints(FinancialProfile profile) {
        if (profile == null || profile.getEmploymentStatus() == null) {
            return 0;
        }
        return switch (profile.getEmploymentStatus()) {
            case FULL_TIME -> 35;
            case SELF_EMPLOYED -> 25;
            case PART_TIME, OTHER -> 15;
            case STUDENT -> 10;
            case UNEMPLOYED -> 0;
        };
    }

    private int computeLoyaltyPoints(User user) {
        long years = monthsSince(user.getCreatedAt(), LocalDateTime.now()) / 12;
        if (years >= 5) return 25;
        if (years >= 3) return 15;
        if (years >= 1) return 10;
        return 0;
    }

    private int computeRiskScore(User user, KycDocument document) {
        int deductions = 0;
        int fraudRisk = document == null || document.getFraudRiskScore() == null ? 0 : document.getFraudRiskScore();
        if (fraudRisk >= CreadiScoreConstants.HIGH_FRAUD_RISK_SCORE) {
            deductions += CreadiScoreConstants.HIGH_FRAUD_RISK_PENALTY;
        } else if (fraudRisk >= CreadiScoreConstants.MEDIUM_FRAUD_RISK_SCORE) {
            deductions += CreadiScoreConstants.MEDIUM_FRAUD_RISK_PENALTY;
        }
        int failedAttempts = user.getKycFailedAttempts() == null ? 0 : user.getKycFailedAttempts();
        deductions += failedAttempts * CreadiScoreConstants.FAILED_KYC_ATTEMPT_PENALTY;
        deductions = Math.min(CreadiScoreConstants.RISK_DEDUCTION_MAX, deductions);
        return clamp(CreadiScoreConstants.RISK_START_POINTS - deductions, 0, CreadiScoreConstants.RISK_SCORE_MAX);
    }

    private PaymentMetrics paymentMetrics(List<Installment> installments) {
        if (installments == null || installments.isEmpty()) {
            return new PaymentMetrics(0.0, 0.0, 0, 0, 0);
        }

        LocalDate today = LocalDate.now();
        List<Installment> scored = installments.stream()
                .filter(installment -> installment.getStatus() == InstallmentStatus.PAID
                        || installment.getStatus() == InstallmentStatus.OVERDUE)
                .toList();

        int paidCount = (int) installments.stream().filter(i -> i.getStatus() == InstallmentStatus.PAID).count();
        if (scored.isEmpty()) {
            return new PaymentMetrics(0.0, 0.0, 0, paidCount, 0);
        }

        long onTimeCount = scored.stream().filter(this::isOnTime).count();
        double onTimeRate = onTimeCount / (double) scored.size();

        LocalDate recentCutoff = today.minusMonths(6);
        List<Installment> recent = scored.stream()
                .filter(installment -> !installment.getDueDate().isBefore(recentCutoff))
                .toList();
        double recentOnTimeRate = recent.isEmpty()
                ? onTimeRate
                : recent.stream().filter(this::isOnTime).count() / (double) recent.size();

        LocalDate firstDueDate = installments.stream()
                .map(Installment::getDueDate)
                .min(Comparator.naturalOrder())
                .orElse(today);
        LocalDate lastSignalDate = installments.stream()
                .map(installment -> installment.getPaidDate() == null
                        ? installment.getDueDate()
                        : installment.getPaidDate().toLocalDate())
                .max(Comparator.naturalOrder())
                .orElse(today);
        long historyMonths = Math.max(0, ChronoUnit.MONTHS.between(firstDueDate.withDayOfMonth(1), lastSignalDate.withDayOfMonth(1)));

        int latePenalty = scored.stream().mapToInt(this::latePenaltyFor).sum();
        return new PaymentMetrics(onTimeRate, recentOnTimeRate, historyMonths, paidCount, latePenalty);
    }

    private boolean isOnTime(Installment installment) {
        if (installment.getStatus() != InstallmentStatus.PAID || installment.getPaidDate() == null) {
            return false;
        }
        return !installment.getPaidDate().toLocalDate().isAfter(installment.getDueDate());
    }

    private int latePenaltyFor(Installment installment) {
        LocalDate paidOrToday = installment.getPaidDate() == null ? LocalDate.now() : installment.getPaidDate().toLocalDate();
        long daysLate = ChronoUnit.DAYS.between(installment.getDueDate(), paidOrToday);
        if (daysLate <= 0) return 0;
        if (daysLate <= 30) return 10;
        if (daysLate <= 60) return 25;
        if (daysLate <= 90) return 50;
        return 90;
    }

    private BuyingPowerSnapshot computeBuyingPower(
            User user,
            FinancialProfile profile,
            List<Installment> installments,
            Integer totalScore,
            boolean applyCurrentDebtToLimit
    ) {
        double baseBuyingPower = computeBaseBuyingPower(
                user,
                profile,
                installments,
                totalScore,
                applyCurrentDebtToLimit
        );
        double paymentTrustBonus = clampPaymentTrustBonus(user.getPaymentTrustBonus());
        double buyingPowerLimit = clampDouble(baseBuyingPower + paymentTrustBonus, 0, CreadiScoreConstants.CREDIT_LIMIT_CAP);
        double outstandingBalance = calculateOutstandingBalance(installments).doubleValue();
        double availableCredit = Math.max(0, buyingPowerLimit - outstandingBalance);
        double usedPercent = buyingPowerLimit <= 0 ? 0 : (outstandingBalance / buyingPowerLimit) * 100;
        Installment next = nextActiveInstallment(installments);
        BigDecimal nextAmount = next == null ? BigDecimal.ZERO : next.getAmount().add(next.getPenalty() == null ? BigDecimal.ZERO : next.getPenalty());

        return new BuyingPowerSnapshot(
                roundMoney(baseBuyingPower),
                roundMoney(paymentTrustBonus),
                roundMoney(buyingPowerLimit),
                roundMoney(outstandingBalance),
                roundMoney(availableCredit),
                roundMoney(usedPercent),
                nextAmount,
                next == null ? null : next.getDueDate()
        );
    }

    private double computeBaseBuyingPower(
            User user,
            FinancialProfile profile,
            List<Installment> installments,
            Integer totalScore,
            boolean applyCurrentDebtToLimit
    ) {
        double salary = monthlySalary(user, profile);
        if (salary <= 0) {
            return 0;
        }

        double baseCredit = salary * CreadiScoreConstants.BASE_CREDIT_MULTIPLIER;
        EmploymentStatus employmentStatus = profile == null ? null : profile.getEmploymentStatus();
        if (employmentStatus == EmploymentStatus.FULL_TIME) {
            baseCredit *= 1.12;
        } else if (employmentStatus == EmploymentStatus.SELF_EMPLOYED) {
            baseCredit *= 1.03;
        } else if (employmentStatus == EmploymentStatus.PART_TIME) {
            baseCredit *= 0.90;
        } else if (employmentStatus == EmploymentStatus.STUDENT) {
            baseCredit *= 0.72;
        } else if (employmentStatus == EmploymentStatus.UNEMPLOYED) {
            baseCredit *= 0.60;
        } else if (employmentStatus == EmploymentStatus.OTHER || employmentStatus == null) {
            baseCredit *= 0.85;
        }

        if (applyCurrentDebtToLimit) {
            int dtiPoints = computeDtiPoints(monthlyDebt(installments), salary);
            double financialCapacityFactor = 0.65
                    + (dtiPoints / (double) CreadiScoreConstants.DTI_POINTS_MAX) * 0.35;
            baseCredit *= financialCapacityFactor;
        }
        baseCredit *= computeScoreFactor(totalScore);

        return Math.min(CreadiScoreConstants.CREDIT_LIMIT_CAP, Math.max(0, baseCredit));
    }

    private BigDecimal calculateOutstandingBalance(List<Installment> installments) {
        if (installments == null || installments.isEmpty()) {
            return BigDecimal.ZERO;
        }

        Map<CreditRequest, List<Installment>> byCredit = installments.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        Installment::getCreditRequest,
                        LinkedHashMap::new,
                        java.util.stream.Collectors.toList()
                ));

        return byCredit.entrySet().stream()
                .map(entry -> calculateOutstandingPrincipal(entry.getKey(), entry.getValue()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal calculateOutstandingPrincipal(
            CreditRequest creditRequest,
            List<Installment> creditInstallments
    ) {
        if (creditRequest == null
                || creditRequest.getTotalAmount() == null
                || creditRequest.getDownPayment() == null
                || creditRequest.getNumberOfInstallments() == null
                || creditRequest.getNumberOfInstallments() <= 0) {
            return creditInstallments.stream()
                    .filter(this::isUnpaid)
                    .map(Installment::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        List<Installment> ordered = creditInstallments.stream()
                .sorted(Comparator.comparing(Installment::getDueDate)
                        .thenComparing(Installment::getId, Comparator.nullsLast(Long::compareTo)))
                .toList();
        List<BigDecimal> principalSchedule = CreditCalculator.calculatePrincipalSchedule(
                creditRequest.getTotalAmount(),
                creditRequest.getDownPayment(),
                creditRequest.getNumberOfInstallments()
        );

        BigDecimal outstanding = BigDecimal.ZERO;
        for (int index = 0; index < ordered.size() && index < principalSchedule.size(); index++) {
            if (isUnpaid(ordered.get(index))) {
                outstanding = outstanding.add(principalSchedule.get(index));
            }
        }
        return outstanding;
    }

    private boolean isUnpaid(Installment installment) {
        return installment.getStatus() == InstallmentStatus.PENDING
                || installment.getStatus() == InstallmentStatus.OVERDUE;
    }

    private Installment nextActiveInstallment(List<Installment> installments) {
        if (installments == null) {
            return null;
        }
        return installments.stream()
                .filter(installment -> installment.getStatus() == InstallmentStatus.PENDING
                        || installment.getStatus() == InstallmentStatus.OVERDUE)
                .min(Comparator.comparing(Installment::getDueDate)
                        .thenComparing(Installment::getId, Comparator.nullsLast(Long::compareTo)))
                .orElse(null);
    }

    private int clampPaymentTrustBonus(Integer value) {
        int bonus = value == null ? 0 : value;
        return clamp(bonus, CreadiScoreConstants.PAYMENT_TRUST_BONUS_MIN, CreadiScoreConstants.PAYMENT_TRUST_BONUS_MAX);
    }

    private double clampDouble(double value, double min, double max) {
        return Math.max(min, Math.min(max, value));
    }

    private double roundMoney(double value) {
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    public double computeCreditLimitForUser(Long userId) {
        return computeBuyingPowerForUser(userId).buyingPowerLimit();
    }

    public BuyingPowerSnapshot computeBuyingPowerForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        KycDocument document = kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        FinancialProfile profile = financialProfileRepository.findByUserId(userId).orElse(null);
        List<Installment> installments = installmentRepository.findByCreditRequestUserId(userId);
        Eligibility eligibility = determineEligibility(user, document, profile);
        if (eligibility.status() != ScoreStatus.COMPLETE) {
            return computeBuyingPower(user, profile, installments, null, false);
        }
        Integer approvedScore = creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(CreadiScore::getTotalScore)
                .orElseGet(() -> {
                    ScoreBreakdown breakdown = calculateBreakdown(user, document, profile, installments);
                    return clamp(
                            breakdown.kycScore()
                                    + breakdown.financialScore()
                                    + breakdown.paymentBehaviorScore()
                                    + breakdown.stabilityScore()
                                    + breakdown.riskScore()
                                    + paymentScoreModifier(user),
                            0,
                            CreadiScoreConstants.TOTAL_SCORE_MAX
                    );
                });
        boolean hasOutstandingCredit = installments.stream()
                .anyMatch(installment -> installment.getStatus() == InstallmentStatus.PENDING
                        || installment.getStatus() == InstallmentStatus.OVERDUE);
        if (hasOutstandingCredit) {
            approvedScore = creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
                    .map(CreadiScore::getTotalScore)
                    .filter(java.util.Objects::nonNull)
                    .max(Integer::compareTo)
                    .orElse(approvedScore);
        }

        // The approved limit stays stable during an active credit. Outstanding debt is
        // subtracted below to produce available credit. A payment must release principal
        // without lowering the ceiling while another approved credit remains open.
        return computeBuyingPower(user, profile, installments, approvedScore, false);
    }

    private double computeScoreFactor(Integer totalScore) {
        if (totalScore == null) {
            return 0.0;
        }
        ScoreLevel level = determineLevel(totalScore);
        return switch (level) {
            case EXCELLENT -> 1.15;
            case GOOD -> 1.00;
            case MEDIUM -> 0.75;
            case HIGH_RISK -> 0.40;
            case CRITICAL -> 0.00;
        };
    }

    private int paymentScoreModifier(User user) {
        int modifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        return clamp(
                modifier,
                CreadiScoreConstants.PAYMENT_SCORE_MODIFIER_MIN,
                CreadiScoreConstants.PAYMENT_SCORE_MODIFIER_MAX
        );
    }

    private CreadiScoreResponse buildResponse(
            Long userId,
            User user,
            ScoreStatus scoreStatus,
            Integer totalScore,
            ScoreLevel level,
            RiskLevel risk,
            String reason,
            ScoreBreakdown breakdown,
            List<String> scoreFactors,
            String badge,
            BuyingPowerSnapshot buyingPower,
            List<String> tips,
            LocalDateTime calculatedAt
    ) {
        String explanation = generateScoreExplanation(scoreStatus, reason, breakdown);
        return CreadiScoreResponse.builder()
                .userId(userId)
                .score(totalScore)
                .totalScore(totalScore)
                .scoreStatus(scoreStatus)
                .level(level)
                .risk(risk)
                .reason(reason)
                .kycScore(breakdown.kycScore())
                .financialScore(breakdown.financialScore())
                .paymentBehaviorScore(breakdown.paymentBehaviorScore())
                .stabilityScore(breakdown.stabilityScore())
                .riskScore(breakdown.riskScore())
                .salaryScore(breakdown.financialScore())
                .maritalScore(0)
                .childrenScore(0)
                .behaviorScore(breakdown.paymentBehaviorScore())
                .behaviorAnalysis(explanation)
                .scoreFactors(scoreFactors)
                .scoreExplanation(explanation)
                .badge(badge)
                .maxCreditLimit(buyingPower.buyingPowerLimit())
                .buyingPowerLimit(buyingPower.buyingPowerLimit())
                .baseBuyingPower(buyingPower.baseBuyingPower())
                .paymentTrustBonus(buyingPower.paymentTrustBonus())
                .outstandingBalance(buyingPower.outstandingBalance())
                .availableCredit(buyingPower.availableCredit())
                .usedPercent(buyingPower.usedPercent())
                .nextInstallmentAmount(buyingPower.nextInstallmentAmount())
                .nextInstallmentDate(buyingPower.nextInstallmentDate())
                .history(getScoreHistory(user.getId()))
                .improvementTips(tips)
                .calculatedAt(calculatedAt)
                .salaryPoints(breakdown.salaryPoints())
                .dtiPoints(breakdown.dtiPoints())
                .incomeStabilityPoints(breakdown.incomeStabilityPoints())
                .onTimePoints(breakdown.onTimePoints())
                .recentPoints(breakdown.recentPoints())
                .historyPoints(breakdown.historyPoints())
                .positiveHistoryPoints(breakdown.positiveHistoryPoints())
                .latePenaltyPoints(breakdown.latePenaltyPoints())
                .accountAgePoints(breakdown.accountAgePoints())
                .employmentPoints(breakdown.employmentPoints())
                .loyaltyPoints(breakdown.loyaltyPoints())
                .build();
    }

    ScoreLevel determineLevel(int score) {
        if (score >= CreadiScoreConstants.EXCELLENT_SCORE_MIN) return ScoreLevel.EXCELLENT;
        if (score >= CreadiScoreConstants.GOOD_SCORE_MIN) return ScoreLevel.GOOD;
        if (score >= CreadiScoreConstants.MEDIUM_SCORE_MIN) return ScoreLevel.MEDIUM;
        if (score >= CreadiScoreConstants.HIGH_RISK_SCORE_MIN) return ScoreLevel.HIGH_RISK;
        return ScoreLevel.CRITICAL;
    }

    RiskLevel determineRisk(int score) {
        if (score >= CreadiScoreConstants.EXCELLENT_SCORE_MIN) return RiskLevel.LOW;
        if (score >= CreadiScoreConstants.GOOD_SCORE_MIN) return RiskLevel.MODERATE;
        if (score >= CreadiScoreConstants.MEDIUM_SCORE_MIN) return RiskLevel.HIGH;
        if (score >= CreadiScoreConstants.HIGH_RISK_SCORE_MIN) return RiskLevel.VERY_HIGH;
        return RiskLevel.CRITICAL;
    }

    String determineBadge(int score) {
        if (score >= CreadiScoreConstants.GOLD_BADGE_MIN) return "GOLD";
        if (score >= CreadiScoreConstants.SILVER_BADGE_MIN) return "SILVER";
        if (score >= CreadiScoreConstants.BRONZE_BADGE_MIN) return "BRONZE";
        return null;
    }

    private String generateReason(int totalScore, ScoreBreakdown breakdown) {
        String levelText = switch (determineLevel(totalScore)) {
            case EXCELLENT -> "excellent";
            case GOOD -> "good";
            case MEDIUM -> "medium";
            case HIGH_RISK -> "high risk";
            case CRITICAL -> "critical";
        };
        return "Your score is " + levelText + " based on identity verification, financial capacity, payment behavior, stability, and risk signals.";
    }

    private List<String> generateImprovementTips(ScoreBreakdown breakdown) {
        List<String> tips = new ArrayList<>();
        if (breakdown.paymentBehaviorScore() < 320) tips.add("Pay installments on or before their due date to improve the largest score component");
        if (breakdown.financialScore() < 200) tips.add("Lower active monthly debt or update salary information to improve financial capacity");
        if (breakdown.kycScore() < 140) tips.add("Keep identity verification data strong and free of fraud signals");
        if (breakdown.stabilityScore() < 70) tips.add("A longer account and income history will improve stability over time");
        if (breakdown.riskScore() < 80) tips.add("Avoid failed KYC attempts and risky identity signals");
        if (tips.isEmpty()) tips.add("Great job! Keep paying on time and maintaining clean account signals");
        return tips;
    }

    private List<String> generateScoreFactors(ScoreBreakdown breakdown) {
        return List.of(
                "KYC and identity: " + breakdown.kycScore() + "/" + CreadiScoreConstants.KYC_SCORE_MAX,
                "Financial capacity: " + breakdown.financialScore() + "/" + CreadiScoreConstants.FINANCIAL_SCORE_MAX,
                "Payment behavior: " + breakdown.paymentBehaviorScore() + "/" + CreadiScoreConstants.PAYMENT_BEHAVIOR_SCORE_MAX,
                "Stability: " + breakdown.stabilityScore() + "/" + CreadiScoreConstants.STABILITY_SCORE_MAX,
                "Risk assessment: " + breakdown.riskScore() + "/" + CreadiScoreConstants.RISK_SCORE_MAX
        );
    }

    private String generateScoreExplanation(ScoreStatus status, String reason, ScoreBreakdown breakdown) {
        if (status != ScoreStatus.COMPLETE) {
            return reason;
        }
        return "Payment behavior is weighted most heavily, followed by financial capacity, identity quality, stability, and risk assessment.";
    }

    private List<CreadiScoreResponse.ScoreHistoryItem> getScoreHistory(Long userId) {
        return creadiScoreRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .limit(10)
                .map(cs -> CreadiScoreResponse.ScoreHistoryItem.builder()
                        .score(cs.getTotalScore())
                        .level(cs.getLevel())
                        .date(cs.getCreatedAt())
                        .build())
                .toList();
    }

    private double monthlySalary(User user, FinancialProfile profile) {
        if (profile != null && profile.getMonthlySalary() != null) {
            return profile.getMonthlySalary().doubleValue();
        }
        return user.getMonthlySalary() == null ? 0 : user.getMonthlySalary();
    }

    private double monthlyDebt(List<Installment> installments) {
        if (installments == null) {
            return 0;
        }
        return installments.stream()
                .filter(installment -> installment.getStatus() == InstallmentStatus.PENDING
                        || installment.getStatus() == InstallmentStatus.OVERDUE)
                .map(installment -> installment.getAmount().add(installment.getPenalty() == null ? BigDecimal.ZERO : installment.getPenalty()))
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .doubleValue();
    }

    private int scaledMetric(Double value, int maxPoints) {
        if (value == null) return 0;
        double normalized = value > 1.0 ? value / 100.0 : value;
        return clamp((int) Math.round(normalized * maxPoints), 0, maxPoints);
    }

    private long monthsSince(LocalDateTime start, LocalDateTime end) {
        if (start == null || end == null || start.isAfter(end)) {
            return 0;
        }
        return ChronoUnit.MONTHS.between(start.toLocalDate().withDayOfMonth(1), end.toLocalDate().withDayOfMonth(1));
    }

    private int clamp(int value, int min, int max) {
        return Math.max(min, Math.min(max, value));
    }

    private int nullToZero(Integer value) {
        return value == null ? 0 : value;
    }

    private String normalize(String value) {
        if (value == null) return "";
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .trim()
                .toUpperCase();
    }

    private record Eligibility(ScoreStatus status, String reason) {
    }

    private record PaymentMetrics(double onTimeRate, double recentOnTimeRate, long historyMonths, int paidCount, int latePenalty) {
    }

    public record BuyingPowerSnapshot(
            double baseBuyingPower,
            double paymentTrustBonus,
            double buyingPowerLimit,
            double outstandingBalance,
            double availableCredit,
            double usedPercent,
            BigDecimal nextInstallmentAmount,
            LocalDate nextInstallmentDate
    ) {
    }

    private record ScoreBreakdown(
            int kycScore,
            int financialScore,
            int paymentBehaviorScore,
            int stabilityScore,
            int riskScore,
            int salaryPoints,
            int dtiPoints,
            int incomeStabilityPoints,
            int onTimePoints,
            int recentPoints,
            int historyPoints,
            int positiveHistoryPoints,
            int latePenaltyPoints,
            int accountAgePoints,
            int employmentPoints,
            int loyaltyPoints
    ) {
        private static ScoreBreakdown empty() {
            return new ScoreBreakdown(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0);
        }
    }
}
