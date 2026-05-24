package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CardDeleteRequest extends CardVerificationRequest {
    @NotNull
    private Long cardId;
}
