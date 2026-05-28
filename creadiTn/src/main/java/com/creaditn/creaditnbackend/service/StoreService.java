package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.StoreRequest;
import com.creaditn.creaditnbackend.dto.StoreResponse;
import com.creaditn.creaditnbackend.entity.Store;
import com.creaditn.creaditnbackend.exception.BadRequestException;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.ArticleRepository;
import com.creaditn.creaditnbackend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.Normalizer;
import java.util.List;

@Service
@RequiredArgsConstructor
public class StoreService {

    private final StoreRepository storeRepository;
    private final ArticleRepository articleRepository;

    public List<StoreResponse> getPublicStores() {
        return storeRepository.findByActiveTrueOrderByCreatedAtDesc()
                .stream()
                .map(store -> toDto(store, articleRepository.countByStoreIdAndActiveTrue(store.getId())))
                .filter(this::isPubliclyVisible)
                .toList();
    }

    public List<StoreResponse> getAdminStores() {
        return storeRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(store -> toDto(store, articleRepository.countByStoreId(store.getId())))
                .toList();
    }

    public Store getStoreEntity(String idOrSlug) {
        try {
            return storeRepository.findById(Long.parseLong(idOrSlug))
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        } catch (NumberFormatException ignored) {
            return storeRepository.findBySlugIgnoreCase(idOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        }
    }

    public StoreResponse getPublicStore(String idOrSlug) {
        Store store = getStoreEntity(idOrSlug);
        StoreResponse response = toDto(store, articleRepository.countByStoreIdAndActiveTrue(store.getId()));
        if (!Boolean.TRUE.equals(store.getActive()) || !isPubliclyVisible(response)) {
            throw new ResourceNotFoundException("Store not found");
        }
        return response;
    }

    public StoreResponse getAdminStore(String idOrSlug) {
        Store store = getStoreEntity(idOrSlug);
        return toDto(store, articleRepository.countByStoreId(store.getId()));
    }

    @Transactional
    public StoreResponse createStore(StoreRequest request) {
        assertNoDuplicateStore(request, null);
        String baseSlug = request.getSlug() == null || request.getSlug().isBlank()
                ? slugify(request.getName())
                : slugify(request.getSlug());
        String slug = uniqueSlug(baseSlug, null);

        Store store = Store.builder()
                .name(clean(request.getName()))
                .slug(slug)
                .logoUrl(clean(request.getLogoUrl()))
                .coverImageUrl(clean(request.getCoverImageUrl()))
                .websiteUrl(clean(request.getWebsiteUrl()))
                .category(clean(request.getCategory()))
                .country(clean(request.getCountry()))
                .parserType(clean(request.getParserType()))
                .difficulty(clean(request.getDifficulty()))
                .antiRobotLevel(normalizeAntiRobotLevel(request.getAntiRobotLevel(), request.getHasAntiRobot()))
                .hasAntiRobot(isAntiRobot(request.getAntiRobotLevel(), request.getHasAntiRobot()))
                .visibleOnClient(request.getVisibleOnClient() == null ? false : request.getVisibleOnClient())
                .description(clean(request.getDescription()))
                .active(request.getActive() == null ? true : request.getActive())
                .build();

        storeRepository.save(store);
        return toDto(store, 0);
    }

    @Transactional
    public StoreResponse updateStore(String idOrSlug, StoreRequest request) {
        Store store = getStoreEntity(idOrSlug);
        String previousName = store.getName();
        assertNoDuplicateStore(request, store.getId());

        store.setName(clean(request.getName()));
        store.setSlug(uniqueSlug(request.getSlug() == null || request.getSlug().isBlank()
                ? slugify(request.getName())
                : slugify(request.getSlug()), store.getId()));
        store.setLogoUrl(clean(request.getLogoUrl()));
        store.setCoverImageUrl(clean(request.getCoverImageUrl()));
        store.setWebsiteUrl(clean(request.getWebsiteUrl()));
        store.setCategory(clean(request.getCategory()));
        store.setCountry(clean(request.getCountry()));
        store.setParserType(clean(request.getParserType()));
        store.setDifficulty(clean(request.getDifficulty()));
        store.setAntiRobotLevel(normalizeAntiRobotLevel(request.getAntiRobotLevel(), request.getHasAntiRobot()));
        store.setHasAntiRobot(isAntiRobot(request.getAntiRobotLevel(), request.getHasAntiRobot()));
        if (request.getVisibleOnClient() != null) {
            store.setVisibleOnClient(request.getVisibleOnClient());
        }
        store.setDescription(clean(request.getDescription()));
        if (request.getActive() != null) {
            store.setActive(request.getActive());
        }

        storeRepository.save(store);
        // Keep legacy articles linked by boutique name coherent after a store rename.
        articleRepository.findStoreArticles(store.getId(), previousName, true, true)
                .forEach(article -> {
                    article.setStoreId(store.getId());
                    article.setBoutiqueName(store.getName());
                    articleRepository.save(article);
                });

        return toDto(store, articleRepository.countByStoreId(store.getId()));
    }

    @Transactional
    public void deleteStore(String idOrSlug) {
        Store store = getStoreEntity(idOrSlug);
        store.setActive(false);
        storeRepository.save(store);
    }

    public StoreResponse toDto(Store store, long articleCount) {
        return StoreResponse.builder()
                .id(store.getId())
                .slug(store.getSlug())
                .name(store.getName())
                .category(store.getCategory())
                .country(store.getCountry())
                .websiteUrl(store.getWebsiteUrl())
                .logoUrl(store.getLogoUrl())
                .coverImageUrl(store.getCoverImageUrl())
                .parserType(store.getParserType())
                .difficulty(store.getDifficulty())
                .hasAntiRobot(store.getHasAntiRobot())
                .antiRobotLevel(store.getAntiRobotLevel())
                .visibleOnClient(store.getVisibleOnClient())
                .description(store.getDescription())
                .articleCount(articleCount)
                .active(store.getActive())
                .createdAt(store.getCreatedAt())
                .updatedAt(store.getUpdatedAt())
                .build();
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private boolean isPubliclyVisible(StoreResponse store) {
        long publishedArticles = store.getArticleCount() == null ? 0 : store.getArticleCount();
        boolean manuallyVisible = Boolean.TRUE.equals(store.getVisibleOnClient());
        if ("hard".equalsIgnoreCase(store.getAntiRobotLevel())) {
            return publishedArticles > 0;
        }
        return manuallyVisible || publishedArticles > 0;
    }

    private String normalizeAntiRobotLevel(String level, Boolean legacyHasAntiRobot) {
        if (level != null && !level.isBlank()) {
            String normalized = level.trim().toLowerCase();
            if (normalized.equals("none") || normalized.equals("soft") || normalized.equals("hard")) {
                return normalized;
            }
        }
        return Boolean.TRUE.equals(legacyHasAntiRobot) ? "soft" : "none";
    }

    private boolean isAntiRobot(String level, Boolean legacyHasAntiRobot) {
        String normalized = normalizeAntiRobotLevel(level, legacyHasAntiRobot);
        return !"none".equals(normalized);
    }

    private void assertNoDuplicateStore(StoreRequest request, Long currentId) {
        String nameKey = normalizeNameKey(request.getName());
        String websiteKey = normalizeWebsiteKey(request.getWebsiteUrl());
        storeRepository.findAll().stream()
                .filter(store -> currentId == null || !store.getId().equals(currentId))
                .filter(store -> Boolean.TRUE.equals(store.getActive()))
                .filter(store -> {
                    boolean sameName = !nameKey.isBlank() && nameKey.equals(normalizeNameKey(store.getName()));
                    boolean sameWebsite = !websiteKey.isBlank() && websiteKey.equals(normalizeWebsiteKey(store.getWebsiteUrl()));
                    return sameName || sameWebsite;
                })
                .findFirst()
                .ifPresent(store -> {
                    throw new BadRequestException("Boutique deja existante: " + store.getName() + ".");
                });
    }

    private String normalizeNameKey(String value) {
        String normalized = Normalizer.normalize(clean(value) == null ? "" : clean(value), Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase().replaceAll("\\s+", " ").trim();
    }

    private String normalizeWebsiteKey(String rawUrl) {
        String value = clean(rawUrl);
        if (value == null || value.isBlank()) {
            return "";
        }
        String normalized = value.toLowerCase()
                .replaceFirst("^https?://", "")
                .replaceFirst("^www\\.", "");
        int slashIndex = normalized.indexOf('/');
        if (slashIndex >= 0) {
            normalized = normalized.substring(0, slashIndex);
        }
        return normalized.replaceAll("/+$", "").trim();
    }

    private String uniqueSlug(String baseSlug, Long currentId) {
        String fallback = baseSlug == null || baseSlug.isBlank() ? "boutique" : baseSlug;
        String candidate = fallback;
        int index = 2;
        while (true) {
            var existing = storeRepository.findBySlugIgnoreCase(candidate);
            if (existing.isEmpty() || (currentId != null && existing.get().getId().equals(currentId))) {
                return candidate;
            }
            candidate = fallback + "-" + index++;
        }
    }

    private String slugify(String raw) {
        String normalized = Normalizer.normalize(raw == null ? "" : raw, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");
        return normalized.toLowerCase()
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }
}
