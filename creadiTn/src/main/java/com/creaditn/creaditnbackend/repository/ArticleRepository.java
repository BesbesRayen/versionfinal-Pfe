package com.creaditn.creaditnbackend.repository;

import com.creaditn.creaditnbackend.entity.Article;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends JpaRepository<Article, Long> {

    @Query("SELECT a FROM Article a WHERE a.id = :id AND a.active = true AND (a.deleted IS NULL OR a.deleted = false)")
    Optional<Article> findByIdAndActiveTrue(@Param("id") Long id);

    boolean existsBySourceUrl(String sourceUrl);

    @Query("SELECT COUNT(a) FROM Article a WHERE a.active = true AND (a.deleted IS NULL OR a.deleted = false)")
    long countByActiveTrue();

    @Query("SELECT COUNT(DISTINCT lower(a.boutiqueName)) FROM Article a WHERE a.active = true AND (a.deleted IS NULL OR a.deleted = false)")
    long countActiveStores();

    @Query("SELECT COUNT(a) FROM Article a WHERE a.storeId = :storeId AND a.active = true AND (a.deleted IS NULL OR a.deleted = false)")
    long countByStoreIdAndActiveTrue(@Param("storeId") Long storeId);

    @Query("SELECT COUNT(a) FROM Article a WHERE a.storeId = :storeId AND (a.deleted IS NULL OR a.deleted = false)")
    long countByStoreId(@Param("storeId") Long storeId);

    @Query("SELECT a FROM Article a WHERE a.active = true AND (a.deleted IS NULL OR a.deleted = false) AND (a.available IS NULL OR a.available = true) ORDER BY a.createdAt DESC")
    List<Article> findPopular(Pageable pageable);

    @Query("SELECT a FROM Article a WHERE a.active = true AND (a.deleted IS NULL OR a.deleted = false) ORDER BY a.createdAt DESC")
    List<Article> findByActiveTrueOrderByCreatedAtDesc();

    @Query("""
            SELECT a FROM Article a
            WHERE (:includeInactive = true OR a.active = true)
              AND (a.deleted IS NULL OR a.deleted = false)
              AND (:includeUnavailable = true OR a.available IS NULL OR a.available = true)
              AND (:activeStatus IS NULL OR a.active = :activeStatus)
              AND (:storeId IS NULL OR a.storeId = :storeId)
              AND (:category IS NULL OR lower(a.category) = lower(:category))
              AND (:boutiqueName IS NULL OR lower(a.boutiqueName) = lower(:boutiqueName))
              AND (:searchTerm IS NULL
                   OR lower(a.productName) LIKE lower(concat('%', :searchTerm, '%'))
                   OR lower(a.description) LIKE lower(concat('%', :searchTerm, '%')))
            ORDER BY a.createdAt DESC
            """)
    List<Article> searchArticles(
            @Param("category") String category,
            @Param("boutiqueName") String boutiqueName,
            @Param("searchTerm") String searchTerm,
            @Param("includeInactive") boolean includeInactive,
            @Param("includeUnavailable") boolean includeUnavailable,
            @Param("activeStatus") Boolean activeStatus,
            @Param("storeId") Long storeId
    );

    @Query("""
            SELECT a FROM Article a
            WHERE (:includeInactive = true OR a.active = true)
              AND (a.deleted IS NULL OR a.deleted = false)
              AND (:includeUnavailable = true OR a.available IS NULL OR a.available = true)
              AND (a.storeId = :storeId OR lower(a.boutiqueName) = lower(:storeName))
            ORDER BY a.createdAt DESC
            """)
    List<Article> findStoreArticles(
            @Param("storeId") Long storeId,
            @Param("storeName") String storeName,
            @Param("includeInactive") boolean includeInactive,
            @Param("includeUnavailable") boolean includeUnavailable
    );
}
