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

    private final UserRepository userRepository;
    private final CreadiScoreRepository creadiScoreRepository;
    private final InstallmentRepository installmentRepository;
    private final KycDocumentRepository kycDocumentRepository;

    public CreadiScoreResponse calculateScore(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        int kycScore = computeKycScore(user);
        int salaryScore = computeSalaryScore(user);
        int maritalScore = computeMaritalScore(user);
        int childrenScore = computeChildrenScore(user);
        int behaviorScore = computeBehaviorScore(user);

        int totalScore = clamp(kycScore + salaryScore + maritalScore + childrenScore + behaviorScore, 0, 1000);
        ScoreLevel level = determineLevel(totalScore);
        RiskLevel risk = determineRisk(totalScore);
        String reason = generateReason(user, kycScore, salaryScore, behaviorScore, totalScore);
        String behaviorAnalysis = generateBehaviorAnalysis(user, behaviorScore, totalScore);
        List<String> scoreFactors = generateScoreFactors(user, kycScore, salaryScore, maritalScore, childrenScore, behaviorScore);
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
        int maritalScore = nullToZero(cs.getMaritalScore());
        int childrenScore = nullToZero(cs.getChildrenScore());
        int behaviorScore = nullToZero(cs.getBehaviorScore());
        int totalScore = nullToZero(cs.getTotalScore());

        return buildResponse(userId, user, totalScore, cs.getLevel(), cs.getRisk(), cs.getReason(), kycScore,
                salaryScore, maritalScore, childrenScore, behaviorScore,
                generateBehaviorAnalysis(user, behaviorScore, totalScore),
                generateScoreFactors(user, kycScore, salaryScore, maritalScore, childrenScore, behaviorScore),
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
        if (user.getKycStatus() != KycStatus.VERIFIED) {
            if (user.getKycStatus() == KycStatus.PENDING_MANUAL_REVIEW) return 90;
            if (user.getKycStatus() == KycStatus.PENDING || user.getKycStatus() == KycStatus.PROVIDER_FAILED) return 40;
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
        return clamp(score, 0, 300);
    }

    private int computeSalaryScore(User user) {
        Double salary = user.getMonthlySalary();
        if (salary == null || salary <= 0) return 0;
        double cappedSalary = Math.min(salary, 5000.0);
        return clamp((int) Math.round(40 + 260 * Math.sqrt(cappedSalary / 5000.0)), 40, 300);
    }

    private int computeMaritalScore(User user) {
        String status = normalize(user.getMaritalStatus());
        if (status.isBlank()) return 35;
        return switch (status) {
            case "MARRIED", "MARIE", "MARIEE" -> 88;
            case "SINGLE", "CELIBATAIRE" -> 62;
            case "DIVORCED", "DIVORCE", "DIVORCEE" -> 55;
            case "WIDOWED", "VEUF", "VEUVE" -> 68;
            default -> 45;
        };
    }

    private int computeChildrenScore(User user) {
        Integer children = user.getNumberOfChildren();
        if (children == null) return 25;
        if (children <= 0) return 86;
        if (children == 1) return 72;
        if (children == 2) return 58;
        if (children == 3) return 44;
        return 30;
    }

    private int computeBehaviorScore(User user) {
        int score = 70;

        if (user.getKycStatus() == KycStatus.VERIFIED && user.getKycSubmittedAt() != null && user.getCreatedAt() != null) {
            long hoursToComplete = Duration.between(user.getCreatedAt(), user.getKycSubmittedAt()).toHours();
            if (hoursToComplete <= 48) score += 35;
            else if (hoursToComplete <= 168) score += 22;
            else score += 10;
        } else if (user.getKycStatus() == KycStatus.REJECTED) {
            score -= 35;
        }

        if (Boolean.FALSE.equals(user.getKycFraudFlag())) score += 35;
        else if (Boolean.TRUE.equals(user.getKycFraudFlag())) score -= 70;

        Integer failedAttempts = user.getKycFailedAttempts();
        if (failedAttempts != null && failedAttempts > 0) {
            score -= Math.min(55, failedAttempts * 18);
        }

        int paymentModifier = user.getPaymentScoreModifier() == null ? 0 : user.getPaymentScoreModifier();
        score += clamp(paymentModifier, -80, 80);

        long overdueCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.OVERDUE)
                .size();
        long pendingCount = installmentRepository
                .findByCreditRequestUserIdAndStatus(user.getId(), InstallmentStatus.PENDING)
                .size();
        if (overdueCount > 0) score -= Math.min(60, overdueCount * 20);
        if (pendingCount > 0 && overdueCount == 0) score += Math.min(15, pendingCount * 3);

        return clamp(score, 0, 200);
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

        if (salaryScore >= 240) positives.add("stable salary");
        else if (salaryScore > 0) positives.add("salary information provided");
        else negatives.add("no salary information provided");

        if (behaviorScore >= 150) positives.add("reliable account behavior");
        else if (behaviorScore < 80) negatives.add("behavior risk signals");

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
        if (failedAttempts >= 3 || behaviorScore < 70) {
            return "Sensitive profile: repeated verification or payment-risk signals reduce trust.";
        }
        if (totalScore >= 800 && behaviorScore >= 150) {
            return "Reliable planner: strong verification, clean history, and consistent financial signals.";
        }
        if (behaviorScore >= 120) {
            return "Responsible profile: behavior is healthy, with room to strengthen financial data.";
        }
        return "Developing profile: complete missing information and keep payments on time to improve trust.";
    }

    private List<String> generateScoreFactors(User user, int kycScore, int salaryScore, int maritalScore, int childrenScore, int behaviorScore) {
        List<String> factors = new ArrayList<>();
        factors.add("KYC identity evidence: " + kycScore + "/300");
        factors.add("Salary strength: " + salaryScore + "/300");
        factors.add("Household profile: " + (maritalScore + childrenScore) + "/200");
        factors.add("Behavior and repayment signals: " + behaviorScore + "/200");
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
        return computeCreditLimitFromUser(user);
    }

    public double computeCreditLimitForUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return computeCreditLimitFromUser(user);
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
        if (salaryScore < 240) tips.add("Update your salary information to improve your score");
        if (behaviorScore < 150) tips.add("Maintain a clean record with no failed verification attempts");
        if (user.getMaritalStatus() == null || user.getMaritalStatus().isBlank()
                || user.getNumberOfChildren() == null) {
            tips.add("Complete your profile for better score");
        }
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
