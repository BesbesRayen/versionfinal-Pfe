import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import { FintechCard, MiniStat, ProgressRing } from "@/components/FintechUI";
import { API_BASE_URL, CreditBalanceResult, getCreditBalance, getMyInstallments, getMyPurchases, getMyReceipts, getTransactions, Installment, Payment, PurchaseOrderResult, Transaction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; prefix: string }> = {
  PAYMENT: { icon: "cash-minus", color: "#f87171", bg: "#3b1111", prefix: "-" },
  CREDIT:  { icon: "cash-plus",  color: "#34d399", bg: "#0d3320", prefix: "+" },
  REFUND:  { icon: "cash-refund", color: "#60a5fa", bg: "#0d1e3b", prefix: "+" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: "Réussi", color: "#34d399" },
  PENDING: { label: "En attente", color: "#fbbf24" },
  FAILED: { label: "Échoué", color: "#f87171" },
  REFUNDED: { label: "Remboursé", color: "#60a5fa" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const PaymentHistory = () => {
  const { navigate } = useAppNavigation();
  const { user, creditSyncVersion } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [receipts, setReceipts] = useState<Payment[]>([]);
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [orders, setOrders] = useState<PurchaseOrderResult[]>([]);
  const [balance, setBalance] = useState<CreditBalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadPayments = useCallback(async (silent = false) => {
    if (!user) { setLoading(false); return; }
    if (!silent) setLoading(true);
    setError("");
    try {
      const [txData, receiptData, installmentData, orderData, balanceData] = await Promise.all([
        getTransactions(user.userId),
        getMyReceipts(user.userId).catch(() => [] as Payment[]),
        getMyInstallments(user.userId).catch(() => [] as Installment[]),
        getMyPurchases(user.userId).catch(() => [] as PurchaseOrderResult[]),
        getCreditBalance(user.userId).catch(() => null),
      ]);
      setTransactions(txData);
      setReceipts(receiptData);
      setInstallments(installmentData);
      setOrders(orderData);
      setBalance(balanceData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur de chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadPayments(); }, [loadPayments, creditSyncVersion]);

  const totalPaid = receipts.reduce((sum, receipt) => sum + receipt.amount, 0);
  const activeCredit = useMemo(
    () => orders.filter((order) => order.paymentType === "CREDIT").reduce((sum, order) => sum + (order.financedAmount ?? 0), 0),
    [orders],
  );
  const totalInterest = useMemo(
    () => orders.filter((order) => order.paymentType === "CREDIT").reduce((sum, order) => sum + (order.interestAmount ?? 0), 0),
    [orders],
  );
  const pendingInstallments = installments.filter((item) => item.status !== "PAID");
  const remainingBalance = pendingInstallments.reduce((sum, item) => sum + item.amount + (item.penalty ?? 0), 0);
  const nextPayment = [...pendingInstallments].sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;
  const paidCount = installments.filter((item) => item.status === "PAID").length;
  const progress = installments.length > 0 ? Math.round((paidCount / installments.length) * 100) : 0;
  const receiptGroups = useMemo(() => {
    const grouped = new Map<string, Payment[]>();
    receipts.forEach((receipt) => {
      const article = receipt.productName?.trim() || "Paiement CreditTN";
      if (!grouped.has(article)) grouped.set(article, []);
      grouped.get(article)!.push(receipt);
    });

    return Array.from(grouped.entries())
      .map(([article, articleReceipts]) => ({
        article,
        receipts: [...articleReceipts].sort(
          (a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime(),
        ),
        total: articleReceipts.reduce((sum, receipt) => sum + receipt.amount, 0),
      }))
      .sort(
        (a, b) => new Date(b.receipts[0].paidAt).getTime() - new Date(a.receipts[0].paidAt).getTime(),
      );
  }, [receipts]);

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPayments(true); }} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => navigate("Profile")} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={20} color={colors.gray900} />
          </Pressable>
          <Text style={styles.title}>Historique</Text>
        </View>

        <FintechCard style={styles.paymentHero}>
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroLabel}>Reste à payer</Text>
              <Text style={styles.heroValue}>{remainingBalance.toFixed(2)} TND</Text>
              <Text style={styles.heroSub}>
                Solde mensuel : {(balance?.availableMonthlyCapacity ?? balance?.availableCredit ?? 0).toFixed(2)} TND
              </Text>
            </View>
            <ProgressRing percent={progress} color={colors.success} label="payé" />
          </View>
          <View style={styles.heroStats}>
            <MiniStat label="Financé" value={`${activeCredit.toFixed(0)} DT`} icon="bank-outline" color={colors.primary} />
            <MiniStat label="Intérêt" value={`${totalInterest.toFixed(0)} DT`} icon="percent-outline" color={colors.warning} />
          </View>
          <View style={styles.nextPaymentCard}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Prochaine mensualité</Text>
              <Text style={styles.nextValue}>
                {nextPayment ? `${nextPayment.amount.toFixed(2)} TND · ${formatDate(nextPayment.dueDate)}` : "Aucune échéance active"}
              </Text>
            </View>
          </View>
          {remainingBalance > 0 && (
            <Pressable
              style={styles.payNowButton}
              onPress={() => navigate("Installments")}
              accessibilityRole="button"
              accessibilityLabel="Voir les échéances à payer"
            >
              <MaterialCommunityIcons name="credit-card-check-outline" size={18} color={colors.white} />
              <Text style={styles.payNowText}>Payer une échéance</Text>
              <MaterialCommunityIcons name="arrow-right" size={18} color={colors.white} />
            </Pressable>
          )}
        </FintechCard>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total payé</Text><Text style={styles.summaryValue}>{totalPaid.toFixed(2)} TND</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Transactions</Text><Text style={styles.summaryValue}>{transactions.length}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Réussies</Text><Text style={[styles.summaryValue, { color: colors.success }]}>{transactions.filter((t) => t.status === "SUCCESS").length}</Text></View>
        </View>

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        )}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && receipts.length === 0 && transactions.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyText}>Aucun reçu</Text>
            <Text style={styles.emptySubtext}>Vos reçus de paiement apparaîtront ici.</Text>
          </View>
        )}

        {receipts.length > 0 && (
          <View style={styles.receiptsCard}>
            <View style={styles.receiptsHeader}>
              <View>
                <Text style={styles.receiptsEyebrow}>Reçus enregistrés</Text>
                <Text style={styles.receiptsTitle}>Historique des paiements</Text>
              </View>
              <View style={styles.receiptsCount}>
                <Text style={styles.receiptsCountText}>{receipts.length}</Text>
              </View>
            </View>
            {receiptGroups.map((group) => (
              <View key={group.article} style={styles.articleGroup}>
                <View style={styles.articleGroupHeader}>
                  <View style={styles.articleGroupIcon}>
                    <MaterialCommunityIcons name="shopping-outline" size={18} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.articleGroupTitle} numberOfLines={2}>{group.article}</Text>
                    <Text style={styles.articleGroupMeta}>
                      {group.receipts.length} paiement{group.receipts.length > 1 ? "s" : ""}
                    </Text>
                  </View>
                  <Text style={styles.articleGroupTotal}>{group.total.toFixed(2)} TND</Text>
                </View>
                {group.receipts.map((receipt) => {
                  const receiptUrl = receipt.receiptDownloadUrl
                    ? `${API_BASE_URL}${receipt.receiptDownloadUrl}`
                    : null;
                  return (
                    <View key={receipt.id} style={styles.receiptRow}>
                      <View style={styles.receiptIcon}>
                        <MaterialCommunityIcons name={receipt.automaticPayment ? "autorenew" : "receipt-text-check-outline"} size={20} color={colors.primary} />
                      </View>
                      <View style={styles.receiptInfo}>
                        <Text style={styles.receiptNumber} numberOfLines={1}>{receipt.receiptNumber ?? receipt.transactionReference}</Text>
                        <Text style={styles.receiptMeta}>
                          {formatDate(receipt.paidAt)}
                          {receipt.installmentNumber ? ` · Mensualité ${receipt.installmentNumber}` : ""}
                          {receipt.automaticPayment ? " · Auto" : ""}
                        </Text>
                      </View>
                      <View style={styles.receiptRight}>
                        <Text style={styles.receiptAmount}>{receipt.amount.toFixed(2)} TND</Text>
                        <Pressable
                          style={[styles.downloadBtn, !receiptUrl && styles.downloadBtnDisabled]}
                          onPress={() => receiptUrl && Linking.openURL(receiptUrl)}
                          disabled={!receiptUrl}
                          accessibilityRole="link"
                          accessibilityLabel={`Télécharger le reçu ${receipt.receiptNumber ?? receipt.transactionReference}`}
                        >
                          <MaterialCommunityIcons name="download" size={13} color={colors.primary} />
                          <Text style={styles.downloadBtnText}>PDF</Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}

        {/* Transaction list */}
        {transactions.length > 0 && <Text style={styles.sectionTitle}>Transactions techniques</Text>}
        {transactions.map((tx) => {
          const typeConf = TYPE_CONFIG[tx.type] ?? TYPE_CONFIG.PAYMENT;
          const statusConf = STATUS_CONFIG[tx.status] ?? STATUS_CONFIG.SUCCESS;
          return (
            <View key={tx.id} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: typeConf.bg }]}>
                <MaterialCommunityIcons name={typeConf.icon as never} size={20} color={typeConf.color} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc} numberOfLines={1}>{tx.description || tx.type}</Text>
                <Text style={styles.txRef} numberOfLines={1}>{tx.reference}</Text>
                <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[styles.txAmount, { color: typeConf.color }]}>
                  {typeConf.prefix}{tx.amount.toFixed(2)} TND
                </Text>
                <View style={[styles.txStatusBadge, { backgroundColor: statusConf.color + "22" }]}>
                  <Text style={[styles.txStatusText, { color: statusConf.color }]}>{statusConf.label}</Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 10 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  backBtn: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  paymentHero: { gap: 14 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 16 },
  heroLabel: { fontSize: 10, color: colors.primary, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  heroValue: { marginTop: 6, fontSize: 30, fontWeight: "900", color: colors.gray900, fontVariant: ["tabular-nums"] },
  heroSub: { marginTop: 3, fontSize: 12, color: colors.gray500, fontWeight: "700" },
  heroStats: { flexDirection: "row", gap: 10 },
  nextPaymentCard: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: colors.surface, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder, padding: 12 },
  nextLabel: { fontSize: 10, color: colors.gray500, fontWeight: "800", textTransform: "uppercase" },
  nextValue: { marginTop: 3, fontSize: 12, color: colors.gray900, fontWeight: "800" },
  summaryCard: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, height: 32, backgroundColor: colors.cardBorder },
  summaryLabel: { fontSize: 10, color: colors.gray500, fontWeight: "600", textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyWrap: { alignItems: "center", paddingTop: 60, gap: 10 },
  emptyText: { fontSize: 16, fontWeight: "700", color: colors.gray700 },
  emptySubtext: { fontSize: 13, color: colors.gray500 },
  errorText: { color: colors.error, fontSize: 13, textAlign: "center" },
  payNowButton: { minHeight: 48, borderRadius: radii.lg, backgroundColor: colors.primary, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 },
  payNowText: { flex: 1, color: colors.white, fontSize: 14, fontWeight: "900", textAlign: "center" },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: radii.xl,
    padding: 14,
  },
  txIcon: { width: 44, height: 44, borderRadius: radii.lg, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txDesc: { fontSize: 13, fontWeight: "700", color: colors.gray900 },
  txRef: { fontSize: 10, color: colors.gray400, fontFamily: "monospace" },
  txDate: { fontSize: 11, color: colors.gray500 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontWeight: "800" },
  txStatusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: radii.sm },
  txStatusText: { fontSize: 10, fontWeight: "700" },
  receiptsCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xxl, padding: 16, gap: 10 },
  receiptsHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  receiptsEyebrow: { fontSize: 10, color: colors.primary, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.6 },
  receiptsTitle: { marginTop: 3, fontSize: 16, color: colors.gray900, fontWeight: "900" },
  receiptsCount: { minWidth: 34, height: 34, borderRadius: 17, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center" },
  receiptsCountText: { color: colors.primary, fontWeight: "900", fontSize: 13 },
  articleGroup: { marginTop: 6, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xl, overflow: "hidden" },
  articleGroupHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, backgroundColor: colors.surface },
  articleGroupIcon: { width: 36, height: 36, borderRadius: radii.md, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center" },
  articleGroupTitle: { fontSize: 13, fontWeight: "900", color: colors.gray900 },
  articleGroupMeta: { marginTop: 2, fontSize: 10, color: colors.gray500, fontWeight: "700" },
  articleGroupTotal: { fontSize: 13, fontWeight: "900", color: colors.success },
  receiptRow: { flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: colors.cardBorder, paddingTop: 12, marginTop: 2 },
  receiptIcon: { width: 42, height: 42, borderRadius: radii.lg, backgroundColor: colors.primaryBg, alignItems: "center", justifyContent: "center" },
  receiptInfo: { flex: 1, gap: 2 },
  receiptProduct: { fontSize: 13, fontWeight: "800", color: colors.gray900 },
  receiptNumber: { fontSize: 10, color: colors.gray500, fontFamily: "monospace" },
  receiptMeta: { fontSize: 10, color: colors.gray500, fontWeight: "600" },
  receiptRight: { alignItems: "flex-end", gap: 6 },
  receiptAmount: { fontSize: 13, fontWeight: "900", color: colors.gray900 },
  downloadBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primaryBg, borderRadius: radii.sm, paddingHorizontal: 8, paddingVertical: 5 },
  downloadBtnDisabled: { opacity: 0.4 },
  downloadBtnText: { color: colors.primary, fontSize: 10, fontWeight: "900" },
  sectionTitle: { fontSize: 11, color: colors.gray500, fontWeight: "900", textTransform: "uppercase", marginTop: 6 },
});

export default PaymentHistory;
