import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import {
  EmploymentStatus,
  FinancialProfile,
  FinancialProfilePayload,
  getFinancialProfile,
  saveFinancialProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { estimateCreditLimit } from "@/lib/credit-limit-estimate";
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
const MAX_MONTHLY_SALARY = 15000;

const SCORE_CATEGORY_MAP = [
  {
    label: "KYC Verification",
    max: 150,
    source: "Etape 1",
    detail: "Identite, reconnaissance faciale, liveness et controle anti-fraude.",
    icon: "card-account-details-outline",
  },
  {
    label: "Financial Capacity",
    max: 250,
    source: "Etape 3 + auto",
    detail: "Salaire saisi ici, ratio dette/revenu et anciennete du profil financier.",
    icon: "cash",
  },
  {
    label: "Payment Behavior",
    max: 400,
    source: "Automatique",
    detail: "Echeances payees a temps, historique recent, retards et impayes.",
    icon: "chart-timeline-variant",
  },
  {
    label: "Stability",
    max: 100,
    source: "Etape 3 + auto",
    detail: "Situation professionnelle saisie ici, anciennete du compte et fidelite.",
    icon: "account-clock-outline",
  },
  {
    label: "Risk Assessment",
    max: 100,
    source: "Etape 1 + auto",
    detail: "Risque KYC, signaux de fraude et tentatives de verification echouees.",
    icon: "shield-alert-outline",
  },
] as const;

interface FinancialProfileFormProps {
  onSaved?: (profile: FinancialProfile) => void;
  submitLabel?: string;
  showStatus?: boolean;
}

const FinancialProfileForm = ({
  onSaved,
  submitLabel = "Enregistrer le profil",
  showStatus = true,
}: FinancialProfileFormProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [salary, setSalary] = useState("");
  const [salaryDay, setSalaryDay] = useState(25);
  const [employmentStatus, setEmploymentStatus] = useState<EmploymentStatus>("FULL_TIME");

  const loadProfile = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const savedProfile = await getFinancialProfile(user.userId);
      if (savedProfile) {
        setProfile(savedProfile);
        setSalary(savedProfile.monthlySalary.toString());
        setSalaryDay(savedProfile.salaryDay);
        setEmploymentStatus(savedProfile.employmentStatus as EmploymentStatus);
      }
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le profil financier.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const salaryNumber = Number.parseFloat(salary);
  const validSalary = Number.isFinite(salaryNumber)
    && salaryNumber >= MIN_MONTHLY_SALARY
    && salaryNumber <= MAX_MONTHLY_SALARY;
  const dueDate = `${Math.min(28, salaryDay + 2)} du mois`;
  const preview = useMemo(() => {
    if (!validSalary) return "A calculer";
    return `${estimateCreditLimit(salaryNumber).toLocaleString("fr-TN")} DT`;
  }, [salaryNumber, validSalary]);

  const handleSave = async () => {
    if (!user || saving) return;
    if (!validSalary) {
      setErrorMessage("Le salaire mensuel doit etre entre 100 DT et 15000 DT.");
      return;
    }

    setSaving(true);
    setErrorMessage("");
    setSuccessMessage("");
    try {
      const payload: FinancialProfilePayload = {
        monthlySalary: salaryNumber,
        salaryDay,
        employmentStatus,
      };
      const savedProfile = await saveFinancialProfile(user.userId, payload);
      setProfile(savedProfile);
      setSalary(savedProfile.monthlySalary.toString());
      setSalaryDay(savedProfile.salaryDay);
      setEmploymentStatus(savedProfile.employmentStatus as EmploymentStatus);
      setSuccessMessage("Profil financier enregistre. Votre score a ete recalcule.");
      onSaved?.(savedProfile);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
      {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={styles.loadingText}>Chargement du profil...</Text>
        </View>
      )}

      {showStatus && (
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
          <Text style={styles.heroNote}>
            La limite finale depend aussi du KYC, de vos dettes et de votre comportement de paiement.
          </Text>
        </View>
      )}

      <View style={styles.scoreInfoCard}>
        <View style={styles.scoreInfoHeader}>
          <MaterialCommunityIcons name="speedometer" size={20} color={colors.primary} />
          <Text style={styles.scoreInfoTitle}>Correspondance avec le Score Breakdown</Text>
        </View>
        {SCORE_CATEGORY_MAP.map((category) => (
          <View key={category.label} style={styles.scoreCategory}>
            <MaterialCommunityIcons name={category.icon} size={18} color={colors.primary} />
            <View style={styles.scoreCategoryBody}>
              <View style={styles.scoreCategoryTitleRow}>
                <Text style={styles.scoreCategoryTitle}>{category.label} /{category.max}</Text>
                <Text style={styles.scoreSource}>{category.source}</Text>
              </View>
              <Text style={styles.scoreCategoryDetail}>{category.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Salaire mensuel net</Text>
        <View style={styles.salaryRow}>
          <TextInput
            style={styles.salaryInput}
            placeholder="Montant"
            placeholderTextColor={colors.gray500}
            keyboardType="decimal-pad"
            value={salary}
            onChangeText={(value) => setSalary(value.replace(/[^0-9.]/g, ""))}
          />
          <View style={styles.unitBox}><Text style={styles.unitText}>DT</Text></View>
        </View>
        <Text style={styles.rangeHint}>Entre 100 DT et 15000 DT.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Situation professionnelle</Text>
        <View style={styles.employmentGrid}>
          {EMPLOYMENT_OPTIONS.map((option) => (
            <Pressable
              key={option.value}
              onPress={() => setEmploymentStatus(option.value)}
              style={[styles.empButton, employmentStatus === option.value && styles.empButtonActive]}
            >
              <MaterialCommunityIcons
                name={option.icon as never}
                size={18}
                color={employmentStatus === option.value ? colors.white : colors.gray500}
              />
              <Text style={[styles.empButtonText, employmentStatus === option.value && styles.empButtonTextActive]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.fieldLabel}>Jour de reception du salaire</Text>
        <Text style={styles.fieldNote}>
          Utilise pour programmer les echeances. Ce champ n'ajoute pas directement des points au score.
        </Text>
        <View style={styles.dayGrid}>
          {SALARY_DAYS.map((day) => (
            <Pressable
              key={day}
              onPress={() => setSalaryDay(day)}
              style={[styles.dayChip, salaryDay === day && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, salaryDay === day && styles.dayChipTextActive]}>{day}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.dueDateHint}>
          <MaterialCommunityIcons name="calendar-clock" size={16} color={colors.primary} />
          <Text style={styles.dueDateText}>Echeances autour du {dueDate}</Text>
        </View>
      </View>

      <Pressable
        style={[styles.primaryButton, (!validSalary || saving || loading) && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={!validSalary || saving || loading}
      >
        {saving ? (
          <ActivityIndicator color={colors.white} size="small" />
        ) : (
          <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.white} />
        )}
        <Text style={styles.primaryButtonText}>{saving ? "Enregistrement..." : submitLabel}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  heroCard: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.primaryBorder, padding: 18, gap: 12 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  heroLabel: { fontSize: 11, color: colors.gray500, fontWeight: "800", textTransform: "uppercase" },
  heroValue: { marginTop: 4, fontSize: 30, color: colors.gray900, fontWeight: "900" },
  heroNote: { color: colors.gray500, fontSize: 12, lineHeight: 18 },
  statusPill: { borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 6 },
  statusDone: { backgroundColor: colors.successSoft },
  statusMissing: { backgroundColor: colors.warningSoft },
  statusPillText: { fontSize: 11, fontWeight: "900" },
  scoreInfoCard: { backgroundColor: colors.primarySoft, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.primaryBorder, padding: 16, gap: 7 },
  scoreInfoHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  scoreInfoTitle: { color: colors.gray900, fontSize: 13, fontWeight: "900" },
  scoreCategory: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingTop: 9, borderTopWidth: 1, borderTopColor: colors.primaryBorder },
  scoreCategoryBody: { flex: 1, gap: 3 },
  scoreCategoryTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  scoreCategoryTitle: { flex: 1, color: colors.gray900, fontSize: 12, fontWeight: "900" },
  scoreSource: { color: colors.primary, fontSize: 9, fontWeight: "900", textTransform: "uppercase" },
  scoreCategoryDetail: { color: colors.gray600, fontSize: 11, lineHeight: 16 },
  card: { backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, gap: 12 },
  fieldLabel: { fontSize: 12, fontWeight: "900", color: colors.gray700, textTransform: "uppercase", letterSpacing: 0.5 },
  fieldNote: { fontSize: 11, color: colors.gray500, lineHeight: 16 },
  salaryRow: { flexDirection: "row" },
  salaryInput: { flex: 1, height: 56, borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, paddingHorizontal: 16, fontSize: 22, fontWeight: "900", color: colors.gray900, backgroundColor: colors.surface },
  unitBox: { width: 58, height: 56, borderTopRightRadius: radii.lg, borderBottomRightRadius: radii.lg, borderWidth: 1, borderLeftWidth: 0, borderColor: colors.primaryBorder, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  unitText: { color: colors.gray900, fontWeight: "900" },
  rangeHint: { fontSize: 11, color: colors.gray500, fontWeight: "700" },
  employmentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  empButton: { flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 10, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface },
  empButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  empButtonText: { fontSize: 12, fontWeight: "800", color: colors.gray600 },
  empButtonTextActive: { color: colors.white },
  dayGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: { width: 46, height: 42, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { fontSize: 13, fontWeight: "900", color: colors.gray600 },
  dayChipTextActive: { color: colors.white },
  dueDateHint: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primarySoft, borderRadius: radii.md, padding: 10, borderWidth: 1, borderColor: colors.primaryBorder },
  dueDateText: { fontSize: 12, color: colors.gray800, fontWeight: "800" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 15 },
  primaryButtonText: { color: colors.white, fontWeight: "900", fontSize: 14 },
  buttonDisabled: { opacity: 0.55 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700", backgroundColor: colors.errorSoft, borderRadius: radii.md, padding: 10 },
  successText: { fontSize: 12, color: colors.success, fontWeight: "800", textAlign: "center", paddingVertical: 10, backgroundColor: colors.successSoft, borderRadius: radii.md, paddingHorizontal: 12 },
});

export default FinancialProfileForm;
