import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import {
  checkoutArticlePurchase,
  CreditBalanceResult,
  getDashboard,
  getCreditBalance,
  PurchaseOrderResult,
  PurchasePaymentType,
  requestCredit,
  simulateCredit,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";
import {
  getPlanComparisons,
  PlanMonths,
  toBackendMoney,
  toDt,
  toInterestPercent,
} from "@/lib/creditPreview";

type Tone = "primary" | "success" | "warning" | "destructive";

const PRESET_AMOUNTS = [100, 500, 1000, 2500, 5000];

const toneColor: Record<Tone, string> = {
  primary: colors.primary,
  success: colors.success,
  warning: colors.warning,
  destructive: colors.destructive,
};

const toneSurface: Record<Tone, string> = {
  primary: colors.primarySoft,
  success: colors.successSoft,
  warning: colors.warningSoft,
  destructive: colors.destructiveSoft,
};

const sanitizeCreditError = (error: unknown) => {
  const message = error instanceof Error ? error.message : "";

  if (/user not found|not found with id|compte introuvable|utilisateur introuvable|database|sql|stack/i.test(message)) {
    return "Compte indisponible temporairement";
  }

  if (/kyc|identit/i.test(message)) {
    return "Votre verification d'identite doit etre validee avant le financement.";
  }

  if (/card|payment method|carte/i.test(message)) {
    return "Ajoutez une carte de paiement pour continuer.";
  }

  if (/financial profile|profil financier|salary|salaire/i.test(message)) {
    return "Completez votre profil financier pour activer le financement.";
  }

  if (/available credit|credit disponible|limit|limite/i.test(message)) {
    return "Votre limite disponible ne couvre pas encore ce montant.";
  }

  return "Impossible de charger vos informations";
};

const SummaryRow = ({
  label,
  value,
  tone,
  strong,
}: {
  label: string;
  value: string;
  tone?: Tone;
  strong?: boolean;
}) => (
  <View style={styles.summaryRow}>
    <Text style={styles.summaryLabel}>{label}</Text>
    <Text style={[styles.summaryValue, tone && { color: toneColor[tone] }, strong && styles.summaryValueStrong]}>
      {value}
    </Text>
  </View>
);

const SoftAlert = ({
  message,
  actionLabel = "Reessayer",
  onAction,
}: {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}) => (
  <View style={styles.alertCard}>
    <View style={styles.alertIcon}>
      <MaterialCommunityIcons name="alert-circle-outline" size={17} color={colors.destructive} />
    </View>
    <View style={styles.alertCopy}>
      <Text style={styles.alertTitle}>{message}</Text>
      <Text style={styles.alertText}>Veuillez reessayer dans quelques instants.</Text>
    </View>
    {onAction && (
      <Pressable onPress={onAction} style={styles.alertButton}>
        <Text style={styles.alertButtonText}>{actionLabel}</Text>
      </Pressable>
    )}
  </View>
);

const MetricCard = ({
  label,
  value,
  helper,
  tone,
  icon,
}: {
  label: string;
  value: string;
  helper: string;
  tone: Tone;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
}) => (
  <View style={styles.metricCard}>
    <View style={[styles.metricIcon, { backgroundColor: toneSurface[tone] }]}>
      <MaterialCommunityIcons name={icon} size={17} color={toneColor[tone]} />
    </View>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricHelper}>{helper}</Text>
  </View>
);

const Credit = () => {
  const { user, creditSyncVersion, triggerCreditSync } = useAuth();
  const { navigate, params } = useAppNavigation();
  const [selectedPrice, setSelectedPrice] = useState(500);
  const [selectedPlan, setSelectedPlan] = useState<PlanMonths>(3);
  const [confirmed, setConfirmed] = useState(false);
  const [requestId, setRequestId] = useState<number | null>(null);
  const [lastOrder, setLastOrder] = useState<PurchaseOrderResult | null>(null);
  const [paymentMode] = useState<PurchasePaymentType>("CREDIT");
  const [creditLimit, setCreditLimit] = useState<number | null>(null);
  const [creditBalance, setCreditBalance] = useState<CreditBalanceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [blockingStep, setBlockingStep] = useState<"ADD_CARD" | "COMPLETE_FINANCIAL_PROFILE" | null>(null);

  const articleId = Number(params?.articleId ?? 0);
  const prefillAmount = Number(params?.prefillAmount ?? 0);
  const hasSelectedProduct = articleId > 0 && prefillAmount > 0;
  const isArticleCheckout = hasSelectedProduct;
  const selectedProductName = String(params?.productName ?? "");
  const selectedBoutiqueName = String(params?.boutiqueName ?? "");
  const selectedProductImage = String(params?.productImageUrl ?? "");

  const downPayment = useMemo(() => toBackendMoney(selectedPrice * 0.2), [selectedPrice]);
  const planComparisons = useMemo(() => getPlanComparisons(selectedPrice, downPayment), [selectedPrice, downPayment]);
  const activePlan = planComparisons.find((plan) => plan.months === selectedPlan) ?? planComparisons[0];
  const isOverLimit = creditLimit !== null && activePlan.principal > creditLimit;
  const noCreditAvailable = creditLimit !== null && creditLimit <= 0;
  const blockingMessage = blockingStep === "ADD_CARD"
    ? "Ajoutez une carte de paiement pour continuer."
    : blockingStep === "COMPLETE_FINANCIAL_PROFILE"
      ? "Completez votre profil financier pour activer le financement."
      : "";

  const loadAccountData = useCallback(async () => {
    if (!user || !hasSelectedProduct) return;

    setErrorMessage("");
    try {
      const [balanceData, dashboard] = await Promise.all([
        getCreditBalance(user.userId),
        getDashboard(user.userId),
      ]);

      setCreditLimit(balanceData.availableCredit);
      setCreditBalance(balanceData);
      setBlockingStep(
        dashboard.nextStep === "ADD_CARD" || dashboard.nextStep === "COMPLETE_FINANCIAL_PROFILE"
          ? dashboard.nextStep
          : null,
      );
    } catch (error) {
      setErrorMessage(sanitizeCreditError(error));
    }
  }, [hasSelectedProduct, user]);

  useEffect(() => {
    loadAccountData();
  }, [loadAccountData, creditSyncVersion]);

  useEffect(() => {
    if (prefillAmount > 0) {
      setSelectedPrice(toBackendMoney(prefillAmount));
    }
  }, [prefillAmount]);

  useEffect(() => {
    if (!user || !hasSelectedProduct) return;

    simulateCredit({
      totalAmount: selectedPrice,
      downPayment,
      numberOfInstallments: selectedPlan,
    }, user.userId).catch(() => {
      // Local calculations keep the preview responsive when the backend is unavailable.
    });
  }, [downPayment, hasSelectedProduct, selectedPlan, selectedPrice, user]);

  const handleConfirmRequest = async () => {
    if (!hasSelectedProduct) {
      navigate("Shops");
      return;
    }

    if (!user) {
      navigate("Login");
      return;
    }

    if (blockingStep) {
      navigate(blockingStep === "ADD_CARD" ? "Cards" : "FinancialProfile");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      if (isArticleCheckout) {
        const order = await checkoutArticlePurchase(user.userId, {
          articleId,
          paymentType: paymentMode,
          installmentMonths: selectedPlan,
          productName: selectedProductName || undefined,
          description: selectedProductName ? `Achat catalogue mobile: ${selectedProductName}` : undefined,
          price: selectedPrice,
          imageUrl: selectedProductImage || undefined,
          boutiqueName: selectedBoutiqueName || undefined,
          category: "PARTNER_CATALOG",
        });
        setLastOrder(order);
        setRequestId(order.id);
      } else {
        const result = await requestCredit(user.userId, {
          totalAmount: selectedPrice,
          downPayment,
          financedAmount: activePlan.principal,
          interestAmount: activePlan.interest,
          interestRate: activePlan.interestRate,
          totalPayable: activePlan.totalRepayable,
          numberOfInstallments: selectedPlan,
          productName: selectedProductName || undefined,
        });
        setLastOrder(null);
        setRequestId(result.id);
      }

      setConfirmed(true);
      await loadAccountData();
      triggerCreditSync();
    } catch (error) {
      setErrorMessage(sanitizeCreditError(error));
    } finally {
      setLoading(false);
    }
  };

  if (!hasSelectedProduct) {
    return (
      <MobileLayout>
        <View style={styles.emptyState}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="shopping-outline" size={30} color={colors.primaryForeground} />
          </View>
          <Text style={styles.emptyTitle}>Aucun produit sélectionné</Text>
          <Text style={styles.emptyText}>
            Choisissez un produit dans la boutique pour consulter les options de financement.
          </Text>
          <Pressable onPress={() => navigate("Shops")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Aller vers Shop</Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color={colors.primaryForeground} />
          </Pressable>
        </View>
        <BottomNav />
      </MobileLayout>
    );
  }

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyState}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="credit-card-outline" size={30} color={colors.primaryForeground} />
          </View>
          <Text style={styles.emptyTitle}>Session requise</Text>
          <Text style={styles.emptyText}>Connectez-vous pour simuler un financement en toute securite.</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Aller a la connexion</Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  if (confirmed) {
    return (
      <MobileLayout>
        <View style={styles.emptyState}>
          <View style={styles.successIcon}>
            <MaterialCommunityIcons name="check-circle-outline" size={34} color={colors.primaryForeground} />
          </View>
          <Text style={styles.emptyTitle}>Financement confirme</Text>
          <Text style={styles.emptyText}>
            {lastOrder ? lastOrder.articleName : "Votre demande"} sur {selectedPlan} mois.
          </Text>
          {requestId !== null && <Text style={styles.referenceText}>Reference #{requestId}</Text>}
          {!!lastOrder?.transactionId && <Text style={styles.referenceText}>{lastOrder.transactionId}</Text>}
          <Pressable onPress={() => setConfirmed(false)} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Nouvelle simulation</Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color={colors.primaryForeground} />
          </Pressable>
        </View>
        <BottomNav />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <View style={styles.kickerRow}>
              <View style={styles.sparkleChip}>
                <MaterialCommunityIcons name="star-four-points-outline" size={14} color={colors.primary} />
              </View>
              <Text style={styles.eyebrow}>CREDIT FLEXIBLE</Text>
            </View>
            <Text style={styles.title}>Financement simple</Text>
            <Text style={styles.subtitle}>Apport aujourd'hui, le reste en mensualites.</Text>
          </View>

          <View style={styles.limitPill}>
            <Text style={styles.limitPillLabel}>Disponible</Text>
            <Text style={styles.limitPillValue}>{toDt(creditBalance?.availableCredit ?? 0)}</Text>
          </View>
        </View>

        {!!errorMessage && <SoftAlert message={errorMessage} onAction={loadAccountData} />}
        {!!blockingMessage && (
          <SoftAlert
            message={blockingMessage}
            actionLabel={blockingStep === "ADD_CARD" ? "Carte" : "Profil"}
            onAction={() => navigate(blockingStep === "ADD_CARD" ? "Cards" : "FinancialProfile")}
          />
        )}

        {!!selectedProductName && (
          <View style={styles.productStrip}>
            <Text style={styles.productLabel}>Article</Text>
            <Text style={styles.productName}>{selectedProductName}</Text>
            {!!selectedBoutiqueName && <Text style={styles.productShop}>{selectedBoutiqueName}</Text>}
          </View>
        )}

        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>Prix de l'article</Text>
          <View style={styles.amountLine}>
            <Text style={styles.heroAmount}>{selectedPrice.toFixed(2)}</Text>
            <Text style={styles.currency}>DT</Text>
          </View>
          {!isArticleCheckout && (
            <View style={styles.amountRow}>
              {PRESET_AMOUNTS.map((value) => {
                const selected = selectedPrice === value;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setSelectedPrice(value)}
                    style={[styles.amountChip, selected && styles.amountChipActive]}
                  >
                    <Text style={[styles.amountChipText, selected && styles.amountChipTextActive]}>{value}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>

        <View style={styles.metricGrid}>
          <MetricCard
            label="A payer aujourd'hui"
            value={toDt(activePlan.downPayment)}
            helper="Apport 20%"
            icon="cash-check"
            tone="success"
          />
          <MetricCard
            label="Montant finance"
            value={toDt(activePlan.principal)}
            helper="Sans l'apport"
            icon="bank-outline"
            tone="primary"
          />
          <MetricCard
            label="Mensualite"
            value={toDt(activePlan.monthly)}
            helper={`${activePlan.months} mois`}
            icon="calendar-outline"
            tone="primary"
          />
          <MetricCard
            label="Cout total"
            value={toDt(activePlan.finalProductCost)}
            helper={activePlan.interest > 0 ? `+${toDt(activePlan.interest)}` : "Sans frais"}
            icon="receipt-text-outline"
            tone={activePlan.interest > 0 ? "warning" : "success"}
          />
        </View>

        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>Choisir un plan</Text>
        </View>

        <View style={styles.planList}>
          {planComparisons.map((plan) => {
            const active = selectedPlan === plan.months;
            const isFree = plan.interestRate === 0;

            return (
              <Pressable
                key={plan.months}
                onPress={() => setSelectedPlan(plan.months)}
                style={[styles.planCard, active && styles.planCardActive]}
              >
                <View style={styles.planTop}>
                  <View>
                    <Text style={styles.planDuration}>{plan.months} mois</Text>
                    <Text style={styles.planMonthly}>{toDt(plan.monthly)} / mois</Text>
                  </View>
                  <View style={[styles.rateBadge, isFree ? styles.successBadge : styles.warningBadge]}>
                    <Text style={[styles.rateBadgeText, isFree ? styles.successBadgeText : styles.warningBadgeText]}>
                      {isFree ? "0% interet" : `Taux ${toInterestPercent(plan.interestRate)}`}
                    </Text>
                  </View>
                </View>

                <View style={styles.planBottom}>
                  <Text style={styles.planMeta}>{isFree ? "Sans frais" : `Interet ${toDt(plan.interest)}`}</Text>
                  <Text style={styles.planTotal}>{toDt(plan.totalRepayable)}</Text>
                </View>

                {isFree && <Text style={styles.cheapestTag}>Le moins cher</Text>}
              </Pressable>
            );
          })}
        </View>

        {isOverLimit && (
          <SoftAlert
            message="Votre limite disponible ne couvre pas encore ce montant."
            onAction={loadAccountData}
          />
        )}

        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Resume de financement</Text>
          <SummaryRow label="Prix de l'article" value={toDt(selectedPrice)} />
          <SummaryRow label="Apport 20%" value={toDt(activePlan.downPayment)} tone="success" />
          <SummaryRow label="Montant finance" value={toDt(activePlan.principal)} />
          <SummaryRow label="Interet total" value={toDt(activePlan.interest)} tone={activePlan.interest > 0 ? "warning" : "success"} />
          <SummaryRow label="Total mensualites" value={toDt(activePlan.totalRepayable)} tone="primary" />
          <SummaryRow label="Total final paye" value={toDt(activePlan.finalProductCost)} strong />

          <Pressable
            onPress={handleConfirmRequest}
            disabled={loading || isOverLimit || noCreditAvailable}
            style={[styles.primaryButton, (loading || isOverLimit || noCreditAvailable) && styles.primaryButtonDisabled]}
          >
            <Text style={styles.primaryButtonText}>
              {loading ? "Traitement..." : isArticleCheckout ? "Acheter avec credit" : "Confirmer la demande"}
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={17} color={colors.primaryForeground} />
          </Pressable>
        </View>
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 118,
    gap: 16,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 14,
  },
  headerCopy: {
    flex: 1,
  },
  kickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sparkleChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.border,
  },
  eyebrow: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0,
  },
  title: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 28,
    fontWeight: "800",
    marginTop: 10,
  },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 6,
    maxWidth: 236,
  },
  limitPill: {
    backgroundColor: colors.card,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
    minWidth: 112,
    shadowColor: colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  limitPillLabel: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "700",
  },
  limitPillValue: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
    marginTop: 2,
    fontVariant: ["tabular-nums"],
  },
  alertCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.destructiveSoft,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.destructiveBorder,
    padding: 12,
  },
  alertIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.foregroundSoft,
  },
  alertCopy: {
    flex: 1,
  },
  alertTitle: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "800",
  },
  alertText: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 11,
    marginTop: 3,
  },
  alertButton: {
    borderRadius: radii.full,
    backgroundColor: colors.foregroundSoft,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  alertButtonText: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "800",
  },
  productStrip: {
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  productLabel: {
    color: colors.primary,
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "800",
  },
  productName: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 15,
    fontWeight: "800",
    marginTop: 5,
  },
  productShop: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 12,
    marginTop: 3,
  },
  heroCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    shadowColor: colors.shadow,
    shadowOpacity: 0.32,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
  },
  heroLabel: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "800",
  },
  amountLine: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginTop: 8,
  },
  heroAmount: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 44,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  currency: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 8,
    marginLeft: 8,
  },
  amountRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 18,
  },
  amountChip: {
    backgroundColor: colors.foregroundSoft,
    borderRadius: radii.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  amountChipActive: {
    backgroundColor: colors.foregroundStrong,
    shadowColor: colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
  },
  amountChipText: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "800",
  },
  amountChipTextActive: {
    color: colors.background,
  },
  metricGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  metricCard: {
    width: "48.5%",
    backgroundColor: colors.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    minHeight: 142,
  },
  metricIcon: {
    width: 34,
    height: 34,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
  },
  metricLabel: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 10,
    fontWeight: "800",
    lineHeight: 14,
  },
  metricValue: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 18,
    fontWeight: "800",
    marginTop: 8,
    fontVariant: ["tabular-nums"],
  },
  metricHelper: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 11,
    marginTop: 4,
  },
  sectionHead: {
    paddingTop: 2,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "800",
  },
  planList: {
    gap: 10,
  },
  planCard: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  planCardActive: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primaryBorder,
    shadowColor: colors.ring,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  planTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  planDuration: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 17,
    fontWeight: "800",
  },
  planMonthly: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 5,
    fontVariant: ["tabular-nums"],
  },
  rateBadge: {
    borderRadius: radii.full,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: "flex-start",
    borderWidth: 1,
  },
  successBadge: {
    backgroundColor: colors.successSoft,
    borderColor: colors.successBorder,
  },
  warningBadge: {
    backgroundColor: colors.warningSoft,
    borderColor: colors.warningBorder,
  },
  rateBadgeText: {
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "800",
  },
  successBadgeText: {
    color: colors.success,
  },
  warningBadgeText: {
    color: colors.warning,
  },
  planBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 14,
  },
  planMeta: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "600",
  },
  planTotal: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
  },
  cheapestTag: {
    color: colors.success,
    fontFamily: "Inter",
    fontSize: 11,
    fontWeight: "800",
    marginTop: 8,
  },
  summaryCard: {
    backgroundColor: colors.card,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
    gap: 12,
  },
  cardTitle: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 2,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
  },
  summaryLabel: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  summaryValue: {
    color: colors.foreground,
    fontFamily: "Inter",
    fontSize: 13,
    fontWeight: "800",
    textAlign: "right",
    fontVariant: ["tabular-nums"],
  },
  summaryValueStrong: {
    fontSize: 15,
    fontWeight: "800",
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
    shadowColor: colors.ring,
    shadowOpacity: 0.34,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: colors.primaryForeground,
    fontFamily: "Inter",
    fontSize: 14,
    fontWeight: "800",
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
    backgroundColor: colors.background,
  },
  emptyTitle: {
    color: colors.foreground,
    fontFamily: "Plus Jakarta Sans",
    fontSize: 24,
    fontWeight: "800",
    textAlign: "center",
  },
  emptyText: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  successIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.ring,
    shadowOpacity: 0.36,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
  },
  referenceText: {
    color: colors.mutedForeground,
    fontFamily: "Inter",
    fontSize: 12,
    fontWeight: "700",
    textAlign: "center",
  },
});

export default Credit;
