package com.creaditn.creaditnbackend.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter
@NoArgsConstructor @AllArgsConstructor
public class ForgotPasswordConfirmRequest {
    @NotBlank
    private String identifier; // email or phone

    @JsonAlias("token")
    private String code;

    @NotBlank
    private String newPassword;

    public String resolveToken() {
        return code == null ? "" : code.trim();
    }
}
