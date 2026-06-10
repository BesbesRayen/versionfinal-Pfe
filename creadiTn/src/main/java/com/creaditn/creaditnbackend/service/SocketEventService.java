package com.creaditn.creaditnbackend.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

/**
 * Fires real-time events to the Socket.IO server (socket-server/index.js).
 * Calls are async and fire-and-forget — a failure never breaks the article save flow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SocketEventService {

    private final ObjectMapper objectMapper;

    @Value("${app.socket.server-url:http://localhost:3001}")
    private String socketServerUrl;

    @Value("${app.socket.emit-secret}")
    private String emitSecret;

    private static final HttpClient HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(3))
            .build();

    @Async
    public void emitNewArticle(Object articleData) {
        emit("new-article", articleData);
    }

    @Async
    public void emitUpdateArticle(Object articleData) {
        emit("update-article", articleData);
    }

    @Async
    public void emitDeleteArticle(Long articleId) {
        emit("delete-article", Map.of("id", articleId));
    }

    public void emitUserEvent(String event, Long userId, Map<String, Object> data) {
        Map<String, Object> payload = new HashMap<>(data);
        payload.put("userId", userId);
        Runnable emitter = () -> CompletableFuture.runAsync(() -> emit(event, payload));

        if (TransactionSynchronizationManager.isActualTransactionActive()
                && TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    emitter.run();
                }
            });
            return;
        }

        emitter.run();
    }

    private void emit(String event, Object data) {
        try {
            String body = objectMapper.writeValueAsString(Map.of(
                    "secret", emitSecret,
                    "event", event,
                    "data", data
            ));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(socketServerUrl + "/emit"))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8))
                    .timeout(Duration.ofSeconds(5))
                    .build();

            HttpResponse<String> response = HTTP_CLIENT.send(request, HttpResponse.BodyHandlers.ofString());

            if (response.statusCode() != 200) {
                log.warn("[socket] emit {} failed: HTTP {}", event, response.statusCode());
            } else {
                log.debug("[socket] emitted {}", event);
            }
        } catch (Exception e) {
            // Non-fatal — socket server may be down
            log.debug("[socket] emit {} skipped: {}", event, e.getMessage());
        }
    }
}
