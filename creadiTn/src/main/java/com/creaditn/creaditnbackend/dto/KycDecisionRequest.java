package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class KycDecisionRequest {
    @Size(max = 1000)
    private String reason;
}
