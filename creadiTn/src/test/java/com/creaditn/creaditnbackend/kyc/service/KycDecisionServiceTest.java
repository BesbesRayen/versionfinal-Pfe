package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class KycDecisionServiceTest {

    private final KycDecisionService decisionService = new KycDecisionService(
            0.75,
            0.70,
            0.70,
            0.65,
            0.75,
            0.70
    );

    @Test
    void samePersonWithStrongSignalsIsApproved() {
        KycDecision decision = decisionService.evaluate(strongResult(), true, false);

        assertEquals(KycStatus.VERIFIED, decision.status());
    }

    @Test
    void differentSelfieIsRejected() {
        KycVerificationResultDto result = strongResult();
        result.setFaceMatchScore(0.42);
        result.setFaceMatched(false);

        KycDecision decision = decisionService.evaluate(result, true, false);

        assertEquals(KycStatus.REJECTED, decision.status());
    }

    @Test
    void missingSelfieRoutesToManualReview() {
        KycDecision decision = decisionService.evaluate(strongResult(), false, false);

        assertEquals(KycStatus.PENDING_MANUAL_REVIEW, decision.status());
    }

    @Test
    void lowProviderConfidenceIsRejected() {
        KycVerificationResultDto result = strongResult();
        result.setProviderConfidence(0.58);

        KycDecision decision = decisionService.evaluate(result, true, false);

        assertEquals(KycStatus.REJECTED, decision.status());
    }

    @Test
    void duplicateIdentityIsRejected() {
        KycDecision decision = decisionService.evaluate(strongResult(), true, true);

        assertEquals(KycStatus.REJECTED, decision.status());
    }

    @Test
    void borderlineFaceMatchRoutesToManualReview() {
        KycVerificationResultDto result = strongResult();
        result.setFaceMatchScore(0.72);

        KycDecision decision = decisionService.evaluate(result, true, false);

        assertEquals(KycStatus.PENDING_MANUAL_REVIEW, decision.status());
    }

    @Test
    void providerFailureRoutesToManualReview() {
        KycVerificationResultDto result = strongResult();
        result.setStatus(KycStatus.PENDING_MANUAL_REVIEW);
        result.setRisk("provider-unavailable");
        result.setProviderReason("Didit credits are insufficient");

        KycDecision decision = decisionService.evaluate(result, true, false);

        assertEquals(KycStatus.PENDING_MANUAL_REVIEW, decision.status());
    }

    @Test
    void providerDeclineIsRejected() {
        KycVerificationResultDto result = strongResult();
        result.setStatus(KycStatus.REJECTED);
        result.setProviderReason("Document expired");

        KycDecision decision = decisionService.evaluate(result, true, false);

        assertEquals(KycStatus.REJECTED, decision.status());
    }

    private KycVerificationResultDto strongResult() {
        return KycVerificationResultDto.builder()
                .status(KycStatus.PENDING)
                .documentAuthentic(true)
                .faceMatchScore(0.91)
                .livenessScore(0.88)
                .spoofDetected(false)
                .providerConfidence(0.92)
                .livenessPassed(true)
                .faceMatched(true)
                .build();
    }
}
