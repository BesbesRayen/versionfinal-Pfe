package com.creaditn.creaditnbackend.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "wallet_recharges",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_wallet_recharge_user_cycle",
                columnNames = {"user_id", "billing_cycle"}
        )
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WalletRecharge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "billing_cycle", nullable = false, length = 7)
    private String billingCycle;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal amount;

    @Column(name = "balance_before", nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceBefore;

    @Column(name = "balance_after", nullable = false, precision = 10, scale = 2)
    private BigDecimal balanceAfter;

    @Column(name = "processed_at", nullable = false)
    private LocalDateTime processedAt;

    @PrePersist
    protected void onCreate() {
        if (processedAt == null) {
            processedAt = LocalDateTime.now();
        }
    }
}
