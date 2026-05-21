import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ShopCatalogProduct, API_BASE_URL } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

interface ProductGridCardProps {
  product: ShopCatalogProduct;
  width: number;
  onBuy: () => void;
  featured?: boolean;
}

const resolveImageUrl = (url: string) => {
  if (!url) return "https://images.unsplash.com/photo-1556740749-887f6717d7e4?w=400";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url}`;
};

const ProductGridCard = ({ product, width, onBuy, featured = false }: ProductGridCardProps) => {
  const monthly = Math.max(1, product.priceTnd / 4);
  return (
    <Pressable style={[styles.card, featured && styles.featuredCard, { width }]} onPress={onBuy}>
      <View style={[styles.imageWrap, featured && styles.featuredImageWrap]}>
        <Image source={{ uri: resolveImageUrl(product.imageUrl) }} style={[styles.image, featured && styles.featuredImage]} />
        <View style={styles.favorite}>
          <MaterialCommunityIcons name="heart-outline" size={16} color={colors.gray900} />
        </View>
        {featured && (
          <View style={styles.financeBadge}>
            <MaterialCommunityIcons name="star-four-points-outline" size={13} color={colors.white} />
            <Text style={styles.financeBadgeText}>Financement instantane</Text>
          </View>
        )}
      </View>
      <View style={[styles.body, featured && styles.featuredBody]}>
        <Text numberOfLines={featured ? 3 : 2} style={[styles.name, featured && styles.featuredName]}>{product.name}</Text>
        <Text style={[styles.price, featured && styles.featuredPrice]}>{`${product.priceTnd.toFixed(2)} TND`}</Text>
        <Text style={[styles.monthly, featured && styles.featuredMonthly]}>ou 4 x {monthly.toFixed(2)} TND</Text>
        <Pressable style={styles.buyButton} onPress={onBuy}>
          <MaterialCommunityIcons name="credit-card-fast-outline" size={15} color={colors.white} />
          <Text style={styles.buyButtonText}>Acheter</Text>
        </Pressable>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: radii.xl, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.card, overflow: "hidden" },
  featuredCard: { borderRadius: radii.xxl, shadowColor: colors.shadow, shadowOpacity: 0.32, shadowRadius: 26, shadowOffset: { width: 0, height: 16 }, elevation: 8 },
  imageWrap: { position: "relative", backgroundColor: colors.surface },
  featuredImageWrap: { minHeight: 280 },
  image: { width: "100%", height: 142 },
  featuredImage: { height: 280 },
  favorite: { position: "absolute", top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
  financeBadge: { position: "absolute", left: 14, bottom: 14, flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.primary, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 7 },
  financeBadgeText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  body: { padding: 11, gap: 6 },
  featuredBody: { padding: 16, gap: 8 },
  name: { fontSize: 13, fontWeight: "900", color: colors.gray900, minHeight: 36, lineHeight: 18 },
  featuredName: { fontSize: 21, lineHeight: 27, minHeight: 0 },
  price: { fontSize: 15, fontWeight: "900", color: colors.gray900 },
  featuredPrice: { fontSize: 28, fontVariant: ["tabular-nums"] },
  monthly: { fontSize: 11, fontWeight: "800", color: colors.accent },
  featuredMonthly: { fontSize: 13 },
  buyButton: { marginTop: 4, backgroundColor: colors.primary, borderRadius: radii.md, alignItems: "center", justifyContent: "center", paddingVertical: 10, flexDirection: "row", gap: 7 },
  buyButtonText: { color: colors.white, fontWeight: "900", fontSize: 12 },
});

export default ProductGridCard;
