package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
@Builder
public class KycAuditLogDto {
    private Long id;
    private String adminId;
    private KycStatus previousStatus;
    private KycStatus decision;
    private String reason;
    private LocalDateTime createdAt;
}
