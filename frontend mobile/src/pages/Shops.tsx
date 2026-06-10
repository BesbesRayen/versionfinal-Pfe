import { useEffect, useMemo, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import ShopListItem from "@/components/shops/ShopListItem";
import { getShopCatalogShops, invalidateShopCatalogCache, ShopCatalogShop } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const Shops = () => {
  const { navigate } = useAppNavigation();
  const [search, setSearch] = useState("");
  const [shops, setShops] = useState<ShopCatalogShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadStores = async (forceRefresh = false) => {
    if (forceRefresh) invalidateShopCatalogCache();
    setErrorMessage("");
    try {
      setShops(await getShopCatalogShops());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les boutiques.");
    }
  };

  useEffect(() => {
    setLoading(true);
    loadStores().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStores(true);
    setRefreshing(false);
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return shops.filter((shop) => shop.name.toLowerCase().includes(term));
  }, [search, shops]);

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.hero}>
          <View style={styles.heroText}>
            <Text style={styles.eyebrow}>Marketplace</Text>
            <Text style={styles.title}>Boutiques partenaires</Text>
            <Text style={styles.subtitle}>Achetez maintenant, payez en plusieurs fois avec votre pouvoir d'achat.</Text>
          </View>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="shopping-outline" size={28} color={colors.white} />
          </View>
        </View>

        <View style={styles.searchBox}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.gray500} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
            placeholder="Rechercher Nike, Samsung..."
            placeholderTextColor={colors.gray500}
          />
          {!!search && (
            <Pressable onPress={() => setSearch("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.gray500} />
            </Pressable>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{shops.length}</Text>
            <Text style={styles.statLabel}>boutiques</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>0%</Text>
            <Text style={styles.statLabel}>simulation</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>3-12x</Text>
            <Text style={styles.statLabel}>paiement</Text>
          </View>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {loading && <Text style={styles.infoText}>Chargement des boutiques...</Text>}

        <View style={styles.list}>
          {filtered.map((store) => (
            <ShopListItem
              key={`shop-${store.slug ?? store.id}-${store.name}`}
              shop={store}
              onPress={() => navigate("ShopProducts", { merchantId: store.id, merchantName: store.name })}
            />
          ))}
          {!loading && filtered.length === 0 && <Text style={styles.emptyText}>Aucune boutique trouvee.</Text>}
        </View>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110, gap: 14 },
  hero: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.primaryBorder, borderRadius: radii.xxl, padding: 18, flexDirection: "row", alignItems: "center", gap: 14 },
  heroText: { flex: 1 },
  eyebrow: { fontSize: 11, color: colors.primary, fontWeight: "900", textTransform: "uppercase", letterSpacing: 1 },
  title: { marginTop: 4, fontSize: 25, fontWeight: "900", color: colors.gray900 },
  subtitle: { marginTop: 6, fontSize: 13, color: colors.gray500, lineHeight: 19 },
  heroIcon: { width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  searchBox: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, paddingHorizontal: 14, minHeight: 52 },
  searchInput: { flex: 1, color: colors.gray900, fontSize: 14, fontWeight: "700" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 },
  statValue: { color: colors.gray900, fontWeight: "900", fontSize: 17 },
  statLabel: { marginTop: 2, color: colors.gray500, fontWeight: "800", fontSize: 10 },
  list: { gap: 10 },
  infoText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
  emptyText: { paddingVertical: 14, fontSize: 12, color: colors.gray500, textAlign: "center" },
});

export default Shops;
