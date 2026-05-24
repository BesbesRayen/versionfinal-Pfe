package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.KycDocumentDto;
import com.creaditn.creaditnbackend.dto.KycAuditLogDto;
import com.creaditn.creaditnbackend.dto.KycVerificationResultDto;
import com.creaditn.creaditnbackend.entity.KycAuditLog;
import com.creaditn.creaditnbackend.entity.KycDocument;
import com.creaditn.creaditnbackend.entity.KycStatus;
import com.creaditn.creaditnbackend.entity.NotificationType;
import com.creaditn.creaditnbackend.entity.User;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.kyc.service.DiditClient;
import com.creaditn.creaditnbackend.kyc.service.KycDecision;
import com.creaditn.creaditnbackend.kyc.service.KycDecisionService;
import com.creaditn.creaditnbackend.repository.KycAuditLogRepository;
import com.creaditn.creaditnbackend.repository.KycDocumentRepository;
import com.creaditn.creaditnbackend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import javax.imageio.ImageIO;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.text.Normalizer;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Slf4j
@Service
@RequiredArgsConstructor
public class KycService {
    private static final int ADMIN_COMMENT_MAX_LENGTH = 1000;

    private final KycDocumentRepository kycDocumentRepository;
    private final KycAuditLogRepository kycAuditLogRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final OcrService ocrService;
    private final DiditClient diditClient;
    private final CreadiScoreService creadiScoreService;
    private final KycDecisionService kycDecisionService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @Value("${kyc.max-image-bytes:5242880}")
    private long maxImageBytes;

    @Value("${kyc.allowed-mime-types:image/jpeg,image/png,image/webp}")
    private Set<String> allowedMimeTypes;

    @Value("${kyc.identity-lock-include-deleted:true}")
    private boolean identityLockIncludeDeleted;

    public KycDocumentDto submitKycDocuments(Long userId, String cinNumber, String cinFrontUrl, String cinBackUrl, String selfieUrl) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (user.getKycStatus() == KycStatus.VERIFIED) {
            throw new BadRequestException("KYC already verified");
        }

        String extractedCinNumber = cinNumber;
        if (cinNumber == null || cinNumber.trim().isEmpty()) {
            extractedCinNumber = ocrService.extractCinNumber(cinFrontUrl);
        }

        String normalizedCin = normalizeIdentityNumber(extractedCinNumber);
        boolean duplicateCin = normalizedCin != null && isCinUsedByAnotherUser(normalizedCin, userId);

        KycDocument doc = KycDocument.builder()
                .user(user)
                .cinFrontUrl(cinFrontUrl)
                .cinBackUrl(cinBackUrl)
                .selfieUrl(selfieUrl)
                .cinNumber(extractedCinNumber)
                .cinNumberUnique(duplicateCin ? null : normalizedCin)
                .fraudSignals(duplicateCin ? "repeatedIdentity=true;source=cin" : null)
                .status(KycStatus.PENDING)
                .build();

        kycDocumentRepository.save(doc);

        user.setKycStatus(KycStatus.PENDING);
        userRepository.save(user);

        return mapToDto(doc);
    }

    @Transactional
    public KycDocumentDto approveKyc(Long documentId, String adminComment) {
        return approveKyc(documentId, adminComment, "system");
    }

    @Transactional
    public KycDocumentDto approveKyc(Long documentId, String adminComment, String adminId) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));
        KycStatus previousStatus = doc.getStatus();

        doc.setStatus(KycStatus.VERIFIED);
        doc.setAdminComment(adminComment);
        kycDocumentRepository.save(doc);
        saveAuditLog(doc, adminId, previousStatus, KycStatus.VERIFIED, adminComment);

        User user = doc.getUser();
        user.setKycStatus(KycStatus.VERIFIED);
        user.setKycSubmittedAt(java.time.LocalDateTime.now());
        userRepository.save(user);
        creadiScoreService.calculateScore(user.getId());

        notificationService.sendNotification(user.getId(),
                "KYC verified", "Your identity has been verified successfully.",
                NotificationType.KYC_VALIDATED);

        return mapToDto(doc);
    }

    @Transactional
    public KycDocumentDto rejectKyc(Long documentId, String adminComment) {
        return rejectKyc(documentId, adminComment, "system");
    }

    @Transactional
    public KycDocumentDto rejectKyc(Long documentId, String adminComment, String adminId) {
        if (adminComment == null || adminComment.isBlank()) {
            throw new BadRequestException("Rejection reason is required");
        }
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));
        KycStatus previousStatus = doc.getStatus();

        doc.setStatus(KycStatus.REJECTED);
        doc.setAdminComment(truncateAdminComment(adminComment));
        kycDocumentRepository.save(doc);
        saveAuditLog(doc, adminId, previousStatus, KycStatus.REJECTED, adminComment);

        User user = doc.getUser();
        user.setKycStatus(KycStatus.REJECTED);
        user.setKycFailedAttempts((user.getKycFailedAttempts() != null ? user.getKycFailedAttempts() : 0) + 1);
        userRepository.save(user);
        creadiScoreService.calculateScore(user.getId());

        notificationService.sendNotification(user.getId(),
                "KYC Rejected", "Your identity verification was rejected. Reason: " + adminComment,
                NotificationType.KYC_VALIDATED);

        return mapToDto(doc);
    }

    public KycDocumentDto manualReviewKyc(Long documentId, String adminComment) {
        KycDocument doc = kycDocumentRepository.findById(documentId)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));

        doc.setStatus(KycStatus.PENDING_MANUAL_REVIEW);
        doc.setAdminComment(adminComment);
        kycDocumentRepository.save(doc);

        User user = doc.getUser();
        user.setKycStatus(KycStatus.PENDING_MANUAL_REVIEW);
        userRepository.save(user);
        creadiScoreService.calculateScore(user.getId());

        notificationService.sendNotification(user.getId(),
                "KYC Manual Review", "Your identity verification needs manual review. Reason: " + adminComment,
                NotificationType.KYC_VALIDATED);

        return mapToDto(doc);
    }

    public List<KycDocumentDto> getPendingDocuments() {
        return kycDocumentRepository.findByStatusInOrderByCreatedAtDesc(List.of(
                        KycStatus.PENDING_MANUAL_REVIEW,
                        KycStatus.PROVIDER_FAILED,
                        KycStatus.PENDING
                ))
                .stream().map(this::mapToDto).toList();
    }

    public KycDocumentDto getReview(Long documentId) {
        return kycDocumentRepository.findById(documentId)
                .map(this::mapToDtoWithAudit)
                .orElseThrow(() -> new ResourceNotFoundException("KYC document not found"));
    }

    public Optional<KycDocumentDto> getLatestKycOptional(Long userId) {
        return kycDocumentRepository.findTopByUserIdOrderByCreatedAtDesc(userId)
                .map(this::mapToDto);
    }

    @Transactional
    public KycDocumentDto uploadMultipart(Long userId, String cinNumber, MultipartFile cinFront, MultipartFile cinBack, MultipartFile selfie)
            throws IOException {
        validateImageUpload(cinFront, "CIN front");
        validateImageUpload(cinBack, "CIN back");
        validateImageUpload(selfie, "Selfie");

        byte[] frontBytes = cinFront.getBytes();
        byte[] backBytes = cinBack.getBytes();
        String frontHash = sha256Hex(frontBytes);
        String backHash = sha256Hex(backBytes);

        boolean duplicateDocumentHash = isDocumentHashUsedByAnotherUser(frontHash, backHash, userId);

        List<KycDocument> toDelete = kycDocumentRepository.findByUserId(userId).stream()
                .filter(d -> d.getStatus() == KycStatus.PENDING
                        || d.getStatus() == KycStatus.REJECTED
                        || d.getStatus() == KycStatus.PENDING_MANUAL_REVIEW
                        || d.getStatus() == KycStatus.PROVIDER_FAILED)
                .toList();
        if (!toDelete.isEmpty()) {
            kycDocumentRepository.deleteAll(toDelete);
            kycDocumentRepository.flush();
        }

        Path uploadPath = resolveUploadPath();
        Path dir = uploadPath.resolve("kyc").resolve(String.valueOf(userId));
        Files.createDirectories(dir);

        String frontName = "cin_front.jpg";
        String backName = "cin_back.jpg";
        String selfieName = "selfie.jpg";
        cinFront.transferTo(dir.resolve(frontName).toFile());
        cinBack.transferTo(dir.resolve(backName).toFile());
        selfie.transferTo(dir.resolve(selfieName).toFile());

        String base = "/api/files/kyc/" + userId + "/";
        KycDocumentDto result = submitKycDocuments(userId, cinNumber, base + frontName, base + backName, base + selfieName);

        kycDocumentRepository.findById(result.getId()).ifPresent(doc -> {
            if (!duplicateDocumentHash) {
                doc.setCinFrontHash(frontHash);
                doc.setCinBackHash(backHash);
            }
            String normalizedSubmittedCin = normalizeIdentityNumber(cinNumber);
            if (normalizedSubmittedCin != null && !isCinUsedByAnotherUser(normalizedSubmittedCin, userId)) {
                doc.setCinNumberUnique(normalizedSubmittedCin);
            }
            if (duplicateDocumentHash) {
                doc.setFraudSignals(buildFraudSignals(doc.getUser(), true) + ";duplicateImageHash=true");
                doc.setFraudRiskScore(95);
            }
            kycDocumentRepository.save(doc);
        });

        return result;
    }

    @Transactional
    public KycVerificationResultDto uploadAndVerify(
            Long userId,
            String cinNumber,
            MultipartFile cinFront,
            MultipartFile cinBack,
            MultipartFile selfie,
            String maritalStatus,
            Integer numberOfChildren,
            Double monthlySalary,
            Boolean usIndicator
    ) throws IOException {
        KycDocumentDto doc = uploadMultipart(userId, cinNumber, cinFront, cinBack, selfie);

        Path userDir = resolveUploadPath().resolve("kyc").resolve(String.valueOf(userId));
        Path frontPath = userDir.resolve("cin_front.jpg");
        Path backPath = userDir.resolve("cin_back.jpg");
        Path selfiePath = userDir.resolve("selfie.jpg");

        KycVerificationResultDto result = diditClient.verifyIdentity(userId, frontPath, backPath, selfiePath);
        result.setDocumentId(doc.getId());

        boolean duplicateIdentity = hasDuplicateProviderIdentity(result, userId) || hasDuplicateDocumentImage(doc.getId());
        persistProviderResult(doc.getId(), result, duplicateIdentity);
        applyIdentityConsistencyChecks(result, userId);
        duplicateIdentity = duplicateIdentity || result.getStatus() == KycStatus.REJECTED;

        KycDecision decision = kycDecisionService.evaluate(result, true, duplicateIdentity);
        result.setStatus(decision.status());
        result.setRisk("risk-score-" + decision.riskScore());
        result.setMessage(toUserFacingKycMessage(decision, result));
        if (result.getProviderReason() == null || result.getProviderReason().isBlank()) {
            result.setProviderReason(decision.reason());
        }
        persistDecision(doc.getId(), decision, result);

        if (decision.status() == KycStatus.VERIFIED) {
            approveKyc(doc.getId(), "Auto-approved by strict Didit biometric checks");
        } else if (decision.status() == KycStatus.PENDING_MANUAL_REVIEW) {
            manualReviewKyc(doc.getId(), truncateAdminComment(decision.reason()));
        } else if (decision.status() == KycStatus.REJECTED) {
            rejectKyc(doc.getId(), truncateAdminComment(decision.reason()));
        }

        updateUserKycProfile(userId, result, decision, maritalStatus, numberOfChildren, monthlySalary, usIndicator);
        result.setProviderReason(result.getMessage());
        return result;
    }

    private void validateImageUpload(MultipartFile file, String label) throws IOException {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException(label + " image is required");
        }
        if (file.getSize() > maxImageBytes) {
            throw new BadRequestException(label + " image exceeds the maximum allowed size");
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedMimeTypes.contains(contentType.toLowerCase())) {
            throw new BadRequestException(label + " must be JPEG, PNG, or WebP");
        }
        String originalName = file.getOriginalFilename();
        if (originalName != null && originalName.matches("(?i).*\\.(exe|bat|cmd|com|scr|js|jar|php|sh)$")) {
            throw new BadRequestException(label + " file type is not allowed");
        }
        if (ImageIO.read(new ByteArrayInputStream(file.getBytes())) == null) {
            throw new BadRequestException(label + " image is corrupted or unsupported");
        }
    }

    private void applyIdentityConsistencyChecks(KycVerificationResultDto result, Long userId) {
        boolean anyFieldExtracted = result.getExtractedFirstName() != null || result.getExtractedLastName() != null
                || result.getExtractedDateOfBirth() != null || result.getExtractedIdentityNumber() != null;
        if (result.getStatus() != KycStatus.REJECTED && anyFieldExtracted) {
            boolean identityComplete =
                    isPresent(result.getExtractedFirstName()) &&
                    isPresent(result.getExtractedLastName()) &&
                    isPresent(result.getExtractedDateOfBirth()) &&
                    isPresent(result.getExtractedIdentityNumber());
            if (!identityComplete) {
                markManualReview(result, "Incomplete identity data returned by Didit");
                return;
            }
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (isPresent(result.getExtractedFirstName()) || isPresent(result.getExtractedLastName())) {
            boolean firstNameMatch = !isPresent(result.getExtractedFirstName())
                    || normalizeForMatch(result.getExtractedFirstName()).contains(normalizeForMatch(user.getFirstName()))
                    || normalizeForMatch(user.getFirstName()).contains(normalizeForMatch(result.getExtractedFirstName()));
            boolean lastNameMatch = !isPresent(result.getExtractedLastName())
                    || normalizeForMatch(result.getExtractedLastName()).contains(normalizeForMatch(user.getLastName()))
                    || normalizeForMatch(user.getLastName()).contains(normalizeForMatch(result.getExtractedLastName()));
            if (!firstNameMatch || !lastNameMatch) {
                if (hasPassingBiometricApproval(result)) {
                    result.setProviderReason(appendProviderReason(
                            result.getProviderReason(),
                            "Account name differs from document name, but Didit biometric checks passed"
                    ));
                    return;
                }
                markManualReview(result, "Identity mismatch: document name does not match account name");
            }
        }
    }

    private boolean hasPassingBiometricApproval(KycVerificationResultDto result) {
        return result.getStatus() != KycStatus.REJECTED
                && Boolean.TRUE.equals(result.getDocumentAuthentic())
                && Boolean.TRUE.equals(result.getFaceMatched())
                && Boolean.TRUE.equals(result.getLivenessPassed())
                && !Boolean.TRUE.equals(result.getSpoofDetected())
                && normalizeScore(result.getFaceMatchScore()) >= 0.75
                && normalizeScore(result.getLivenessScore()) >= 0.70
                && normalizeScore(result.getProviderConfidence()) >= 0.75;
    }

    private double normalizeScore(Double value) {
        if (value == null) {
            return 0.0;
        }
        return value > 1.0 ? value / 100.0 : value;
    }

    private String appendProviderReason(String currentReason, String warning) {
        if (currentReason == null || currentReason.isBlank()) {
            return warning;
        }
        if (currentReason.contains(warning)) {
            return currentReason;
        }
        return currentReason + "; " + warning;
    }

    private boolean hasDuplicateProviderIdentity(KycVerificationResultDto result, Long userId) {
        if (isPresent(result.getDiditIdentityId()) && isDiditIdentityUsedByAnotherUser(result.getDiditIdentityId(), userId)) {
            return true;
        }
        String extractedIdentity = normalizeIdentityNumber(result.getExtractedIdentityNumber());
        return extractedIdentity != null && isCinUsedByAnotherUser(extractedIdentity, userId);
    }

    private boolean hasDuplicateDocumentImage(Long documentId) {
        return kycDocumentRepository.findById(documentId)
                .map(doc -> (doc.getFraudRiskScore() != null && doc.getFraudRiskScore() >= 90)
                        || (doc.getFraudSignals() != null && doc.getFraudSignals().contains("duplicateImageHash=true")))
                .orElse(false);
    }

    private void persistProviderResult(Long documentId, KycVerificationResultDto result, boolean duplicateIdentity) {
        kycDocumentRepository.findById(documentId).ifPresent(doc -> {
            if (!duplicateIdentity) {
                doc.setDiditIdentityId(blankToNull(result.getDiditIdentityId()));
            }
            doc.setExtractedFirstName(blankToNull(result.getExtractedFirstName()));
            doc.setExtractedLastName(blankToNull(result.getExtractedLastName()));
            doc.setExtractedDateOfBirth(blankToNull(result.getExtractedDateOfBirth()));
            String extractedIdentity = normalizeIdentityNumber(result.getExtractedIdentityNumber());
            if (extractedIdentity != null) {
                doc.setExtractedIdentityNumber(extractedIdentity);
                if (!duplicateIdentity) {
                    doc.setCinNumberUnique(extractedIdentity);
                }
            }
            doc.setFaceMatchScore(result.getFaceMatchScore());
            doc.setLivenessScore(result.getLivenessScore());
            doc.setSpoofDetected(result.getSpoofDetected());
            doc.setProviderConfidence(result.getProviderConfidence());
            doc.setProviderReason(truncateAdminComment(result.getProviderReason()));
            doc.setFraudSignals(buildFraudSignals(doc.getUser(), duplicateIdentity));
            kycDocumentRepository.save(doc);
        });
    }

    private void persistDecision(Long documentId, KycDecision decision, KycVerificationResultDto result) {
        kycDocumentRepository.findById(documentId).ifPresent(doc -> {
            doc.setProviderReason(truncateAdminComment(result.getProviderReason()));
            doc.setFraudRiskScore(decision.riskScore());
            doc.setFraudSignals(buildFraudSignals(doc.getUser(), decision.riskScore() >= 90));
            kycDocumentRepository.save(doc);
        });
    }

    private void updateUserKycProfile(
            Long userId,
            KycVerificationResultDto result,
            KycDecision decision,
            String maritalStatus,
            Integer numberOfChildren,
            Double monthlySalary,
            Boolean usIndicator
    ) {
        try {
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new ResourceNotFoundException("User not found"));
            user.setKycProvider("DIDIT");
            user.setKycSubmittedAt(java.time.LocalDateTime.now());
            if (isPresent(maritalStatus)) {
                user.setMaritalStatus(maritalStatus);
            }
            if (numberOfChildren != null) {
                user.setNumberOfChildren(numberOfChildren);
            }
            if (monthlySalary != null && monthlySalary > 0) {
                user.setMonthlySalary(monthlySalary);
            }
            if (Boolean.TRUE.equals(usIndicator) || decision.riskScore() >= 90) {
                user.setKycFraudFlag(true);
            }
            userRepository.save(user);
            creadiScoreService.calculateScore(userId);
        } catch (Exception dbEx) {
            log.warn("Could not update user KYC provider (userId={}): {}", userId, dbEx.getMessage());
        }
    }

    private String buildFraudSignals(User user, boolean repeatedIdentity) {
        int failedAttempts = user.getKycFailedAttempts() != null ? user.getKycFailedAttempts() : 0;
        return "failedAttempts=" + failedAttempts
                + ";repeatedIdentity=" + repeatedIdentity
                + ";rapidRetry=placeholder"
                + ";deviceMismatch=placeholder"
                + ";vpnProxy=placeholder";
    }

    private Path resolveUploadPath() {
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            uploadPath = Paths.get(System.getProperty("user.dir"), uploadDir);
        }
        return uploadPath;
    }

    private boolean isCinUsedByAnotherUser(String normalizedCin, Long userId) {
        // The database has global unique indexes on normalized identity values.
        // Check the same scope in application code so users get a 400, not a commit-time 500.
        if (identityLockIncludeDeleted) {
            return kycDocumentRepository.existsByCinNumberAndUser_IdNot(normalizedCin, userId)
                    || kycDocumentRepository.existsByCinNumberUniqueAndUser_IdNot(normalizedCin, userId)
                    || kycDocumentRepository.existsByExtractedIdentityNumberAndUser_IdNot(normalizedCin, userId);
        }
        return kycDocumentRepository.existsByCinNumberAndUser_IdNotAndUser_AccountDeletedFalse(normalizedCin, userId)
                || kycDocumentRepository.existsByCinNumberUniqueAndUser_IdNotAndUser_AccountDeletedFalse(normalizedCin, userId)
                || kycDocumentRepository.existsByExtractedIdentityNumberAndUser_IdNotAndUser_AccountDeletedFalse(normalizedCin, userId);
    }

    private boolean isDocumentHashUsedByAnotherUser(String frontHash, String backHash, Long userId) {
        // These hashes are globally unique in MySQL; keep validation aligned with the schema.
        if (identityLockIncludeDeleted) {
            return kycDocumentRepository.existsByCinFrontHashAndUser_IdNot(frontHash, userId)
                    || kycDocumentRepository.existsByCinBackHashAndUser_IdNot(backHash, userId);
        }
        return kycDocumentRepository.existsByCinFrontHashAndUser_IdNotAndUser_AccountDeletedFalse(frontHash, userId)
                || kycDocumentRepository.existsByCinBackHashAndUser_IdNotAndUser_AccountDeletedFalse(backHash, userId);
    }

    private boolean isDiditIdentityUsedByAnotherUser(String diditIdentityId, Long userId) {
        // didit_identity_id is globally unique in MySQL; keep validation aligned with the schema.
        if (identityLockIncludeDeleted) {
            return kycDocumentRepository.existsByDiditIdentityIdAndUser_IdNot(diditIdentityId, userId);
        }
        return kycDocumentRepository.existsByDiditIdentityIdAndUser_IdNotAndUser_AccountDeletedFalse(diditIdentityId, userId);
    }

    private void markManualReview(KycVerificationResultDto result, String reason) {
        result.setStatus(KycStatus.PENDING_MANUAL_REVIEW);
        result.setMessage(reason);
        result.setProviderReason(reason);
    }

    private String toUserFacingKycMessage(KycDecision decision, KycVerificationResultDto result) {
        if (decision.status() == KycStatus.PENDING_MANUAL_REVIEW) {
            return "Votre verification est en revue manuelle. Nous devons verifier votre selfie et votre piece d'identite avant validation.";
        }
        if (result.getProviderReason() != null
                && result.getProviderReason().toLowerCase().contains("don't have enough credits")) {
            return "Le service de verification KYC est temporairement indisponible. Votre dossier est conserve pour revue.";
        }
        return decision.reason();
    }

    private String normalizeIdentityNumber(String value) {
        return value == null || value.isBlank() ? null : value.trim().toUpperCase();
    }

    private boolean isPresent(String value) {
        return value != null && !value.isBlank();
    }

    private String blankToNull(String value) {
        return isPresent(value) ? value.trim() : null;
    }

    private static String sha256Hex(byte[] data) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(data));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private String normalizeForMatch(String name) {
        if (name == null) {
            return "";
        }
        return Normalizer.normalize(name.toLowerCase(), Normalizer.Form.NFD)
                .replaceAll("[^\\p{ASCII}]", "")
                .replaceAll("[^a-z0-9 ]", "")
                .trim()
                .replaceAll("\\s+", " ");
    }

    private String truncateAdminComment(String comment) {
        if (comment == null || comment.length() <= ADMIN_COMMENT_MAX_LENGTH) {
            return comment;
        }
        return comment.substring(0, ADMIN_COMMENT_MAX_LENGTH - 3) + "...";
    }

    private KycDocumentDto mapToDto(KycDocument doc) {
        User user = doc.getUser();
        return KycDocumentDto.builder()
                .id(doc.getId())
                .userId(user.getId())
                .userFirstName(user.getFirstName())
                .userLastName(user.getLastName())
                .userEmail(user.getEmail())
                .userPhone(user.getPhone())
                .cinFrontUrl(doc.getCinFrontUrl())
                .cinBackUrl(doc.getCinBackUrl())
                .selfieUrl(doc.getSelfieUrl())
                .cinNumber(doc.getCinNumber())
                .ocrResult(doc.getOcrResult())
                .faceMatchScore(doc.getFaceMatchScore())
                .livenessScore(doc.getLivenessScore())
                .spoofDetected(doc.getSpoofDetected())
                .providerConfidence(doc.getProviderConfidence())
                .providerReason(doc.getProviderReason())
                .extractedFirstName(doc.getExtractedFirstName())
                .extractedLastName(doc.getExtractedLastName())
                .extractedDateOfBirth(doc.getExtractedDateOfBirth())
                .extractedIdentityNumber(doc.getExtractedIdentityNumber())
                .diditIdentityId(doc.getDiditIdentityId())
                .fraudSignals(doc.getFraudSignals())
                .fraudRiskScore(doc.getFraudRiskScore())
                .status(doc.getStatus())
                .adminComment(doc.getAdminComment())
                .createdAt(doc.getCreatedAt())
                .build();
    }

    private KycDocumentDto mapToDtoWithAudit(KycDocument doc) {
        KycDocumentDto dto = mapToDto(doc);
        dto.setAuditLogs(kycAuditLogRepository.findByKycDocumentIdOrderByCreatedAtDesc(doc.getId())
                .stream()
                .map(this::mapAuditLog)
                .toList());
        return dto;
    }

    private KycAuditLogDto mapAuditLog(KycAuditLog auditLog) {
        return KycAuditLogDto.builder()
                .id(auditLog.getId())
                .adminId(auditLog.getAdminId())
                .previousStatus(auditLog.getPreviousStatus())
                .decision(auditLog.getDecision())
                .reason(auditLog.getReason())
                .createdAt(auditLog.getCreatedAt())
                .build();
    }

    private void saveAuditLog(KycDocument doc, String adminId, KycStatus previousStatus, KycStatus decision, String reason) {
        kycAuditLogRepository.save(KycAuditLog.builder()
                .kycDocument(doc)
                .adminId(adminId == null || adminId.isBlank() ? "admin" : adminId)
                .previousStatus(previousStatus)
                .decision(decision)
                .reason(truncateAdminComment(reason))
                .build());
    }
}

