package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KycDocumentDto {
    private Long id;
    private Long userId;
    private String userFirstName;
    private String userLastName;
    private String userEmail;
    private String userPhone;
    private String cinFrontUrl;
    private String cinBackUrl;
    private String selfieUrl;
    private String cinNumber;
    private String ocrResult;
    private Double faceMatchScore;
    private Double livenessScore;
    private Boolean spoofDetected;
    private Double providerConfidence;
    private String providerReason;
    private String extractedFirstName;
    private String extractedLastName;
    private String extractedDateOfBirth;
    private String extractedIdentityNumber;
    private String diditIdentityId;
    private String fraudSignals;
    private Integer fraudRiskScore;
    private KycStatus status;
    private String adminComment;
    private LocalDateTime createdAt;
    private List<KycAuditLogDto> auditLogs;
}
