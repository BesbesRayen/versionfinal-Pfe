package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.service.DevDatabaseResetService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/dev-reset")
@RequiredArgsConstructor
public class DevDatabaseResetController {

    private final DevDatabaseResetService devDatabaseResetService;

    @PostMapping
    public ResponseEntity<Map<String, Object>> reset(
            @RequestParam String confirm,
            @RequestParam(defaultValue = "true") boolean clearUploads,
            @RequestHeader("X-Reset-Token") String resetToken
    ) {
        return ResponseEntity.ok(devDatabaseResetService.reset(confirm, resetToken, clearUploads));
    }
}
