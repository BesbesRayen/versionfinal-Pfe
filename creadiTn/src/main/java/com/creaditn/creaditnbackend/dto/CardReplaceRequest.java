package com.creaditn.creaditnbackend.dto;

import com.creaditn.creaditnbackend.entity.CardType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import lombok.*;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class CardReplaceRequest extends CardVerificationRequest {
    @NotBlank
    private String cardNumber;

    @NotBlank
    @Pattern(regexp = "^(0[1-9]|1[0-2])\\/\\d{2}$", message = "Expiry date must follow MM/YY")
    private String expiryDate;

    private String cardholderName;

    @NotNull
    private CardType type;

    @NotBlank
    @Pattern(regexp = "^\\d{3}$", message = "CVV must be exactly 3 digits")
    private String cvv;
}
