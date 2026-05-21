import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { ShopCatalogShop } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

interface ShopListItemProps {
  shop: ShopCatalogShop;
  onPress: () => void;
}

const ShopListItem = ({ shop, onPress }: ShopListItemProps) => {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.logoShell}>
        <Image source={{ uri: shop.logoUrl }} style={styles.image} />
      </View>
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{shop.name}</Text>
          <MaterialCommunityIcons name="chevron-right" size={18} color={colors.gray500} />
        </View>
        <Text style={styles.subtitle}>Paiement fractionne disponible</Text>
        <View style={styles.metaRow}>
          <View style={styles.pill}>
            <MaterialCommunityIcons name="shield-check-outline" size={12} color={colors.success} />
            <Text style={styles.pillText}>Partenaire</Text>
          </View>
          <View style={styles.pillSoft}>
            <Text style={styles.pillSoftText}>0% rapide</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    gap: 12,
  },
  logoShell: {
    width: 76,
    height: 76,
    borderRadius: radii.lg,
    overflow: "hidden",
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  image: { width: "100%", height: "100%" },
  body: { flex: 1, gap: 7 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: "900", color: colors.gray900 },
  subtitle: { fontSize: 12, fontWeight: "700", color: colors.gray500 },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  pill: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.successSoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { color: colors.success, fontWeight: "900", fontSize: 10 },
  pillSoft: { backgroundColor: colors.primarySoft, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 4 },
  pillSoftText: { color: colors.gray800, fontWeight: "900", fontSize: 10 },
});

export default ShopListItem;
