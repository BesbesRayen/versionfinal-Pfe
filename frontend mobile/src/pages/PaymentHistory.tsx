import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
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
import { CreditBalanceResult, getCreditBalance, getMyInstallments, getMyPurchases, getTransactions, Installment, PurchaseOrderResult, Transaction } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, radii } from "@/lib/theme";

const TYPE_CONFIG: Record<string, { icon: string; color: string; bg: string; prefix: string }> = {
  PAYMENT: { icon: "cash-minus", color: "#f87171", bg: "#3b1111", prefix: "-" },
  CREDIT:  { icon: "cash-plus",  color: "#34d399", bg: "#0d3320", prefix: "+" },
  REFUND:  { icon: "cash-refund", color: "#60a5fa", bg: "#0d1e3b", prefix: "+" },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  SUCCESS: { label: "Reussi",  color: "#34d399" },
  FAILED:  { label: "Echoue", color: "#f87171" },
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

const PaymentHistory = () => {
  const { navigate } = useAppNavigation();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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
      const [txData, installmentData, orderData, balanceData] = await Promise.all([
        getTransactions(user.userId),
        getMyInstallments(user.userId).catch(() => [] as Installment[]),
        getMyPurchases(user.userId).catch(() => [] as PurchaseOrderResult[]),
        getCreditBalance(user.userId).catch(() => null),
      ]);
      setTransactions(txData);
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

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const totalPaid = transactions
    .filter((t) => t.type === "PAYMENT" && t.status === "SUCCESS")
    .reduce((sum, t) => sum + t.amount, 0);
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
              <Text style={styles.heroLabel}>Solde restant</Text>
              <Text style={styles.heroValue}>{remainingBalance.toFixed(2)} TND</Text>
              <Text style={styles.heroSub}>Disponible: {(balance?.availableCredit ?? 0).toFixed(2)} TND</Text>
            </View>
            <ProgressRing percent={progress} color={colors.success} label="paye" />
          </View>
          <View style={styles.heroStats}>
            <MiniStat label="Finance" value={`${activeCredit.toFixed(0)} DT`} icon="bank-outline" color={colors.primary} />
            <MiniStat label="Interet" value={`${totalInterest.toFixed(0)} DT`} icon="percent-outline" color={colors.warning} />
          </View>
          <View style={styles.nextPaymentCard}>
            <MaterialCommunityIcons name="calendar-clock" size={18} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextLabel}>Prochaine mensualite</Text>
              <Text style={styles.nextValue}>
                {nextPayment ? `${nextPayment.amount.toFixed(2)} TND · ${formatDate(nextPayment.dueDate)}` : "Aucune echeance active"}
              </Text>
            </View>
          </View>
        </FintechCard>

        <View style={styles.summaryCard}>
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Total paye</Text><Text style={styles.summaryValue}>{totalPaid.toFixed(2)} TND</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Transactions</Text><Text style={styles.summaryValue}>{transactions.length}</Text></View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}><Text style={styles.summaryLabel}>Reussies</Text><Text style={[styles.summaryValue, { color: colors.success }]}>{transactions.filter((t) => t.status === "SUCCESS").length}</Text></View>
        </View>

        {installments.length > 0 && (
          <View style={styles.timelineCard}>
            <Text style={styles.timelineTitle}>Timeline de remboursement</Text>
            {installments.slice(0, 5).map((item, index) => (
              <View key={item.id} style={styles.timelineRow}>
                <View style={[styles.timelineDot, item.status === "PAID" && styles.timelineDotPaid]} />
                {index < Math.min(installments.length, 5) - 1 && <View style={styles.timelineLine} />}
                <View style={{ flex: 1 }}>
                  <Text style={styles.timelineMain}>{item.productName ?? `Credit #${item.creditRequestId}`}</Text>
                  <Text style={styles.timelineSub}>{formatDate(item.dueDate)}</Text>
                </View>
                <Text style={[styles.timelineAmount, item.status === "PAID" && { color: colors.success }]}>{item.amount.toFixed(2)} DT</Text>
              </View>
            ))}
          </View>
        )}

        {loading && (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 32 }} />
        )}
        {!!error && <Text style={styles.errorText}>{error}</Text>}

        {!loading && transactions.length === 0 && (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="receipt-text-outline" size={48} color={colors.gray400} />
            <Text style={styles.emptyText}>Aucune transaction</Text>
            <Text style={styles.emptySubtext}>Vos paiements apparaitront ici.</Text>
          </View>
        )}

        {/* Transaction list */}
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
  timelineCard: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.xxl, padding: 16, gap: 4 },
  timelineTitle: { fontSize: 15, fontWeight: "900", color: colors.gray900, marginBottom: 8 },
  timelineRow: { flexDirection: "row", alignItems: "center", gap: 12, minHeight: 54, position: "relative" },
  timelineDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.primary, borderWidth: 3, borderColor: colors.primarySoft },
  timelineDotPaid: { backgroundColor: colors.success, borderColor: colors.successSoft },
  timelineLine: { position: "absolute", left: 6, top: 33, width: 2, height: 32, backgroundColor: colors.cardBorder },
  timelineMain: { fontSize: 13, fontWeight: "800", color: colors.gray900 },
  timelineSub: { marginTop: 2, fontSize: 11, color: colors.gray500 },
  timelineAmount: { fontSize: 13, fontWeight: "900", color: colors.gray900 },
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
});

export default PaymentHistory;
