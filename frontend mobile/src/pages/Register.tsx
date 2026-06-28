import { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
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

const paymentRules = [
  ["Payment Obligation", "All invoices, subscriptions, service fees, and amounts related to the use of the application must be paid on or before the due date shown in the app or invoice."],
  ["Late Payment Penalty", "If payment is not completed on time, a late payment penalty of [X]% may be added to the outstanding amount, according to the payment rules applied in the application."],
  ["Account Suspension", "In case of unpaid invoices or delayed payment, the company reserves the right to temporarily suspend or restrict access to the application until the full payment is received."],
  ["Payment Reminders", "The client may receive one or more reminders by notification, email, phone, or any other communication method available in the application."],
  ["Legal Recovery", "If payment is still not completed after reminders, the company reserves the right to transfer the case to a lawyer, debt collection service, or any competent legal authority."],
  ["Additional Costs", "Any legal, administrative, recovery, lawyer, or collection fees caused by non-payment may be charged to the client, where permitted by law."],
] as const;

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
  const [showTerms, setShowTerms] = useState(false);
  const [termsConfirmed, setTermsConfirmed] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const clearError = () => {
    if (errorMessage) setErrorMessage("");
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

    if (!termsAccepted) {
      setErrorMessage("Veuillez lire et accepter les conditions de paiement.");
      setShowTerms(true);
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
        termsAccepted: true,
        address: address.trim() || undefined,
      });

      navigate("EmailVerification", { email: auth.email ?? email.trim() });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Echec de creation du compte.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.orbTop} />
      <View style={styles.orbLeft} />
      <View style={styles.orbBottom} />
      <KeyboardAvoidingView style={styles.flexOne} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.topBar}>
            <Pressable onPress={() => navigate("Login")} style={styles.backButton}>
              <MaterialCommunityIcons name="arrow-left" size={19} color={colors.white} />
            </Pressable>
            <View style={styles.invitePill}>
              <MaterialCommunityIcons name="diamond-stone" size={14} color="#E8DDFF" />
              <Text style={styles.inviteText}>Founding member access</Text>
            </View>
          </View>

          <View style={styles.hero}>
            <View style={styles.identityStack}>
              <View style={styles.identityCardLarge}>
                <View style={styles.identityIcon}>
                  <MaterialCommunityIcons name="fingerprint" size={28} color={colors.white} />
                </View>
                <Text style={styles.identityTitle}>Onboarding prive</Text>
                <Text style={styles.identityCopy}>Verification, credit profile and card readiness in one polished flow.</Text>
              </View>
              <View style={styles.identityCardSmall}>
                <MaterialCommunityIcons name="check-decagram" size={18} color={colors.success} />
                <Text style={styles.identitySmallText}>Email verification next</Text>
              </View>
            </View>

            <Text style={styles.title}>Ouvrez votre portefeuille CreditTN.</Text>
            <Text style={styles.subtitle}>Un compte moderne pour acheter maintenant, payer intelligemment et batir votre reputation financiere.</Text>
          </View>

          <View style={styles.formPanel}>
            <View style={styles.nameGrid}>
              <View style={styles.compactField}>
                <Text style={styles.floatingLabel}>Prenom</Text>
                <TextInput
                  value={firstName}
                  onChangeText={(value) => {
                    setFirstName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Rayen"
                  placeholderTextColor="#646E8F"
                />
              </View>

              <View style={styles.compactField}>
                <Text style={styles.floatingLabel}>Nom</Text>
                <TextInput
                  value={lastName}
                  onChangeText={(value) => {
                    setLastName(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Ben Ali"
                  placeholderTextColor="#646E8F"
                />
              </View>
            </View>

            <View style={styles.fieldShell}>
              <Text style={styles.floatingLabel}>Email</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="email-outline" size={19} color="#A99CFF" />
                <TextInput
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="vous@exemple.com"
                  placeholderTextColor="#646E8F"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.fieldShell}>
              <Text style={styles.floatingLabel}>Adresse</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="map-marker-outline" size={19} color="#A99CFF" />
                <TextInput
                  value={address}
                  onChangeText={(value) => {
                    setAddress(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Ville, quartier"
                  placeholderTextColor="#646E8F"
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
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="8 caracteres minimum"
                  placeholderTextColor="#646E8F"
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)} style={styles.iconButton}>
                  <MaterialCommunityIcons name={showPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <View style={styles.fieldShell}>
              <Text style={styles.floatingLabel}>Confirmation</Text>
              <View style={styles.inputRow}>
                <MaterialCommunityIcons name="shield-key-outline" size={19} color="#A99CFF" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={(value) => {
                    setConfirmPassword(value);
                    clearError();
                  }}
                  style={styles.input}
                  placeholder="Repeter le mot de passe"
                  placeholderTextColor="#646E8F"
                  secureTextEntry={!showConfirmPassword}
                />
                <Pressable onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.iconButton}>
                  <MaterialCommunityIcons name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} size={20} color={colors.white} />
                </Pressable>
              </View>
            </View>

            {!!errorMessage && (
              <View style={styles.errorCard}>
                <MaterialCommunityIcons name="alert-circle-outline" size={17} color={colors.error} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            <View style={styles.termsSummary}>
              <View style={styles.termsSummaryText}>
                <Text style={styles.termsSummaryTitle}>Client Terms &amp; Payment Rules</Text>
                <Text style={styles.termsSummaryCopy}>
                  Read and accept the payment rules before creating your account.
                </Text>
              </View>
              <Pressable
                onPress={() => {
                  setTermsConfirmed(termsAccepted);
                  setShowTerms(true);
                }}
                style={[styles.termsLink, termsAccepted && styles.termsLinkAccepted]}
              >
                <Text style={styles.termsLinkText}>{termsAccepted ? "Accepted" : "Read terms"}</Text>
              </Pressable>
            </View>

            <View style={styles.ctaBlock}>
              <TouchableOpacity
                style={[styles.primaryButton, (isSubmitting || !termsAccepted) && styles.buttonDisabled]}
                activeOpacity={0.9}
                onPress={handleRegister}
                disabled={isSubmitting || !termsAccepted}
              >
                <Text style={styles.primaryButtonText}>{isSubmitting ? "Creation..." : "Creer mon compte"}</Text>
                <MaterialCommunityIcons name="arrow-right" size={19} color={colors.white} />
              </TouchableOpacity>
              <Text style={styles.legalText}>Compte protege par verification email et controles de securite CreditTN.</Text>
            </View>
          </View>

          <Pressable style={styles.footerLink} onPress={() => navigate("Login")}>
            <Text style={styles.footerMuted}>Vous avez deja un compte</Text>
            <Text style={styles.footerAction}>Se connecter</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={showTerms} transparent animationType="slide" onRequestClose={() => setShowTerms(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Client Terms &amp; Payment Rules</Text>
                <Text style={styles.modalIntro}>
                  Before creating an account and using the application, please read and accept the following terms.
                </Text>
              </View>
              <Pressable onPress={() => setShowTerms(false)} style={styles.modalClose}>
                <MaterialCommunityIcons name="close" size={22} color={colors.white} />
              </Pressable>
            </View>

            <ScrollView style={styles.rulesScroll} contentContainerStyle={styles.rulesContent}>
              {paymentRules.map(([title, body], index) => (
                <View key={title} style={styles.ruleBlock}>
                  <Text style={styles.ruleTitle}>{index + 1}. {title}</Text>
                  <Text style={styles.ruleBody}>{body}</Text>
                </View>
              ))}

              <View style={styles.confirmationBlock}>
                <Text style={styles.confirmationTitle}>Confirmation</Text>
                <Pressable
                  onPress={() => setTermsConfirmed((value) => !value)}
                  style={styles.confirmationRow}
                >
                  <MaterialCommunityIcons
                    name={termsConfirmed ? "checkbox-marked" : "checkbox-blank-outline"}
                    size={24}
                    color={termsConfirmed ? "#A99CFF" : colors.mutedForeground}
                  />
                  <Text style={styles.confirmationText}>
                    I have read, understood, and agree to the Client Terms &amp; Payment Rules.
                  </Text>
                </Pressable>
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <Pressable
                onPress={() => {
                  setTermsConfirmed(false);
                  setTermsAccepted(false);
                  setShowTerms(false);
                }}
                style={styles.refuseButton}
              >
                <Text style={styles.refuseButtonText}>Refuse</Text>
              </Pressable>
              <Pressable
                disabled={!termsConfirmed}
                onPress={() => {
                  setTermsAccepted(true);
                  setShowTerms(false);
                  clearError();
                }}
                style={[styles.acceptButton, !termsConfirmed && styles.buttonDisabled]}
              >
                <Text style={styles.acceptButtonText}>Accept</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    paddingTop: 14,
    paddingBottom: 26,
  },
  orbTop: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(139, 92, 246, 0.32)",
    top: -110,
    right: -120,
  },
  orbLeft: {
    position: "absolute",
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(45, 212, 255, 0.12)",
    top: 170,
    left: -145,
  },
  orbBottom: {
    position: "absolute",
    width: 360,
    height: 260,
    borderRadius: 180,
    backgroundColor: "rgba(183, 140, 255, 0.10)",
    bottom: -160,
    alignSelf: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  invitePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radii.full,
    backgroundColor: "rgba(139, 92, 246, 0.18)",
    borderWidth: 1,
    borderColor: "rgba(183, 140, 255, 0.28)",
  },
  inviteText: {
    color: "#E8DDFF",
    fontSize: 11,
    fontWeight: "900",
  },
  hero: {
    marginTop: 22,
    gap: 18,
  },
  identityStack: {
    height: 166,
  },
  identityCardLarge: {
    width: "86%",
    minHeight: 140,
    borderRadius: 30,
    padding: 18,
    backgroundColor: "rgba(17, 20, 39, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: colors.ring,
    shadowOpacity: 0.28,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  identityIcon: {
    width: 48,
    height: 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#8B5CF6",
    marginBottom: 15,
  },
  identityTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  identityCopy: {
    marginTop: 6,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "700",
    maxWidth: 230,
  },
  identityCardSmall: {
    position: "absolute",
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 22,
    backgroundColor: "rgba(5, 8, 22, 0.86)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.13)",
  },
  identitySmallText: {
    color: colors.gray800,
    fontSize: 12,
    fontWeight: "900",
  },
  title: {
    maxWidth: 345,
    color: colors.white,
    fontSize: 36,
    lineHeight: 41,
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
    marginTop: 24,
    gap: 13,
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
  nameGrid: {
    flexDirection: "row",
    gap: 10,
  },
  compactField: {
    flex: 1,
    minHeight: 68,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingTop: 10,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
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
  termsSummary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 20,
    padding: 13,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
  },
  termsSummaryText: {
    flex: 1,
  },
  termsSummaryTitle: {
    color: colors.white,
    fontSize: 12,
    fontWeight: "900",
  },
  termsSummaryCopy: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
  },
  termsLink: {
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 9,
    backgroundColor: "rgba(139, 92, 246, 0.22)",
  },
  termsLinkAccepted: {
    backgroundColor: "rgba(34, 197, 94, 0.18)",
  },
  termsLinkText: {
    color: "#E8DDFF",
    fontSize: 11,
    fontWeight: "900",
  },
  ctaBlock: {
    gap: 10,
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
  legalText: {
    color: colors.mutedForeground,
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    fontWeight: "700",
    paddingHorizontal: 12,
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
  modalBackdrop: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.76)",
  },
  modalCard: {
    maxHeight: "92%",
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    backgroundColor: "#11162A",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.10)",
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    color: colors.white,
    fontSize: 19,
    fontWeight: "900",
  },
  modalIntro: {
    marginTop: 6,
    color: colors.mutedForeground,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "600",
  },
  modalClose: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  rulesScroll: {
    flexShrink: 1,
  },
  rulesContent: {
    padding: 20,
    gap: 17,
  },
  ruleBlock: {
    gap: 5,
  },
  ruleTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  ruleBody: {
    color: "#C7CCE0",
    fontSize: 12,
    lineHeight: 19,
    fontWeight: "600",
  },
  confirmationBlock: {
    gap: 10,
    paddingTop: 18,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
  },
  confirmationTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  confirmationRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 18,
    padding: 14,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.11)",
  },
  confirmationText: {
    flex: 1,
    color: "#E2E5F2",
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700",
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.10)",
  },
  refuseButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
  },
  refuseButtonText: {
    color: "#E2E5F2",
    fontSize: 14,
    fontWeight: "900",
  },
  acceptButton: {
    flex: 1,
    minHeight: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 18,
    backgroundColor: "#8B5CF6",
  },
  acceptButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
});

export default Register;
