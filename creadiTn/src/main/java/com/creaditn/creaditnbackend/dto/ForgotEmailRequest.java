package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class ForgotEmailRequest {
    @NotBlank
    private String identifier; // phone number or username

    @NotBlank
    private String password;
}
