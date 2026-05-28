import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAppNavigation } from "@/lib/app-navigation";
import { login, setAuthToken } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const Login = () => {
  const { navigate } = useAppNavigation();
  const { setUser } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Veuillez saisir votre email et mot de passe.");
      return;
    }

    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const auth = await login({
        email: email.trim(),
        password,
      });
      setAuthToken(auth.token as string);
      setUser({
        userId: auth.userId,
        email: auth.email,
        firstName: auth.firstName,
        lastName: auth.lastName,
      }, auth.token as string);
      navigate("Home");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Impossible de vous connecter.";
      if (msg.includes("EMAIL_NOT_VERIFIED")) {
        navigate("EmailVerification", { email: email.trim() });
        return;
      }
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.orbTop} />
      <View style={styles.orbCenter} />
      <View style={styles.gridGlow} />
      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <View style={styles.brandRow}>
              <View style={styles.logoMark}>
                <Text style={styles.logoText}>CT</Text>
              </View>
              <View>
                <Text style={styles.brandName}>CreditTN</Text>
                <Text style={styles.brandSub}>Private credit wallet</Text>
              </View>
            </View>

            <View style={styles.walletScene}>
              <View style={styles.cardHalo} />
              <View style={styles.walletCard}>
                <View style={styles.cardTopRow}>
                  <View>
                    <Text style={styles.cardLabel}>Spending power</Text>
                    <Text style={styles.cardAmount}>4,800 DT</Text>
                  </View>
                  <MaterialCommunityIcons name="contactless-payment" size={25} color="#FFFFFF" />
                </View>
                <View style={styles.cardChipRow}>
                  <View style={styles.cardChip} />
                  <Text style={styles.cardDigits}>**** 2948</Text>
                </View>
              </View>
              <View style={styles.insightPill}>
                <MaterialCommunityIcons name="shield-check-outline" size={15} color={colors.success} />
                <Text style={styles.insightText}>KYC-grade secure session</Text>
              </View>
            </View>

            <Text style={styles.title}>Votre credit, plus rapide que votre banque.</Text>
            <Text style={styles.subtitle}>Connectez-vous pour piloter vos achats, vos echeances et votre score depuis une seule interface premium.</Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.fieldShell}>
              <Text style={styles.floatingLabel}>Email</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" size={19} color="#A99CFF" />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  style={styles.input}
                  placeholder="vous@exemple.com"
                  placeholderTextColor="#646E8F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldShell}>
              <Text style={styles.floatingLabel}>Mot de passe</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="lock-outline" size={19} color="#A99CFF" />
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  style={styles.input}
                  placeholder="Votre phrase secrete"
                  placeholderTextColor="#646E8F"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.iconButton}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <View style={styles.recoveryRow}>
              <TouchableOpacity activeOpacity={0.82} onPress={() => navigate("ForgotPassword")} style={styles.recoveryButton}>
                <MaterialCommunityIcons name="lock-reset" size={15} color="#D9D0FF" />
                <Text style={styles.recoveryText}>Mot de passe</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.82} onPress={() => navigate("ForgotEmail")} style={styles.recoveryButton}>
                <MaterialCommunityIcons name="email-search-outline" size={15} color="#D9D0FF" />
                <Text style={styles.recoveryText}>Email oublie</Text>
              </TouchableOpacity>
            </View>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={17} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]}
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.primaryButtonText}>{isSubmitting ? "Connexion..." : "Entrer dans CreditTN"}</Text>
              <MaterialCommunityIcons name="arrow-right" size={19} color={colors.white} />
            </TouchableOpacity>
          </View>

          <Pressable style={styles.footerLink} onPress={() => navigate("Register")}>
            <Text style={styles.footerMuted}>Pas encore membre</Text>
            <Text style={styles.footerAction}>Ouvrir un compte</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
    overflow: "hidden",
  },
  flexOne: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 26,
  },
  orbTop: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "rgba(139, 92, 246, 0.34)",
    top: -120,
    right: -105,
  },
  orbCenter: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(45, 212, 255, 0.12)",
    top: 220,
    left: -140,
  },
  gridGlow: {
    position: "absolute",
    left: 34,
    right: 34,
    bottom: 90,
    height: 180,
    borderRadius: 90,
    backgroundColor: "rgba(183, 140, 255, 0.10)",
  },
  hero: {
    gap: 18,
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoMark: {
    width: 54,
    height: 54,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.09)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ring,
    shadowOpacity: 0.36,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  logoText: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  brandName: {
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  brandSub: {
    marginTop: 2,
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "700",
  },
  walletScene: {
    height: 196,
    justifyContent: "center",
  },
  cardHalo: {
    position: "absolute",
    alignSelf: "center",
    width: 230,
    height: 112,
    borderRadius: 56,
    backgroundColor: "rgba(139, 92, 246, 0.24)",
    top: 38,
  },
  walletCard: {
    alignSelf: "center",
    width: "91%",
    minHeight: 148,
    borderRadius: 30,
    padding: 20,
    backgroundColor: "rgba(21, 17, 45, 0.92)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    shadowColor: colors.ring,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 20 },
    transform: [{ rotate: "-2deg" }],
  },
  cardTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  cardLabel: {
    color: "#BDB5FF",
    fontSize: 12,
    fontWeight: "800",
  },
  cardAmount: {
    marginTop: 6,
    color: colors.white,
    fontSize: 36,
    lineHeight: 40,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  cardChipRow: {
    marginTop: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardChip: {
    width: 42,
    height: 30,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.24)",
  },
  cardDigits: {
    color: "#D8D9FF",
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0,
  },
  insightPill: {
    position: "absolute",
    right: 0,
    bottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: radii.full,
    backgroundColor: "rgba(5, 8, 22, 0.82)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  insightText: {
    color: colors.gray800,
    fontSize: 11,
    fontWeight: "800",
  },
  title: {
    maxWidth: 360,
    color: colors.white,
    fontSize: 37,
    lineHeight: 42,
    fontWeight: "900",
  },
  subtitle: {
    maxWidth: 350,
    color: colors.mutedForeground,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: "600",
  },
  formPanel: {
    marginTop: 26,
    gap: 14,
    borderRadius: 32,
    padding: 14,
    backgroundColor: "rgba(12, 16, 34, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.38,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  fieldShell: {
    minHeight: 68,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
  },
  floatingLabel: {
    color: "#A99CFF",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 11,
    color: colors.white,
    fontSize: 15,
    fontWeight: "700",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  recoveryRow: {
    flexDirection: "row",
    gap: 10,
  },
  recoveryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 7,
  },
  recoveryText: {
    color: "#D9D0FF",
    fontSize: 12,
    fontWeight: "900",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 20,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  primaryButton: {
    minHeight: 58,
    borderRadius: 24,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 10,
    shadowColor: colors.ring,
    shadowOpacity: 0.52,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  buttonDisabled: {
    opacity: 0.68,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "900",
  },
  footerLink: {
    marginTop: 18,
    alignSelf: "center",
    alignItems: "center",
    gap: 4,
  },
  footerMuted: {
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  footerAction: {
    color: "#E8DDFF",
    fontSize: 14,
    fontWeight: "900",
  },
});

export default Login;
