package com.creaditn.creaditnbackend.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.sql.Connection;

@Configuration
@RequiredArgsConstructor
public class WalletRechargeSchemaGuard {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Bean
    CommandLineRunner ensureWalletRechargeSchema() {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                String databaseProduct = connection.getMetaData().getDatabaseProductName();
                if (!"MySQL".equalsIgnoreCase(databaseProduct)) {
                    return;
                }
            }

            jdbcTemplate.execute("""
                    CREATE TABLE IF NOT EXISTS wallet_recharges (
                        id BIGINT AUTO_INCREMENT PRIMARY KEY,
                        user_id BIGINT NOT NULL,
                        billing_cycle VARCHAR(7) NOT NULL,
                        amount DECIMAL(10,2) NOT NULL,
                        balance_before DECIMAL(10,2) NOT NULL,
                        balance_after DECIMAL(10,2) NOT NULL,
                        processed_at DATETIME NOT NULL,
                        CONSTRAINT uq_wallet_recharge_user_cycle UNIQUE (user_id, billing_cycle),
                        CONSTRAINT fk_wallet_recharge_user
                            FOREIGN KEY (user_id) REFERENCES users(id),
                        INDEX idx_wallet_recharge_user_processed (user_id, processed_at)
                    )
                    """);
        };
    }
}
