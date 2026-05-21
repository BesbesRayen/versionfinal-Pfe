import { useEffect, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import ArticleCard from "@/components/shops/ArticleCard";
import { useAppNavigation } from "@/lib/app-navigation";
import { getShopCatalogArticles, getShopCatalogShop, getShopCatalogShops, ShopCatalogArticle } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const ShopProducts = () => {
  const { navigate, params } = useAppNavigation();
  const { width: screenWidth } = useWindowDimensions();
  const rawMerchantId = Number(params?.merchantId ?? 0);
  const rawMerchantName = String(params?.merchantName ?? "Boutique");
  const highlightedProductName = String(params?.highlightedProductName ?? "");
  const fromQR = Boolean(params?.fromQR);
  const [resolvedMerchantId, setResolvedMerchantId] = useState(rawMerchantId);
  const [resolvedMerchantName, setResolvedMerchantName] = useState(rawMerchantName);
  const [storeUrl, setStoreUrl] = useState("");
  const [articles, setArticles] = useState<ShopCatalogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadArticles = async () => {
      setLoading(true);
      setErrorMessage("");
      try {
        let shopId = rawMerchantId;
        if (fromQR && rawMerchantId === 0 && rawMerchantName) {
          const allShops = await getShopCatalogShops();
          const match = allShops.find((s) => s.name.toLowerCase() === rawMerchantName.toLowerCase());
          if (match) {
            shopId = match.id;
            setResolvedMerchantId(match.id);
            setResolvedMerchantName(match.name);
          }
        }
        const [shop, result] = await Promise.all([getShopCatalogShop(shopId), getShopCatalogArticles(shopId)]);
        setStoreUrl(shop?.storeUrl ?? "");
        if (shop?.name) setResolvedMerchantName(shop.name);
        setArticles(
          highlightedProductName
            ? [...result].sort((a, b) => {
                const aMatch = a.name.toLowerCase().includes(highlightedProductName.toLowerCase()) ? 0 : 1;
                const bMatch = b.name.toLowerCase().includes(highlightedProductName.toLowerCase()) ? 0 : 1;
                return aMatch - bMatch;
              })
            : result,
        );
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les articles.");
      } finally {
        setLoading(false);
      }
    };
    loadArticles();
  }, [fromQR, highlightedProductName, rawMerchantId, rawMerchantName]);

  const columnCount = screenWidth >= 860 ? 3 : 2;
  const hasSingleArticle = articles.length === 1;
  const itemWidth = useMemo(() => {
    if (hasSingleArticle) {
      return screenWidth - 40;
    }
    const totalGap = (columnCount - 1) * 10;
    return (screenWidth - 40 - totalGap) / columnCount;
  }, [columnCount, hasSingleArticle, screenWidth]);

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Shops")} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray800} />
          </Pressable>
          <Pressable
            style={styles.visitStore}
            onPress={() => {
              if (storeUrl) Linking.openURL(storeUrl);
            }}
          >
            <Text style={styles.visitStoreText}>Site</Text>
            <MaterialCommunityIcons name="open-in-new" size={14} color={colors.gray900} />
          </Pressable>
        </View>

        <View style={styles.hero}>
          <Text style={styles.eyebrow}>Boutique</Text>
          <Text style={styles.title}>{resolvedMerchantName}</Text>
          <Text style={styles.subtitle}>
            {highlightedProductName
              ? `QR detecte : ${highlightedProductName}. Choisissez l'article correspondant.`
              : `${articles.length} collections disponibles avec paiement flexible.`}
          </Text>
        </View>

        {loading && <Text style={styles.infoText}>Chargement des articles...</Text>}
        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        <View style={styles.grid}>
          {articles.map((article) => (
            <ArticleCard
              key={article.id}
              article={article}
              width={itemWidth}
              featured={hasSingleArticle}
              onOpen={() =>
                navigate("ProductDetail", {
                  merchantId: resolvedMerchantId,
                  merchantName: resolvedMerchantName,
                  articleId: article.id,
                  articleName: article.name,
                })
              }
              onVisitStore={() => {
                const url = article.sourceUrl || storeUrl;
                if (url) Linking.openURL(url);
              }}
            />
          ))}
        </View>

        {!loading && articles.length === 0 && <Text style={styles.empty}>Aucun article disponible pour cette boutique.</Text>}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 110, gap: 14 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  iconButton: { width: 44, height: 44, borderRadius: radii.lg, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  visitStore: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primarySoft, borderColor: colors.primaryBorder, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 13, paddingVertical: 9 },
  visitStoreText: { fontSize: 12, fontWeight: "900", color: colors.gray900 },
  hero: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 18 },
  eyebrow: { fontSize: 11, color: colors.primary, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  title: { marginTop: 4, fontSize: 26, fontWeight: "900", color: colors.gray900 },
  subtitle: { marginTop: 6, fontSize: 13, color: colors.gray500, lineHeight: 19 },
  infoText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  empty: { fontSize: 12, color: colors.gray500, marginTop: 12, textAlign: "center" },
});

export default ShopProducts;
