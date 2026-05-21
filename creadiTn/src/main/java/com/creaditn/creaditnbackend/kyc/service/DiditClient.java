package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.nio.file.Path;
import java.util.Map;

/**
 * Client for the Didit KYC verification API.
 * Provider adapter only. Business approval is performed by KycDecisionService.
 */
@Slf4j
@Service
public class DiditClient {

    @Value("${didit.api.url:https://verification.didit.me/v3}")
    private String apiUrl;

    @Value("${didit.api.key:}")
    private String apiKey;

    @Value("${didit.fallback-on-error:false}")
    private boolean fallbackOnError;

    @Value("${kyc.face-match-manual-review-threshold:0.70}")
    private double faceMatchDeclineThreshold;

    @Value("${kyc.liveness-manual-review-threshold:0.65}")
    private double livenessDeclineThreshold;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * Verify identity documents via the Didit API.
     * If the API call fails, returns PENDING_MANUAL_REVIEW, never VERIFIED.
     */
    public KycVerificationResultDto verifyIdentity(
            Long userId,
            Path cinFrontPath,
            Path cinBackPath,
            Path selfiePath
    ) {
        if (apiKey == null || apiKey.isBlank()) {
            log.error("Didit API key not configured - KYC cannot be auto-approved");
            return providerUnavailable(userId, "Didit API key is not configured");
        }

        try {
            return callDiditApi(userId, cinFrontPath, cinBackPath, selfiePath);
        } catch (Exception e) {
            log.error("Didit API call failed: {}", e.getMessage());
            if (fallbackOnError) {
                log.warn("didit.fallback-on-error=true - routing KYC to manual review");
            }
            return providerUnavailable(userId, "Didit API unavailable or rejected the request: " + e.getMessage());
        }
    }

    private KycVerificationResultDto callDiditApi(
            Long userId,
            Path cinFrontPath,
            Path cinBackPath,
            Path selfiePath
    ) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        // Didit v3 uses x-api-key header, not Bearer auth
        headers.set("x-api-key", apiKey);

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("front_image", new FileSystemResource(cinFrontPath.toFile()));
        if (cinBackPath != null && cinBackPath.toFile().exists()) {
            body.add("back_image", new FileSystemResource(cinBackPath.toFile()));
        }
        // Send selfie for server-side face comparison against the ID document photo
        if (selfiePath != null && selfiePath.toFile().exists()) {
            body.add("selfie_image", new FileSystemResource(selfiePath.toFile()));
        }
        body.add("perform_document_liveness", "true");
        body.add("save_api_request", "true");
        body.add("vendor_data", String.valueOf(userId));

        HttpEntity<MultiValueMap<String, Object>> request = new HttpEntity<>(body, headers);

        @SuppressWarnings("unchecked")
        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                apiUrl + "/id-verification/",
                HttpMethod.POST,
                request,
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );

        Map<String, Object> responseBody = response.getBody();
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Didit API");
        }
        Map<String, Object> livenessResponse = callPassiveLiveness(userId, selfiePath);
        Map<String, Object> faceMatchResponse = callFaceMatch(userId, selfiePath, cinFrontPath);

        // Didit v3: results nested under "id_verification" object
        @SuppressWarnings("unchecked")
        Map<String, Object> idVerification = responseBody.get("id_verification") instanceof Map<?, ?> m
                ? (Map<String, Object>) m : responseBody;

        String statusStr = extractStringField(responseBody, "status");
        if (statusStr == null) {
            statusStr = extractStringField(idVerification, "status");
        }
        boolean approved = "Approved".equalsIgnoreCase(statusStr) || "approved".equalsIgnoreCase(statusStr);
        boolean inReview = "In Review".equalsIgnoreCase(statusStr)
                || "InReview".equalsIgnoreCase(statusStr)
                || "manual_review".equalsIgnoreCase(statusStr)
                || "review".equalsIgnoreCase(statusStr);

        // Extract identity fields
        String extractedFirstName   = extractStringField(idVerification, "first_name", "name");
        String extractedLastName    = extractStringField(idVerification, "last_name", "surname");
        String extractedDob         = extractStringField(idVerification, "date_of_birth", "birth_date");
        String extractedIdentityNum = extractStringField(idVerification, "document_number", "personal_number", "document_id");

        // Use request_id as the Didit identity ID
        String diditId = extractStringField(responseBody, "request_id", "session_id");
        Double faceMatchScore = firstNumber(faceMatchResponse,
                "face_match.score", "face_match.similarity", "face_match.confidence");
        if (faceMatchScore == null) {
            faceMatchScore = firstNumber(responseBody,
                "face_match.score", "face_match.similarity", "face_match.confidence",
                "id_verification.face_match.score", "id_verification.face_match.similarity",
                "id_verification.face_match_score", "id_verification.face_similarity",
                "selfie.face_match_score", "biometric.face_match_score");
        }
        Double livenessScore = firstNumber(livenessResponse,
                "liveness.score", "liveness.confidence", "liveness.liveness_score");
        if (livenessScore == null) {
            livenessScore = firstNumber(responseBody,
                "liveness.score", "liveness.confidence", "liveness.liveness_score",
                "id_verification.liveness.score", "id_verification.liveness_score",
                "selfie.liveness_score", "biometric.liveness_score");
        }
        Double providerConfidence = firstNumber(responseBody,
                "confidence", "score", "id_verification.confidence", "id_verification.score",
                "id_verification.document_confidence", "document.confidence");
        Boolean documentAuthentic = firstBoolean(responseBody,
                "document.authentic", "document.valid", "document_valid", "documentAuthentic",
                "id_verification.document.valid", "id_verification.document.authentic",
                "id_verification.document_valid", "id_verification.document_authentic");
        Boolean livenessPassed = firstBoolean(livenessResponse,
                "liveness.passed", "liveness.approved", "liveness.is_live", "liveness.status");
        if (livenessPassed == null) {
            livenessPassed = firstBoolean(responseBody,
                "liveness.passed", "liveness.approved", "liveness.is_live",
                "id_verification.liveness.passed", "id_verification.liveness_passed");
        }
        Boolean spoofDetected = firstBoolean(livenessResponse,
                "spoof_detected", "spoofDetected", "liveness.spoof_detected", "liveness.spoofDetected");
        if (spoofDetected == null) {
            spoofDetected = firstBoolean(responseBody,
                "spoof_detected", "spoofDetected", "liveness.spoof_detected",
                "liveness.spoofDetected", "id_verification.spoof_detected");
        }
        Boolean faceMatched = firstBoolean(faceMatchResponse,
                "face_match.matched", "face_match.approved", "face_match.status");
        if (faceMatched == null) {
            faceMatched = firstBoolean(responseBody,
                "face_match.matched", "face_match.approved", "id_verification.face_matched",
                "id_verification.face_match.matched");
        }
        String providerReason = extractStringField(responseBody, "reason", "message", "decline_reason", "warning")
                != null ? extractStringField(responseBody, "reason", "message", "decline_reason", "warning")
                : extractStringField(idVerification, "reason", "message", "decline_reason", "warning");

        if (documentAuthentic == null && approved) {
            documentAuthentic = true;
        }
        if (providerConfidence == null) {
            providerConfidence = approved ? 1.0 : 0.0;
        }
        if (livenessPassed == null && livenessScore != null) {
            livenessPassed = normalizeScore(livenessScore) >= 0.70;
        }
        if (faceMatched == null && faceMatchScore != null) {
            faceMatched = normalizeScore(faceMatchScore) >= 0.75;
        }
        if (spoofDetected == null && livenessPassed != null) {
            spoofDetected = !livenessPassed;
        }

        int confidence = providerConfidence != null
                ? (int) Math.round(normalizeScore(providerConfidence) * 100)
                : approved ? 90 : 30;
        KycStatus providerStatus = approved ? KycStatus.PENDING : inReview ? KycStatus.PENDING_MANUAL_REVIEW : KycStatus.PENDING_MANUAL_REVIEW;

        return KycVerificationResultDto.builder()
                .userId(userId)
                .status(providerStatus)
                .confidence(confidence)
                .risk(approved ? "provider-approved" : inReview ? "manual-review" : "provider-rejected")
                .message(approved ? "Provider verification completed" : "Verification requires manual review: " + statusStr)
                .faceMatchScore(faceMatchScore)
                .livenessScore(livenessScore)
                .spoofDetected(spoofDetected)
                .providerConfidence(providerConfidence)
                .providerReason(providerReason)
                .documentAuthentic(documentAuthentic)
                .livenessPassed(livenessPassed)
                .faceMatched(faceMatched)
                .extractedFirstName(extractedFirstName)
                .extractedLastName(extractedLastName)
                .extractedDateOfBirth(extractedDob)
                .extractedIdentityNumber(extractedIdentityNum)
                .diditIdentityId(diditId)
                .build();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callPassiveLiveness(Long userId, Path selfiePath) {
        if (selfiePath == null || !selfiePath.toFile().exists()) {
            throw new RuntimeException("Selfie image is required for passive liveness");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_image", new FileSystemResource(selfiePath.toFile()));
        body.add("face_liveness_score_decline_threshold", String.valueOf(Math.round(livenessDeclineThreshold * 100)));
        body.add("save_api_request", "true");
        body.add("vendor_data", String.valueOf(userId));

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                apiUrl + "/passive-liveness/",
                HttpMethod.POST,
                new HttpEntity<>(body, multipartHeaders()),
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Didit passive liveness");
        }
        return response.getBody();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callFaceMatch(Long userId, Path selfiePath, Path referencePath) {
        if (selfiePath == null || !selfiePath.toFile().exists()) {
            throw new RuntimeException("Selfie image is required for face match");
        }
        if (referencePath == null || !referencePath.toFile().exists()) {
            throw new RuntimeException("Reference identity image is required for face match");
        }

        MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
        body.add("user_image", new FileSystemResource(selfiePath.toFile()));
        body.add("ref_image", new FileSystemResource(referencePath.toFile()));
        body.add("face_match_score_decline_threshold", String.valueOf(Math.round(faceMatchDeclineThreshold * 100)));
        body.add("save_api_request", "true");
        body.add("vendor_data", String.valueOf(userId));

        ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                apiUrl + "/face-match/",
                HttpMethod.POST,
                new HttpEntity<>(body, multipartHeaders()),
                (Class<Map<String, Object>>) (Class<?>) Map.class
        );
        if (response.getBody() == null) {
            throw new RuntimeException("Empty response from Didit face match");
        }
        return response.getBody();
    }

    private HttpHeaders multipartHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.MULTIPART_FORM_DATA);
        headers.set("x-api-key", apiKey);
        return headers;
    }

    /** Try multiple possible field names and return the first non-blank string value found. */
    private String extractStringField(Map<String, Object> map, String... keys) {
        for (String key : keys) {
            Object val = map.get(key);
            if (val instanceof String s && !s.isBlank()) return s.trim();
            // Didit sometimes nests extracted data under "document" or "extracted_data"
            String nestedValue = extractFromNestedMap(map, "document", key);
            if (nestedValue != null) return nestedValue;
            nestedValue = extractFromNestedMap(map, "extracted_data", key);
            if (nestedValue != null) return nestedValue;
            nestedValue = extractFromNestedMap(map, "mrz", key);
            if (nestedValue != null) return nestedValue;
        }
        return null;
    }

    private String extractFromNestedMap(Map<String, Object> map, String nestedKey, String fieldKey) {
        Object nested = map.get(nestedKey);
        if (nested instanceof Map<?, ?> nestedMap) {
            Object nestedVal = nestedMap.get(fieldKey);
            if (nestedVal instanceof String s && !s.isBlank()) {
                return s.trim();
            }
        }
        return null;
    }

    private KycVerificationResultDto providerUnavailable(Long userId, String reason) {
        return KycVerificationResultDto.builder()
                .userId(userId)
                .status(KycStatus.PENDING_MANUAL_REVIEW)
                .confidence(0)
                .risk("provider-unavailable")
                .message("KYC provider unavailable")
                .providerReason(reason)
                .build();
    }

    private Double firstNumber(Map<String, Object> map, String... paths) {
        for (String path : paths) {
            Object value = getPath(map, path);
            if (value instanceof Number number) {
                return number.doubleValue();
            }
            if (value instanceof String s && !s.isBlank()) {
                try {
                    return Double.parseDouble(s.trim().replace("%", ""));
                } catch (NumberFormatException ignored) {
                    // Try next path.
                }
            }
        }
        return null;
    }

    private Boolean firstBoolean(Map<String, Object> map, String... paths) {
        for (String path : paths) {
            Object value = getPath(map, path);
            if (value instanceof Boolean b) {
                return b;
            }
            if (value instanceof String s && !s.isBlank()) {
                String normalized = s.trim().toLowerCase();
                if (normalized.equals("true") || normalized.equals("approved") || normalized.equals("passed")
                        || normalized.equals("valid") || normalized.equals("yes")) {
                    return true;
                }
                if (normalized.equals("false") || normalized.equals("declined") || normalized.equals("failed")
                        || normalized.equals("invalid") || normalized.equals("no")) {
                    return false;
                }
            }
        }
        return null;
    }

    @SuppressWarnings("unchecked")
    private Object getPath(Map<String, Object> map, String path) {
        Object current = map;
        for (String part : path.split("\\.")) {
            if (!(current instanceof Map<?, ?> currentMap)) {
                return null;
            }
            current = ((Map<String, Object>) currentMap).get(part);
        }
        return current;
    }

    private double normalizeScore(double value) {
        return value > 1.0 ? value / 100.0 : value;
    }
}

