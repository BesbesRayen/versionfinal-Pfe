import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { getProfile, updateProfile } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

interface EditableProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  profession: string;
}

const FIELDS: { key: keyof EditableProfile; label: string; icon: string; keyboardType?: "default" | "email-address" | "phone-pad"; autoCapitalize?: "none" | "words" }[] = [
  { key: "firstName", label: "Prenom", icon: "account-outline", autoCapitalize: "words" },
  { key: "lastName", label: "Nom", icon: "account-outline", autoCapitalize: "words" },
  { key: "email", label: "Email", icon: "email-outline", keyboardType: "email-address", autoCapitalize: "none" },
  { key: "phone", label: "Telephone", icon: "phone-outline", keyboardType: "phone-pad" },
  { key: "address", label: "Adresse", icon: "map-marker-outline" },
  { key: "profession", label: "Profession", icon: "briefcase-outline" },
];

const EditProfileField = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const [form, setForm] = useState<EditableProfile>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    profession: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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
        const profile = await getProfile(user.userId);
        setForm({
          firstName: profile.firstName ?? user.firstName ?? "",
          lastName: profile.lastName ?? user.lastName ?? "",
          email: profile.email ?? user.email ?? "",
          phone: profile.phone ?? "",
          address: profile.address ?? "",
          profession: profile.profession ?? "",
        });
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le profil.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user, navigate]);

  const setField = (field: keyof EditableProfile, value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }));
  };

  const save = async () => {
    if (!user) return;
    setSaving(true);
    setErrorMessage("");
    try {
      await updateProfile(user.userId, {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        profession: form.profession.trim(),
      });
      navigate("PersonalInformation");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de sauvegarde.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Pressable onPress={() => navigate("PersonalInformation")} style={styles.iconButton}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray800} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Modifier le profil</Text>
            <Text style={styles.subtitle}>Gardez vos informations exactes pour faciliter la verification.</Text>
          </View>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {loading && <Text style={styles.loadingText}>Chargement...</Text>}

        <View style={styles.card}>
          {FIELDS.map((field) => (
            <View key={field.key} style={styles.fieldBlock}>
              <View style={styles.fieldHeader}>
                <MaterialCommunityIcons name={field.icon as never} size={16} color={colors.primary} />
                <Text style={styles.label}>{field.label}</Text>
              </View>
              <TextInput
                value={form[field.key]}
                onChangeText={(value) => setField(field.key, value)}
                style={styles.input}
                keyboardType={field.keyboardType ?? "default"}
                autoCapitalize={field.autoCapitalize ?? "words"}
                placeholderTextColor={colors.gray500}
              />
            </View>
          ))}
        </View>

        <Pressable style={[styles.primaryButton, (saving || loading) && styles.disabled]} onPress={save} disabled={saving || loading}>
          <MaterialCommunityIcons name="content-save-outline" size={18} color={colors.white} />
          <Text style={styles.primaryText}>{saving ? "Enregistrement..." : "Enregistrer"}</Text>
        </Pressable>
      </ScrollView>
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
  card: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 16, gap: 14 },
  fieldBlock: { gap: 8 },
  fieldHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  label: { fontSize: 12, fontWeight: "800", color: colors.gray700 },
  input: { borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 13, backgroundColor: colors.surface, color: colors.gray900, fontSize: 15, fontWeight: "700" },
  primaryButton: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14 },
  primaryText: { color: colors.white, fontWeight: "900", fontSize: 14 },
  disabled: { opacity: 0.7 },
  loadingText: { fontSize: 12, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "700" },
});

export default EditProfileField;
