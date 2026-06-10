import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import FinancialProfileForm from "@/components/FinancialProfileForm";
import { useAppNavigation } from "@/lib/app-navigation";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const FinancialProfilePage = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Session requise</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Profile")} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray800} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Profil financier</Text>
            <Text style={styles.subtitle}>Ces informations servent au score et au calendrier des echeances.</Text>
          </View>
        </View>

        <FinancialProfileForm />
        <View style={{ height: 90 }} />
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 180, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: radii.lg, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: colors.gray900 },
  subtitle: { marginTop: 3, fontSize: 12, color: colors.gray500, lineHeight: 18 },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14 },
  primaryButtonText: { color: colors.white, fontWeight: "900", fontSize: 14 },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },
});

export default FinancialProfilePage;
