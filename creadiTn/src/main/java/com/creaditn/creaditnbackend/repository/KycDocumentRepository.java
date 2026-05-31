package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.KycDocument;
import com.creaditn.creaditnbackend.entity.KycStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
    @EntityGraph(attributePaths = "user")
    List<KycDocument> findByUserId(Long userId);

    @EntityGraph(attributePaths = "user")
    Optional<KycDocument> findTopByUserIdOrderByCreatedAtDesc(Long userId);

    @EntityGraph(attributePaths = "user")
    List<KycDocument> findByStatus(KycStatus status);

    @EntityGraph(attributePaths = "user")
    List<KycDocument> findByStatusInOrderByCreatedAtDesc(List<KycStatus> statuses);

    @Override
    @EntityGraph(attributePaths = "user")
    Page<KycDocument> findAll(Pageable pageable);

    long countByStatus(KycStatus status);

    /**
     * Returns true if the given CIN number is already associated with a PENDING or APPROVED
     * KYC document belonging to a DIFFERENT user. Used to prevent identity reuse across accounts.
     */
    boolean existsByCinNumberAndUser_IdNotAndStatusIn(String cinNumber, Long userId, List<KycStatus> statuses);

    /**
     * Returns true if the given CIN number is used by ANY KYC document (any status) belonging
     * to a different user. Prevents identity reuse even when the other account was rejected.
     */
    boolean existsByCinNumberAndUser_IdNot(String cinNumber, Long userId);
    boolean existsByCinNumberAndUser_IdNotAndUser_AccountDeletedFalse(String cinNumber, Long userId);

    /**
     * Hard identity lock: reject if the same CIN front image (by SHA-256 hash) was already used
     * by a different user — regardless of status.
     */
    boolean existsByCinFrontHashAndUser_IdNot(String cinFrontHash, Long userId);
    boolean existsByCinFrontHashAndUser_IdNotAndUser_AccountDeletedFalse(String cinFrontHash, Long userId);

    /**
     * Hard identity lock: same check for CIN back image.
     */
    boolean existsByCinBackHashAndUser_IdNot(String cinBackHash, Long userId);
    boolean existsByCinBackHashAndUser_IdNotAndUser_AccountDeletedFalse(String cinBackHash, Long userId);

    /**
     * Hard identity lock: reject if the same Didit identity ID is already linked to another user.
     */
    boolean existsByDiditIdentityIdAndUser_IdNot(String diditIdentityId, Long userId);
    boolean existsByDiditIdentityIdAndUser_IdNotAndUser_AccountDeletedFalse(String diditIdentityId, Long userId);

    /**
     * Reject if the authoritative document number extracted by Didit is already tied
     * to another account.
     */
    boolean existsByExtractedIdentityNumberAndUser_IdNot(String extractedIdentityNumber, Long userId);
    boolean existsByExtractedIdentityNumberAndUser_IdNotAndUser_AccountDeletedFalse(String extractedIdentityNumber, Long userId);

    /**
     * Normalized CIN duplicate check used after OCR/provider extraction.
     */
    boolean existsByCinNumberUniqueAndUser_IdNot(String cinNumberUnique, Long userId);
    boolean existsByCinNumberUniqueAndUser_IdNotAndUser_AccountDeletedFalse(String cinNumberUnique, Long userId);
}

