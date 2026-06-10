import { ReactNode, useCallback, useEffect, useState } from "react";
import { Alert, AppState, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { FadeInView, ProgressRing } from "@/components/FintechUI";
import { useAppNavigation } from "@/lib/app-navigation";
import {
  API_BASE_URL,
  AccountStatus,
  deleteAccount,
  getAccountStatus,
  getAutopayStatus,
  getCards,
  getCreditBalance,
  getCreadiScoreLatest,
  getFinancialProfile,
  getKycStatus,
  getProfile,
  KycStatusResult,
  processDueAutopayments,
  processOverdueInstallments,
  processWalletRecharge,
  setAuthToken,
  setAutopay,
  uploadProfilePhoto,
  UserProfile,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const KYC_STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; icon: IconName }> = {
  VERIFIED: { label: "Verifie", bg: "rgba(36, 224, 164, 0.15)", text: colors.success, icon: "check-decagram" },
  PENDING: { label: "En attente", bg: "rgba(247, 198, 107, 0.15)", text: colors.warning, icon: "clock-outline" },
  PENDING_MANUAL_REVIEW: { label: "En revue", bg: "rgba(247, 198, 107, 0.15)", text: colors.warning, icon: "account-search-outline" },
  PROVIDER_FAILED: { label: "En revue", bg: "rgba(247, 198, 107, 0.15)", text: colors.warning, icon: "account-search-outline" },
  REJECTED: { label: "Refuse", bg: "rgba(255, 107, 138, 0.15)", text: colors.error, icon: "close-circle-outline" },
  NOT_SUBMITTED: { label: "Non soumis", bg: "rgba(255, 255, 255, 0.07)", text: colors.mutedForeground, icon: "alert-circle-outline" },
};

const toLocalDateString = (date = new Date()) => {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isDateDue = (dueDate: string | null | undefined, today: string) => {
  if (!dueDate) return false;
  return dueDate.slice(0, 10) <= today;
};

const money = (value?: number | null) => `${(value ?? 0).toFixed(2)} DT`;

const GlassCard = ({ children, style }: { children: ReactNode; style?: object }) => (
  <View style={[styles.glassCard, style]}>{children}</View>
);

const MetricTile = ({ label, value, icon, tone }: { label: string; value: string; icon: IconName; tone: string }) => (
  <View style={styles.metricTile}>
    <View style={[styles.metricIcon, { backgroundColor: `${tone}20`, borderColor: `${tone}3A` }]}>
      <MaterialCommunityIcons name={icon} size={18} color={tone} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue} numberOfLines={1}>{value}</Text>
  </View>
);

const SettingRow = ({
  icon,
  title,
  subtitle,
  tone = colors.primary,
  onPress,
  right,
}: {
  icon: IconName;
  title: string;
  subtitle?: string;
  tone?: string;
  onPress?: () => void;
  right?: ReactNode;
}) => (
  <Pressable onPress={onPress} disabled={!onPress} style={({ pressed }) => [styles.settingRow, pressed && styles.rowPressed]}>
    <View style={styles.settingLeft}>
      <View style={[styles.settingIcon, { backgroundColor: `${tone}1F`, borderColor: `${tone}36` }]}>
        <MaterialCommunityIcons name={icon} size={18} color={tone} />
      </View>
      <View style={styles.settingCopy}>
        <Text style={styles.settingTitle}>{title}</Text>
        {!!subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
    </View>
    {right ?? <MaterialCommunityIcons name="chevron-right" size={20} color="#7D88A8" />}
  </Pressable>
);

const Profile = () => {
  const { navigate } = useAppNavigation();
  const { user, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [kyc, setKyc] = useState<KycStatusResult | null>(null);
  const [hasCard, setHasCard] = useState<boolean | null>(null);
  const [hasFinancialProfile, setHasFinancialProfile] = useState<boolean | null>(null);
  const [accountStatus, setAccountStatus] = useState<AccountStatus | null>(null);
  const [creditBalance, setCreditBalance] = useState<{
    buyingPowerLimit?: number;
    totalLimit: number;
    outstandingBalance?: number;
    usedCredit: number;
    availableCredit: number;
    usedPercent?: number;
  } | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [autopayEnabled, setAutopayEnabled] = useState(false);
  const [savingAutopay, setSavingAutopay] = useState(false);
  const [showAutopayPasswordModal, setShowAutopayPasswordModal] = useState(false);
  const [autopayPassword, setAutopayPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = useCallback(async (silent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

    if (!silent) setLoading(true);
    setErrorMessage("");
    try {
      const localToday = toLocalDateString();
      await processOverdueInstallments(user.userId, localToday).catch(() => null);
      await processWalletRecharge(user.userId, localToday).catch((error) => {
        setErrorMessage(error instanceof Error ? error.message : "Recharge mensuelle impossible.");
        return null;
      });

      const [profileData, kycData, cardsData, finProfileData, accountStatusData, autopayData, balanceData, scoreData] =
        await Promise.all([
          getProfile(user.userId),
          getKycStatus(user.userId).catch(() => undefined),
          getCards(user.userId).catch(() => undefined),
          getFinancialProfile(user.userId).catch(() => undefined),
          getAccountStatus(user.userId).catch(() => undefined),
          getAutopayStatus(user.userId).catch(() => undefined),
          getCreditBalance(user.userId).catch(() => undefined),
          getCreadiScoreLatest(user.userId).catch(() => undefined),
        ]);
      let latestAccountStatus = accountStatusData;

      if (autopayData?.enabled && isDateDue(accountStatusData?.nextInstallmentDate, localToday)) {
        await processDueAutopayments(user.userId, localToday).catch((error) => {
          setErrorMessage(error instanceof Error ? error.message : "Paiement automatique impossible.");
          return null;
        });
        latestAccountStatus = await getAccountStatus(user.userId).catch(() => accountStatusData);
      }

      setProfile(profileData);
      if (kycData !== undefined) setKyc(kycData);
      if (cardsData !== undefined) setHasCard(cardsData.length > 0);
      if (finProfileData !== undefined) setHasFinancialProfile(finProfileData !== null);
      if (latestAccountStatus !== undefined) setAccountStatus(latestAccountStatus);
      if (autopayData !== undefined) setAutopayEnabled(autopayData.enabled);
      if (balanceData !== undefined) setCreditBalance(balanceData);
      if (scoreData !== undefined) setScore(scoreData?.score ?? null);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger votre profil.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    if (!user) return;

    const processBillingForPhoneDate = async () => {
      const localToday = toLocalDateString();

      try {
        await processOverdueInstallments(user.userId, localToday);
        await processWalletRecharge(user.userId, localToday);
        if (autopayEnabled && isDateDue(accountStatus?.nextInstallmentDate, localToday)) {
          await processDueAutopayments(user.userId, localToday);
        }
        const refreshed = await getAccountStatus(user.userId).catch(() => null);
        if (refreshed) setAccountStatus(refreshed);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Traitement mensuel impossible.");
      }
    };

    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void processBillingForPhoneDate();
    });

    void processBillingForPhoneDate();

    return () => subscription.remove();
  }, [accountStatus?.nextInstallmentDate, autopayEnabled, user]);

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <MaterialCommunityIcons name="lock-outline" size={28} color={colors.white} />
          </View>
          <Text style={styles.emptyTitle}>Session requise</Text>
          <Text style={styles.emptyText}>Connectez-vous pour afficher votre espace client.</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryMiniButton}>
            <Text style={styles.primaryMiniText}>Aller a la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  const firstName = profile?.firstName ?? user.firstName;
  const lastName = profile?.lastName ?? user.lastName;
  const email = profile?.email ?? user.email;
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  const profilePhotoUrl = profile?.profilePhotoUrl;
  const kycLabel = kyc?.status ?? profile?.kycStatus ?? "NOT_SUBMITTED";
  const kycConfig = KYC_STATUS_CONFIG[kycLabel] ?? KYC_STATUS_CONFIG.NOT_SUBMITTED;
  const isGoodPayer = kycLabel === "VERIFIED" && !!hasCard && !!hasFinancialProfile;
  const buyingPowerLimit = creditBalance?.buyingPowerLimit ?? creditBalance?.totalLimit ?? 0;
  const outstandingBalance = creditBalance?.outstandingBalance ?? creditBalance?.usedCredit ?? 0;
  const availableBalance = creditBalance?.availableCredit ?? Math.max(0, buyingPowerLimit - outstandingBalance);
  const usedPercent = creditBalance?.usedPercent ?? (buyingPowerLimit > 0 ? (outstandingBalance / buyingPowerLimit) * 100 : 0);
  const nextDate = accountStatus?.nextInstallmentDate
    ? new Date(accountStatus.nextInstallmentDate).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })
    : "Aucune";
  const payerTone = accountStatus?.payerStatus === "BON_PAYEUR" ? colors.success : accountStatus?.payerStatus === "RISQUE" ? colors.error : colors.warning;
  const payerLabel = accountStatus?.payerStatus === "BON_PAYEUR" ? "Bon payeur" : accountStatus?.payerStatus === "RISQUE" ? "Risque" : "Neutre";

  const handlePickPhoto = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      try {
        const updatedProfile = await uploadProfilePhoto(user.userId, {
          uri: asset.uri,
          fileName: asset.fileName ?? "profile.jpg",
          mimeType: asset.mimeType ?? "image/jpeg",
        });
        setProfile(updatedProfile);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Echec de l'upload.");
      } finally {
        setUploading(false);
      }
    } catch {
      setErrorMessage("Impossible d'ouvrir la galerie.");
    }
  };

  const updateAutopay = async (value: boolean, password?: string) => {
    if (savingAutopay) return;
    setAutopayEnabled(value);
    setSavingAutopay(true);
    try {
      const response = await setAutopay(user.userId, value, password);
      let paidInstallments = response.data?.paidInstallments ?? 0;

      if (value) {
        const localToday = toLocalDateString();
        const dueResponse = await processDueAutopayments(user.userId, localToday);
        paidInstallments += dueResponse.data?.paidInstallments ?? 0;
        const refreshed = await getAccountStatus(user.userId).catch(() => null);
        if (refreshed) setAccountStatus(refreshed);
      }

      Alert.alert(
        value ? "Paiement automatique actif" : "Paiement automatique inactif",
        value && paidInstallments > 0
          ? `${response.message || "Le paiement automatique est actif."} ${paidInstallments} paiement(s) automatique(s) traite(s).`
          : response.message || (value ? "Le paiement automatique est actif." : "Le paiement automatique est inactif."),
      );
    } catch (error) {
      setAutopayEnabled(!value);
      Alert.alert("Mise a jour impossible", error instanceof Error ? error.message : "Veuillez reessayer.");
    } finally {
      setSavingAutopay(false);
    }
  };

  const handleToggleAutopay = (value: boolean) => {
    if (value) {
      setAutopayPassword("");
      setShowAutopayPasswordModal(true);
      return;
    }
    void updateAutopay(false);
  };

  const setupSteps = [
    { label: "Identite KYC", done: kycLabel === "VERIFIED", route: "Kyc" as const },
    { label: "Carte active", done: !!hasCard, route: "Cards" as const },
    { label: "Profil financier", done: !!hasFinancialProfile, route: "FinancialProfile" as const },
  ];

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(true); }} tintColor={colors.primary} />}
      >
        <View style={styles.pageHeader}>
          <View>
            <Text style={styles.eyebrow}>Private banking profile</Text>
            <Text style={styles.title}>Bonsoir, {firstName}</Text>
          </View>
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={17} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        <FadeInView>
          <View style={styles.profileHero}>
            <View style={styles.heroGlow} />
            <View style={styles.heroTop}>
              <Pressable onPress={handlePickPhoto} style={styles.avatarWrap}>
                {profilePhotoUrl ? (
                  <Image source={{ uri: `${API_BASE_URL}${profilePhotoUrl}` }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                )}
                <View style={styles.cameraIcon}>
                  <MaterialCommunityIcons name="camera" size={12} color={colors.white} />
                </View>
                {uploading && <View style={styles.avatarOverlay}><Text style={styles.avatarOverlayText}>...</Text></View>}
              </Pressable>

              <View style={styles.profileIdentity}>
                <Text style={styles.userName}>{`${firstName} ${lastName}`}</Text>
                <Text style={styles.userMail}>{email}</Text>
              </View>

              <View style={[styles.kycBadge, { backgroundColor: kycConfig.bg, borderColor: `${kycConfig.text}38` }]}>
                <MaterialCommunityIcons name={kycConfig.icon} size={13} color={kycConfig.text} />
                <Text style={[styles.kycBadgeText, { color: kycConfig.text }]}>{kycConfig.label}</Text>
              </View>
            </View>

            <View style={styles.heroBalanceRow}>
              <View style={styles.heroBalanceCopy}>
                <Text style={styles.heroBalanceLabel}>Disponible</Text>
                <Text style={styles.heroBalance}>{money(availableBalance)}</Text>
                <Text style={styles.heroBalanceSub}>
                  Pouvoir d'achat: {money(buyingPowerLimit)} - Utilise: {money(outstandingBalance)}
                </Text>
              </View>
              <View style={styles.heroProgressRing}>
                <ProgressRing percent={usedPercent} size={70} strokeWidth={7} color={colors.primary} label="utilise" />
              </View>
            </View>

            <View style={styles.statusStrip}>
              <View style={[styles.statusDot, { backgroundColor: payerTone }]} />
              <Text style={styles.statusStripText}>{isGoodPayer ? "Profil premium pret a financer" : "Completez le profil pour debloquer plus de limite"}</Text>
            </View>
          </View>
        </FadeInView>

        <View style={styles.metricGrid}>
          <MetricTile label="Score" value={score !== null ? `${score}` : loading ? "..." : "-"} icon="speedometer" tone={colors.primary} />
          <MetricTile label="Echeances" value={accountStatus ? `${accountStatus.paidCount}/${accountStatus.totalCount}` : loading ? "..." : "-"} icon="calendar-check-outline" tone={colors.success} />
          <MetricTile label="Statut" value={payerLabel} icon="shield-check-outline" tone={payerTone} />
        </View>

        <GlassCard style={styles.paymentCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Cashflow</Text>
              <Text style={styles.sectionTitle}>Prochaine echeance</Text>
            </View>
            <Pressable style={styles.tinyAction} onPress={() => navigate("PaymentHistory")}>
              <Text style={styles.tinyActionText}>Historique</Text>
            </Pressable>
          </View>

          <View style={[styles.duePanel, accountStatus?.overdueCount > 0 && styles.duePanelDanger]}>
            <View style={styles.dueIcon}>
              <MaterialCommunityIcons name={accountStatus?.overdueCount > 0 ? "alert-outline" : "calendar-clock"} size={21} color={accountStatus?.overdueCount > 0 ? colors.error : colors.primary} />
            </View>
            <View style={styles.dueCopy}>
              <Text style={styles.dueLabel}>{accountStatus?.overdueCount > 0 ? "Retard detecte" : "Debit programme"}</Text>
              <Text style={styles.dueDate}>{nextDate}</Text>
            </View>
            <Text style={[styles.dueAmount, accountStatus?.overdueCount > 0 && { color: colors.error }]}>
              {money(accountStatus?.nextInstallmentAmount)}
            </Text>
          </View>
        </GlassCard>

        {(!hasCard || !hasFinancialProfile || kycLabel !== "VERIFIED") && (
          <GlassCard style={styles.setupCard}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={styles.sectionKicker}>Activation</Text>
                <Text style={styles.sectionTitle}> 3 Step de Verification </Text>
              </View>
              <Text style={styles.setupProgress}>{setupSteps.filter((step) => step.done).length}/3</Text>
            </View>
            <View style={styles.setupRail}>
              {setupSteps.map((step) => (
                <Pressable key={step.label} style={styles.setupStep} onPress={() => !step.done && navigate(step.route)}>
                  <View style={[styles.setupNode, step.done && styles.setupNodeDone]}>
                    <MaterialCommunityIcons name={step.done ? "check" : "plus"} size={13} color={step.done ? colors.white : colors.mutedForeground} />
                  </View>
                  <Text style={[styles.setupLabel, step.done && styles.setupLabelDone]}>{step.label}</Text>
                  <Text style={[styles.setupState, step.done ? styles.setupStateDone : styles.setupStateTodo]}>{step.done ? "Pret" : "A faire"}</Text>
                </Pressable>
              ))}
            </View>
          </GlassCard>
        )}

        <GlassCard style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Wallet controls</Text>
              <Text style={styles.sectionTitle}>Paiements</Text>
            </View>
          </View>
          <SettingRow icon="credit-card-outline" title="Moyens de paiement" subtitle="Cartes Visa / Mastercard" onPress={() => navigate("Cards")} tone={colors.primary} />
          <SettingRow
            icon="autorenew"
            title="Paiement automatique"
            subtitle={autopayEnabled ? "Actif - echeances traitees automatiquement" : "Inactif - paiement manuel"}
            tone={colors.success}
            right={
              <Switch
                value={autopayEnabled}
                onValueChange={handleToggleAutopay}
                disabled={savingAutopay}
                thumbColor={colors.white}
                trackColor={{ false: "rgba(255, 255, 255, 0.13)", true: "rgba(36, 224, 164, 0.42)" }}
              />
            }
          />
        </GlassCard>

        <GlassCard style={styles.settingsCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionKicker}>Apple-style settings</Text>
              <Text style={styles.sectionTitle}>Compte</Text>
            </View>
          </View>
          <SettingRow icon="account-outline" title="Informations personnelles" subtitle="Identite, adresse et coordonnees" onPress={() => navigate("PersonalInformation")} />
          <SettingRow icon="speedometer" title="Score de credit" subtitle="Niveau, risque et recommandations" onPress={() => navigate("CreadiScore")} tone="#2DD4FF" />
          <SettingRow icon="format-list-bulleted" title="Mes echeances" subtitle="Calendrier et paiements restants" onPress={() => navigate("Installments")} tone={colors.success} />
          <SettingRow icon="lock-reset" title="Mot de passe oublie" subtitle="Recevoir un code de reinitialisation" onPress={() => navigate("ForgotPassword")} tone="#E8DDFF" />
          <SettingRow icon="email-search-outline" title="Email oublie" subtitle="Retrouver ou modifier votre email" onPress={() => navigate("ForgotEmail")} tone="#E8DDFF" />
          <SettingRow icon="lifebuoy" title="Aide et support" subtitle="Tickets, FAQ et assistance" onPress={() => navigate("Support")} tone={colors.warning} />
        </GlassCard>

        <GlassCard style={styles.dangerCard}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionKicker, { color: colors.error }]}>Danger zone</Text>
              <Text style={styles.sectionTitle}>Actions sensibles</Text>
            </View>
          </View>
          <Pressable
            onPress={() => {
              setAuthToken(null);
              logout();
              navigate("Login");
            }}
            style={styles.logoutButton}
          >
            <MaterialCommunityIcons name="logout" size={17} color={colors.error} />
            <Text style={styles.logoutText}>Se deconnecter</Text>
          </Pressable>
          <Pressable
            onPress={() => { setDeleteConfirmInput(""); setShowDeleteModal(true); }}
            style={styles.deleteButton}
            disabled={deletingAccount}
          >
            <MaterialCommunityIcons name="delete-outline" size={17} color={colors.white} />
            <Text style={styles.deleteText}>{deletingAccount ? "Suppression..." : "Supprimer le compte"}</Text>
          </Pressable>
        </GlassCard>

        <Modal visible={showDeleteModal} transparent animationType="fade" onRequestClose={() => setShowDeleteModal(false)}>
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons name="alert-outline" size={26} color={colors.error} />
              </View>
              <Text style={styles.modalTitle}>Supprimer le compte</Text>
              <Text style={styles.modalBody}>
                Cette action est irreversible. Toutes vos donnees seront supprimees. Pour confirmer, tapez supprimer.
              </Text>
              <TextInput
                style={[styles.modalInput, deleteConfirmInput === "supprimer" && styles.modalInputOk]}
                value={deleteConfirmInput}
                onChangeText={setDeleteConfirmInput}
                placeholder="supprimer"
                placeholderTextColor={colors.gray500}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalActions}>
                <Pressable style={styles.modalCancelBtn} onPress={() => { setShowDeleteModal(false); setDeleteConfirmInput(""); }}>
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalDeleteBtn, deleteConfirmInput !== "supprimer" && styles.modalDeleteBtnOff]}
                  disabled={deleteConfirmInput !== "supprimer" || deletingAccount}
                  onPress={async () => {
                    setDeletingAccount(true);
                    setShowDeleteModal(false);
                    try {
                      await deleteAccount(user.userId);
                      setAuthToken(null);
                      logout();
                      navigate("Login");
                    } catch (err) {
                      const msg = err instanceof Error ? err.message : "Une erreur est survenue.";
                      const hasInstallments = msg.includes("echeance") || msg.includes("installment") || msg.includes("pending");
                      Alert.alert(
                        "Suppression impossible",
                        hasInstallments
                          ? "Vous avez des echeances en cours. Reglez-les avant de supprimer votre compte."
                          : msg,
                        hasInstallments
                          ? [
                              { text: "Fermer", style: "cancel" },
                              { text: "Voir mes echeances", onPress: () => navigate("Installments") },
                            ]
                          : [{ text: "OK" }],
                      );
                    } finally {
                      setDeletingAccount(false);
                    }
                  }}
                >
                  <Text style={styles.modalDeleteText}>{deletingAccount ? "Suppression..." : "Confirmer"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
        <Modal
          visible={showAutopayPasswordModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowAutopayPasswordModal(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <View style={styles.modalIcon}>
                <MaterialCommunityIcons name="shield-lock-outline" size={26} color={colors.primary} />
              </View>
              <Text style={styles.modalTitle}>Activer le paiement automatique</Text>
              <Text style={styles.modalBody}>
                Confirmez le mot de passe de votre compte avant d'autoriser les paiements automatiques.
              </Text>
              <TextInput
                style={styles.modalInput}
                value={autopayPassword}
                onChangeText={setAutopayPassword}
                placeholder="Mot de passe"
                placeholderTextColor={colors.gray500}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.modalActions}>
                <Pressable
                  style={styles.modalCancelBtn}
                  onPress={() => { setShowAutopayPasswordModal(false); setAutopayPassword(""); }}
                >
                  <Text style={styles.modalCancelText}>Annuler</Text>
                </Pressable>
                <Pressable
                  style={[styles.modalDeleteBtn, !autopayPassword.trim() && styles.modalDeleteBtnOff]}
                  disabled={!autopayPassword.trim() || savingAutopay}
                  onPress={async () => {
                    const password = autopayPassword;
                    setShowAutopayPasswordModal(false);
                    setAutopayPassword("");
                    await updateAutopay(true, password);
                  }}
                >
                  <Text style={styles.modalDeleteText}>{savingAutopay ? "Verification..." : "Activer"}</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 126,
    gap: 16,
  },
  pageHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  eyebrow: {
    color: "#A99CFF",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  title: {
    marginTop: 5,
    color: colors.white,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: "900",
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 20,
    padding: 13,
  },
  errorText: {
    flex: 1,
    color: colors.error,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  profileHero: {
    minHeight: 286,
    borderRadius: 34,
    padding: 18,
    overflow: "hidden",
    backgroundColor: "rgba(17, 20, 39, 0.88)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.16)",
    shadowColor: colors.ring,
    shadowOpacity: 0.28,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 22 },
  },
  heroGlow: {
    position: "absolute",
    width: 250,
    height: 250,
    borderRadius: 125,
    top: -105,
    right: -105,
    backgroundColor: "rgba(139, 92, 246, 0.34)",
  },
  heroTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 26,
    backgroundColor: "#8B5CF6",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
  },
  avatarImage: {
    width: 66,
    height: 66,
    borderRadius: 26,
  },
  avatarText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: "900",
  },
  cameraIcon: {
    position: "absolute",
    right: -2,
    bottom: -2,
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: "#101426",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    backgroundColor: "rgba(0, 0, 0, 0.48)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOverlayText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  profileIdentity: {
    flex: 1,
  },
  userName: {
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  userMail: {
    marginTop: 4,
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "700",
  },
  kycBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  kycBadgeText: {
    fontSize: 10,
    fontWeight: "900",
  },
  heroBalanceRow: {
    marginTop: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 14,
  },
  heroBalanceCopy: {
    flex: 1,
    minWidth: 0,
  },
  heroProgressRing: {
    width: 70,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  heroBalanceLabel: {
    color: "#BDB5FF",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  heroBalance: {
    marginTop: 7,
    color: colors.white,
    fontSize: 35,
    lineHeight: 40,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  heroBalanceSub: {
    marginTop: 5,
    color: colors.mutedForeground,
    fontSize: 12,
    fontWeight: "800",
  },
  statusStrip: {
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    padding: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  statusDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
  },
  statusStripText: {
    flex: 1,
    color: colors.gray800,
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "800",
  },
  metricGrid: {
    flexDirection: "row",
    gap: 10,
  },
  metricTile: {
    flex: 1,
    minHeight: 118,
    borderRadius: 26,
    padding: 12,
    backgroundColor: "rgba(12, 16, 34, 0.76)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  metricLabel: {
    marginTop: 12,
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  metricValue: {
    marginTop: 5,
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
  },
  glassCard: {
    borderRadius: 28,
    padding: 16,
    backgroundColor: "rgba(12, 16, 34, 0.78)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    shadowColor: colors.shadow,
    shadowOpacity: 0.30,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 16 },
  },
  paymentCard: {
    gap: 14,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    marginBottom: 10,
  },
  sectionKicker: {
    color: "#A99CFF",
    fontSize: 10,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  sectionTitle: {
    marginTop: 4,
    color: colors.white,
    fontSize: 18,
    fontWeight: "900",
  },
  tinyAction: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    backgroundColor: "rgba(139, 92, 246, 0.17)",
    borderWidth: 1,
    borderColor: "rgba(183, 140, 255, 0.26)",
  },
  tinyActionText: {
    color: "#E8DDFF",
    fontSize: 11,
    fontWeight: "900",
  },
  duePanel: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 13,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.055)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.10)",
  },
  duePanelDanger: {
    backgroundColor: colors.errorLight,
    borderColor: colors.errorBorder,
  },
  dueIcon: {
    width: 42,
    height: 42,
    borderRadius: 18,
    backgroundColor: "rgba(139, 92, 246, 0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  dueCopy: {
    flex: 1,
  },
  dueLabel: {
    color: colors.mutedForeground,
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  dueDate: {
    marginTop: 5,
    color: colors.white,
    fontSize: 17,
    fontWeight: "900",
  },
  dueAmount: {
    color: colors.primary,
    fontSize: 17,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  setupCard: {
    gap: 4,
  },
  setupProgress: {
    color: "#E8DDFF",
    fontSize: 13,
    fontWeight: "900",
  },
  setupRail: {
    gap: 9,
  },
  setupStep: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minHeight: 48,
    paddingHorizontal: 11,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.045)",
  },
  setupNode: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  setupNodeDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  setupLabel: {
    flex: 1,
    color: colors.mutedForeground,
    fontSize: 13,
    fontWeight: "800",
  },
  setupLabelDone: {
    color: colors.white,
  },
  setupState: {
    fontSize: 11,
    fontWeight: "900",
  },
  setupStateDone: {
    color: colors.success,
  },
  setupStateTodo: {
    color: colors.warning,
  },
  settingsCard: {
    gap: 2,
  },
  settingRow: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.075)",
  },
  rowPressed: {
    opacity: 0.78,
  },
  settingLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  settingIcon: {
    width: 38,
    height: 38,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  settingCopy: {
    flex: 1,
  },
  settingTitle: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  settingSubtitle: {
    marginTop: 3,
    color: colors.mutedForeground,
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "700",
  },
  dangerCard: {
    borderColor: "rgba(255, 107, 138, 0.26)",
    gap: 10,
  },
  logoutButton: {
    minHeight: 50,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    backgroundColor: colors.errorLight,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: {
    color: colors.error,
    fontSize: 14,
    fontWeight: "900",
  },
  deleteButton: {
    minHeight: 52,
    borderRadius: 20,
    backgroundColor: colors.error,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    shadowColor: colors.error,
    shadowOpacity: 0.30,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
  },
  deleteText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  emptyIcon: {
    width: 66,
    height: 66,
    borderRadius: 26,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    color: colors.white,
    fontSize: 24,
    fontWeight: "900",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontSize: 14,
    textAlign: "center",
  },
  primaryMiniButton: {
    marginTop: 8,
    borderRadius: 20,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  primaryMiniText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "900",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 390,
    borderRadius: 30,
    padding: 22,
    gap: 14,
    backgroundColor: "#101426",
    borderWidth: 1,
    borderColor: "rgba(255, 107, 138, 0.34)",
  },
  modalIcon: {
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 22,
    backgroundColor: colors.errorLight,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    color: colors.white,
    fontSize: 21,
    fontWeight: "900",
    textAlign: "center",
  },
  modalBody: {
    color: colors.mutedForeground,
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
    fontWeight: "700",
  },
  modalInput: {
    height: 54,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    paddingHorizontal: 14,
    fontSize: 16,
    color: colors.white,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    textAlign: "center",
    fontWeight: "800",
  },
  modalInputOk: {
    borderColor: colors.error,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.14)",
    paddingVertical: 13,
    alignItems: "center",
  },
  modalCancelText: {
    color: colors.gray700,
    fontWeight: "900",
    fontSize: 14,
  },
  modalDeleteBtn: {
    flex: 1,
    backgroundColor: colors.error,
    borderRadius: 18,
    paddingVertical: 13,
    alignItems: "center",
  },
  modalDeleteBtnOff: {
    opacity: 0.4,
  },
  modalDeleteText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 14,
  },
});

export default Profile;
