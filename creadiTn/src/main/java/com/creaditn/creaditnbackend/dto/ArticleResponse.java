package com.creaditn.creaditnbackend.dto;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ArticleResponse {

    private Long id;
    private String productName;
    private String description;
    private BigDecimal price;
    private BigDecimal promoPrice;
    private String imageUrl;
    private String boutiqueName;
    private Long storeId;
    private String category;
    private String brand;
    private Integer stockQuantity;
    private String warranty;
    private String availability;
    private Boolean active;
    private Boolean deleted;
    private Boolean available;
    private Boolean eligibleThreeMonths;
    private Boolean eligibleSixMonths;
    private Boolean eligibleTwelveMonths;
    private String sourceUrl;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
