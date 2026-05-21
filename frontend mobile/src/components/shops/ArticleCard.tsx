import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ShopCatalogArticle } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

interface ArticleCardProps {
  article: ShopCatalogArticle;
  width: number;
  onOpen: () => void;
  onVisitStore: () => void;
  featured?: boolean;
}

const ArticleCard = ({ article, width, onOpen, onVisitStore, featured = false }: ArticleCardProps) => {
  return (
    <Pressable style={[styles.card, featured && styles.featuredCard, { width }]} onPress={onOpen}>
      <View style={styles.imageWrap}>
        <Image source={{ uri: article.imageUrl }} style={[styles.image, featured && styles.featuredImage]} />
        <View style={styles.badge}>
          <Text style={styles.badgeText}>BNPL</Text>
        </View>
      </View>
      <View style={[styles.body, featured && styles.featuredBody]}>
        <Text numberOfLines={featured ? 3 : 2} style={[styles.name, featured && styles.featuredName]}>{article.name}</Text>
        <Text style={styles.subtitle}>{featured ? "Selection premium avec paiement flexible" : "Voir les produits"}</Text>
        <View style={styles.actionsRow}>
          <Pressable style={styles.visitButton} onPress={onVisitStore}>
            <MaterialCommunityIcons name="open-in-new" size={13} color={colors.gray700} />
          </Pressable>
          <Pressable style={styles.buyButton} onPress={onOpen}>
            <Text style={styles.buyButtonText}>Explorer</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, overflow: "hidden" },
  featuredCard: { borderRadius: radii.xxl, shadowColor: colors.shadow, shadowOpacity: 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 14 }, elevation: 8 },
  imageWrap: { position: "relative", backgroundColor: colors.surface },
  image: { width: "100%", height: 142 },
  featuredImage: { height: 260 },
  badge: { position: "absolute", top: 10, left: 10, backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { color: colors.white, fontWeight: "900", fontSize: 10 },
  body: { padding: 11, gap: 7 },
  featuredBody: { padding: 16, gap: 10 },
  name: { fontSize: 13, fontWeight: "900", color: colors.gray900, minHeight: 36, lineHeight: 18 },
  featuredName: { fontSize: 22, lineHeight: 28, minHeight: 0 },
  subtitle: { fontSize: 12, fontWeight: "800", color: colors.gray500 },
  actionsRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  visitButton: { width: 38, height: 36, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.md, alignItems: "center", justifyContent: "center", backgroundColor: colors.surface },
  buyButton: { flex: 1, backgroundColor: colors.accent, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingVertical: 10 },
  buyButtonText: { color: colors.white, fontWeight: "900", fontSize: 12 },
});

export default ArticleCard;
