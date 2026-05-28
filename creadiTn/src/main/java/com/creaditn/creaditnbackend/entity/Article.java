package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "articles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Article {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 160)
    private String productName;

    @Column(nullable = false, length = 2000)
    private String description;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal price;

    @Column(precision = 12, scale = 2)
    private BigDecimal promoPrice;

    @Column(nullable = false, length = 600)
    private String imageUrl;

    @Column(nullable = false, length = 160)
    private String boutiqueName;

    private Long storeId;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(length = 120)
    private String brand;

    private Integer stockQuantity;

    @Column(length = 160)
    private String warranty;

    @Column(length = 80)
    private String availability;

    @Column(nullable = false)
    private Boolean active;

    @Column(nullable = false)
    private Boolean deleted;

    @Column(nullable = false)
    private Boolean available;

    @Column(nullable = false)
    private Boolean eligibleThreeMonths;

    @Column(nullable = false)
    private Boolean eligibleSixMonths;

    @Column(nullable = false)
    private Boolean eligibleTwelveMonths;

    @Column(length = 800, unique = true)
    private String sourceUrl;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (active == null) {
            active = true;
        }
        if (deleted == null) {
            deleted = false;
        }
        if (available == null) {
            available = true;
        }
        if (eligibleThreeMonths == null) {
            eligibleThreeMonths = true;
        }
        if (eligibleSixMonths == null) {
            eligibleSixMonths = true;
        }
        if (eligibleTwelveMonths == null) {
            eligibleTwelveMonths = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
