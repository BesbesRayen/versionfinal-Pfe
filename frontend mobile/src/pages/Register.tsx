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
import { register } from "@/lib/api";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const Register = () => {
  const { navigate } = useAppNavigation();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const clearError = () => {
    if (errorMessage) {
      setErrorMessage("");
    }
  };

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Le mot de passe doit contenir au moins 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const auth = await register({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        address: address.trim() || undefined,
      });

      // Don't set auth token yet — user must verify email first
      navigate("EmailVerification", { email: auth.email ?? email.trim() });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de creation du compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.headerBlock}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="account-plus-outline" size={27} color={colors.white} />
            </View>

            <Text style={styles.title}>Creer votre compte</Text>
            <Text style={styles.subtitle}>Inscrivez-vous pour commencer avec CreditTN</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.row}>
              <View style={styles.halfField}>
                <Text style={styles.label}>PRENOM</Text>
                <TextInput
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Prenom"
                  placeholderTextColor="#6b6b80"
                />
              </View>

              <View style={styles.halfField}>
                <Text style={styles.label}>NOM</Text>
                <TextInput
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Nom"
                  placeholderTextColor="#6b6b80"
                />
              </View>
            </View>

            <View>
              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearError();
                }}
                style={styles.input}
                placeholder="vous@exemple.com"
                placeholderTextColor="#6b6b80"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View>
              <Text style={styles.label}>ADRESSE (OPTIONNEL)</Text>
              <TextInput
                value={address}
                onChangeText={(value) => {
                  setAddress(value);
                  clearError();
                }}
                style={styles.input}
                placeholder="Ville, quartier..."
                placeholderTextColor="#6b6b80"
              />
            </View>
            <View>
              <Text style={styles.label}>MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="lock-outline" size={18} color={colors.gray400} />
                <TextInput
                  value={password}
                  onChangeText={(value) => {
                    setPassword(value);
                    clearError();
                  }}
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6b6b80"
                  secureTextEntry={!showPassword}
                />
                <Pressable
                  onPress={() => setShowPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                >
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <View>
              <Text style={styles.label}>CONFIRMER LE MOT DE PASSE</Text>
              <View style={styles.passwordWrapper}>
                <MaterialCommunityIcons name="shield-key-outline" size={18} color={colors.gray400} />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearError();
                  }}
                  style={styles.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor="#6b6b80"
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  style={styles.passwordToggle}
                >
                  <MaterialCommunityIcons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={19} color={colors.primary} />
                </Pressable>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.registerButton, isSubmitting && styles.registerButtonDisabled]}
              activeOpacity={0.9}
              onPress={handleRegister}
              disabled={isSubmitting}
            >
              <Text style={styles.registerButtonText}>
                {isSubmitting ? "Creation..." : "Creer un compte"}
              </Text>
            </TouchableOpacity>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}
          </View>

          <Text style={styles.footerText}>
            Vous avez deja un compte?{" "}
            <Text style={styles.footerAction} onPress={() => navigate("Login")}>
              Se connecter
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
    paddingVertical: 34,
  },
  headerBlock: {
    marginBottom: 32,
  },
  logoBox: {
    width: 60,
    height: 60,
    borderRadius: 22,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    shadowColor: colors.ring,
    shadowOpacity: 0.32,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  title: {
    fontSize: 31,
    lineHeight: 37,
    fontWeight: "900",
    color: colors.gray900,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: colors.gray500,
  },
  form: {
    gap: 16,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  halfField: {
    flex: 1,
  },
  label: {
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    color: colors.gray700,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: 15,
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
    height: 38,
    width: 38,
    borderRadius: radii.full,
    backgroundColor: colors.primarySoft,
    alignItems: "center",
    justifyContent: "center",
  },
  registerButton: {
    marginTop: 8,
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    shadowColor: colors.ring,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  registerButtonDisabled: {
    opacity: 0.7,
  },
  registerButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: "800",
  },
  errorCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: radii.xl,
    padding: 12,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  footerText: {
    marginTop: 26,
    textAlign: "center",
    color: colors.gray500,
    fontSize: 14,
  },
  footerAction: {
    color: colors.primary,
    fontWeight: "700",
  },
});

export default Register;
