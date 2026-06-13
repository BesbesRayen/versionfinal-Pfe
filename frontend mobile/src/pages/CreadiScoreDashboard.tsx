import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import { useAuth } from "@/lib/auth";
import {
  calculateCreadiScore,
  CreditBalanceResult,
  CreadiScoreResult,
  getCreditBalance,
  getCreadiScoreLatest,
  ScoreLevel,
} from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const LEVEL_COLORS: Record<ScoreLevel, string> = {
  EXCELLENT: colors.success,
  GOOD: "#84CC16",
  MEDIUM: colors.warning,
  HIGH_RISK: colors.error,
  CRITICAL: "#FF4770",
};

const LEVEL_LABELS: Record<ScoreLevel, string> = {
  EXCELLENT: "Excellent",
  GOOD: "Bon",
  MEDIUM: "Moyen",
  HIGH_RISK: "Risque eleve",
  CRITICAL: "Critique",
};

const LEVEL_ICONS: Record<ScoreLevel, string> = {
  EXCELLENT: "shield-check",
  GOOD: "shield-half-full",
  MEDIUM: "shield-alert-outline",
  HIGH_RISK: "shield-off-outline",
  CRITICAL: "alert-octagon-outline",
};

const BADGE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  GOLD: { bg: "rgba(247, 198, 107, 0.16)", text: colors.warning, icon: "trophy" },
  SILVER: { bg: "rgba(185, 195, 221, 0.14)", text: colors.gray600, icon: "trophy-variant" },
  BRONZE: { bg: "rgba(249, 115, 22, 0.14)", text: "#FB923C", icon: "trophy-outline" },
};

const MAX_SCORE = 1000;
const RING_SIZE = 176;
const STROKE_WIDTH = 12;
const RADIUS = (RING_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const componentValue = (value: number | undefined | null, max: number) =>
  Math.max(0, Math.min(max, Number.isFinite(Number(value)) ? Number(value) : 0));

const ScoreRing = ({ score, level }: { score: number; level: ScoreLevel }) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const color = LEVEL_COLORS[level];

  useEffect(() => {
    animatedValue.setValue(0);
    Animated.timing(animatedValue, {
      toValue: score / MAX_SCORE,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [animatedValue, score]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  return (
    <View style={styles.ringContainer}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={colors.gray200}
          strokeWidth={STROKE_WIDTH}
          fill="none"
        />
        <AnimatedCircle
          cx={RING_SIZE / 2}
          cy={RING_SIZE / 2}
          r={RADIUS}
          stroke={color}
          strokeWidth={STROKE_WIDTH}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={strokeDashoffset}
          transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={[styles.scoreNumber, { color }]}>{score}</Text>
        <Text style={styles.scoreMax}>sur {MAX_SCORE}</Text>
      </View>
    </View>
  );
};

interface BreakdownBarProps {
  label: string;
  description: string;
  value: number;
  max: number;
  icon: string;
  accent: string;
  pending: boolean;
}

const BreakdownBar = ({
  label,
  description,
  value,
  max,
  icon,
  accent,
  pending,
}: BreakdownBarProps) => {
  const safeValue = componentValue(value, max);
  const percentage = max > 0 ? Math.min((safeValue / max) * 100, 100) : 0;
  const barColor = percentage >= 80
    ? colors.success
    : percentage >= 50
      ? colors.warning
      : colors.error;

  return (
    <View style={styles.breakdownRow}>
      <View style={[styles.breakdownIcon, { backgroundColor: `${accent}18` }]}>
        <MaterialCommunityIcons name={icon as never} size={19} color={accent} />
      </View>
      <View style={styles.breakdownBody}>
        <View style={styles.breakdownTop}>
          <View style={styles.breakdownCopy}>
            <Text style={styles.breakdownLabel}>{label}</Text>
            <Text style={styles.breakdownDescription}>{description}</Text>
          </View>
          <Text style={styles.breakdownValue}>
            {safeValue}<Text style={styles.breakdownMax}>/{max}</Text>
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${pending ? 0 : percentage}%`,
                backgroundColor: pending ? accent : barColor,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
};

const CreadiScoreDashboard = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();
  const userId = user?.userId;
  const [data, setData] = useState<CreadiScoreResult | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchScore = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [score, balance] = await Promise.all([
        getCreadiScoreLatest(userId),
        getCreditBalance(userId),
      ]);
      setData(score);
      setCreditBalance(balance);
    } catch {
      setData(null);
      setCreditBalance(null);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchScore();
  }, [fetchScore]);

  const handleCalculate = async () => {
    if (!userId) return;
    setCalculating(true);
    setError(null);
    try {
      const score = await calculateCreadiScore(userId);
      setData(score);
      setCreditBalance(await getCreditBalance(userId));
    } catch (calculationError) {
      setError(calculationError instanceof Error ? calculationError.message : "Impossible de calculer le score.");
    } finally {
      setCalculating(false);
    }
  };

  const displayScore = data?.score ?? data?.totalScore ?? 0;
  const displayLevel = data?.level ?? "CRITICAL";
  const displayStatus = data?.scoreStatus ?? (data?.score == null ? "INCOMPLETE" : "COMPLETE");
  const isComplete = displayStatus === "COMPLETE";
  const isBlocked = displayStatus === "BLOCKED";
  const levelColor = LEVEL_COLORS[displayLevel];

  const buyingPower = creditBalance?.monthlyCapacityLimit
    ?? data?.buyingPowerLimit
    ?? data?.maxCreditLimit
    ?? 0;
  const availableCredit = creditBalance?.availableMonthlyCapacity ?? buyingPower;
  const outstandingBalance = creditBalance?.monthlyCommittedAmount ?? 0;
  const usedPercent = buyingPower > 0
    ? Math.min(100, (outstandingBalance / buyingPower) * 100)
    : 0;

  const breakdown = [
    {
      label: "Identite KYC",
      description: "Identite et controle biometrique",
      value: componentValue(data?.kycScore, 150),
      max: 150,
      icon: "card-account-details-outline",
      accent: "#8B5CF6",
    },
    {
      label: "Capacite financiere",
      description: "Revenus et ratio d'endettement",
      value: componentValue(data?.financialScore ?? data?.salaryScore, 250),
      max: 250,
      icon: "cash",
      accent: "#2DD4FF",
    },
    {
      label: "Comportement de paiement",
      description: "Ponctualite et historique",
      value: componentValue(data?.paymentBehaviorScore ?? data?.behaviorScore, 400),
      max: 400,
      icon: "chart-timeline-variant",
      accent: "#24E0A4",
    },
    {
      label: "Stabilite",
      description: "Emploi et anciennete du compte",
      value: componentValue(data?.stabilityScore, 100),
      max: 100,
      icon: "account-clock-outline",
      accent: "#F7C66B",
    },
    {
      label: "Evaluation du risque",
      description: "Signaux de securite du profil",
      value: componentValue(data?.riskScore, 100),
      max: 100,
      icon: "shield-alert-outline",
      accent: "#FF6B8A",
    },
  ];

  return (
    <MobileLayout noPadding>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Home")} style={styles.headerButton}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={colors.gray800} />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.headerEyebrow}>SANTE FINANCIERE</Text>
            <Text style={styles.headerTitle}>Creadi Score</Text>
          </View>
          <View style={styles.headerMark}>
            <MaterialCommunityIcons name="shield-star-outline" size={21} color={colors.primary} />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingTitle}>Analyse de votre profil</Text>
            <Text style={styles.loadingText}>Nous preparons votre score personnalise.</Text>
          </View>
        ) : (
          <>
            <View style={[styles.heroCard, !isComplete && styles.heroPending]}>
              {data ? (
                <>
                  {isComplete ? (
                    <>
                      <ScoreRing score={displayScore} level={displayLevel} />
                      <View style={[styles.levelBadge, { backgroundColor: `${levelColor}18` }]}>
                        <MaterialCommunityIcons name={LEVEL_ICONS[displayLevel] as never} size={17} color={levelColor} />
                        <Text style={[styles.levelText, { color: levelColor }]}>{LEVEL_LABELS[displayLevel]}</Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.pendingHero}>
                      <View style={[styles.pendingIcon, isBlocked && styles.pendingIconBlocked]}>
                        <MaterialCommunityIcons
                          name={isBlocked ? "shield-alert-outline" : "chart-donut"}
                          size={34}
                          color={isBlocked ? colors.error : colors.primary}
                        />
                      </View>
                      <View style={styles.pendingCopy}>
                        <View style={styles.pendingBadge}>
                          <View style={[styles.pendingDot, isBlocked && { backgroundColor: colors.error }]} />
                          <Text style={[styles.pendingBadgeText, isBlocked && { color: colors.error }]}>
                            {isBlocked ? "REVUE REQUISE" : "PROFIL INCOMPLET"}
                          </Text>
                        </View>
                        <Text style={styles.pendingTitle}>
                          {isBlocked ? "Score temporairement bloque" : "Votre score est presque pret"}
                        </Text>
                        <Text style={styles.pendingSubtitle}>
                          Completez les informations requises pour activer votre analyse personnalisee.
                        </Text>
                      </View>
                    </View>
                  )}

                  <View style={[styles.reasonBox, !isComplete && styles.reasonBoxPending]}>
                    <MaterialCommunityIcons
                      name={isComplete ? "information-outline" : "progress-alert"}
                      size={17}
                      color={isComplete ? colors.accent : colors.warning}
                    />
                    <Text style={styles.reason}>{data.reason}</Text>
                  </View>

                  {isComplete && data.behaviorAnalysis && (
                    <Text style={styles.behaviorAnalysis}>{data.behaviorAnalysis}</Text>
                  )}

                  {isComplete && data.badge && BADGE_COLORS[data.badge] && (
                    <View style={[styles.memberBadge, { backgroundColor: BADGE_COLORS[data.badge].bg }]}>
                      <MaterialCommunityIcons
                        name={BADGE_COLORS[data.badge].icon as never}
                        size={16}
                        color={BADGE_COLORS[data.badge].text}
                      />
                      <Text style={[styles.memberBadgeText, { color: BADGE_COLORS[data.badge].text }]}>
                        Membre {data.badge}
                      </Text>
                    </View>
                  )}
                </>
              ) : (
                <View style={styles.noScore}>
                  <View style={styles.pendingIcon}>
                    <MaterialCommunityIcons name="speedometer" size={34} color={colors.primary} />
                  </View>
                  <Text style={styles.pendingTitle}>Demarrez votre analyse</Text>
                  <Text style={styles.pendingSubtitle}>
                    Calculez votre Creadi Score pour connaitre votre sante financiere.
                  </Text>
                </View>
              )}

              <Pressable
                style={[styles.calculateButton, calculating && styles.buttonDisabled]}
                onPress={handleCalculate}
                disabled={calculating}
              >
                {calculating ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <MaterialCommunityIcons name="calculator-variant-outline" size={19} color={colors.white} />
                )}
                <Text style={styles.calculateButtonText}>
                  {calculating ? "Calcul en cours..." : data ? "Recalculer mon score" : "Calculer mon score"}
                </Text>
                {!calculating && <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />}
              </Pressable>
              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </View>

            {data && (
              <>
                <View style={styles.card}>
                  <View style={styles.sectionHeadingRow}>
                    <View>
                      <Text style={styles.sectionEyebrow}>CAPACITE DE FINANCEMENT</Text>
                      <Text style={styles.sectionTitleCompact}>Pouvoir d'achat</Text>
                    </View>
                    <View style={[styles.statusChip, buyingPower > 0 ? styles.statusChipReady : styles.statusChipLocked]}>
                      <MaterialCommunityIcons
                        name={buyingPower > 0 ? "check-decagram-outline" : "lock-outline"}
                        size={14}
                        color={buyingPower > 0 ? colors.success : colors.mutedForeground}
                      />
                      <Text style={[styles.statusChipText, { color: buyingPower > 0 ? colors.success : colors.mutedForeground }]}>
                        {buyingPower > 0 ? "Active" : "A debloquer"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.buyingPowerValue}>
                    {buyingPower > 0 ? `${buyingPower.toFixed(2)} TND` : "Non disponible"}
                  </Text>
                  <View style={styles.metricsRow}>
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Solde mensuel</Text>
                      <Text style={styles.metricValue}>{availableCredit.toFixed(2)}</Text>
                      <Text style={styles.metricUnit}>TND</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Echeances du mois</Text>
                      <Text style={styles.metricValue}>{outstandingBalance.toFixed(2)}</Text>
                      <Text style={styles.metricUnit}>TND</Text>
                    </View>
                    <View style={styles.metricDivider} />
                    <View style={styles.metricCell}>
                      <Text style={styles.metricLabel}>Taux</Text>
                      <Text style={styles.metricValue}>{usedPercent.toFixed(1)}</Text>
                      <Text style={styles.metricUnit}>%</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionEyebrow}>ANALYSE DETAILLEE</Text>
                  <Text style={styles.sectionTitle}>Composition du score</Text>
                  <Text style={styles.sectionSubtitle}>
                    Une lecture claire des cinq piliers de votre profil.
                  </Text>
                  <View style={styles.breakdownList}>
                    {breakdown.map((item) => (
                      <BreakdownBar key={item.label} {...item} pending={!isComplete} />
                    ))}
                  </View>
                </View>

                {data.improvementTips.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionEyebrow}>PROCHAINES ETAPES</Text>
                    <Text style={styles.sectionTitle}>Ameliorer mon score</Text>
                    <View style={styles.tipList}>
                      {data.improvementTips.map((tip, index) => (
                        <View key={`${tip}-${index}`} style={styles.tipRow}>
                          <View style={styles.tipNumber}>
                            <Text style={styles.tipNumberText}>{index + 1}</Text>
                          </View>
                          <Text style={styles.tipText}>{tip}</Text>
                        </View>
                      ))}
                    </View>
                    {!isComplete && (
                      <View style={styles.inlineActions}>
                        <Pressable style={styles.inlinePrimary} onPress={() => navigate("Kyc")}>
                          <Text style={styles.inlinePrimaryText}>Completer KYC</Text>
                        </Pressable>
                        <Pressable style={styles.inlineSecondary} onPress={() => navigate("FinancialProfile")}>
                          <Text style={styles.inlineSecondaryText}>Profil financier</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                )}

                {isComplete && data.scoreFactors && data.scoreFactors.length > 0 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionEyebrow}>TRANSPARENCE</Text>
                    <Text style={styles.sectionTitle}>Facteurs d'analyse</Text>
                    {data.scoreFactors.map((factor, index) => (
                      <View key={`${factor}-${index}`} style={styles.factorRow}>
                        <MaterialCommunityIcons name="check-circle-outline" size={17} color={colors.success} />
                        <Text style={styles.factorText}>{factor}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {isComplete && data.history.length > 1 && (
                  <View style={styles.card}>
                    <Text style={styles.sectionEyebrow}>EVOLUTION</Text>
                    <Text style={styles.sectionTitle}>Historique du score</Text>
                    {data.history.slice(0, 5).map((historyItem, index) => (
                      <View key={`${historyItem.date}-${index}`} style={styles.historyRow}>
                        <View style={[styles.historyDot, { backgroundColor: LEVEL_COLORS[historyItem.level] }]} />
                        <Text style={styles.historyScore}>{historyItem.score}</Text>
                        <Text style={styles.historyLevel}>{LEVEL_LABELS[historyItem.level]}</Text>
                        <Text style={styles.historyDate}>
                          {new Date(historyItem.date).toLocaleDateString("fr-TN", { day: "numeric", month: "short" })}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}

                {isComplete && (
                  <View style={styles.actionRow}>
                    <Pressable style={styles.actionCard} onPress={() => navigate("Kyc")}>
                      <View style={styles.actionIcon}>
                        <MaterialCommunityIcons name="card-account-details-outline" size={21} color={colors.primary} />
                      </View>
                      <Text style={styles.actionTitle}>Identite KYC</Text>
                      <Text style={styles.actionSubtitle}>Consulter mon statut</Text>
                    </Pressable>
                    <Pressable style={styles.actionCard} onPress={() => navigate("Credit")}>
                      <View style={[styles.actionIcon, { backgroundColor: colors.accentLight }]}>
                        <MaterialCommunityIcons name="credit-card-outline" size={21} color={colors.accent} />
                      </View>
                      <Text style={styles.actionTitle}>Mon credit</Text>
                      <Text style={styles.actionSubtitle}>Voir ma capacite</Text>
                    </Pressable>
                  </View>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 150, gap: 14 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  headerButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.surfaceStrong,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCopy: { flex: 1 },
  headerEyebrow: { fontSize: 9, letterSpacing: 1.4, fontWeight: "900", color: colors.primary },
  headerTitle: { marginTop: 2, fontSize: 22, fontWeight: "900", color: colors.foreground },
  headerMark: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingCard: {
    minHeight: 280,
    borderRadius: 28,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  loadingTitle: { marginTop: 16, fontSize: 17, fontWeight: "900", color: colors.foreground },
  loadingText: { marginTop: 6, color: colors.mutedForeground, fontSize: 12, textAlign: "center" },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 20,
    alignItems: "center",
    shadowColor: colors.shadow,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
  },
  heroPending: { alignItems: "stretch", borderColor: colors.primaryBorder },
  ringContainer: { width: RING_SIZE, height: RING_SIZE, alignItems: "center", justifyContent: "center" },
  ringCenter: { position: "absolute", alignItems: "center" },
  scoreNumber: { fontSize: 40, fontWeight: "900", letterSpacing: -1.5 },
  scoreMax: { marginTop: -2, fontSize: 11, color: colors.gray500, fontWeight: "700" },
  levelBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 13,
    paddingVertical: 6,
    borderRadius: radii.full,
    marginTop: 10,
  },
  levelText: { fontWeight: "900", fontSize: 12 },
  pendingHero: { flexDirection: "row", alignItems: "center", gap: 14 },
  pendingIcon: {
    width: 64,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primaryBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  pendingIconBlocked: { backgroundColor: colors.errorLight, borderColor: colors.errorBorder },
  pendingCopy: { flex: 1 },
  pendingBadge: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 6 },
  pendingDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.warning },
  pendingBadgeText: { fontSize: 9, letterSpacing: 1.1, fontWeight: "900", color: colors.warning },
  pendingTitle: { fontSize: 19, lineHeight: 24, fontWeight: "900", color: colors.foreground },
  pendingSubtitle: { marginTop: 5, fontSize: 12, lineHeight: 18, color: colors.mutedForeground },
  noScore: { alignItems: "center", gap: 10, paddingVertical: 10 },
  reasonBox: {
    width: "100%",
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    backgroundColor: colors.accentLight,
    borderRadius: 16,
    padding: 12,
    marginTop: 16,
  },
  reasonBoxPending: { backgroundColor: colors.warningSoft },
  reason: { flex: 1, fontSize: 12, color: colors.gray700, lineHeight: 18 },
  behaviorAnalysis: { marginTop: 10, fontSize: 12, color: colors.gray600, textAlign: "center", lineHeight: 18 },
  memberBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: radii.full,
    marginTop: 10,
  },
  memberBadgeText: { fontSize: 11, fontWeight: "900" },
  calculateButton: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
    backgroundColor: colors.primary,
    borderRadius: 17,
    paddingVertical: 15,
    paddingHorizontal: 18,
    marginTop: 16,
    shadowColor: colors.ring,
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 9 },
  },
  calculateButtonText: { flex: 1, textAlign: "center", color: colors.white, fontSize: 14, fontWeight: "900" },
  buttonDisabled: { opacity: 0.65 },
  errorText: { marginTop: 10, color: colors.error, fontSize: 12, textAlign: "center" },
  card: {
    backgroundColor: colors.card,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 18,
    shadowColor: colors.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  sectionHeadingRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  sectionEyebrow: { fontSize: 9, letterSpacing: 1.2, color: colors.primary, fontWeight: "900" },
  sectionTitle: { marginTop: 4, marginBottom: 5, fontSize: 18, fontWeight: "900", color: colors.foreground },
  sectionTitleCompact: { marginTop: 4, fontSize: 17, fontWeight: "900", color: colors.foreground },
  sectionSubtitle: { color: colors.mutedForeground, fontSize: 11, lineHeight: 17 },
  statusChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  statusChipReady: { backgroundColor: colors.successSoft },
  statusChipLocked: { backgroundColor: colors.foregroundSoft },
  statusChipText: { fontSize: 10, fontWeight: "900" },
  buyingPowerValue: { marginTop: 16, fontSize: 29, letterSpacing: -0.8, color: colors.foreground, fontWeight: "900" },
  metricsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 18,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  metricCell: { flex: 1, alignItems: "center" },
  metricDivider: { width: 1, backgroundColor: colors.cardBorder },
  metricLabel: { fontSize: 9, fontWeight: "800", color: colors.mutedForeground, textTransform: "uppercase" },
  metricValue: { marginTop: 5, fontSize: 14, fontWeight: "900", color: colors.foreground },
  metricUnit: { marginTop: 1, fontSize: 9, fontWeight: "700", color: colors.gray500 },
  breakdownList: { marginTop: 14 },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  breakdownIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  breakdownBody: { flex: 1 },
  breakdownTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 9 },
  breakdownCopy: { flex: 1 },
  breakdownLabel: { fontSize: 12, fontWeight: "900", color: colors.gray800 },
  breakdownDescription: { marginTop: 2, fontSize: 9, lineHeight: 13, color: colors.gray500 },
  breakdownValue: { fontSize: 14, fontWeight: "900", color: colors.foreground },
  breakdownMax: { fontSize: 10, color: colors.gray500, fontWeight: "700" },
  progressTrack: { height: 5, borderRadius: radii.full, backgroundColor: colors.surfaceStrong, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: radii.full },
  tipList: { marginTop: 10, gap: 10 },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 11, backgroundColor: colors.surface, borderRadius: 15, padding: 12 },
  tipNumber: { width: 25, height: 25, borderRadius: 9, backgroundColor: colors.warningSoft, alignItems: "center", justifyContent: "center" },
  tipNumberText: { color: colors.warning, fontSize: 11, fontWeight: "900" },
  tipText: { flex: 1, color: colors.gray700, fontSize: 12, lineHeight: 18 },
  inlineActions: { flexDirection: "row", gap: 9, marginTop: 14 },
  inlinePrimary: { flex: 1, backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  inlinePrimaryText: { color: colors.white, fontSize: 11, fontWeight: "900" },
  inlineSecondary: { flex: 1, backgroundColor: colors.surfaceStrong, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: 14, paddingVertical: 12, alignItems: "center" },
  inlineSecondaryText: { color: colors.gray700, fontSize: 11, fontWeight: "900" },
  factorRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, marginTop: 11 },
  factorText: { flex: 1, color: colors.gray700, fontSize: 12, lineHeight: 18 },
  historyRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.cardBorder },
  historyDot: { width: 8, height: 8, borderRadius: 4 },
  historyScore: { width: 48, color: colors.foreground, fontSize: 15, fontWeight: "900" },
  historyLevel: { flex: 1, color: colors.gray600, fontSize: 11 },
  historyDate: { color: colors.gray500, fontSize: 10 },
  actionRow: { flexDirection: "row", gap: 12 },
  actionCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 15,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.primarySoft, alignItems: "center", justifyContent: "center" },
  actionTitle: { marginTop: 12, color: colors.foreground, fontSize: 12, fontWeight: "900" },
  actionSubtitle: { marginTop: 3, color: colors.gray500, fontSize: 9 },
});

export default CreadiScoreDashboard;
