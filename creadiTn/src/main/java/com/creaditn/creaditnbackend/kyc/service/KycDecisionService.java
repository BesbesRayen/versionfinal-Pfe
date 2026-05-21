package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycStatus;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class KycDecisionService {

    private final double faceMatchThreshold;
    private final double faceMatchManualReviewThreshold;
    private final double livenessThreshold;
    private final double livenessManualReviewThreshold;
    private final double providerConfidenceThreshold;
    private final double providerConfidenceManualReviewThreshold;

    public KycDecisionService(
            @Value("${kyc.face-match-threshold:0.75}") double faceMatchThreshold,
            @Value("${kyc.face-match-manual-review-threshold:0.70}") double faceMatchManualReviewThreshold,
            @Value("${kyc.liveness-threshold:0.70}") double livenessThreshold,
            @Value("${kyc.liveness-manual-review-threshold:0.65}") double livenessManualReviewThreshold,
            @Value("${kyc.provider-confidence-threshold:0.75}") double providerConfidenceThreshold,
            @Value("${kyc.provider-confidence-manual-review-threshold:0.70}") double providerConfidenceManualReviewThreshold
    ) {
        this.faceMatchThreshold = faceMatchThreshold;
        this.faceMatchManualReviewThreshold = faceMatchManualReviewThreshold;
        this.livenessThreshold = livenessThreshold;
        this.livenessManualReviewThreshold = livenessManualReviewThreshold;
        this.providerConfidenceThreshold = providerConfidenceThreshold;
        this.providerConfidenceManualReviewThreshold = providerConfidenceManualReviewThreshold;
    }

    public KycDecision evaluate(KycVerificationResultDto result, boolean selfieProvided, boolean duplicateIdentity) {
        if (!selfieProvided) {
            return manualReview("Selfie is required for biometric verification", 90);
        }
        if (duplicateIdentity) {
            return reject("Identity document or extracted identity is already linked to another account", 95);
        }
        if (result == null) {
            return manualReview("KYC provider returned no verification result", 80);
        }
        if (result.getStatus() == KycStatus.REJECTED) {
            return reject(nonBlank(result.getProviderReason(), nonBlank(result.getMessage(), "Provider rejected verification")), 85);
        }
        if (result.getStatus() == KycStatus.PENDING_MANUAL_REVIEW && "provider-unavailable".equals(result.getRisk())) {
            return new KycDecision(KycStatus.PENDING_MANUAL_REVIEW, "KYC provider unavailable. Manual review required.", 60);
        }
        if (result.getStatus() == KycStatus.PENDING_MANUAL_REVIEW) {
            return manualReview(nonBlank(result.getProviderReason(), nonBlank(result.getMessage(), "Manual identity review required")), 70);
        }
        if (Boolean.FALSE.equals(result.getDocumentAuthentic())) {
            return reject("Identity document authenticity check failed", 90);
        }
        if (result.getDocumentAuthentic() == null) {
            return manualReview("Missing document authenticity signal from provider", 80);
        }
        if (Boolean.TRUE.equals(result.getSpoofDetected())) {
            return reject("Spoof or presentation attack detected", 100);
        }
        if (result.getSpoofDetected() == null) {
            return manualReview("Missing anti-spoofing signal from provider", 80);
        }

        KycDecision faceDecision = evaluateScore(
                result.getFaceMatchScore(),
                faceMatchThreshold,
                faceMatchManualReviewThreshold,
                "Face match score"
        );
        if (faceDecision.status() != KycStatus.VERIFIED) {
            return faceDecision;
        }

        KycDecision livenessDecision = evaluateScore(
                result.getLivenessScore(),
                livenessThreshold,
                livenessManualReviewThreshold,
                "Liveness score"
        );
        if (livenessDecision.status() != KycStatus.VERIFIED) {
            return livenessDecision;
        }

        if (Boolean.FALSE.equals(result.getLivenessPassed())) {
            return reject("Liveness check failed", 90);
        }
        if (Boolean.FALSE.equals(result.getFaceMatched())) {
            return reject("Selfie does not match identity document owner", 95);
        }

        KycDecision confidenceDecision = evaluateScore(
                result.getProviderConfidence(),
                providerConfidenceThreshold,
                providerConfidenceManualReviewThreshold,
                "Provider confidence"
        );
        if (confidenceDecision.status() != KycStatus.VERIFIED) {
            return confidenceDecision;
        }

        return new KycDecision(KycStatus.VERIFIED, "Strict KYC checks passed", 0);
    }

    private KycDecision evaluateScore(Double value, double approveThreshold, double manualReviewThreshold, String label) {
        if (value == null) {
            return manualReview("Missing " + label.toLowerCase() + " from provider", 80);
        }
        double normalized = normalizeScore(value);
        if (normalized < manualReviewThreshold) {
            return reject(label + " below reject threshold", 90);
        }
        if (normalized < approveThreshold) {
            return new KycDecision(KycStatus.PENDING_MANUAL_REVIEW, label + " requires manual review", 55);
        }
        return new KycDecision(KycStatus.VERIFIED, label + " passed", 0);
    }

    private double normalizeScore(double value) {
        return value > 1.0 ? value / 100.0 : value;
    }

    private KycDecision manualReview(String reason, int riskScore) {
        return new KycDecision(KycStatus.PENDING_MANUAL_REVIEW, reason, riskScore);
    }

    private KycDecision reject(String reason, int riskScore) {
        return new KycDecision(KycStatus.REJECTED, reason, riskScore);
    }

    private String nonBlank(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value;
    }
}

