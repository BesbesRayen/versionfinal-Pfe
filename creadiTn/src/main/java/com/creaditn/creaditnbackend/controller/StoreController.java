package com.creaditn.creaditnbackend.controller;

import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.dto.StoreResponse;
import com.creaditn.creaditnbackend.service.ArticleService;
import com.creaditn.creaditnbackend.service.StoreService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping({"/api/stores", "/api/public/stores"})
@RequiredArgsConstructor
public class StoreController {

    private final ArticleService articleService;
    private final StoreService storeService;

    @GetMapping
    public ResponseEntity<List<StoreResponse>> getStores() {
        return ResponseEntity.ok(storeService.getPublicStores());
    }

    @GetMapping("/{storeId}")
    public ResponseEntity<StoreResponse> getStore(@PathVariable String storeId) {
        return ResponseEntity.ok(storeService.getPublicStore(storeId));
    }

    @GetMapping("/{storeId}/articles")
    public ResponseEntity<List<ArticleResponse>> getStoreArticles(@PathVariable String storeId) {
        return ResponseEntity.ok(articleService.getPublicStoreArticles(storeId));
    }
}
