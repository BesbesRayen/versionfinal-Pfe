package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.KycAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface KycAuditLogRepository extends JpaRepository<KycAuditLog, Long> {
    List<KycAuditLog> findByKycDocumentIdOrderByCreatedAtDesc(Long kycDocumentId);
}
