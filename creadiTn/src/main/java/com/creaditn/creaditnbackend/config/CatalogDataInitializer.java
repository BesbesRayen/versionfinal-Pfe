package com.creaditn.creaditnbackend.config;

import com.creaditn.creaditnbackend.entity.Article;
import com.creaditn.creaditnbackend.entity.Store;
import com.creaditn.creaditnbackend.repository.ArticleRepository;
import com.creaditn.creaditnbackend.repository.StoreRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.text.Normalizer;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration
@RequiredArgsConstructor
public class CatalogDataInitializer {

    private final StoreRepository storeRepository;
    private final ArticleRepository articleRepository;

    @Bean
    CommandLineRunner initializeCatalogData() {
        return args -> {
            if (storeRepository.count() == 0) {
                storeRepository.saveAll(defaultStores());
            }

            List<Store> storesToNormalize = storeRepository.findAll().stream()
                    .filter(store -> store.getAntiRobotLevel() == null || store.getAntiRobotLevel().isBlank() || store.getVisibleOnClient() == null || isKnownHardAntiRobot(store.getName()))
                    .peek(store -> {
                        if (isKnownHardAntiRobot(store.getName())) {
                            store.setAntiRobotLevel("hard");
                        } else if (store.getAntiRobotLevel() == null || store.getAntiRobotLevel().isBlank()) {
                            store.setAntiRobotLevel(Boolean.TRUE.equals(store.getHasAntiRobot()) ? "soft" : "none");
                        }
                        store.setHasAntiRobot(!"none".equalsIgnoreCase(store.getAntiRobotLevel()));
                        if (store.getVisibleOnClient() == null) {
                            store.setVisibleOnClient(false);
                        }
                    })
                    .toList();

            if (!storesToNormalize.isEmpty()) {
                storeRepository.saveAll(storesToNormalize);
            }

            List<Article> deletedArticlesToNormalize = articleRepository.findAll().stream()
                    .filter(article -> article.getDeleted() == null
                            || (Boolean.FALSE.equals(article.getActive()) && Boolean.FALSE.equals(article.getAvailable())))
                    .peek(article -> {
                        if (article.getDeleted() == null) {
                            article.setDeleted(false);
                        }
                        if (Boolean.FALSE.equals(article.getActive()) && Boolean.FALSE.equals(article.getAvailable())) {
                            article.setDeleted(true);
                        }
                    })
                    .toList();

            if (!deletedArticlesToNormalize.isEmpty()) {
                articleRepository.saveAll(deletedArticlesToNormalize);
            }

            Map<String, Store> storesByName = storeRepository.findAll().stream()
                    .collect(Collectors.toMap(store -> normalize(store.getName()), Function.identity(), (first, ignored) -> first));

            List<Article> relinkedArticles = articleRepository.findAll().stream()
                    .filter(article -> article.getStoreId() == null && article.getBoutiqueName() != null)
                    .map(article -> relinkArticle(article, storesByName))
                    .filter(article -> article.getStoreId() != null)
                    .toList();

            if (!relinkedArticles.isEmpty()) {
                articleRepository.saveAll(relinkedArticles);
            }
        };
    }

    private Article relinkArticle(Article article, Map<String, Store> storesByName) {
        Store store = storesByName.get(normalize(article.getBoutiqueName()));
        if (store != null) {
            article.setStoreId(store.getId());
            article.setBoutiqueName(store.getName());
        }
        return article;
    }

    private List<Store> defaultStores() {
        return List.of(
                store("MyTek", "mytek", "https://www.google.com/s2/favicons?domain=mytek.tn&sz=128", "https://www.mytek.tn", "Electronics", "Tunisie", "MagentoParser", "medium", "none", "Leader high-tech tunisien pour laptops, smartphones, composants et gaming."),
                store("Tunisianet", "tunisianet", "https://www.google.com/s2/favicons?domain=tunisianet.com.tn&sz=128", "https://www.tunisianet.com.tn", "Electronics", "Tunisie", "PrestashopParser", "medium", "none", "Marketplace informatique, telephonie et accessoires high-tech."),
                store("Scoop Informatique", "scoop-informatique", "https://www.google.com/s2/favicons?domain=scoop.com.tn&sz=128", "https://www.scoop.com.tn", "Electronics", "Tunisie", "PrestashopParser", "medium", "none", "Informatique, bureautique et accessoires en ligne."),
                store("Zoom Informatique", "zoom-informatique", "https://www.google.com/s2/favicons?domain=zoom.com.tn&sz=128", "https://www.zoom.com.tn", "Electronics", "Tunisie", "PrestashopParser", "medium", "none", "Catalogue informatique tunisien compatible import produit."),
                store("Mega PC", "mega-pc", "https://www.google.com/s2/favicons?domain=megapc.tn&sz=128", "https://megapc.tn", "Gaming", "Tunisie", "WooCommerceParser", "medium", "none", "Specialiste PC gaming, composants et setups performants."),
                store("Spacenet", "spacenet", "https://www.google.com/s2/favicons?domain=spacenet.tn&sz=128", "https://www.spacenet.tn", "Electronics", "Tunisie", "PrestashopParser", "medium", "none", "Vente en ligne high-tech, composants et materiel informatique."),
                store("Dabchy", "dabchy", "https://www.google.com/s2/favicons?domain=dabchy.com&sz=128", "https://www.dabchy.com", "Fashion", "Tunisie", "ReactHydrationParser", "hard", "hard", "Mode seconde main avec rendu dynamique et protections anti-bot."),
                store("Founa", "founa", "https://www.google.com/s2/favicons?domain=founa.com&sz=128", "https://www.founa.com", "Food", "Tunisie", "DynamicSiteParser", "hard", "soft", "Courses en ligne avec rendu dynamique."),
                store("Exist", "exist", "https://www.google.com/s2/favicons?domain=exist.com.tn&sz=128", "https://www.exist.com.tn", "Fashion", "Tunisie", "PrestashopParser", "medium", "none", "Mode et lifestyle compatible import Prestashop."),
                store("Zen", "zen", "https://www.google.com/s2/favicons?domain=zen.com.tn&sz=128", "https://www.zen.com.tn", "Fashion", "Tunisie", "PrestashopParser", "medium", "none", "Boutique mode tunisienne avec catalogue web."),
                store("Parashop", "parashop", "https://www.google.com/s2/favicons?domain=parashop.tn&sz=128", "https://www.parashop.tn", "Beauty", "Tunisie", "PrestashopParser", "medium", "none", "Parapharmacie et beaute en ligne."),
                store("Fatales", "fatales", "https://www.google.com/s2/favicons?domain=fatales.tn&sz=128", "https://www.fatales.tn", "Beauty", "Tunisie", "MagentoParser", "medium", "none", "Parfums, cosmetiques et produits beaute premium."),
                store("Jumia Tunisie", "jumia-tunisie", "https://www.google.com/s2/favicons?domain=jumia.com.tn&sz=128", "https://www.jumia.com.tn", "Marketplace", "Tunisie", "DynamicSiteParser", "very-hard", "hard", "Marketplace avec protections anti-bot et rendu dynamique."),
                store("Decathlon Tunisie", "decathlon-tunisie", "https://www.google.com/s2/favicons?domain=decathlon.tn&sz=128", "https://www.decathlon.tn", "Sport", "Tunisie", "ReactHydrationParser", "hard", "hard", "Sport et equipements avec extraction hydration.")
        );
    }

    private Store store(
            String name,
            String slug,
            String logoUrl,
            String websiteUrl,
            String category,
            String country,
            String parserType,
            String difficulty,
            String antiRobotLevel,
            String description
    ) {
        return Store.builder()
                .name(name)
                .slug(slug)
                .logoUrl(logoUrl)
                .coverImageUrl(null)
                .websiteUrl(websiteUrl)
                .category(category)
                .country(country)
                .parserType(parserType)
                .difficulty(difficulty)
                .hasAntiRobot(!"none".equals(antiRobotLevel))
                .antiRobotLevel(antiRobotLevel)
                .visibleOnClient(false)
                .description(description)
                .active(true)
                .build();
    }

    private String normalize(String value) {
        return Normalizer.normalize(value, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "")
                .replaceAll("[^A-Za-z0-9]", "")
                .toLowerCase(Locale.ROOT);
    }

    private boolean isKnownHardAntiRobot(String name) {
        String normalized = normalize(name);
        return normalized.equals("jumiatunisie")
                || normalized.equals("jumia")
                || normalized.equals("decathlontunisie")
                || normalized.equals("decathlon")
                || normalized.equals("dabchy")
                || normalized.equals("zaratunisie")
                || normalized.equals("zara");
    }
}
