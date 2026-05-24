import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import {
  EmploymentStatus,
  FinancialProfile,
  FinancialProfilePayload,
  getFinancialProfile,
  saveFinancialProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const EMPLOYMENT_OPTIONS: { value: EmploymentStatus; label: string; icon: string }[] = [
  { value: "FULL_TIME", label: "Temps plein", icon: "briefcase-outline" },
  { value: "PART_TIME", label: "Temps partiel", icon: "briefcase-clock-outline" },
  { value: "SELF_EMPLOYED", label: "Independant", icon: "storefront-outline" },
  { value: "STUDENT", label: "Etudiant", icon: "school-outline" },
  { value: "UNEMPLOYED", label: "Sans emploi", icon: "account-search-outline" },
  { value: "OTHER", label: "Autre", icon: "dots-horizontal" },
];

const SALARY_DAYS = [1, 5, 10, 15, 20, 25, 28, 30];
const MIN_MONTHLY_SALARY = 100;
const MAX_MONTHLY_SALARY = 5000;

const FinancialProfilePage = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryDay, setSalaryDay] = useState<number>(25);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("FULL_TIME");

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setErrorMessage("");
    try {
      const data = await getFinancialProfile(user.userId);
      if (data) {
        setProfile(data);
        setSalary(data.monthlySalary.toString());
        setSalaryDay(data.salaryDay);
        setEmploymentStatus(data.employmentStatus as EmploymentStatus);
      }
    } catch {
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const salaryNum = Number.parseFloat(salary);
  const valid = Number.isFinite(salaryNum) && salaryNum >= MIN_MONTHLY_SALARY && salaryNum <= MAX_MONTHLY_SALARY;
  const dueDate = `${salaryDay + 2 > 28 ? 28 : salaryDay + 2} du mois`;
  const preview = useMemo(() => {
    if (!valid) return "0 DT";
    return `${Math.round(Math.min(2000, salaryNum * 0.55)).toLocaleString("fr-TN")} DT`;
  }, [salaryNum, valid]);

  const handleSave = async () => {
    if (!user) return;
    if (!valid) {
      setErrorMessage("Le salaire mensuel doit etre entre 100 DT et 5000 DT.");
      return;
    }
    setSaving(true);
    setErrorMessage("");
    try {
      const payload: FinancialProfilePayload = { monthlySalary: salaryNum, salaryDay, employmentStatus };
      const saved = await saveFinancialProfile(user.userId, payload);
      setProfile(saved);
      setSuccessMessage("Profil financier enregistre. Votre score sera recalcule.");
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Echec de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

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

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        {loading && <Text style={styles.loadingText}>Chargement...</Text>}

        <View style={styles.heroCard}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Limite estimee</Text>
              <Text style={styles.heroValue}>{preview}</Text>
            </View>
            <View style={[styles.statusPill, profile ? styles.statusDone : styles.statusMissing]}>
              <Text style={[styles.statusPillText, { color: profile ? colors.success : colors.warning }]}>
                {profile ? "Complete" : "A completer"}
              </Text>
            </View>
          </View>
          <Text style={styles.heroNote}>La limite finale depend du KYC, du comportement de paiement et du score global.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Salaire mensuel net</Text>
          <View style={styles.salaryRow}>
            <TextInput
              style={styles.salaryInput}
              placeholder="1500"
              placeholderTextColor={colors.gray500}
              keyboardType="decimal-pad"
              value={salary}
              onChangeText={(value) => setSalary(value.replace(/[^0-9.]/g, ""))}
            />
            <View style={styles.unitBox}><Text style={styles.unitText}>DT</Text></View>
          </View>
          <Text style={styles.rangeHint}>Entre 100 DT et 5000 DT.</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Jour de salaire</Text>
          <View style={styles.dayGrid}>
            {SALARY_DAYS.map((day) => (
              <Pressable key={day} onPress={() => setSalaryDay(day)} style={[styles.dayChip, salaryDay === day && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, salaryDay === day && styles.dayChipTextActive]}>{day}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.dueDateHint}>
            <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.primary} />
            <Text style={styles.dueDateText}>Echeances autour du {dueDate}</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Situation professionnelle</Text>
          <View style={styles.employmentGrid}>
            {EMPLOYMENT_OPTIONS.map((opt) => (
              <Pressable key={opt.value} onPress={() => setEmploymentStatus(opt.value)} style={[styles.empBtn, employmentStatus === opt.value && styles.empBtnActive]}>
                <MaterialCommunityIcons name={opt.icon as never} size={18} color={employmentStatus === opt.value ? colors.white : colors.gray500} />
                <Text style={[styles.empBtnText, employmentStatus === opt.value && styles.empBtnTextActive]}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Pressable style={[styles.primaryButton, (!valid || saving) && { opacity: 0.6 }]} onPress={handleSave} disabled={!valid || saving}>
          <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.white} />
          <Text style={styles.primaryButtonText}>{saving ? "Enregistrement..." : "Enregistrer le profil"}</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 110, gap: 16 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconButton: { width: 44, height: 44, borderRadius: radii.lg, backgroundColor: colors.surfaceStrong, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.cardBorder },
  headerText: { flex: 1 },
  title: { fontSize: 22, fontWeight: "900", color: colors.gray900 },
  subtitle: { marginTop: 3, fontSize: 12, color: colors.gray500, lineHeight: 18 },
  heroCard: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.primaryBorder, padding: 18, gap: 12 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heroLabel: { fontSize: 11, color: colors.gray500, fontWeight: "800", textTransform: "uppercase" },
  heroValue: { marginTop: 4, fontSize: 30, color: colors.gray900, fontWeight: "900" },
  heroNote: { color: colors.gray500, fontSize: 12, lineHeight: 18 },
  statusPill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 6 },
  statusDone: { backgroundColor: colors.successSoft },
  statusMissing: { backgroundColor: colors.warningSoft },
  statusPillText: { fontSize: 11, fontWeight: "900" },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "900", color: colors.gray700, textTransform: "uppercase", letterSpacing: 0.5 },
  salaryRow: { flexDirection: "row" },
  salaryInput: { flex: 1, height: 56, borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 16, fontSize: 22, fontWeight: "900", color: colors.gray900, backgroundColor: colors.surface },
  unitBox: { width: 58, height: 56, borderTopRightRadius: radii.lg, borderBottomRightRadius: radii.lg, borderWidth: 1, borderLeftWidth: 0, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  unitText: { color: colors.gray900, fontWeight: "900" },
  rangeHint: { fontSize: 11, color: colors.gray500, fontWeight: "700" },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: { width: 46, height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 13, fontWeight: "900", color: colors.gray600 },
  dayChipTextActive: { color: colors.white },
  dueDateHint: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primarySoft, borderRadius: radii.md, padding: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  dueDateText: { fontSize: 12, color: colors.gray800, fontWeight: "800" },
  employmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empBtn: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  empBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  empBtnText: { fontSize: 12, fontWeight: "800", color: colors.gray600 },
  empBtnTextActive: { color: colors.white },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14 },
  primaryButtonText: { color: colors.white, fontWeight: "900", fontSize: 14 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
  successText: { fontSize: 12, color: colors.success, fontWeight: "800", textAlign: "center", paddingVertical: 10, backgroundColor: colors.successSoft, borderRadius: radii.md, paddingHorizontal: 12 },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },
});

export default FinancialProfilePage;
