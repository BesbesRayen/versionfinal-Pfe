package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.ContactMessageDto;
import com.creaditn.creaditnbackend.dto.ContactMessageRequest;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;
import org.springframework.jdbc.support.GeneratedKeyHolder;
import org.springframework.jdbc.support.KeyHolder;
import org.springframework.stereotype.Service;

import java.sql.PreparedStatement;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ContactMessageService {

    private static final RowMapper<ContactMessageDto> ROW_MAPPER = (rs, rowNum) -> {
        var createdAt = rs.getTimestamp("created_at");
        return ContactMessageDto.builder()
                .id(rs.getLong("id"))
                .name(rs.getString("name"))
                .email(rs.getString("email"))
                .subject(rs.getString("subject"))
                .message(rs.getString("message"))
                .status(rs.getString("status"))
                .createdAt(createdAt == null ? null : createdAt.toLocalDateTime())
                .build();
    };

    private final JdbcTemplate jdbcTemplate;

    @PostConstruct
    void ensureTable() {
        jdbcTemplate.execute("""
                CREATE TABLE IF NOT EXISTS messages (
                    id BIGINT AUTO_INCREMENT PRIMARY KEY,
                    name VARCHAR(180) NOT NULL,
                    email VARCHAR(180) NOT NULL,
                    subject VARCHAR(180) NOT NULL,
                    message TEXT NOT NULL,
                    status VARCHAR(30) NOT NULL DEFAULT 'unread',
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_messages_created_at (created_at),
                    INDEX idx_messages_status (status)
                )
                """);
    }

    public List<ContactMessageDto> listRecent() {
        return jdbcTemplate.query(
                "SELECT id, name, email, subject, message, status, created_at FROM messages ORDER BY created_at DESC LIMIT 100",
                ROW_MAPPER
        );
    }

    public ContactMessageDto create(ContactMessageRequest request) {
        KeyHolder keyHolder = new GeneratedKeyHolder();
        jdbcTemplate.update(connection -> {
            PreparedStatement statement = connection.prepareStatement(
                    "INSERT INTO messages (name, email, subject, message, status) VALUES (?, ?, ?, ?, ?)",
                    Statement.RETURN_GENERATED_KEYS
            );
            statement.setString(1, request.getName().trim());
            statement.setString(2, request.getEmail().trim());
            statement.setString(3, request.getSubject().trim());
            statement.setString(4, request.getMessage().trim());
            statement.setString(5, "unread");
            return statement;
        }, keyHolder);

        Number key = keyHolder.getKey();
        Long id = key == null ? null : key.longValue();
        return ContactMessageDto.builder()
                .id(id)
                .name(request.getName().trim())
                .email(request.getEmail().trim())
                .subject(request.getSubject().trim())
                .message(request.getMessage().trim())
                .status("unread")
                .createdAt(LocalDateTime.now())
                .build();
    }
}
