import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { FadeInView, MiniStat, ProgressRing, SkeletonLine } from "@/components/FintechUI";
import { AppRoute, useAppNavigation } from "@/lib/app-navigation";
import {
  getCreadiScoreLatest,
  getCreditBalance,
  getKycStatus,
  getMyInstallments,
  getMyPayments,
  getProfile,
  getAutopayStatus,
  processDueAutopayments,
  getUnreadNotificationCount,
  getPopularArticles,
  CreditBalanceResult,
  Installment,
  KycStatusResult,
  PartnerArticle,
  Payment,
  RiskLevel,
  UserProfile,
  API_BASE_URL,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const quickActions: Array<{ label: string; route: AppRoute; icon: string; color: string }> = [
  { label: "Creadi Score", route: "CreadiScore", icon: "speedometer", color: "#16a34a" },
  { label: "Boutique", route: "Shops", icon: "storefront-outline", color: "#6C63FF" },
  { label: "Mobile Pay", route: "Installments", icon: "cellphone-check", color: "#55D6A5" },
  { label: "Paiements", route: "Installments", icon: "receipt-text-outline", color: "#F59E0B" },
];

const toMoney = (value?: number) => `${(value ?? 0).toFixed(2)} DT`;

const toPrettyDate = (dateIso?: string) => {
  if (!dateIso) {
    return "-";
  }
  const date = new Date(dateIso);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const getInstallmentPriority = (status: Installment["status"]) => {
  if (status === "OVERDUE") {
    return 0;
  }
  if (status === "PENDING") {
    return 1;
  }
  return 2;
};

const Home = () => {
  const { navigate } = useAppNavigation();
  const { user, creditSyncVersion } = useAuth();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [score, setScore] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceResult | null>(null);
  const [riskLevel, setRiskLevel] = useState<RiskLevel | null>(null);
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [popularArticles, setPopularArticles] = useState<PartnerArticle[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (silent = false) => {
    if (!user) {
      setLoading(false);
      return;
    }

      if (!silent) setLoading(true);
      setErrorMessage("");
      try {
        const autopay = await getAutopayStatus(user.userId).catch(() => ({ enabled: false }));
        if (autopay.enabled) {
          await processDueAutopayments(user.userId).catch(() => null);
        }
        const [installmentData, paymentData, scoreData, unreadData, kycData, profileData, balanceData, popularData] = await Promise.all([
          getMyInstallments(user.userId),
          getMyPayments(user.userId),
          getCreadiScoreLatest(user.userId).catch(() => null),
          getUnreadNotificationCount(user.userId).catch(() => 0),
          getKycStatus(user.userId).catch(() => null),
          getProfile(user.userId).catch(() => null),
          getCreditBalance(user.userId).catch(() => null),
          getPopularArticles(3).catch(() => [] as PartnerArticle[]),
        ]);

        setInstallments(installmentData);
        setPayments(paymentData);
        setScore(scoreData?.score ?? null);
        setCreditBalance(balanceData);
        setRiskLevel(scoreData?.risk ?? null);
        setKycStatus(kycData?.status ?? null);
        setUnreadCount(unreadData);
        setProfile(profileData);
        setPopularArticles(popularData);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : "Impossible de charger le tableau de bord.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, creditSyncVersion]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };

  const nextInstallment = useMemo(() => {
    const dueItems = installments
      .filter((item) => item.status === "PENDING" || item.status === "OVERDUE")
      .sort((a, b) => {
        const statusDelta = getInstallmentPriority(a.status) - getInstallmentPriority(b.status);
        if (statusDelta !== 0) {
          return statusDelta;
        }
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });

    return dueItems[0] ?? null;
  }, [installments]);

  const recentPayments = useMemo(
    () =>
      [...payments]
        .sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime())
        .slice(0, 3),
    [payments],
  );

  const activeLoanCount = useMemo(
    () =>
      new Set(
        installments
          .filter((item) => item.status === "PENDING" || item.status === "OVERDUE")
          .map((item) => item.creditRequestId),
      ).size,
    [installments],
  );

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.centerBox}>
          <Text style={styles.emptyTitle}>Session expiree</Text>
          <Text style={styles.emptySubtitle}>Connectez-vous pour charger vos donnees.</Text>
          <Pressable style={styles.primarySmall} onPress={() => navigate("Login")}>
            <Text style={styles.primarySmallText}>Aller a la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            {profile?.profilePhotoUrl ? (
              <Image source={{ uri: `${API_BASE_URL}${profile.profilePhotoUrl}` }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}><Text style={styles.avatarText}>{`${user.firstName[0] ?? "U"}${user.lastName[0] ?? "S"}`}</Text></View>
            )}
            <View>
              <Text style={styles.hello}>Bonjour</Text>
              <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
            </View>
          </View>
          <Pressable style={styles.bell} onPress={() => navigate("Notifications")}>
            <MaterialCommunityIcons
              name={unreadCount > 0 ? "bell-badge" : "bell-outline"}
              size={18}
              color={unreadCount > 0 ? colors.primary : colors.gray500}
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
              </View>
            )}
          </Pressable>
        </View>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

        {loading && (
          <View style={styles.skeletonCard}>
            <SkeletonLine width="42%" />
            <SkeletonLine height={30} width="70%" />
            <SkeletonLine height={10} />
          </View>
        )}

        {/* Credit overview */}
        {(() => {
          const limit = creditBalance?.totalLimit ?? 0;
          const used = creditBalance?.usedCredit ?? 0;
          const available = creditBalance?.availableCredit ?? (limit - used);
          const usedPct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
          const barColor = usedPct >= 80 ? colors.error : usedPct >= 50 ? colors.warning : colors.success;
          return (
            <FadeInView>
            <View style={styles.creditMainCard}>
              <View style={styles.creditMainHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.creditMainLabel}>Pouvoir d'achat</Text>
                  <Text style={styles.creditMainLimit}>{toMoney(limit)}</Text>
                  <Text style={styles.creditMainSublabel}>Limite totale</Text>
                </View>
                <View style={styles.creditMainRight}>
                  <ProgressRing percent={usedPct} size={82} color={barColor} label="utilise" />
                </View>
              </View>
              <View style={styles.creditBarTrack}>
                <View style={[styles.creditBarFill, { width: `${usedPct}%`, backgroundColor: barColor }]} />
              </View>
              <View style={styles.creditBarRow}>
                <Text style={styles.creditBarPct}>{usedPct}% utilise</Text>
                <Text style={styles.creditAvailText}>
                  <Text style={styles.creditAvailAmount}>{toMoney(available)}</Text>
                  {" disponible"}
                </Text>
              </View>
              {nextInstallment && (
                <View style={styles.creditNextRow}>
                  <MaterialCommunityIcons name="calendar-clock" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.creditNextText}>
                    Prochain paiement : <Text style={{ fontWeight: "800" }}>{toMoney(nextInstallment.amount)}</Text>
                    {" le "}<Text style={{ fontWeight: "800" }}>{toPrettyDate(nextInstallment.dueDate)}</Text>
                  </Text>
                  <Pressable style={styles.creditPayBtn} onPress={() => navigate("Installments")}>
                    <Text style={styles.creditPayBtnText}>Payer</Text>
                  </Pressable>
                </View>
              )}
            </View>
            </FadeInView>
          );
        })()}

        <View style={styles.insightGrid}>
          <MiniStat label="Credits actifs" value={String(activeLoanCount)} icon="format-list-checks" color={colors.primary} />
          <MiniStat label="Prochaine date" value={nextInstallment ? toPrettyDate(nextInstallment.dueDate) : "-"} icon="calendar-clock" color={colors.warning} />
        </View>

        <View style={styles.analyticsCard}>
          <View style={styles.analyticsHeader}>
            <View>
              <Text style={styles.analyticsLabel}>Analyse mensuelle</Text>
              <Text style={styles.analyticsTitle}>Depenses financees</Text>
            </View>
            <Text style={styles.analyticsAmount}>{toMoney(payments
              .filter((payment) => new Date(payment.paidAt).getMonth() === new Date().getMonth())
              .reduce((sum, payment) => sum + payment.amount, 0))}</Text>
          </View>
          <View style={styles.analyticsBars}>
            {[0.32, 0.56, 0.44, 0.72, 0.38, 0.84].map((height, index) => (
              <View key={index} style={styles.analyticsBarTrack}>
                <View style={[styles.analyticsBarFill, { height: `${height * 100}%` }]} />
              </View>
            ))}
          </View>
        </View>

        {/* Credit health */}
        {(() => {
          const isGood = riskLevel === "LOW" || (score !== null && score >= 700);
          const isMed  = riskLevel === "MODERATE" || (score !== null && score >= 500 && score < 700);
          const isRisk = riskLevel === "HIGH" || riskLevel === "CRITICAL" || (score !== null && score < 500);
          const label  = isGood ? "Bonne sante" : isMed ? "Moyen" : isRisk ? "A risque" : "En evaluation";
          const icon   = isGood ? "shield-check" : isMed ? "shield-alert" : isRisk ? "shield-off" : "shield-outline";
          const bg     = isGood ? "#0d2818" : isMed ? "#2d1f00" : isRisk ? "#2d0a0a" : colors.surface;
          const fg     = isGood ? colors.success : isMed ? colors.warning : isRisk ? colors.error : colors.gray500;
          return (
            <View style={[styles.healthCard, { backgroundColor: bg, borderColor: fg + "44" }]}>
              <MaterialCommunityIcons name={icon as never} size={28} color={fg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.healthTitle}>Sante du Credit</Text>
                <Text style={[styles.healthLabel, { color: fg }]}>{label}</Text>
              </View>
              {score !== null && (
                <Pressable onPress={() => navigate("CreadiScore")}>
                  <Text style={[styles.healthScore, { color: fg }]}>{score}/1000</Text>
                  <Text style={styles.healthScoreSub}>Score</Text>
                </Pressable>
              )}
            </View>
          );
        })()}

        {kycStatus === "VERIFIED" ? (
          <View style={styles.kycVERIFIEDCard}>
            <MaterialCommunityIcons name="shield-check" size={16} color={colors.success} />
            <Text style={styles.kycVERIFIEDText}>Identite verifiee</Text>
          </View>
        ) : (
          <Pressable style={styles.kycCard} onPress={() => navigate("Kyc")}>
            <MaterialCommunityIcons name="shield-check-outline" size={16} color={colors.primary} />
            <Text style={styles.kycPendingText}>Verifier votre identite</Text>
            <MaterialCommunityIcons name="chevron-right" size={16} color={colors.gray400} style={{ marginLeft: "auto" }} />
          </Pressable>
        )}

        <Text style={styles.sectionTitle}>Acces rapide</Text>
        <View style={styles.actionRow}>
          {quickActions.map((action) => (
            <Pressable key={action.label} style={styles.actionCard} onPress={() => navigate(action.route)}>
              <View style={[styles.actionIconWrap, { backgroundColor: action.color }]}>
                <MaterialCommunityIcons name={action.icon as never} size={18} color="#fff" />
              </View>
              <Text style={styles.actionLabel}>{action.label}</Text>
            </Pressable>
          ))}
        </View>

        <Pressable style={styles.ctaButton} onPress={() => navigate("Credit")}>
          <MaterialCommunityIcons name="cash-fast" size={18} color="#fff" />
          <Text style={styles.ctaText}>Demander un credit maintenant</Text>
        </Pressable>

        {/* Popular products */}
        {popularArticles.length > 0 && (
          <>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Produits Populaires</Text>
              <Pressable onPress={() => navigate("Shops")}><Text style={styles.link}>Voir plus</Text></Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
              {popularArticles.map((article) => (
                <Pressable
                  key={`popular-${article.id}-${article.boutiqueName}`}
                  style={styles.popularCard}
                  onPress={() => navigate("Credit", { prefillAmount: article.price, productName: article.productName })}
                >
                  {article.imageUrl ? (
                    <Image source={{ uri: article.imageUrl }} style={styles.popularImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.popularImage, { backgroundColor: colors.gray300, alignItems: "center", justifyContent: "center" }]}>
                      <MaterialCommunityIcons name="image-off-outline" size={24} color={colors.gray500} />
                    </View>
                  )}
                  <View style={styles.popularInfo}>
                    <Text style={styles.popularName} numberOfLines={2}>{article.productName}</Text>
                    <Text style={styles.popularShop} numberOfLines={1}>{article.boutiqueName}</Text>
                    <Text style={styles.popularPrice}>{article.price.toLocaleString("fr-TN")} TND</Text>
                    <Pressable
                      style={styles.popularBuy}
                      onPress={() => navigate("Credit", { prefillAmount: article.price, productName: article.productName })}
                    >
                      <Text style={styles.popularBuyText}>Acheter</Text>
                    </Pressable>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
          </>
        )}

        <Text style={styles.sectionTitle}>Recents</Text>
        <View style={styles.listCard}>
          {recentPayments.map((txn) => (
            <View key={txn.id} style={styles.listRow}>
              <View>
                <Text style={styles.txnLabel}>{`Paiement #${txn.installmentId}`}</Text>
                <Text style={styles.txnDate}>{toPrettyDate(txn.paidAt)}</Text>
              </View>
              <Text style={styles.txnAmount}>{`-${toMoney(txn.amount)}`}</Text>
            </View>
          ))}
          {recentPayments.length === 0 && <Text style={styles.emptyListText}>Aucun paiement recent.</Text>}
        </View>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: { width: 48, height: 48, borderRadius: radii.xl, backgroundColor: colors.primary, alignItems: "center", justifyContent: "center" },
  avatarImage: { width: 48, height: 48, borderRadius: radii.xl },
  avatarText: { color: colors.white, fontWeight: "700" },
  hello: { fontSize: 12, color: colors.gray500 },
  name: { fontSize: 15, fontWeight: "700", color: colors.gray900 },
  bell: { width: 40, height: 40, borderRadius: radii.lg, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, alignItems: "center", justifyContent: "center" },
  bellBadge: { position: "absolute", top: -4, right: -4, backgroundColor: colors.error, borderRadius: 8, minWidth: 16, height: 16, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  bellBadgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  // Credit main card
  creditMainCard: { backgroundColor: colors.primary, borderRadius: radii.xxl, padding: 20, shadowColor: colors.primary, shadowOpacity: 0.3, shadowRadius: 16, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  creditMainHead: { flexDirection: "row", alignItems: "flex-start", marginBottom: 14 },
  creditMainLabel: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  creditMainLimit: { color: "#ffffff", fontSize: 32, fontWeight: "800", marginTop: 4 },
  creditMainSublabel: { color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: 2 },
  creditMainRight: { alignItems: "flex-end" },
  creditUsedLabel: { color: "rgba(255,255,255,0.6)", fontSize: 11 },
  creditUsedValue: { color: "#fff", fontSize: 18, fontWeight: "800", marginTop: 2 },
  creditBarTrack: { height: 8, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.2)", overflow: "hidden", marginBottom: 6 },
  creditBarFill: { height: "100%", borderRadius: 6 },
  creditBarRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  creditBarPct: { color: "rgba(255,255,255,0.7)", fontSize: 11, fontWeight: "700" },
  creditAvailText: { color: "rgba(255,255,255,0.7)", fontSize: 11 },
  creditAvailAmount: { color: "#ffffff", fontWeight: "800" },
  creditNextRow: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.15)", flexDirection: "row", alignItems: "center", gap: 6 },
  creditNextText: { flex: 1, color: "rgba(255,255,255,0.85)", fontSize: 12 },
  creditPayBtn: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 7, paddingHorizontal: 14, borderRadius: radii.md },
  creditPayBtnText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  insightGrid: { flexDirection: "row", gap: 10 },
  insightCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 14, minHeight: 96, justifyContent: "center", gap: 6 },
  insightValue: { fontSize: 18, fontWeight: "800", color: colors.gray900 },
  insightLabel: { fontSize: 11, fontWeight: "700", color: colors.gray500 },

  // ── Credit health card ──
  healthCard: { borderRadius: radii.xl, borderWidth: 1.5, padding: 16, flexDirection: "row", alignItems: "center", gap: 14 },
  healthTitle: { fontSize: 11, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  healthLabel: { fontSize: 17, fontWeight: "800", marginTop: 3 },
  healthScore: { fontSize: 20, fontWeight: "800", textAlign: "right" },
  healthScoreSub: { fontSize: 10, color: colors.gray500, textAlign: "right", fontWeight: "700", textTransform: "uppercase" },

  primarySmall: { backgroundColor: "rgba(255,255,255,0.2)", paddingVertical: 8, paddingHorizontal: 16, borderRadius: radii.md },
  primarySmallText: { color: colors.white, fontWeight: "700", fontSize: 12 },
  kycCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.primary + "30", borderRadius: radii.lg, padding: 12 },
  kycPendingText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  kycVERIFIEDCard: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#0d2818", borderWidth: 1, borderColor: colors.success + "30", borderRadius: radii.lg, padding: 12 },
  kycVERIFIEDText: { fontSize: 12, fontWeight: "700", color: colors.success },
  sectionTitle: { fontSize: 12, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionCard: { flex: 1, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, padding: 12, minHeight: 92, justifyContent: "center", alignItems: "center", gap: 8 },
  actionIconWrap: { width: 34, height: 34, borderRadius: radii.md, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 11, textAlign: "center", fontWeight: "700", color: colors.gray900 },
  ctaButton: { marginTop: 2, backgroundColor: colors.accent, borderRadius: radii.xl, paddingVertical: 13, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  ctaText: { color: colors.white, fontWeight: "700" },
  sectionHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  link: { color: colors.primary, fontWeight: "700", fontSize: 12 },
  listCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, overflow: "hidden" },
  listRow: { paddingHorizontal: 14, paddingVertical: 12, flexDirection: "row", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: colors.gray100 },
  txnLabel: { fontSize: 13, fontWeight: "600", color: colors.gray900 },
  txnDate: { fontSize: 11, color: colors.gray500, marginTop: 2 },
  txnAmount: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  emptyListText: { paddingHorizontal: 14, paddingVertical: 12, fontSize: 12, color: colors.gray500 },
  infoText: { fontSize: 12, color: colors.gray500, marginBottom: 6 },
  errorText: { fontSize: 12, color: colors.error, marginBottom: 6 },
  skeletonCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xxl, padding: 18, gap: 12 },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },
  emptySubtitle: { fontSize: 13, color: colors.gray500, textAlign: "center" },

  // Popular products
  popularCard: { width: 148, backgroundColor: colors.card, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  popularImage: { width: 148, height: 110 },
  popularInfo: { padding: 10, gap: 4 },
  popularName: { fontSize: 12, fontWeight: "700", color: colors.gray900, lineHeight: 16 },
  popularShop: { fontSize: 10, color: colors.gray500 },
  popularPrice: { fontSize: 13, fontWeight: "800", color: colors.primary },
  popularBuy: { marginTop: 6, backgroundColor: colors.primary, borderRadius: radii.md, paddingVertical: 7, alignItems: "center" },
  popularBuyText: { color: colors.white, fontSize: 11, fontWeight: "800" },
  analyticsCard: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 16, gap: 14 },
  analyticsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  analyticsLabel: { fontSize: 10, color: colors.primary, fontWeight: "900", textTransform: "uppercase" },
  analyticsTitle: { marginTop: 4, fontSize: 15, color: colors.gray900, fontWeight: "900" },
  analyticsAmount: { fontSize: 17, color: colors.success, fontWeight: "900", fontVariant: ["tabular-nums"] },
  analyticsBars: { height: 78, flexDirection: "row", alignItems: "flex-end", gap: 8 },
  analyticsBarTrack: { flex: 1, height: "100%", borderRadius: radii.full, backgroundColor: colors.surface, overflow: "hidden", justifyContent: "flex-end" },
  analyticsBarFill: { width: "100%", borderRadius: radii.full, backgroundColor: colors.primary },
});

export default Home;

