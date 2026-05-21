package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.exception.BadRequestException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.ConnectionCallback;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Pattern;
import java.util.stream.Stream;

@Service
@RequiredArgsConstructor
public class DevDatabaseResetService {

    private static final String CONFIRMATION = "RESET_DATABASE";
    private static final Pattern SAFE_TABLE_NAME = Pattern.compile("[a-zA-Z0-9_]+");

    private static final List<String> RESET_TABLES = List.of(
            "admin_notifications",
            "invoices",
            "payments",
            "transactions",
            "purchase_orders",
            "installments",
            "credit_requests",
            "creadi_scores",
            "financial_profiles",
            "kyc_documents",
            "cards",
            "notifications",
            "user_wallet",
            "users",
            "articles",
            "merchants",
            "messages"
    );

    private final JdbcTemplate jdbcTemplate;
    private final PlatformTransactionManager transactionManager;
    private final AuthService authService;
    private final SupportService supportService;

    @Value("${app.dev-reset.enabled:false}")
    private boolean enabled;

    @Value("${app.dev-reset.token:}")
    private String configuredResetToken;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    public Map<String, Object> reset(String confirmation, String resetToken, boolean clearUploads) {
        requireResetAllowed(confirmation, resetToken);

        Map<String, Long> beforeCounts = countRows();
        List<String> deletedTables = new ArrayList<>();

        TransactionTemplate transactionTemplate = new TransactionTemplate(transactionManager);
        transactionTemplate.executeWithoutResult(status -> {
            for (String table : RESET_TABLES) {
                if (tableExists(table)) {
                    jdbcTemplate.update("DELETE FROM " + quote(table));
                    deletedTables.add(table);
                }
            }
        });

        List<String> resetIdentities = resetIdentities(deletedTables);
        int deletedUploadFiles = clearUploads ? clearUploadDirectory() : 0;

        authService.clearPasswordResetSessions();
        supportService.clearTransientTickets();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "RESET_COMPLETE");
        result.put("database", currentDatabaseName());
        result.put("deletedTables", deletedTables);
        result.put("resetIdentities", resetIdentities);
        result.put("rowsBeforeReset", beforeCounts);
        result.put("rowsAfterReset", countRows());
        result.put("deletedUploadFiles", deletedUploadFiles);
        result.put("transientCachesCleared", List.of("password_reset_sessions", "support_tickets"));
        return result;
    }

    private void requireResetAllowed(String confirmation, String resetToken) {
        if (!enabled) {
            throw new BadRequestException("Development database reset is disabled.");
        }
        if (!CONFIRMATION.equals(confirmation)) {
            throw new BadRequestException("Confirmation must be RESET_DATABASE.");
        }
        if (configuredResetToken == null || configuredResetToken.isBlank()) {
            throw new BadRequestException("APP_DEV_RESET_TOKEN must be configured before reset can run.");
        }
        byte[] expected = configuredResetToken.getBytes(StandardCharsets.UTF_8);
        byte[] actual = (resetToken == null ? "" : resetToken).getBytes(StandardCharsets.UTF_8);
        if (!MessageDigest.isEqual(expected, actual)) {
            throw new BadRequestException("Invalid reset token.");
        }
    }

    private Map<String, Long> countRows() {
        Map<String, Long> counts = new LinkedHashMap<>();
        for (String table : RESET_TABLES) {
            if (tableExists(table)) {
                Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + quote(table), Long.class);
                counts.put(table, count == null ? 0L : count);
            }
        }
        return counts;
    }

    private List<String> resetIdentities(List<String> tables) {
        String product = databaseProductName().toLowerCase();
        List<String> reset = new ArrayList<>();
        for (String table : tables) {
            if (!tableExists(table)) {
                continue;
            }
            if (product.contains("postgres")) {
                jdbcTemplate.execute("ALTER SEQUENCE IF EXISTS " + quote(table + "_id_seq") + " RESTART WITH 1");
            } else {
                jdbcTemplate.execute("ALTER TABLE " + quote(table) + " AUTO_INCREMENT = 1");
            }
            reset.add(table);
        }
        return reset;
    }

    private boolean tableExists(String table) {
        validateTableName(table);
        String product = databaseProductName().toLowerCase();
        String sql = product.contains("postgres")
                ? "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = ?"
                : "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = ?";
        Integer count = jdbcTemplate.queryForObject(sql, Integer.class, table);
        return count != null && count > 0;
    }

    private String quote(String identifier) {
        validateTableName(identifier);
        return databaseProductName().toLowerCase().contains("postgres")
                ? "\"" + identifier + "\""
                : "`" + identifier + "`";
    }

    private void validateTableName(String identifier) {
        if (identifier == null || !SAFE_TABLE_NAME.matcher(identifier).matches()) {
            throw new BadRequestException("Unsafe table identifier.");
        }
    }

    private String databaseProductName() {
        return jdbcTemplate.execute((ConnectionCallback<String>) connection ->
                connection.getMetaData().getDatabaseProductName());
    }

    private String currentDatabaseName() {
        String product = databaseProductName().toLowerCase();
        String sql = product.contains("postgres") ? "SELECT current_database()" : "SELECT DATABASE()";
        return jdbcTemplate.queryForObject(sql, String.class);
    }

    private int clearUploadDirectory() {
        Path uploadPath = Paths.get(uploadDir);
        if (!uploadPath.isAbsolute()) {
            uploadPath = Paths.get(System.getProperty("user.dir")).resolve(uploadPath);
        }
        Path normalized = uploadPath.toAbsolutePath().normalize();

        if (normalized.getNameCount() < 2) {
            throw new BadRequestException("Refusing to clear unsafe upload directory: " + normalized);
        }
        if (!Files.exists(normalized)) {
            return 0;
        }
        if (!Files.isDirectory(normalized)) {
            throw new BadRequestException("Upload path is not a directory: " + normalized);
        }

        AtomicInteger deleted = new AtomicInteger();
        try (Stream<Path> paths = Files.walk(normalized)) {
            paths
                    .filter(path -> !path.equals(normalized))
                    .sorted(Comparator.reverseOrder())
                    .forEach(path -> {
                        try {
                            Files.deleteIfExists(path);
                            deleted.incrementAndGet();
                        } catch (IOException e) {
                            throw new IllegalStateException("Failed to delete upload path: " + path, e);
                        }
                    });
        } catch (IOException e) {
            throw new IllegalStateException("Failed to clear upload directory: " + normalized, e);
        }
        return deleted.get();
    }
}
