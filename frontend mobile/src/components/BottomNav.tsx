import { Pressable, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { AppRoute, useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const tabs = [
  { route: "Home" as AppRoute, icon: "view-dashboard-outline", label: "Home" },
  { route: "Shops" as AppRoute, icon: "shopping-outline", label: "Shop" },
  { route: "Credit" as AppRoute, icon: "star-four-points-outline", label: "Credit" },
  { route: "Installments" as AppRoute, icon: "chart-timeline-variant", label: "Pay" },
  { route: "Profile" as AppRoute, icon: "account-circle-outline", label: "Me" },
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
              {isActive && <View style={styles.activeGlow} />}
              <View style={[styles.iconBox, isActive && styles.iconBoxActive]}>
                <MaterialCommunityIcons
                  name={tab.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={20}
                  color={isActive ? colors.white : "#7D88A8"}
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
    bottom: 8,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingBottom: 10,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.navGlass,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
    borderRadius: 34,
    paddingHorizontal: 8,
    paddingVertical: 9,
    shadowColor: colors.shadow,
    shadowOpacity: 0.6,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 18,
  },
  tabButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 3,
    borderRadius: 28,
    flex: 1,
    position: "relative",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBoxActive: {
    backgroundColor: "#8B5CF6",
    shadowColor: colors.ring,
    shadowOpacity: 0.58,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  activeGlow: {
    position: "absolute",
    top: 4,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(139, 92, 246, 0.20)",
  },
  label: {
    marginTop: 3,
    fontFamily: "Inter",
    fontSize: 10,
    color: "#7D88A8",
    fontWeight: "800",
  },
  labelActive: {
    color: "#E8DDFF",
  },
});

export default BottomNav;
