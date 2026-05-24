package com.creaditn.creaditnbackend.kyc.service;

import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycStatus;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

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

    @Value("${didit.access-token:}")
    private String accessToken;

    @Value("${didit.fallback-on-error:false}")
    private boolean fallbackOnError;

    @Value("${kyc.dev-auto-approve:false}")
    private boolean devAutoApprove;

    @Value("${kyc.face-match-manual-review-threshold:0.70}")
    private double faceMatchDeclineThreshold;

    @Value("${kyc.liveness-manual-review-threshold:0.65}")
    private double livenessDeclineThreshold;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();
    private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

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
            if (devAutoApprove) {
                log.warn("kyc.dev-auto-approve=true - simulating KYC approval because Didit API key is missing");
                return simulatedApproval(userId, "Local/demo KYC auto-approval: Didit API key is not configured");
            }
            return providerUnavailable(userId, "Didit API key is not configured");
        }

        try {
            return callDiditApi(userId, cinFrontPath, cinBackPath, selfiePath);
        } catch (Exception e) {
            log.error("Didit API call failed: {}", e.getMessage());
            if (devAutoApprove) {
                log.warn("kyc.dev-auto-approve=true - simulating KYC approval after provider failure");
                return simulatedApproval(userId, "Local/demo KYC auto-approval: " + e.getMessage());
            }
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
        List<MultipartPart> parts = new ArrayList<>();
        parts.add(filePart("front_image", "cin_front.jpg", cinFrontPath));
        if (cinBackPath != null && cinBackPath.toFile().exists()) {
            parts.add(filePart("back_image", "cin_back.jpg", cinBackPath));
        }
        parts.add(textPart("perform_document_liveness", "true"));
        parts.add(textPart("save_api_request", "true"));
        parts.add(textPart("vendor_data", String.valueOf(userId)));

        Map<String, Object> responseBody = postMultipart(apiUrl + "/id-verification/", parts);
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
        boolean declined = "Declined".equalsIgnoreCase(statusStr)
                || "Rejected".equalsIgnoreCase(statusStr)
                || "Failed".equalsIgnoreCase(statusStr);

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
                "passive_liveness.score", "passive_liveness.confidence",
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
                "passive_liveness.status", "passive_liveness.passed", "passive_liveness.approved",
                "liveness.passed", "liveness.approved", "liveness.is_live", "liveness.status");
        if (livenessPassed == null) {
            livenessPassed = firstBoolean(responseBody,
                "liveness.passed", "liveness.approved", "liveness.is_live",
                "id_verification.liveness.passed", "id_verification.liveness_passed");
        }
        Boolean spoofDetected = firstBoolean(livenessResponse,
                "passive_liveness.spoof_detected", "passive_liveness.spoofDetected",
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
        if (providerReason == null) {
            providerReason = firstWarning(idVerification);
        }

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
        if (approved && Boolean.TRUE.equals(faceMatched) && faceMatchScore == null) {
            faceMatchScore = 1.0;
        }
        if (approved && Boolean.TRUE.equals(livenessPassed) && livenessScore == null) {
            livenessScore = 1.0;
        }
        if (approved && Boolean.FALSE.equals(spoofDetected) && livenessScore == null) {
            livenessScore = 1.0;
            livenessPassed = true;
        }

        int confidence = providerConfidence != null
                ? (int) Math.round(normalizeScore(providerConfidence) * 100)
                : approved ? 90 : 30;
        KycStatus providerStatus = approved
                ? KycStatus.PENDING
                : declined ? KycStatus.REJECTED
                : inReview ? KycStatus.PENDING_MANUAL_REVIEW
                : KycStatus.PENDING_MANUAL_REVIEW;

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

        List<MultipartPart> parts = List.of(
                filePart("user_image", "selfie.jpg", selfiePath),
                textPart("face_liveness_score_decline_threshold", String.valueOf(Math.round(livenessDeclineThreshold * 100))),
                textPart("save_api_request", "true"),
                textPart("vendor_data", String.valueOf(userId))
        );

        Map<String, Object> responseBody = postMultipart(apiUrl + "/passive-liveness/", parts);
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Didit passive liveness");
        }
        return responseBody;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> callFaceMatch(Long userId, Path selfiePath, Path referencePath) {
        if (selfiePath == null || !selfiePath.toFile().exists()) {
            throw new RuntimeException("Selfie image is required for face match");
        }
        if (referencePath == null || !referencePath.toFile().exists()) {
            throw new RuntimeException("Reference identity image is required for face match");
        }

        List<MultipartPart> parts = List.of(
                filePart("user_image", "selfie.jpg", selfiePath),
                filePart("ref_image", "cin_front.jpg", referencePath),
                textPart("face_match_score_decline_threshold", String.valueOf(Math.round(faceMatchDeclineThreshold * 100))),
                textPart("save_api_request", "true"),
                textPart("vendor_data", String.valueOf(userId))
        );

        Map<String, Object> responseBody = postMultipart(apiUrl + "/face-match/", parts);
        if (responseBody == null) {
            throw new RuntimeException("Empty response from Didit face match");
        }
        return responseBody;
    }

    private Map<String, Object> postMultipart(String url, List<MultipartPart> parts) {
        try {
            String boundary = "----CreadiTnDiditBoundary" + UUID.randomUUID();
            byte[] body = buildMultipartBody(boundary, parts);
            HttpRequest.Builder builder = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(90))
                    .header("x-api-key", apiKey)
                    .header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArray(body));
            if (accessToken != null && !accessToken.isBlank()) {
                builder.header("Authorization", "Bearer " + accessToken);
            }

            HttpResponse<String> response = httpClient.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                throw new RuntimeException(response.statusCode() + " response from Didit: " + response.body());
            }
            return objectMapper.readValue(response.body(), new TypeReference<>() {});
        } catch (IOException e) {
            throw new RuntimeException("Could not call Didit multipart API", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Didit multipart API call interrupted", e);
        }
    }

    private byte[] buildMultipartBody(String boundary, List<MultipartPart> parts) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        for (MultipartPart part : parts) {
            writeAscii(out, "--" + boundary + "\r\n");
            if (part.filename() == null) {
                writeAscii(out, "Content-Disposition: form-data; name=\"" + part.name() + "\"\r\n\r\n");
                writeAscii(out, part.textValue() + "\r\n");
            } else {
                writeAscii(out, "Content-Disposition: form-data; name=\"" + part.name()
                        + "\"; filename=\"" + part.filename() + "\"\r\n");
                writeAscii(out, "Content-Type: " + part.contentType() + "\r\n\r\n");
                out.write(part.bytes());
                writeAscii(out, "\r\n");
            }
        }
        writeAscii(out, "--" + boundary + "--\r\n");
        return out.toByteArray();
    }

    private void writeAscii(ByteArrayOutputStream out, String value) throws IOException {
        out.write(value.getBytes(StandardCharsets.US_ASCII));
    }

    private MultipartPart textPart(String name, String value) {
        return new MultipartPart(name, null, null, null, value);
    }

    private MultipartPart filePart(String fieldName, String filename, Path path) {
        try {
            byte[] bytes = Files.readAllBytes(path);
            return new MultipartPart(fieldName, filename, detectImageMediaType(path).toString(), bytes, null);
        } catch (IOException e) {
            throw new RuntimeException("Could not read KYC image " + filename, e);
        }
    }

    private MediaType detectImageMediaType(Path path) {
        try {
            String contentType = Files.probeContentType(path);
            if (contentType != null && !contentType.isBlank()) {
                return MediaType.parseMediaType(contentType);
            }
        } catch (Exception ignored) {
            // Use the default below.
        }
        return MediaType.IMAGE_JPEG;
    }

    private record MultipartPart(String name, String filename, String contentType, byte[] bytes, String textValue) {}

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

    private KycVerificationResultDto simulatedApproval(Long userId, String reason) {
        return KycVerificationResultDto.builder()
                .userId(userId)
                .status(KycStatus.PENDING)
                .confidence(99)
                .risk("local-demo-auto-approved")
                .message("Local/demo KYC verification approved")
                .faceMatchScore(0.99)
                .livenessScore(0.99)
                .spoofDetected(false)
                .providerConfidence(0.99)
                .providerReason(reason)
                .documentAuthentic(true)
                .livenessPassed(true)
                .faceMatched(true)
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
    private String firstWarning(Map<String, Object> map) {
        Object warnings = map.get("warnings");
        if (warnings instanceof Iterable<?> iterable) {
            for (Object warning : iterable) {
                if (warning instanceof Map<?, ?> warningMap) {
                    Object shortDescription = ((Map<String, Object>) warningMap).get("short_description");
                    if (shortDescription instanceof String s && !s.isBlank()) {
                        return s.trim();
                    }
                    Object longDescription = ((Map<String, Object>) warningMap).get("long_description");
                    if (longDescription instanceof String s && !s.isBlank()) {
                        return s.trim();
                    }
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

