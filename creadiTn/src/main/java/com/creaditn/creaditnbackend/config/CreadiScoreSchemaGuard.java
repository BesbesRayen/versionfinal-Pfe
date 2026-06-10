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
public class CreadiScoreSchemaGuard {

    private final JdbcTemplate jdbcTemplate;
    private final DataSource dataSource;

    @Bean
    CommandLineRunner alignCreadiScoreEnums() {
        return args -> {
            try (Connection connection = dataSource.getConnection()) {
                String databaseProduct = connection.getMetaData().getDatabaseProductName();
                if (!"MySQL".equalsIgnoreCase(databaseProduct)) {
                    return;
                }
            }

            jdbcTemplate.execute("ALTER TABLE creadi_scores MODIFY level ENUM('EXCELLENT','GOOD','MEDIUM','HIGH_RISK','CRITICAL') NOT NULL");
            jdbcTemplate.execute("ALTER TABLE creadi_scores MODIFY risk ENUM('LOW','MODERATE','HIGH','VERY_HIGH','CRITICAL') NOT NULL");
        };
    }
}
