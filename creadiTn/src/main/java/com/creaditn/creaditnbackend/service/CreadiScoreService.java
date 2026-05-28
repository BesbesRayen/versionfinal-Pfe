package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.CreadiScoreResponse;
import com.creaditn.creaditnbackend.entity.*;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.CreadiScoreRepository;
import com.creaditn.creaditnbackend.repository.InstallmentRepository;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.text.Normalizer;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CreadiScoreService {

    private static final int TOTAL_SCORE_MAX = 1000;
    private static final int KYC_SCORE_MAX = 300;
    private static final int SALARY_SCORE_MAX = 387;
    private static final int BEHAVIOR_SCORE_MAX = 287;
    private static final int REMOVED_HOUSEHOLD_SCORE = 0;

    private static final double SALARY_CAP = 15_000.0;

    private static final int BEHAVIOR_BASE = 100;
    private static final int FAST_KYC_BONUS = 50;
    private static final int NORMAL_KYC_BONUS = 32;
    private static final int SLOW_KYC_BONUS = 15;
    private static final int REJECTED_KYC_PENALTY = 50;
    private static final int CLEAN_FRAUD_BONUS = 50;
    private static final int FRAUD_FLAG_PENALTY = 95;
    private static final int FAILED_KYC_ATTEMPT_PENALTY = 24;
    private static final int FAILED_KYC_ATTEMPT_PENALTY_MAX = 75;
    private static final int PAYMENT_MODIFIER_MIN = -110;
    private static final int PAYMENT_MODIFIER_MAX = 110;
    private static final int OVERDUE_INSTALLMENT_PENALTY = 28;
    private static final int OVERDUE_INSTALLMENT_PENALTY_MAX = 85;
    private static final int PENDING_INSTALLMENT_BONUS = 4;
    private static final int PENDING_INSTALLMENT_BONUS_MAX = 25;

    private final UserRepository userRepository;
    private final CreadiScoreRepository creadiScoreRepository;
    private final InstallmentRepository installmentRepository;
    private final KycDocumentRepository kycDocumentRepository;

    public CreadiScoreResponse calculateScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int kycScore = computeKycScore(user);
        int salaryScore = computeSalaryScore(user);
        int maritalScore = REMOVED_HOUSEHOLD_SCORE;
        int childrenScore = REMOVED_HOUSEHOLD_SCORE;
        int behaviorScore = computeBehaviorScore(user);

        int totalScore = calculateTotalScore(kycScore, salaryScore, behaviorScore);
        ScoreLevel level = determineLevel(totalScore);
        RiskLevel risk = determineRisk(totalScore);
        String reason = generateReason(user, kycScore, salaryScore, behaviorScore, totalScore);
        String behaviorAnalysis = generateBehaviorAnalysis(user, behaviorScore, totalScore);
        List<String> scoreFactors = generateScoreFactors(user, kycScore, salaryScore, behaviorScore);
        String badge = determineBadge(totalScore);
        double maxCreditLimit = computeCreditLimit(totalScore, user);
        List<String> tips = generateImprovementTips(user, kycScore, salaryScore, behaviorScore);

        CreadiScore entity = CreadiScore.builder()
                .user(user)
                .totalScore(totalScore)
                .kycScore(kycScore)
                .salaryScore(salaryScore)
                .maritalScore(maritalScore)
                .childrenScore(childrenScore)
                .behaviorScore(behaviorScore)
                .level(level)
                .risk(risk)
                .reason(reason)
                .badge(badge)
                .build();

        creadiScoreRepository.save(entity);

        return buildResponse(userId, user, totalScore, level, risk, reason, kycScore, salaryScore,
                maritalScore, childrenScore, behaviorScore, behaviorAnalysis, scoreFactors, badge,
                maxCreditLimit, tips, entity.getCreatedAt());
    }

    public CreadiScoreResponse getLatestScore(Long userId) {
        CreadiScore cs = creadiScoreRepository.findTopByUserIdOrderByCreatedAtDesc(userId).orElse(null);
        if (cs == null) {
            return calculateScore(userId);
        }

        User user = cs.getUser();
        int kycScore = nullToZero(cs.getKycScore());
        int salaryScore = nullToZero(cs.getSalaryScore());
        int maritalScore = REMOVED_HOUSEHOLD_SCORE;
        int childrenScore = REMOVED_HOUSEHOLD_SCORE;
        int behaviorScore = nullToZero(cs.getBehaviorScore());
        int totalScore = nullToZero(cs.getTotalScore());

        return buildResponse(userId, user, totalScore, cs.getLevel(), cs.getRisk(), cs.getReason(), kycScore,
                salaryScore, maritalScore, childrenScore, behaviorScore,
                generateBehaviorAnalysis(user, behaviorScore, totalScore),
                generateScoreFactors(user, kycScore, salaryScore, behaviorScore),
                cs.getBadge(), computeCreditLimit(totalScore, user),
                generateImprovementTips(user, kycScore, salaryScore, behaviorScore), cs.getCreatedAt());
    }

    private CreadiScoreResponse buildResponse(
            Long userId,
            User user,
            int totalScore,
            ScoreLevel level,
            RiskLevel risk,
            String reason,
            int kycScore,
            int salaryScore,
            int maritalScore,
            int childrenScore,
            int behaviorScore,
            String behaviorAnalysis,
            List<String> scoreFactors,
            String badge,
            double maxCreditLimit,
            List<String> tips,
            java.time.LocalDateTime calculatedAt
    ) {
        return CreadiScoreResponse.builder()
                .userId(userId)
                .score(totalScore)
                .level(level)
                .risk(risk)
                .reason(reason)
                .kycScore(kycScore)
                .salaryScore(salaryScore)
                .maritalScore(maritalScore)
                .childrenScore(childrenScore)
                .behaviorScore(behaviorScore)
                .behaviorAnalysis(behaviorAnalysis)
                .scoreFactors(scoreFactors)
                .badge(badge)
                .maxCreditLimit(maxCreditLimit)
                .history(getScoreHistory(user.getId()))
                .improvementTips(tips)
                .calculatedAt(calculatedAt)
                .build();
    }

    private int computeKycScore(User user) {
        // KYC remains capped at 300; pending provider states get no trust until there is a verified or manual-review signal.
        if (user.getKycStatus() != KycStatus.VERIFIED) {
            if (user.getKycStatus() == KycStatus.PENDING_MANUAL_REVIEW) return 90;
            if (user.getKycStatus() == KycStatus.PENDING || user.getKycStatus() == KycStatus.PROVIDER_FAILED) return 0;
            return 0;
        }

        int score = 210;
        KycDocument document = kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId()).orElse(null);
        if (document == null) return 240;

        score += scaledMetric(document.getFaceMatchScore(), 40);
        score += scaledMetric(document.getLivenessScore(), 25);
        score += scaledMetric(document.getProviderConfidence(), 20);
        score += Boolean.FALSE.equals(document.getSpoofDetected()) ? 5 : 0;
        score -= Boolean.TRUE.equals(document.getSpoofDetected()) ? 80 : 0;
        if (document.getFraudRiskScore() != null) {
            score -= Math.min(70, document.getFraudRiskScore());
        }
        return clamp(score, 0, KYC_SCORE_MAX);
    }

    private int computeSalaryScore(User user) {
        // Salary now carries the removed household points and keeps signal up to 15,000 instead of flattening at 5,000.
        Double salary = user.getMonthlySalary();
        if (salary == null || salary <= 0) return 0;
        double cappedSalary = Math.min(salary, SALARY_CAP);
        return clamp((int) Math.round(SALARY_SCORE_MAX * Math.sqrt(cappedSalary / SALARY_CAP)), 0, SALARY_SCORE_MAX);
    }

    private int computeBehaviorScore(User user) {
        // Behavior absorbs the other half of the removed household points, rewarding repayment and clean risk signals more heavily.
        int score = BEHAVIOR_BASE;

        if (user.getKycStatus() == KycStatus.VERIFIED && user.getKycSubmittedAt() != null && user.getCreatedAt() != null) {
            long hoursToComplete = Duration.between(user.getCreatedAt(), user.getKycSubmittedAt()).toHours();
            if (hoursToComplete <= 48) score += FAST_KYC_BONUS;
            else if (hoursToComplete <= 168) score += NORMAL_KYC_BONUS;
            else score += SLOW_KYC_BONUS;
        } else if (user.getKycStatus() == KycStatus.REJECTED) {
            score -= REJECTED_KYC_PENALTY;
        }

        if (Boolean.FALSE.equals(user.getKycFraudFlag())) score += CLEAN_FRAUD_BONUS;
        else if (Boolean.TRUE.equals(user.getKycFraudFlag())) score -= FRAUD_FLAG_PENALTY;

        Integer failedAttempts = user.getKycFailedAttempts();
        if (failedAttempts != null && failedAttempts > 0) {
            score -= Math.min(FAILED_KYC_ATTEMPT_PENALTY_MAX, failedAttempts * FAILED_KYC_ATTEMPT_PENALTY);
        }

        int paymentModifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        score += clamp(paymentModifier, PAYMENT_MODIFIER_MIN, PAYMENT_MODIFIER_MAX);

        long overdueCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.OVERDUE)
                .size();
        long pendingCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.PENDING)
                .size();
        if (overdueCount > 0) score -= Math.min(OVERDUE_INSTALLMENT_PENALTY_MAX, overdueCount * OVERDUE_INSTALLMENT_PENALTY);
        if (pendingCount > 0 && overdueCount == 0) {
            score += Math.min(PENDING_INSTALLMENT_BONUS_MAX, pendingCount * PENDING_INSTALLMENT_BONUS);
        }

        return clamp(score, 0, BEHAVIOR_SCORE_MAX);
    }

    private ScoreLevel determineLevel(int score) {
        if (score >= 800) return ScoreLevel.EXCELLENT;
        if (score >= 600) return ScoreLevel.GOOD;
        if (score >= 400) return ScoreLevel.MEDIUM;
        return ScoreLevel.HIGH_RISK;
    }

    private RiskLevel determineRisk(int score) {
        if (score >= 800) return RiskLevel.LOW;
        if (score >= 600) return RiskLevel.MODERATE;
        if (score >= 400) return RiskLevel.HIGH;
        return RiskLevel.CRITICAL;
    }

    private String generateReason(User user, int kycScore, int salaryScore, int behaviorScore, int totalScore) {
        List<String> positives = new ArrayList<>();
        List<String> negatives = new ArrayList<>();

        if (kycScore >= 260) positives.add("strong identity verification");
        else if (kycScore > 0) negatives.add("identity needs stronger verification evidence");
        else negatives.add("identity not yet verified");

        if (salaryScore >= 310) positives.add("strong salary capacity");
        else if (salaryScore > 0) positives.add("salary information provided");
        else negatives.add("no salary information provided");

        if (behaviorScore >= 220) positives.add("reliable account behavior");
        else if (behaviorScore < 100) negatives.add("behavior risk signals");

        if (Boolean.FALSE.equals(user.getKycFraudFlag())) positives.add("clean fraud record");
        else if (Boolean.TRUE.equals(user.getKycFraudFlag())) negatives.add("fraud flag detected on account");

        StringBuilder sb = new StringBuilder();
        if (totalScore >= 800) sb.append("Your score is excellent");
        else if (totalScore >= 600) sb.append("Your score is good");
        else if (totalScore >= 400) sb.append("Your score needs improvement");
        else sb.append("Your score is at high risk level");

        if (!positives.isEmpty()) sb.append(" due to ").append(String.join(", ", positives));
        if (!negatives.isEmpty()) sb.append(". Consider improving: ").append(String.join(", ", negatives));
        sb.append(".");
        return sb.toString();
    }

    private String generateBehaviorAnalysis(User user, int behaviorScore, int totalScore) {
        if (Boolean.TRUE.equals(user.getKycFraudFlag())) {
            return "High-risk profile: verification history contains fraud or identity-risk signals.";
        }
        int failedAttempts = user.getKycFailedAttempts() == null ? 0 : user.getKycFailedAttempts();
        if (failedAttempts >= 3 || behaviorScore < 100) {
            return "Sensitive profile: repeated verification or payment-risk signals reduce trust.";
        }
        if (totalScore >= 800 && behaviorScore >= 220) {
            return "Reliable planner: strong verification, clean history, and consistent financial signals.";
        }
        if (behaviorScore >= 170) {
            return "Responsible profile: behavior is healthy, with room to strengthen financial data.";
        }
        return "Developing profile: complete missing information and keep payments on time to improve trust.";
    }

    private List<String> generateScoreFactors(User user, int kycScore, int salaryScore, int behaviorScore) {
        List<String> factors = new ArrayList<>();
        factors.add("KYC identity evidence: " + kycScore + "/" + KYC_SCORE_MAX);
        factors.add("Salary strength: " + salaryScore + "/" + SALARY_SCORE_MAX);
        factors.add("Behavior and repayment signals: " + behaviorScore + "/" + BEHAVIOR_SCORE_MAX);
        if (user.getKycFailedAttempts() != null && user.getKycFailedAttempts() > 0) {
            factors.add("Failed KYC attempts: " + user.getKycFailedAttempts());
        }
        return factors;
    }

    private String determineBadge(int score) {
        if (score >= 900) return "GOLD";
        if (score >= 700) return "SILVER";
        if (score >= 500) return "BRONZE";
        return null;
    }

    private double computeCreditLimit(int score, User user) {
        // Credit capacity is still based on affordability, then scaled by the final score so low scores cannot receive the full limit.
        double rawLimit = computeCreditLimitFromUser(user);
        double scoreMultiplier = clamp(score, 0, TOTAL_SCORE_MAX) / (double) TOTAL_SCORE_MAX;
        return Math.round(rawLimit * scoreMultiplier / 10.0) * 10.0;
    }

    public double computeCreditLimitForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return computeCreditLimit(calculateTotalScore(user), user);
    }

    private double computeCreditLimitFromUser(User user) {
        Double salary = user.getMonthlySalary();
        if (salary == null || salary <= 0) return 0;

        double baseCredit = salary * 1.35;
        if (salary < 900) {
            baseCredit *= 0.85;
        } else if (salary >= 2500) {
            baseCredit *= 1.12;
        }

        String marital = normalize(user.getMaritalStatus());
        if (marital.equals("MARRIED") || marital.startsWith("MARIE")) {
            baseCredit *= 1.07;
        }

        Integer children = user.getNumberOfChildren();
        if (children != null && children > 0) {
            baseCredit *= Math.max(0.82, 1.0 - (children * 0.035));
        }

        int modifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        double paymentFactor = 1.0 + (modifier / 1000.0);

        long overdueCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.OVERDUE)
                .size();
        long pendingCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.PENDING)
                .size();

        if (overdueCount > 0 && pendingCount > 0) {
            paymentFactor -= Math.min(0.25, overdueCount / (double) (pendingCount + overdueCount));
        }

        baseCredit = baseCredit * Math.max(0.6, paymentFactor);
        return Math.min(8000, Math.max(0, Math.round(baseCredit / 10.0) * 10.0));
    }

    private List<String> generateImprovementTips(User user, int kycScore, int salaryScore, int behaviorScore) {
        List<String> tips = new ArrayList<>();
        if (kycScore < 260) tips.add("Complete a strong selfie and ID verification to gain more KYC points");
        if (salaryScore < 310) tips.add("Update your salary information to improve your score");
        if (behaviorScore < 220) tips.add("Maintain a clean record with no failed verification attempts and on-time payments");
        if (tips.isEmpty()) tips.add("Great job! Maintain your current standing to keep your excellent score");
        return tips;
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

    private int scaledMetric(Double value, int maxPoints) {
        if (value == null) return 0;
        double normalized = value > 1.0 ? value / 100.0 : value;
        return clamp((int) Math.round(normalized * maxPoints), 0, maxPoints);
    }

    private int calculateTotalScore(User user) {
        return calculateTotalScore(computeKycScore(user), computeSalaryScore(user), computeBehaviorScore(user));
    }

    private int calculateTotalScore(int kycScore, int salaryScore, int behaviorScore) {
        return clamp(kycScore + salaryScore + behaviorScore, 0, TOTAL_SCORE_MAX);
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
}
