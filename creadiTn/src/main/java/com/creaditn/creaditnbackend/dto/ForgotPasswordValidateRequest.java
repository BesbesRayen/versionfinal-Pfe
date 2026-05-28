package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordValidateRequest {
    @NotBlank
    private String identifier;

    @NotBlank
    private String token;
}
