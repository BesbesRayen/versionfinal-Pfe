import { useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { FadeInView } from "@/components/FintechUI";
import { getProfile, UserProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

type KycUiStatus = "PENDING" | "VERIFIED" | "REJECTED";

const normalizeKycStatus = (value?: string | null): KycUiStatus => {
  const status = (value ?? "").toUpperCase();
  if (status === "VERIFIED") return "VERIFIED";
  if (status === "REJECTED") return "REJECTED";
  return "PENDING";
};

const PersonalInformation = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) {
        navigate("Login");
        return;
      }
      setLoading(true);
      setErrorMessage("");
      try {
        setProfile(await getProfile(user.userId));
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les informations.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const rows = useMemo(() => {
    const firstName = profile?.firstName ?? user?.firstName ?? "";
    const lastName = profile?.lastName ?? user?.lastName ?? "";
    return [
      { icon: "account-outline", label: "Nom complet", value: `${firstName} ${lastName}`.trim() || "Non renseigne" },
      { icon: "email-outline", label: "Email", value: profile?.email ?? user?.email ?? "Non renseigne" },
      { icon: "phone-outline", label: "Telephone", value: profile?.phone || "Non renseigne" },
      { icon: "map-marker-outline", label: "Adresse", value: profile?.address || "Non renseignee" },
      { icon: "briefcase-outline", label: "Profession", value: profile?.profession || "Non renseignee" },
    ];
  }, [profile, user]);

  const kycStatus = normalizeKycStatus(profile?.kycStatus);
  const statusColor = kycStatus === "VERIFIED" ? colors.success : kycStatus === "REJECTED" ? colors.error : colors.warning;
  const statusBg = kycStatus === "VERIFIED" ? colors.successSoft : kycStatus === "REJECTED" ? colors.errorLight : colors.warningSoft;

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Profile")} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray800} />
          </Pressable>
          <Pressable style={styles.editPill} onPress={() => navigate("EditProfileField")}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={colors.gray900} />
            <Text style={styles.editPillText}>Modifier</Text>
          </Pressable>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {loading && <Text style={styles.loadingText}>Chargement...</Text>}

        <FadeInView>
        <View style={styles.heroCard}>
          <View style={styles.avatarHero}>
            <Text style={styles.avatarHeroText}>
              {`${(profile?.firstName ?? user?.firstName ?? "U").charAt(0)}${(profile?.lastName ?? user?.lastName ?? "S").charAt(0)}`.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroTitle}>{rows[0]?.value}</Text>
          <Text style={styles.heroSubtitle}>{profile?.email ?? user?.email}</Text>
          <View style={[styles.statusBadge, { backgroundColor: statusBg, borderColor: `${statusColor}55` }]}>
            <MaterialCommunityIcons
              name={kycStatus === "VERIFIED" ? "shield-check" : kycStatus === "REJECTED" ? "shield-off" : "shield-search"}
              size={15}
              color={statusColor}
            />
            <Text style={[styles.statusBadgeText, { color: statusColor }]}>
              {kycStatus === "VERIFIED" ? "Identite verifiee" : kycStatus === "REJECTED" ? "Verification refusee" : "Verification en attente"}
            </Text>
          </View>
        </View>
        </FadeInView>

        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Dossier client</Text>
            <Text style={styles.cardSubtitle}>Informations utilisees pour la securite et le credit</Text>
          </View>
          {rows.map((row) => (
            <View key={row.label} style={styles.row}>
              <View style={styles.rowIcon}>
                <MaterialCommunityIcons name={row.icon as never} size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.label}>{row.label}</Text>
                <Text style={styles.value}>{row.value}</Text>
              </View>
            </View>
          ))}
        </View>

        <Pressable style={styles.primaryButton} onPress={() => navigate("Kyc")}>
          <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>{kycStatus === "VERIFIED" ? "Voir la verification" : "Completer la verification"}</Text>
        </Pressable>
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 110, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: radii.lg, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  editPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.full, paddingHorizontal: 13, paddingVertical: 9 },
  editPillText: { color: colors.gray900, fontSize: 12, fontWeight: "900" },
  heroCard: { alignItems: "center", backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xxl, padding: 22, shadowColor: colors.shadow, shadowOpacity: 0.28, shadowRadius: 24, shadowOffset: { width: 0, height: 16 }, elevation: 7 },
  avatarHero: { width: 78, height: 78, borderRadius: 28, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center", shadowColor: colors.ring, shadowOpacity: 0.35, shadowRadius: 18, shadowOffset: { width: 0, height: 10 } },
  avatarHeroText: { color: colors.white, fontSize: 26, fontWeight: "900" },
  heroTitle: { marginTop: 14, fontSize: 23, fontWeight: "900", color: colors.gray900, textAlign: "center" },
  heroSubtitle: { marginTop: 4, fontSize: 13, color: colors.gray500, textAlign: "center" },
  statusBadge: { marginTop: 14, flexDirection: "row", alignItems: "center", gap: 7, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: 12, paddingVertical: 7 },
  statusBadgeText: { fontSize: 12, fontWeight: "900" },
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xxl, overflow: "hidden" },
  cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  cardTitle: { fontSize: 16, fontWeight: "900", color: colors.gray900 },
  cardSubtitle: { marginTop: 3, fontSize: 12, color: colors.gray500, lineHeight: 17 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: colors.cardBorder },
  rowIcon: { width: 40, height: 40, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  label: { fontSize: 11, color: colors.gray500, fontWeight: "800", textTransform: "uppercase" },
  value: { marginTop: 3, fontSize: 15, color: colors.gray900, fontWeight: "700" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: "900", fontSize: 14 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
});

export default PersonalInformation;
