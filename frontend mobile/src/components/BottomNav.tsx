import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppRoute, useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const tabs = [
  { route: "Home" as AppRoute, icon: "home-outline", label: "Accueil" },
  { route: "Shops" as AppRoute, icon: "store-outline", label: "Boutiques" },
  { route: "Credit" as AppRoute, icon: "credit-card-outline", label: "Credit" },
  { route: "Installments" as AppRoute, icon: "receipt-text-outline", label: "Paiements" },
  { route: "Profile" as AppRoute, icon: "account-outline", label: "Profil" },
];

const BottomNav = () => {
  const { route, navigate } = useAppNavigation();

  return (
    <View style={styles.wrapper}>
      <View style={styles.bar}>
        {tabs.map((tab) => {
          const isActive = route === tab.route;

          return (
            <Pressable key={tab.route} onPress={() => navigate(tab.route)} style={[styles.tabButton, isActive && styles.tabButtonActive]}>
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <MaterialCommunityIcons
                  name={tab.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={18}
                  color={isActive ? colors.white : colors.mutedForeground}
                />
              </View>
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.navGlass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 30,
    padding: 7,
    shadowColor: colors.shadow,
    shadowOpacity: 0.42,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 12,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderRadius: 24,
    flex: 1,
  },
  tabButtonActive: {
    backgroundColor: colors.primarySoft,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.ring,
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
  },
  label: {
    marginTop: 2,
    fontFamily: "Inter",
    fontSize: 9,
    color: colors.mutedForeground,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primary,
  },
});

export default BottomNav;
