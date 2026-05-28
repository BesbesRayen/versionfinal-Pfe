package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "stores")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Store {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String slug;

    @Column(length = 600)
    private String logoUrl;

    @Column(length = 600)
    private String coverImageUrl;

    @Column(nullable = false, length = 600)
    private String websiteUrl;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 80)
    private String country;

    @Column(length = 80)
    private String parserType;

    @Column(length = 40)
    private String difficulty;

    @Column(nullable = false)
    private Boolean hasAntiRobot;

    @Column(nullable = false, length = 20)
    private String antiRobotLevel;

    @Column(nullable = false)
    private Boolean visibleOnClient;

    @Column(length = 1200)
    private String description;

    @Column(nullable = false)
    private Boolean active;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) active = true;
        if (hasAntiRobot == null) hasAntiRobot = false;
        if (antiRobotLevel == null || antiRobotLevel.isBlank()) antiRobotLevel = Boolean.TRUE.equals(hasAntiRobot) ? "soft" : "none";
        if (visibleOnClient == null) visibleOnClient = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
