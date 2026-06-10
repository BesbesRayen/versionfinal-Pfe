package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.NotificationDto;
import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.service.NotificationService;
import com.creaditn.creaditnbackend.security.AuthenticatedUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final AuthenticatedUserService authenticatedUserService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getNotifications(@RequestParam(required = false) Long userId,
                                                                  Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(notificationService.getUserNotifications(currentUserId));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDto>> getUnread(@RequestParam(required = false) Long userId,
                                                           Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(notificationService.getUnreadNotifications(currentUserId));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Long> getUnreadCount(@RequestParam(required = false) Long userId,
                                               Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireSameUser(authentication, userId);
        return ResponseEntity.ok(notificationService.getUnreadCount(currentUserId));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<ApiResponse> markAsRead(@PathVariable Long id, Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireUserId(authentication);
        notificationService.markAsRead(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<ApiResponse> markAllAsRead(Authentication authentication) {
        Long currentUserId = authenticatedUserService.requireUserId(authentication);
        int count = notificationService.markAllAsRead(currentUserId);
        return ResponseEntity.ok(ApiResponse.success("Notifications marked as read", Map.of("count", count)));
    }
}
