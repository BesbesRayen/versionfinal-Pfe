package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.KycStatus;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class KycVerificationResultDto {
    private Long documentId;
    private Long userId;
    private KycStatus status;
    private int confidence;
    private String risk;
    private String message;
    private Double faceMatchScore;
    private Double livenessScore;
    private Boolean spoofDetected;
    private Double providerConfidence;
    private String providerReason;
    private Boolean documentAuthentic;
    private Boolean livenessPassed;
    private Boolean faceMatched;
    /** Extracted from the identity document by Didit AI. Null when using simulated verification. */
    private String extractedFirstName;
    private String extractedLastName;
    private String extractedDateOfBirth;
    /** Document / identity number extracted by Didit (e.g. CIN number on the card). */
    private String extractedIdentityNumber;
    /** Didit session / identity ID — stored for hard lock enforcement. */
    private String diditIdentityId;
}
