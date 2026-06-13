package com.creaditn.creaditnbackend.service;

/**
 * Central constants for the CreadiTN 1000-point credit scoring model.
 */
public final class CreadiScoreConstants {

    private CreadiScoreConstants() {
    }

    public static final int TOTAL_SCORE_MAX = 1000;

    public static final int KYC_SCORE_MAX = 150;
    public static final int FINANCIAL_SCORE_MAX = 250;
    public static final int PAYMENT_BEHAVIOR_SCORE_MAX = 400;
    public static final int STABILITY_SCORE_MAX = 100;
    public static final int RISK_SCORE_MAX = 100;

    public static final int KYC_VERIFIED_BASE = 100;
    public static final int KYC_FACE_MATCH_MAX = 20;
    public static final int KYC_LIVENESS_MAX = 15;
    public static final int KYC_PROVIDER_CONFIDENCE_MAX = 10;
    public static final int KYC_NO_SPOOF_POINTS = 5;

    public static final double SALARY_CAP = 15_000.0;
    public static final int SALARY_POINTS_MAX = 120;
    public static final int DTI_POINTS_MAX = 80;
    public static final int INCOME_STABILITY_POINTS_MAX = 50;

    public static final int ON_TIME_POINTS_MAX = 180;
    public static final int RECENT_PAYMENT_POINTS_MAX = 100;
    public static final int PAYMENT_HISTORY_POINTS_MAX = 60;
    public static final int POSITIVE_PAYMENT_POINTS_MAX = 60;
    public static final int POSITIVE_PAYMENT_POINTS_PER_INSTALLMENT = 5;
    public static final int LATE_PAYMENT_PENALTY_MAX = 200;

    public static final int ACCOUNT_AGE_POINTS_MAX = 40;
    public static final int EMPLOYMENT_POINTS_MAX = 35;
    public static final int LOYALTY_POINTS_MAX = 25;

    public static final int RISK_START_POINTS = 100;
    public static final int MEDIUM_FRAUD_RISK_PENALTY = 25;
    public static final int HIGH_FRAUD_RISK_PENALTY = 50;
    public static final int FAILED_KYC_ATTEMPT_PENALTY = 10;
    public static final int RISK_DEDUCTION_MAX = 100;
    public static final int CRITICAL_FRAUD_RISK_SCORE = 90;
    public static final int HIGH_FRAUD_RISK_SCORE = 60;
    public static final int MEDIUM_FRAUD_RISK_SCORE = 30;

    public static final int EXCELLENT_SCORE_MIN = 850;
    public static final int GOOD_SCORE_MIN = 700;
    public static final int MEDIUM_SCORE_MIN = 550;
    public static final int HIGH_RISK_SCORE_MIN = 300;

    public static final int GOLD_BADGE_MIN = 900;
    public static final int SILVER_BADGE_MIN = 750;
    public static final int BRONZE_BADGE_MIN = 600;

    public static final double CREDIT_LIMIT_CAP = 8_000.0;
    public static final double BASE_CREDIT_MULTIPLIER = 1.35;
    public static final int PAYMENT_TRUST_ON_TIME_BONUS = 10;
    public static final int PAYMENT_TRUST_LATE_MALUS = 20;
    public static final int PAYMENT_TRUST_BONUS_MAX = 200;
    public static final int PAYMENT_TRUST_BONUS_MIN = -300;
    public static final int PAYMENT_SCORE_ON_TIME_BONUS = 10;
    public static final int PAYMENT_SCORE_LATE_MALUS = 20;
    public static final int PAYMENT_SCORE_MODIFIER_MAX = 200;
    public static final int PAYMENT_SCORE_MODIFIER_MIN = -300;
}
