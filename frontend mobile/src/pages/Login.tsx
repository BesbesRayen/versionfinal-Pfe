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
      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerBlock}>
            <View style={styles.logoBox}>
              <View style={styles.logoInner}>
                <Text style={styles.logoText}>CT</Text>
              </View>
            </View>

            <Text style={styles.eyebrow}>CREDITN</Text>
            <Text style={styles.title}>Bienvenue</Text>
            <Text style={styles.subtitle}>Connectez-vous pour gerer vos achats, credits et paiements.</Text>
          </View>

          <View style={styles.form}>
            <View>
              <Text style={styles.label}>Email</Text>
              <View style={styles.inputShell}>
                <MaterialCommunityIcons name="email-outline" size={18} color={colors.gray400} />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  style={styles.input}
                  placeholder="vous@exemple.com"
                  placeholderTextColor={colors.gray400}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>Mot de passe</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.gray400} />
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    if (errorMessage) setErrorMessage("");
                  }}
                  style={styles.passwordInput}
                  placeholder="********"
                  placeholderTextColor={colors.gray400}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />

                <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View style={styles.recoveryActions}>
              <TouchableOpacity activeOpacity={0.8} onPress={() => navigate("ForgotPassword")} style={styles.recoveryButton}>
                <MaterialCommunityIcons name="lock-reset" size={16} color={colors.primary} />
                <Text style={styles.recoveryText}>Mot de passe oublie</Text>
              </TouchableOpacity>

              <TouchableOpacity activeOpacity={0.8} onPress={() => navigate("ForgotEmail")} style={styles.recoveryButton}>
                <MaterialCommunityIcons name="email-search-outline" size={16} color={colors.primary} />
                <Text style={styles.recoveryText}>Email oublie</Text>
              </TouchableOpacity>
            </View>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              <Text style={styles.loginButtonText}>{isSubmitting ? "Connexion..." : "Se connecter"}</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.footerText}>
            Pas encore de compte ?{" "}
            <Text style={styles.footerAction} onPress={() => navigate("Register")}>
              Creer un compte
            </Text>
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
  },
  flexOne: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 22,
    paddingVertical: 38,
  },
  headerBlock: {
    marginBottom: 34,
  },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    shadowColor: colors.ring,
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 12 },
    borderWidth: 1,
    borderColor: colors.primaryBorder,
  },
  logoInner: {
    width: 44,
    height: 44,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoText: {
    fontSize: 17,
    color: colors.white,
    fontWeight: "900",
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginBottom: 8,
    letterSpacing: 1,
  },
  title: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: "900",
    color: colors.gray900,
  },
  subtitle: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 21,
    color: colors.gray500,
    maxWidth: 320,
  },
  form: {
    gap: 17,
  },
  label: {
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "700",
    color: colors.gray700,
  },
  inputShell: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.gray900,
  },
  passwordWrapper: {
    minHeight: 54,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingLeft: 15,
    paddingRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.gray900,
  },
  passwordToggle: {
    width: 38,
    height: 38,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  recoveryActions: {
    flexDirection: "row",
    gap: 10,
  },
  recoveryButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surfaceStrong,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
  },
  recoveryText: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.primary,
    textAlign: "center",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.lg,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
  },
  loginButton: {
    marginTop: 2,
    borderRadius: radii.xl,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ring,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  footerText: {
    marginTop: 30,
    textAlign: "center",
    fontSize: 14,
    color: colors.gray500,
  },
  footerAction: {
    fontWeight: "800",
    color: colors.primary,
  },
});

export default Login;
