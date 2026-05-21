import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { recoverEmail, revealRecoveredEmail, updateRecoveredEmail } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const ForgotEmail = () => {
  const { navigate } = useAppNavigation();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [maskedEmail, setMaskedEmail] = useState("");
  const [fullEmail, setFullEmail] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [recoveryToken, setRecoveryToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRecover = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Entrez votre telephone ou nom utilisateur et votre mot de passe.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMaskedEmail("");
    setFullEmail("");
    setRecoveryToken("");

    try {
      const response = await recoverEmail({
        identifier: identifier.trim(),
        password,
      });
      setMaskedEmail(response.data?.maskedEmail ?? "");
      setRecoveryToken(response.data?.recoveryToken ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de verifier ces informations.");
    } finally {
      setLoading(false);
    }
  };

  const handleReveal = async () => {
    if (!recoveryToken) return;
    setLoading(true);
    setErrorMessage("");
    try {
      const response = await revealRecoveredEmail(recoveryToken);
      setFullEmail(response.data?.email ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible d'afficher l'email complet.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!recoveryToken || !newEmail.trim()) {
      setErrorMessage("Entrez le nouvel email.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await updateRecoveredEmail(recoveryToken, newEmail.trim());
      const updatedEmail = response.data?.email ?? newEmail.trim();
      navigate("EmailVerification", { email: updatedEmail });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de modifier l'email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate("Login")} style={styles.backRow}>
          <MaterialCommunityIcons name="arrow-left" size={20} color={colors.primary} />
          <Text style={styles.backText}>Connexion</Text>
        </Pressable>

        <View>
          <Text style={styles.title}>Email oublie</Text>
          <Text style={styles.subtitle}>
            Verifiez votre identite avec votre telephone ou nom utilisateur et votre mot de passe.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>TELEPHONE OU NOM UTILISATEUR</Text>
          <TextInput
            value={identifier}
            onChangeText={setIdentifier}
            style={styles.input}
            placeholder="Ex: 20000000 ou rayen"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
          />

          <Text style={styles.label}>MOT DE PASSE</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              style={styles.passwordInput}
              placeholder="Votre mot de passe"
              placeholderTextColor={colors.gray400}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eyeBtn}>
              <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={18} color={colors.gray400} />
            </Pressable>
          </View>

          <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleRecover} disabled={loading}>
            <Text style={styles.primaryText}>{loading ? "Verification..." : "Verifier mon compte"}</Text>
          </Pressable>
        </View>

        {!!maskedEmail && (
          <View style={styles.resultCard}>
            <MaterialCommunityIcons name="shield-check-outline" size={22} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.resultLabel}>Email associe</Text>
              <Text style={styles.emailText}>{fullEmail || maskedEmail}</Text>
              {!fullEmail && (
                <View style={styles.resultActions}>
                  <Pressable style={styles.revealButton} onPress={handleReveal} disabled={loading}>
                    <Text style={styles.revealText}>Afficher l'email complet</Text>
                  </Pressable>
                  <Pressable style={styles.revealButton} onPress={() => setEditingEmail((value) => !value)} disabled={loading}>
                    <Text style={styles.revealText}>Modifier cet email</Text>
                  </Pressable>
                </View>
              )}
              {!!fullEmail && (
                <View style={styles.resultActions}>
                  <Pressable style={styles.revealButton} onPress={() => navigate("Login")}>
                    <Text style={styles.revealText}>Continuer vers la connexion</Text>
                  </Pressable>
                  <Pressable style={styles.revealButton} onPress={() => setEditingEmail((value) => !value)} disabled={loading}>
                    <Text style={styles.revealText}>Modifier cet email</Text>
                  </Pressable>
                </View>
              )}
              {editingEmail && (
                <View style={styles.editBox}>
                  <Text style={styles.editLabel}>NOUVEL EMAIL</Text>
                  <TextInput
                    value={newEmail}
                    onChangeText={setNewEmail}
                    style={styles.editInput}
                    placeholder="nouvel@email.com"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Pressable style={[styles.updateButton, loading && styles.disabled]} onPress={handleUpdateEmail} disabled={loading}>
                    <Text style={styles.updateText}>{loading ? "Modification..." : "Enregistrer et verifier"}</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorRow}>
            <MaterialCommunityIcons name="alert-circle-outline" size={14} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 28, gap: 16 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  backText: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  title: { fontSize: 26, fontWeight: "800", color: colors.gray900 },
  subtitle: { marginTop: 8, fontSize: 13, color: colors.gray500, lineHeight: 20 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    gap: 10,
  },
  label: { fontSize: 11, color: colors.gray500, fontWeight: "700", letterSpacing: 0.5 },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 11,
    backgroundColor: colors.gray50,
    color: colors.gray900,
    fontSize: 15,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.lg,
    backgroundColor: colors.gray50,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    color: colors.gray900,
    fontSize: 15,
  },
  eyeBtn: { padding: 10 },
  primaryButton: {
    marginTop: 4,
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    alignItems: "center",
    paddingVertical: 14,
  },
  primaryText: { color: colors.white, fontWeight: "700", fontSize: 15 },
  disabled: { opacity: 0.5 },
  resultCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    backgroundColor: colors.successLight,
    borderWidth: 1,
    borderColor: colors.success,
    borderRadius: radii.lg,
    padding: 14,
  },
  resultLabel: { color: colors.success, fontSize: 11, fontWeight: "800" },
  emailText: { color: colors.gray900, fontSize: 16, fontWeight: "900", marginTop: 3 },
  revealButton: { marginTop: 10, alignSelf: "flex-start" },
  revealText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  resultActions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  editBox: { marginTop: 12, gap: 8 },
  editLabel: { fontSize: 10, color: colors.gray500, fontWeight: "800", letterSpacing: 0.5 },
  editInput: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: colors.gray50,
    color: colors.gray900,
    fontSize: 14,
  },
  updateButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.md,
    alignItems: "center",
    paddingVertical: 11,
  },
  updateText: { color: colors.white, fontSize: 13, fontWeight: "800" },
  errorRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  errorText: { flex: 1, fontSize: 12, color: colors.error },
});

export default ForgotEmail;
