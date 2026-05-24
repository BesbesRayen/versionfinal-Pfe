package com.creaditn.creaditnbackend.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CardDeleteResponse {
    private boolean success;
    private String message;
}
