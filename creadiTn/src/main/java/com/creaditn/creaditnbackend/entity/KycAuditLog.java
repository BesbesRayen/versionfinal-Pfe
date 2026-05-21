package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "kyc_audit_logs")
@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KycAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kyc_document_id", nullable = false)
    private KycDocument kycDocument;

    @Column(nullable = false)
    private String adminId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus previousStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private KycStatus decision;

    @Column(length = 1000)
    private String reason;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
