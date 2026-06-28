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
public class NotificationSchemaGuard {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Bean
    CommandLineRunner alignNotificationTypes() {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                String databaseProduct = connection.getMetaData().getDatabaseProductName();
                if (!"MySQL".equalsIgnoreCase(databaseProduct)) {
                    return;
                }
            }

            jdbcTemplate.execute("""
                    ALTER TABLE notifications MODIFY type ENUM(
                        'KYC_VALIDATED',
                        'CREDIT_APPROVED',
                        'CREDIT_REJECTED',
                        'PAYMENT_REMINDER',
                        'PAYMENT_PENDING',
                        'PAYMENT_CONFIRMED',
                        'PAYMENT_FAILED',
                        'PAYMENT_REFUNDED',
                        'INSTALLMENT_OVERDUE'
                    ) NOT NULL
                    """);
        };
    }
}
