import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
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

  const clearError = () => {
    if (errorMessage) setErrorMessage("");
  };

  const handleRecover = async () => {
    if (!identifier.trim() || !password.trim()) {
      setErrorMessage("Enter your username and password.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setMaskedEmail("");
    setFullEmail("");
    setRecoveryToken("");

    try {
      const response = await recoverEmail({ identifier: identifier.trim(), password });
      setMaskedEmail(response.data?.maskedEmail ?? "");
      setRecoveryToken(response.data?.recoveryToken ?? "");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to verify this account.");
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
      setErrorMessage(error instanceof Error ? error.message : "Unable to show the full email.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmail = async () => {
    if (!recoveryToken || !newEmail.trim()) {
      setErrorMessage("Enter the new email.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    try {
      const response = await updateRecoveredEmail(recoveryToken, newEmail.trim());
      navigate("EmailVerification", { email: response.data?.email ?? newEmail.trim() });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to update the email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate("Login")} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.gray700} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="email-search-outline" size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Email oublie</Text>
          <Text style={styles.subtitle}>
            Verifiez votre identite avec votre nom utilisateur et votre mot de passe.
          </Text>
        </View>

        <View style={styles.panel}>
          <View style={styles.securityStrip}>
            <MaterialCommunityIcons name="shield-lock-outline" size={18} color={colors.success} />
            <Text style={styles.securityText}>Vos informations restent masquees jusqu'a verification.</Text>
          </View>

          <Text style={styles.label}>NOM UTILISATEUR</Text>
          <TextInput
            value={identifier}
            onChangeText={(value) => { setIdentifier(value); clearError(); }}
            style={styles.input}
            placeholder="ex: rayen"
            placeholderTextColor={colors.gray400}
            autoCapitalize="none"
          />

          <Text style={styles.label}>MOT DE PASSE</Text>
          <View style={styles.passwordWrap}>
            <TextInput
              value={password}
              onChangeText={(value) => { setPassword(value); clearError(); }}
              style={styles.passwordInput}
              placeholder="Votre mot de passe"
              placeholderTextColor={colors.gray400}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
              <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.gray500} />
            </Pressable>
          </View>

          <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={handleRecover} disabled={loading}>
            {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Verifier mon compte</Text>}
          </Pressable>
        </View>

        {!!maskedEmail && (
          <View style={styles.resultCard}>
            <View style={styles.resultIcon}>
              <MaterialCommunityIcons name="check" size={22} color={colors.background} />
            </View>
            <View style={styles.resultBody}>
              <Text style={styles.resultLabel}>Email associe</Text>
              <Text style={styles.emailText}>{fullEmail || maskedEmail}</Text>

              <View style={styles.resultActions}>
                {!fullEmail && (
                  <Pressable style={styles.actionButton} onPress={handleReveal} disabled={loading}>
                    <MaterialCommunityIcons name="eye-outline" size={16} color={colors.primary} />
                    <Text style={styles.actionText}>Afficher</Text>
                  </Pressable>
                )}
                <Pressable style={styles.actionButton} onPress={() => setEditingEmail((value) => !value)} disabled={loading}>
                  <MaterialCommunityIcons name="email-edit-outline" size={16} color={colors.primary} />
                  <Text style={styles.actionText}>Modifier</Text>
                </Pressable>
                {!!fullEmail && (
                  <Pressable style={styles.actionButton} onPress={() => navigate("Login")}>
                    <MaterialCommunityIcons name="login" size={16} color={colors.primary} />
                    <Text style={styles.actionText}>Connexion</Text>
                  </Pressable>
                )}
              </View>

              {editingEmail && (
                <View style={styles.editBox}>
                  <Text style={styles.label}>NOUVEL EMAIL</Text>
                  <TextInput
                    value={newEmail}
                    onChangeText={(value) => { setNewEmail(value); clearError(); }}
                    style={styles.input}
                    placeholder="nouvel@email.com"
                    placeholderTextColor={colors.gray400}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <Pressable style={[styles.updateButton, loading && styles.disabled]} onPress={handleUpdateEmail} disabled={loading}>
                    {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.updateText}>Enregistrer et verifier</Text>}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        )}

        {!!errorMessage && (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}
      </ScrollView>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingVertical: 24, gap: 18 },
  backButton: {
    width: 42, height: 42, borderRadius: radii.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
    backgroundColor: colors.surface, alignItems: "center", justifyContent: "center",
  },
  hero: { gap: 10 },
  heroIcon: {
    width: 58, height: 58, borderRadius: 18,
    backgroundColor: colors.primary, alignItems: "center", justifyContent: "center",
  },
  title: { fontSize: 28, fontWeight: "900", color: colors.gray900 },
  subtitle: { fontSize: 14, color: colors.gray500, lineHeight: 21 },
  panel: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: radii.xxl, padding: 18, gap: 12,
  },
  securityStrip: {
    flexDirection: "row", alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: colors.successBorder,
    backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: 11,
  },
  securityText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: colors.gray500 },
  input: {
    borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.surface,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.gray900, fontSize: 15,
  },
  passwordWrap: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: colors.gray300, backgroundColor: colors.surface, borderRadius: radii.lg,
  },
  passwordInput: { flex: 1, paddingHorizontal: 14, paddingVertical: 13, color: colors.gray900, fontSize: 15 },
  eyeButton: { width: 46, alignItems: "center", justifyContent: "center" },
  primaryButton: {
    minHeight: 50, borderRadius: radii.lg, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center", marginTop: 4,
  },
  primaryText: { color: colors.white, fontSize: 14, fontWeight: "900" },
  disabled: { opacity: 0.55 },
  resultCard: {
    flexDirection: "row", gap: 12,
    borderWidth: 1, borderColor: colors.successBorder,
    backgroundColor: colors.successSoft, borderRadius: radii.xxl, padding: 16,
  },
  resultIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: colors.success, alignItems: "center", justifyContent: "center",
  },
  resultBody: { flex: 1, gap: 8 },
  resultLabel: { color: colors.success, fontSize: 11, fontWeight: "900", letterSpacing: 0.8 },
  emailText: { color: colors.gray900, fontSize: 18, fontWeight: "900" },
  resultActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  actionButton: {
    flexDirection: "row", alignItems: "center", gap: 5,
    borderWidth: 1, borderColor: colors.primaryBorder,
    backgroundColor: colors.primaryLight, borderRadius: radii.full,
    paddingHorizontal: 10, paddingVertical: 8,
  },
  actionText: { color: colors.primary, fontSize: 12, fontWeight: "900" },
  editBox: { marginTop: 6, gap: 10 },
  updateButton: {
    minHeight: 46, borderRadius: radii.lg, backgroundColor: colors.primary,
    alignItems: "center", justifyContent: "center",
  },
  updateText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  errorBox: {
    flexDirection: "row", gap: 8, borderWidth: 1, borderColor: colors.errorBorder,
    backgroundColor: colors.errorLight, borderRadius: radii.lg, padding: 12,
  },
  errorText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "700", lineHeight: 18 },
});

export default ForgotEmail;
