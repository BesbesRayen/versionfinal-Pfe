package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreResponse {
    private Long id;
    private String slug;
    private String name;
    private String category;
    private String country;
    private String websiteUrl;
    private String logoUrl;
    private String coverImageUrl;
    private String parserType;
    private String difficulty;
    private Boolean hasAntiRobot;
    private String antiRobotLevel;
    private Boolean visibleOnClient;
    private String description;
    private Long articleCount;
    private Boolean active;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
