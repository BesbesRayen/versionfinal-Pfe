package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.RiskLevel;
import com.creaditn.creaditnbackend.entity.ScoreLevel;
import com.creaditn.creaditnbackend.entity.ScoreStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class CreadiScoreResponse {
    private Long userId;
    private Integer score;
    private Integer totalScore;
    private ScoreStatus scoreStatus;
    private ScoreLevel level;
    private RiskLevel risk;
    private String reason;

    private Integer kycScore;
    private Integer financialScore;
    private Integer paymentBehaviorScore;
    private Integer stabilityScore;
    private Integer riskScore;

    // Legacy aliases kept so existing clients continue to render during migration.
    private Integer salaryScore;
    private Integer maritalScore;
    private Integer childrenScore;
    private Integer behaviorScore;
    private String behaviorAnalysis;
    private List<String> scoreFactors;
    private String scoreExplanation;

    private String badge;
    private Double maxCreditLimit;
    private Double buyingPowerLimit;
    private Double baseBuyingPower;
    private Double paymentTrustBonus;
    private Double outstandingBalance;
    private Double availableCredit;
    private Double usedPercent;
    private BigDecimal nextInstallmentAmount;
    private LocalDate nextInstallmentDate;

    private List<ScoreHistoryItem> history;
    private List<String> improvementTips;

    private LocalDateTime calculatedAt;

    private Integer salaryPoints;
    private Integer dtiPoints;
    private Integer incomeStabilityPoints;

    private Integer onTimePoints;
    private Integer recentPoints;
    private Integer historyPoints;
    private Integer positiveHistoryPoints;
    private Integer latePenaltyPoints;

    private Integer accountAgePoints;
    private Integer employmentPoints;
    private Integer loyaltyPoints;

    @Getter @Setter
    @NoArgsConstructor @AllArgsConstructor
    @Builder
    public static class ScoreHistoryItem {
        private Integer score;
        private ScoreLevel level;
        private LocalDateTime date;
    }
}
