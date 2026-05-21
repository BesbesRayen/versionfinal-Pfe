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
            <Pressable key={tab.route} onPress={() => navigate(tab.route)} style={styles.tabButton}>
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <MaterialCommunityIcons
                  name={tab.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={18}
                  color={isActive ? colors.primaryForeground : colors.mutedForeground}
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
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: colors.navGlass,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 28,
    paddingVertical: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.34,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  tabButton: {
    alignItems: "center",
    paddingVertical: 2,
    flex: 1,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.ring,
    shadowOpacity: 0.34,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
  },
  label: {
    marginTop: 3,
    fontFamily: "Inter",
    fontSize: 10,
    color: colors.mutedForeground,
    fontWeight: "700",
  },
  labelActive: {
    color: colors.primary,
  },
});

export default BottomNav;
