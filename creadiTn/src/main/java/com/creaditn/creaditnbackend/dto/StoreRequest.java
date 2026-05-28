package com.creaditn.creaditnbackend.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StoreRequest {

    @NotBlank
    @Size(max = 160)
    private String name;

    @Size(max = 180)
    private String slug;

    @Size(max = 600)
    private String logoUrl;

    @Size(max = 600)
    private String coverImageUrl;

    @NotBlank
    @Size(max = 600)
    private String websiteUrl;

    @NotBlank
    @Size(max = 100)
    private String category;

    @NotBlank
    @Size(max = 80)
    private String country;

    @Size(max = 80)
    private String parserType;

    @Size(max = 40)
    private String difficulty;

    private Boolean hasAntiRobot;

    @Size(max = 20)
    private String antiRobotLevel;

    private Boolean visibleOnClient;

    @Size(max = 1200)
    private String description;

    private Boolean active;
}
