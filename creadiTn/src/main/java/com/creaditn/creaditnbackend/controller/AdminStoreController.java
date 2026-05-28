package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ApiResponse;
import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.dto.StoreRequest;
import com.creaditn.creaditnbackend.dto.StoreResponse;
import com.creaditn.creaditnbackend.service.ArticleService;
import com.creaditn.creaditnbackend.service.StoreService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin/stores")
@RequiredArgsConstructor
public class AdminStoreController {

    private final StoreService storeService;
    private final ArticleService articleService;

    @Value("${app.upload-dir:uploads}")
    private String uploadDir;

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getStores() {
        return ResponseEntity.ok(storeService.getAdminStores());
    }

    @PostMapping
    public ResponseEntity<StoreResponse> createStore(@Valid @RequestBody StoreRequest request) {
        return ResponseEntity.ok(storeService.createStore(request));
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStore(@PathVariable String storeId) {
        return ResponseEntity.ok(storeService.getAdminStore(storeId));
    }

    @PutMapping("/{storeId}")
    public ResponseEntity<StoreResponse> updateStore(
            @PathVariable String storeId,
            @Valid @RequestBody StoreRequest request
    ) {
        return ResponseEntity.ok(storeService.updateStore(storeId, request));
    }

    @PatchMapping("/{storeId}")
    public ResponseEntity<StoreResponse> patchStore(
            @PathVariable String storeId,
            @Valid @RequestBody StoreRequest request
    ) {
        return ResponseEntity.ok(storeService.updateStore(storeId, request));
    }

    @DeleteMapping("/{storeId}")
    public ResponseEntity<ApiResponse> deleteStore(@PathVariable String storeId) {
        storeService.deleteStore(storeId);
        return ResponseEntity.ok(ApiResponse.success("Store disabled"));
    }

    @GetMapping("/{storeId}/articles")
    public ResponseEntity<List<ArticleResponse>> getStoreArticles(@PathVariable String storeId) {
        return ResponseEntity.ok(articleService.getAdminStoreArticles(storeId));
    }

    @PostMapping(value = "/upload-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> uploadImage(@RequestParam("file") MultipartFile file) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("image/jpeg") && !contentType.equals("image/png") && !contentType.equals("image/webp"))) {
            return ResponseEntity.badRequest().body(Map.of("error", "Only jpg/png/webp images are allowed"));
        }
        if (file.getSize() > 5 * 1024 * 1024) {
            return ResponseEntity.badRequest().body(Map.of("error", "File size must not exceed 5 MB"));
        }

        Path storesDir = Paths.get(System.getProperty("user.dir"), uploadDir, "stores");
        Files.createDirectories(storesDir);

        String extension = switch (contentType) {
            case "image/png" -> ".png";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
        String filename = UUID.randomUUID() + extension;
        Path dest = storesDir.resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        return ResponseEntity.ok(Map.of("imageUrl", "/api/files/stores/" + filename));
    }
}
