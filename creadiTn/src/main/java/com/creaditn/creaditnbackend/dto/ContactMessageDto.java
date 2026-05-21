package com.creaditn.creaditnbackend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ContactMessageDto {
    private Long id;
    private String name;
    private String email;
    private String subject;
    private String message;
    private String status;
    private LocalDateTime createdAt;
}
