package com.creaditn.creaditnbackend.service;

import com.creaditn.creaditnbackend.dto.ArticleRequest;
import com.creaditn.creaditnbackend.dto.ArticleResponse;
import com.creaditn.creaditnbackend.entity.Article;
import com.creaditn.creaditnbackend.entity.Store;
import com.creaditn.creaditnbackend.exception.ResourceNotFoundException;
import com.creaditn.creaditnbackend.repository.ArticleRepository;
import com.creaditn.creaditnbackend.repository.PurchaseOrderRepository;
import com.creaditn.creaditnbackend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ArticleService {

    private final ArticleRepository articleRepository;
    private final StoreRepository storeRepository;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SocketEventService socketEventService;

    public List<ArticleResponse> getPopularArticles(int limit) {
        return articleRepository.findPopular(PageRequest.of(0, Math.min(limit, 50)))
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ArticleResponse> getPublicArticles(String category, String boutiqueName, String searchTerm) {
        return articleRepository.searchArticles(
                        normalize(category),
                        normalize(boutiqueName),
                        normalize(searchTerm),
                        false,
                        false,
                        null,
                        null
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ArticleResponse> getAdminArticles(String category, String boutiqueName, String searchTerm) {
        return getAdminArticles(category, boutiqueName, searchTerm, null, null);
    }

    public List<ArticleResponse> getAdminArticles(String category, String boutiqueName, String searchTerm, Boolean activeStatus, Long storeId) {
        return articleRepository.searchArticles(
                        normalize(category),
                        normalize(boutiqueName),
                        normalize(searchTerm),
                        true,
                        true,
                        activeStatus,
                        storeId
                )
                .stream()
                .map(this::toDto)
                .toList();
    }

    public ArticleResponse getPublicArticle(Long id) {
        Article article = articleRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
        return toDto(article);
    }

    public List<ArticleResponse> getPublicStoreArticles(String storeIdOrName) {
        Store store = getStoreEntity(storeIdOrName);
        if (!Boolean.TRUE.equals(store.getActive())) {
            throw new ResourceNotFoundException("Store not found");
        }
        return articleRepository.findStoreArticles(store.getId(), store.getName(), false, false)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public List<ArticleResponse> getAdminStoreArticles(String storeIdOrName) {
        Store store = getStoreEntity(storeIdOrName);
        return articleRepository.findStoreArticles(store.getId(), store.getName(), true, true)
                .stream()
                .map(this::toDto)
                .toList();
    }

    public Article getActiveArticleEntity(Long id) {
        return articleRepository.findByIdAndActiveTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    public Article getArticleEntity(Long id) {
        return articleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Article not found"));
    }

    @Transactional
    public ArticleResponse createArticle(ArticleRequest request) {
        if (request.getSourceUrl() != null && !request.getSourceUrl().isBlank()) {
            if (articleRepository.existsBySourceUrl(request.getSourceUrl().trim())) {
                throw new IllegalStateException("Ce produit est deja importe.");
            }
        }
        Store store = request.getStoreId() == null
                ? null
                : storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));

        Article article = Article.builder()
                .productName(clean(request.getProductName()))
                .description(clean(request.getDescription()))
                .price(request.getPrice())
                .promoPrice(request.getPromoPrice())
                .imageUrl(clean(request.getImageUrl()))
                .boutiqueName(store == null ? clean(request.getBoutiqueName()) : store.getName())
                .storeId(store == null ? null : store.getId())
                .category(clean(request.getCategory()) == null ? (store == null ? null : store.getCategory()) : clean(request.getCategory()))
                .brand(clean(request.getBrand()))
                .stockQuantity(request.getStockQuantity())
                .warranty(clean(request.getWarranty()))
                .availability(clean(request.getAvailability()))
                .sourceUrl(request.getSourceUrl() != null && !request.getSourceUrl().isBlank() ? request.getSourceUrl().trim() : null)
                .active(request.getActive() == null ? true : request.getActive())
                .deleted(false)
                .available(request.getAvailable() == null ? true : request.getAvailable())
                .eligibleThreeMonths(request.getEligibleThreeMonths() == null ? true : request.getEligibleThreeMonths())
                .eligibleSixMonths(request.getEligibleSixMonths() == null ? true : request.getEligibleSixMonths())
                .eligibleTwelveMonths(request.getEligibleTwelveMonths() == null ? true : request.getEligibleTwelveMonths())
                .build();

        articleRepository.save(article);
        ArticleResponse dto = toDto(article);
        socketEventService.emitNewArticle(dto);
        return dto;
    }

    @Transactional
    public ArticleResponse updateArticle(Long id, ArticleRequest request) {
        Article article = getArticleEntity(id);

        article.setProductName(clean(request.getProductName()));
        article.setDescription(clean(request.getDescription()));
        article.setPrice(request.getPrice());
        article.setPromoPrice(request.getPromoPrice());
        article.setImageUrl(clean(request.getImageUrl()));
        Store store = request.getStoreId() == null
                ? null
                : storeRepository.findById(request.getStoreId())
                .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        article.setStoreId(store == null ? request.getStoreId() : store.getId());
        article.setBoutiqueName(store == null ? clean(request.getBoutiqueName()) : store.getName());
        article.setCategory(clean(request.getCategory()) == null ? (store == null ? null : store.getCategory()) : clean(request.getCategory()));
        article.setBrand(clean(request.getBrand()));
        article.setStockQuantity(request.getStockQuantity());
        article.setWarranty(clean(request.getWarranty()));
        article.setAvailability(clean(request.getAvailability()));
        if (request.getActive() != null) {
            article.setActive(request.getActive());
        }
        if (request.getAvailable() != null) {
            article.setAvailable(request.getAvailable());
        }
        if (request.getEligibleThreeMonths() != null) {
            article.setEligibleThreeMonths(request.getEligibleThreeMonths());
        }
        if (request.getEligibleSixMonths() != null) {
            article.setEligibleSixMonths(request.getEligibleSixMonths());
        }
        if (request.getEligibleTwelveMonths() != null) {
            article.setEligibleTwelveMonths(request.getEligibleTwelveMonths());
        }
        if (request.getSourceUrl() != null && !request.getSourceUrl().isBlank()) {
            article.setSourceUrl(request.getSourceUrl().trim());
        }

        articleRepository.save(article);
        ArticleResponse dto = toDto(article);
        socketEventService.emitUpdateArticle(dto);
        return dto;
    }

    @Transactional
    public void deleteArticle(Long id) {
        Article article = getArticleEntity(id);
        if (purchaseOrderRepository.existsByArticleId(id)) {
            article.setActive(false);
            article.setAvailable(false);
            article.setDeleted(true);
            articleRepository.save(article);
        } else {
            articleRepository.delete(article);
        }
        socketEventService.emitDeleteArticle(id);
    }

    @Transactional
    public ArticleResponse updateArticleStatus(Long id, boolean active) {
        Article article = getArticleEntity(id);
        article.setActive(active);
        articleRepository.save(article);
        ArticleResponse dto = toDto(article);
        socketEventService.emitUpdateArticle(dto);
        return dto;
    }

    public long getActiveArticlesCount() {
        return articleRepository.countByActiveTrue();
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String clean(String value) {
        return value == null ? null : value.trim();
    }

    private Store getStoreEntity(String storeIdOrSlug) {
        try {
            return storeRepository.findById(Long.parseLong(storeIdOrSlug))
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        } catch (NumberFormatException ignored) {
            return storeRepository.findBySlugIgnoreCase(storeIdOrSlug)
                    .orElseThrow(() -> new ResourceNotFoundException("Store not found"));
        }
    }

    private ArticleResponse toDto(Article article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .productName(article.getProductName())
                .description(article.getDescription())
                .price(article.getPrice())
                .promoPrice(article.getPromoPrice())
                .imageUrl(article.getImageUrl())
                .boutiqueName(article.getBoutiqueName())
                .storeId(article.getStoreId())
                .category(article.getCategory())
                .brand(article.getBrand())
                .stockQuantity(article.getStockQuantity())
                .warranty(article.getWarranty())
                .availability(article.getAvailability())
                .active(article.getActive())
                .deleted(article.getDeleted())
                .available(article.getAvailable())
                .eligibleThreeMonths(article.getEligibleThreeMonths())
                .eligibleSixMonths(article.getEligibleSixMonths())
                .eligibleTwelveMonths(article.getEligibleTwelveMonths())
                .sourceUrl(article.getSourceUrl())
                .createdAt(article.getCreatedAt())
                .updatedAt(article.getUpdatedAt())
                .build();
    }
}
