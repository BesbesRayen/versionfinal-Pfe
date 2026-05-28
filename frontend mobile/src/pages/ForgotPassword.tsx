import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { confirmForgotPassword, requestForgotPassword } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const RESET_EXPIRY_SECONDS = 1800;

const ForgotPassword = () => {
  const { navigate } = useAppNavigation();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [infoMessage, setInfoMessage] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startTimer = () => {
    setSecondsLeft(RESET_EXPIRY_SECONDS);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
  };

  const formatCountdown = (value: number) => {
    const minutes = Math.floor(value / 60);
    const seconds = value % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const clearMessages = () => {
    setErrorMessage("");
    setInfoMessage("");
  };

  const sendCode = async () => {
    if (!email.trim()) {
      setErrorMessage("Enter your email address.");
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      await requestForgotPassword(email.trim());
      setCodeSent(true);
      startTimer();
      setInfoMessage("Reset link sent. Check your inbox.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send the code.");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!email.trim() || !token.trim() || !newPassword.trim()) {
      setErrorMessage("Complete all fields before continuing.");
      return;
    }
    if (newPassword.length < 8) {
      setErrorMessage("The new password must contain at least 8 characters.");
      return;
    }
    setLoading(true);
    clearMessages();
    try {
      await confirmForgotPassword(email.trim(), token.trim(), newPassword);
      setResetDone(true);
      if (timerRef.current) clearInterval(timerRef.current);
      setTimeout(() => navigate("Login"), 1600);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Password reset failed.");
    } finally {
      setLoading(false);
    }
  };

  if (resetDone) {
    return (
      <MobileLayout>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check" size={32} color={colors.background} />
          </View>
          <Text style={styles.successTitle}>Password updated</Text>
          <Text style={styles.successSub}>You can sign in with your new credentials.</Text>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigate("Login")} style={styles.backButton}>
          <MaterialCommunityIcons name="arrow-left" size={18} color={colors.gray700} />
        </Pressable>

        <View style={styles.hero}>
          <View style={styles.heroIcon}>
            <MaterialCommunityIcons name="lock-reset" size={28} color={colors.white} />
          </View>
          <Text style={styles.title}>Mot de passe oublie</Text>
          <Text style={styles.subtitle}>
            Recevez un lien temporaire, puis creez un nouveau mot de passe securise.
          </Text>
        </View>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, styles.stepDone]}><Text style={styles.stepText}>1</Text></View>
          <View style={[styles.stepLine, codeSent && styles.stepLineActive]} />
          <View style={[styles.stepDot, codeSent && styles.stepDone]}><Text style={styles.stepText}>2</Text></View>
        </View>

        <View style={styles.panel}>
          <Text style={styles.panelTitle}>{codeSent ? "Verifier et changer" : "Identifier le compte"}</Text>
          <Text style={styles.label}>EMAIL</Text>
          <TextInput
            value={email}
            onChangeText={(value) => { setEmail(value); clearMessages(); }}
            editable={!codeSent}
            style={[styles.input, codeSent && styles.inputDisabled]}
            placeholder="vous@exemple.com"
            placeholderTextColor={colors.gray400}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {!codeSent ? (
            <Pressable style={[styles.primaryButton, loading && styles.disabled]} onPress={sendCode} disabled={loading}>
              {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Envoyer le lien</Text>}
            </Pressable>
          ) : (
            <>
              <View style={[styles.timerPill, secondsLeft === 0 && styles.timerPillExpired]}>
                <MaterialCommunityIcons name="timer-outline" size={15} color={secondsLeft > 0 ? colors.success : colors.error} />
                <Text style={[styles.timerText, secondsLeft === 0 && { color: colors.error }]}>
                  {secondsLeft > 0 ? `Lien valide ${formatCountdown(secondsLeft)}` : "Lien expire"}
                </Text>
              </View>

              <Text style={styles.label}>JETON DE REINITIALISATION</Text>
              <TextInput
                value={token}
                onChangeText={(value) => { setToken(value.trim()); clearMessages(); }}
                style={styles.input}
                placeholder="Copiez le jeton recu par email"
                placeholderTextColor={colors.gray400}
                autoCapitalize="none"
              />

              <Text style={styles.label}>NOUVEAU MOT DE PASSE</Text>
              <View style={styles.passwordWrap}>
                <TextInput
                  value={newPassword}
                  onChangeText={(value) => { setNewPassword(value); clearMessages(); }}
                  style={styles.passwordInput}
                  placeholder="8 caracteres minimum"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((value) => !value)} style={styles.eyeButton}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.gray500} />
                </Pressable>
              </View>

              <Pressable
                style={[styles.primaryButton, (loading || secondsLeft === 0) && styles.disabled]}
                onPress={resetPassword}
                disabled={loading || secondsLeft === 0}
              >
                {loading ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryText}>Confirmer le nouveau mot de passe</Text>}
              </Pressable>

              <Pressable style={styles.secondaryButton} onPress={sendCode} disabled={loading || secondsLeft > 0}>
                <Text style={[styles.secondaryText, secondsLeft > 0 && styles.secondaryTextDisabled]}>
                  {secondsLeft > 0 ? `Renvoyer dans ${formatCountdown(secondsLeft)}` : "Renvoyer un lien"}
                </Text>
              </Pressable>
            </>
          )}
        </View>

        {!!infoMessage && (
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="check-circle-outline" size={16} color={colors.success} />
            <Text style={styles.infoText}>{infoMessage}</Text>
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
  stepRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 6 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    borderWidth: 1, borderColor: colors.cardBorder,
    alignItems: "center", justifyContent: "center", backgroundColor: colors.surface,
  },
  stepDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepText: { color: colors.white, fontSize: 12, fontWeight: "900" },
  stepLine: { flex: 1, height: 2, backgroundColor: colors.cardBorder },
  stepLineActive: { backgroundColor: colors.primary },
  panel: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder,
    borderRadius: radii.xxl, padding: 18, gap: 12,
  },
  panelTitle: { fontSize: 17, fontWeight: "900", color: colors.gray900 },
  label: { fontSize: 10, fontWeight: "900", letterSpacing: 1, color: colors.gray500 },
  input: {
    borderWidth: 1, borderColor: colors.gray300, backgroundColor: colors.surface,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 13,
    color: colors.gray900, fontSize: 15,
  },
  inputDisabled: { opacity: 0.65 },
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
  secondaryButton: { alignItems: "center", paddingVertical: 6 },
  secondaryText: { color: colors.primary, fontSize: 13, fontWeight: "800" },
  secondaryTextDisabled: { color: colors.gray500 },
  disabled: { opacity: 0.55 },
  timerPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    alignSelf: "flex-start", borderWidth: 1, borderColor: colors.successBorder,
    backgroundColor: colors.successSoft, borderRadius: radii.full, paddingHorizontal: 10, paddingVertical: 7,
  },
  timerPillExpired: { borderColor: colors.errorBorder, backgroundColor: colors.errorLight },
  timerText: { color: colors.success, fontSize: 12, fontWeight: "800" },
  infoBox: {
    flexDirection: "row", gap: 8, borderWidth: 1, borderColor: colors.successBorder,
    backgroundColor: colors.successSoft, borderRadius: radii.lg, padding: 12,
  },
  infoText: { flex: 1, color: colors.success, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  errorBox: {
    flexDirection: "row", gap: 8, borderWidth: 1, borderColor: colors.errorBorder,
    backgroundColor: colors.errorLight, borderRadius: radii.lg, padding: 12,
  },
  errorText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "700", lineHeight: 18 },
  successWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 24 },
  successIcon: {
    width: 68, height: 68, borderRadius: 34,
    backgroundColor: colors.success, alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 24, fontWeight: "900", color: colors.gray900 },
  successSub: { fontSize: 14, color: colors.gray500, textAlign: "center" },
});

export default ForgotPassword;
