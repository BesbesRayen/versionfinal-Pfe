import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Fragment } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { API_BASE_URL, getCards, getMyInstallments, Installment, Payment, payAllInstallments, payCreditInstallments, payInstallment } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

const toMoney = (amount: number) => `${amount.toFixed(2)} DT`;
const toPrettyDate = (dateIso: string) =>
  new Date(dateIso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

type PendingPayment =
  | { kind: "installment"; installment: Installment }
  | { kind: "group"; creditId: number; items: Installment[] }
  | { kind: "all" };

const Installments = () => {
  const { user, triggerCreditSync, creditSyncVersion } = useAuth();
  const { navigate } = useAppNavigation();
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingId, setPayingId] = useState<number | null>(null);
  const [payingGroupId, setPayingGroupId] = useState<number | null>(null);
  const [payingAll, setPayingAll] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasCard, setHasCard] = useState<boolean>(true);
  const [showNoCardModal, setShowNoCardModal] = useState(false);
  const [payStatus, setPayStatus] = useState<"processing" | "success" | "failed" | null>(null);
  const [lastReceiptUrl, setLastReceiptUrl] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());
  const [pendingPayment, setPendingPayment] = useState<PendingPayment | null>(null);
  const [paymentPassword, setPaymentPassword] = useState("");

  const toggleGroup = (creditId: number) =>
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(creditId)) next.delete(creditId);
      else next.add(creditId);
      return next;
    });

  const loadInstallments = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setErrorMessage("");
    try {
      const [data, cards] = await Promise.all([
        getMyInstallments(user.userId),
        getCards(user.userId).catch(() => undefined),
      ]);
      setInstallments(data);
      if (cards !== undefined) setHasCard(cards.length > 0);
      // Keep actionable groups open and completed groups collapsed.
      const ids = new Set<number>();
      data
        .filter((item) => item.status !== "PAID")
        .forEach((item) => ids.add(item.creditRequestId));
      setExpandedGroups(ids);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les échéances.");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadInstallments(); }, [loadInstallments, creditSyncVersion]);
  const totalPaid = installments.filter((i) => i.status === "PAID").length;
  const total = installments.length;
  const pct = total > 0 ? Math.round((totalPaid / total) * 100) : 0;
  const totalDebt = installments
    .filter((i) => i.status !== "PAID")
    .reduce((sum, item) => sum + item.amount + (item.penalty ?? 0), 0);
  const overdueCount = installments.filter((i) => i.status === "OVERDUE").length;
  const nextInstallment = installments
    .filter((i) => i.status !== "PAID")
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0] ?? null;
  const groups = new Map<number, Installment[]>();
  for (const inst of installments) {
    if (!groups.has(inst.creditRequestId)) groups.set(inst.creditRequestId, []);
    groups.get(inst.creditRequestId)!.push(inst);
  }
  const sortedGroups = Array.from(groups.entries()).sort(([, left], [, right]) => {
    const leftActive = left.some((item) => item.status !== "PAID");
    const rightActive = right.some((item) => item.status !== "PAID");
    if (leftActive !== rightActive) return leftActive ? -1 : 1;

    const leftOverdue = left.some((item) => item.status === "OVERDUE");
    const rightOverdue = right.some((item) => item.status === "OVERDUE");
    if (leftOverdue !== rightOverdue) return leftOverdue ? -1 : 1;

    const leftDate = Math.min(...left.map((item) => new Date(item.dueDate).getTime()));
    const rightDate = Math.min(...right.map((item) => new Date(item.dueDate).getTime()));
    return leftActive ? leftDate - rightDate : rightDate - leftDate;
  });
  const activeGroupCount = sortedGroups.filter(([, items]) =>
    items.some((item) => item.status !== "PAID"),
  ).length;
  const openSuccess = (payment?: Payment) => {
    setLastReceiptUrl(payment?.receiptDownloadUrl
      ? `${API_BASE_URL}${payment.receiptDownloadUrl}`
      : null);
    setPayStatus("success");
  };

  const handlePayInstallment = async (installment: Installment, password: string) => {
    if (!user) return;
    if (!hasCard) { setShowNoCardModal(true); return; }
    setPayingId(installment.id);
    setErrorMessage("");
    setPayStatus("processing");
    try {
      const paid = await payInstallment(user.userId, installment.id, installment.amount + (installment.penalty ?? 0), password);
      openSuccess(paid);
      await loadInstallments();
      triggerCreditSync();
    } catch (error) {
      setPayStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Le paiement a échoué.");
    } finally {
      setPayingId(null);
    }
  };

  const handlePayGroup = async (creditId: number, items: Installment[], password: string) => {
    if (!user) return;
    if (!hasCard) { setShowNoCardModal(true); return; }
    const unpaid = items.filter((i) => i.status !== "PAID");
    if (unpaid.length === 0) return;
    setPayingGroupId(creditId);
    setErrorMessage("");
    setPayStatus("processing");
    try {
      await payCreditInstallments(user.userId, creditId, password);
      openSuccess();
      await loadInstallments();
      triggerCreditSync();
    } catch (error) {
      setPayStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Le paiement a échoué.");
    } finally {
      setPayingGroupId(null);
    }
  };

  const handlePayAll = async (password: string) => {
    if (!user) return;
    if (!hasCard) { setShowNoCardModal(true); return; }
    setPayingAll(true);
    setErrorMessage("");
    setPayStatus("processing");
    try {
      await payAllInstallments(user.userId, password);
      openSuccess();
      await loadInstallments();
      triggerCreditSync();
    } catch (error) {
      setPayStatus("failed");
      setErrorMessage(error instanceof Error ? error.message : "Le paiement total a échoué.");
    } finally {
      setPayingAll(false);
    }
  };

  const isBusy = payingId !== null || payingGroupId !== null || payingAll;

  const requestPayment = (payment: PendingPayment) => {
    if (!hasCard) {
      setShowNoCardModal(true);
      return;
    }
    setPaymentPassword("");
    setPendingPayment(payment);
  };

  const confirmPayment = async () => {
    if (!pendingPayment || !paymentPassword.trim()) return;
    const action = pendingPayment;
    const password = paymentPassword;
    setPendingPayment(null);
    setPaymentPassword("");

    if (action.kind === "installment") {
      await handlePayInstallment(action.installment, password);
    } else if (action.kind === "group") {
      await handlePayGroup(action.creditId, action.items, password);
    } else {
      await handlePayAll(password);
    }
  };

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Session requise</Text>
          <Text style={styles.subtitle}>Connectez-vous pour afficher vos échéances.</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.dangerButton}>
            <Text style={styles.dangerText}>Aller à la connexion</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerBlock}>
          <Text style={styles.title}>Mes Échéances</Text>
          <Text style={styles.subtitle}>{totalPaid} / {total} payées</Text>
        </View>

        {!!errorMessage && (
          <View style={styles.alertRow}>
            <MaterialCommunityIcons name="alert-circle" size={14} color={colors.error} />
            <Text style={styles.alertText}>{errorMessage}</Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.subtitle}>Chargement...</Text>
          </View>
        )}
        {!loading && total > 0 && (
          <View style={styles.progressCard}>
            <View style={styles.progressHead}>
              <Text style={styles.progressLabel}>Progression globale</Text>
              <Text style={[styles.progressPct, pct === 100 && { color: colors.success }]}>{pct}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View style={[
                styles.progressFill,
                { width: `${pct}%` },
                pct === 100 && { backgroundColor: colors.success },
              ]} />
            </View>
            <Text style={styles.progressSub}>
              {toMoney(totalDebt)} restants · {totalPaid}/{total} réglées
            </Text>
          </View>
        )}
        {overdueCount > 0 && (
          <View style={styles.overdueAlert}>
            <MaterialCommunityIcons name="alarm" size={16} color={colors.error} />
            <Text style={styles.overdueAlertText}>
              {overdueCount} échéance{overdueCount > 1 ? "s" : ""} en retard — des pénalités s'appliquent
            </Text>
          </View>
        )}
        {nextInstallment && (
          <View style={[styles.nextBanner, nextInstallment.status === "OVERDUE" && styles.nextBannerOverdue]}>
            <MaterialCommunityIcons
              name="calendar-clock"
              size={22}
              color={nextInstallment.status === "OVERDUE" ? colors.error : colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.nextBannerLabel}>
                {nextInstallment.status === "OVERDUE" ? "Échéance en retard" : "Prochaine échéance"}
              </Text>
              <Text style={styles.nextBannerDate}>{toPrettyDate(nextInstallment.dueDate)}</Text>
            </View>
            <Text style={[styles.nextBannerAmount, nextInstallment.status === "OVERDUE" && { color: colors.error }]}>
              {toMoney(nextInstallment.amount + (nextInstallment.penalty ?? 0))}
            </Text>
          </View>
        )}
        {!loading && totalDebt > 0 && (
          <Pressable
            style={[styles.globalPayBtn, (payingAll || isBusy) && styles.globalPayBtnDisabled]}
            onPress={() => requestPayment({ kind: "all" })}
            disabled={payingAll || isBusy}
            accessibilityRole="button"
            accessibilityLabel={`Régler toutes les échéances, ${toMoney(totalDebt)}`}
          >
            <MaterialCommunityIcons name="check-all" size={18} color={colors.white} />
            <Text style={styles.globalPayBtnText}>
              {payingAll ? "Paiement en cours..." : `Tout régler — ${toMoney(totalDebt)}`}
            </Text>
          </Pressable>
        )}
        {sortedGroups.map(([creditId, items], groupIndex) => {
          const first = items[0];
          const label = first.productName ?? `Crédit #${creditId}`;
          const groupPaid = items.filter((i) => i.status === "PAID").length;
          const groupTotal = items.length;
          const groupPct = groupTotal > 0 ? Math.round((groupPaid / groupTotal) * 100) : 0;
          const groupDebt = items
            .filter((i) => i.status !== "PAID")
            .reduce((s, i) => s + i.amount + (i.penalty ?? 0), 0);
          const remainingPrincipal = items.find((item) => item.remainingAmount != null)?.remainingAmount ?? null;
          const groupHasOverdue = items.some((i) => i.status === "OVERDUE");
          const isFullyPaid = groupPaid === groupTotal;
          const isExpanded = expandedGroups.has(creditId);
          const isPayingThisGroup = payingGroupId === creditId;
          const unpaid = items.filter((i) => i.status !== "PAID");
          const chronologicalItems = [...items].sort(
            (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(),
          );
          const orderedItems = [
            ...chronologicalItems.filter((item) => item.status !== "PAID"),
            ...chronologicalItems.filter((item) => item.status === "PAID"),
          ];

          return (
            <Fragment key={creditId}>
            {groupIndex === 0 && activeGroupCount > 0 && (
              <Text style={styles.listSectionTitle}>À payer maintenant</Text>
            )}
            {groupIndex === activeGroupCount && (
              <Text style={styles.listSectionTitle}>Articles soldés</Text>
            )}
            <View key={creditId} style={[
              styles.groupCard,
              groupHasOverdue && styles.groupCardOverdue,
              isFullyPaid && styles.groupCardPaid,
            ]}>

              {/* Header row — tap to expand/collapse */}
              <Pressable style={styles.groupHeader} onPress={() => toggleGroup(creditId)}>
                <View style={[styles.groupIcon, isFullyPaid && styles.groupIconPaid, groupHasOverdue && styles.groupIconOverdue]}>
                  <MaterialCommunityIcons
                    name={isFullyPaid ? "check" : "shopping-outline"}
                    size={18}
                    color={isFullyPaid ? colors.success : groupHasOverdue ? colors.error : colors.primary}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.groupTitle} numberOfLines={2}>{label}</Text>
                  <Text style={styles.groupMeta}>
                    {groupPaid}/{groupTotal} payées
                    {first.totalAmount != null ? ` · ${toMoney(first.totalAmount)}` : ""}
                  </Text>
                  {remainingPrincipal !== null && (
                    <Text style={styles.groupMeta}>{`Principal restant · ${toMoney(remainingPrincipal)}`}</Text>
                  )}
                </View>
                <View style={styles.groupBadgeRow}>
                  {groupHasOverdue && (
                    <View style={styles.pillOverdue}><Text style={styles.pillOverdueText}>En retard</Text></View>
                  )}
                  {isFullyPaid && (
                    <View style={styles.pillPaid}><Text style={styles.pillPaidText}>Soldé</Text></View>
                  )}
                  <MaterialCommunityIcons
                    name={isExpanded ? "chevron-up" : "chevron-down"}
                    size={20}
                    color={colors.gray400}
                  />
                </View>
              </Pressable>

              {/* Thin progress bar under header */}
              <View style={styles.groupBarTrack}>
                <View style={[
                  styles.groupBarFill,
                  { width: `${groupPct}%` },
                  groupHasOverdue && { backgroundColor: colors.error },
                  isFullyPaid && { backgroundColor: colors.success },
                ]} />
              </View>

              {/* Expanded body */}
              {isExpanded && (
                <>
                  <View style={styles.groupBody}>
                    {orderedItems.map((inst, i) => {
                      const isPaid = inst.status === "PAID";
                      const isOverdue = inst.status === "OVERDUE";
                      const isPayingThis = payingId === inst.id;
                      const penalty = inst.penalty ?? 0;
                      const totalAmt = inst.amount + penalty;
                      const trancheNumber = chronologicalItems.findIndex((item) => item.id === inst.id) + 1;

                      return (
                        <View
                          key={`${inst.id}-${i}`}
                          style={[
                            styles.instRow,
                            i > 0 && styles.instRowDivider,
                            isOverdue && styles.instRowOverdue,
                          ]}
                        >
                          {/* Index bubble */}
                          <View style={[styles.instBubble, isPaid && styles.instBubblePaid, isOverdue && styles.instBubbleOverdue]}>
                            {isPaid
                              ? <MaterialCommunityIcons name="check" size={12} color={colors.success} />
                              : <Text style={[styles.instBubbleText, isOverdue && { color: colors.error }]}>{trancheNumber}</Text>
                            }
                          </View>

                          {/* Info */}
                          <View style={{ flex: 1 }}>
                            <Text style={styles.instTitle}>Tranche {trancheNumber}</Text>
                            <Text style={styles.instDate}>{toPrettyDate(inst.dueDate)}</Text>
                            {penalty > 0 && (
                              <Text style={styles.penaltyTag}>+{toMoney(penalty)} pénalité</Text>
                            )}
                          </View>

                          {/* Amount + action */}
                          <View style={styles.instRight}>
                            <Text style={[styles.instAmount, isOverdue && { color: colors.error }]}>
                              {toMoney(totalAmt)}
                            </Text>
                            {isPaid ? (
                              <View style={styles.badgePaid}>
                              <Text style={styles.badgePaidText}>Payé</Text>
                              </View>
                            ) : (
                              <Pressable
                                style={[
                                  styles.payBtn,
                                  isOverdue && styles.payBtnOverdue,
                                  (isPayingThis || isBusy) && styles.payBtnDisabled,
                                ]}
                                onPress={() => requestPayment({ kind: "installment", installment: inst })}
                                disabled={isBusy}
                                accessibilityRole="button"
                                accessibilityLabel={`Payer la tranche ${trancheNumber}, ${toMoney(totalAmt)}`}
                              >
                                <Text style={styles.payBtnText}>
                                  {isPayingThis ? "..." : isOverdue ? "Régulariser" : "Payer maintenant"}
                                </Text>
                              </Pressable>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Pay group footer — only if unpaid items exist */}
                  {unpaid.length > 0 && (
                    <View style={styles.groupFooter}>
                      <View style={styles.groupFooterInfo}>
                        <Text style={styles.groupFooterLabel}>Reste a payer</Text>
                        <Text style={styles.groupFooterAmount}>{toMoney(groupDebt)}</Text>
                      </View>
                      <Pressable
                        style={[styles.payGroupBtn, (isPayingThisGroup || isBusy) && styles.payGroupBtnDisabled]}
                        onPress={() => requestPayment({ kind: "group", creditId, items })}
                        disabled={isPayingThisGroup || isBusy}
                        accessibilityRole="button"
                        accessibilityLabel={`Régler toutes les échéances de ${label}, ${toMoney(groupDebt)}`}
                      >
                        {isPayingThisGroup
                          ? <ActivityIndicator size="small" color={colors.white} />
                          : <MaterialCommunityIcons name="lightning-bolt" size={16} color={colors.white} />
                        }
                        <Text style={styles.payGroupBtnText}>
                          {isPayingThisGroup
                            ? "Paiement en cours..."
                            : `Régler ${unpaid.length} tranche${unpaid.length > 1 ? "s" : ""} — ${toMoney(groupDebt)}`
                          }
                        </Text>
                      </Pressable>
                    </View>
                  )}
                </>
              )}
            </View>
            </Fragment>
          );
        })}

        {!loading && installments.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="check-circle-outline" size={48} color={colors.success} />
            <Text style={styles.emptyCardTitle}>Aucune échéance active</Text>
            <Text style={styles.emptyCardSub}>Vos futures échéances apparaîtront ici.</Text>
          </View>
        )}
      </ScrollView>
      <BottomNav />
      <Modal visible={pendingPayment !== null} transparent animationType="fade" onRequestClose={() => setPendingPayment(null)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="shield-lock-outline" size={44} color={colors.primary} />
            <Text style={styles.modalTitle}>Confirmer le paiement</Text>
            <Text style={styles.modalSub}>Saisissez le mot de passe de votre compte pour autoriser cette opération.</Text>
            <TextInput
              style={styles.passwordInput}
              value={paymentPassword}
              onChangeText={setPaymentPassword}
              placeholder="Mot de passe"
              placeholderTextColor={colors.gray500}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={() => void confirmPayment()}
            />
            <Pressable
              style={[styles.modalPrimaryBtn, !paymentPassword.trim() && styles.payBtnDisabled]}
              disabled={!paymentPassword.trim()}
              onPress={() => void confirmPayment()}
            >
              <Text style={styles.modalPrimaryBtnText}>Verifier et payer</Text>
            </Pressable>
            <Pressable onPress={() => { setPendingPayment(null); setPaymentPassword(""); }}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={showNoCardModal} transparent animationType="fade" onRequestClose={() => setShowNoCardModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            <MaterialCommunityIcons name="credit-card-off-outline" size={44} color={colors.warning} />
            <Text style={styles.modalTitle}>Aucune carte enregistrée</Text>
            <Text style={styles.modalSub}>Ajoutez une méthode de paiement pour régler vos échéances.</Text>
            <Pressable style={styles.modalPrimaryBtn} onPress={() => { setShowNoCardModal(false); navigate("Cards"); }}>
              <Text style={styles.modalPrimaryBtnText}>Ajouter une carte</Text>
            </Pressable>
            <Pressable onPress={() => setShowNoCardModal(false)}>
              <Text style={styles.modalCancelText}>Annuler</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal visible={payStatus !== null} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalCard}>
            {payStatus === "processing" && (
              <>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={styles.modalTitle}>Traitement en cours...</Text>
                <Text style={styles.modalSub}>Veuillez patienter</Text>
              </>
            )}
            {payStatus === "success" && (
              <>
                <View style={styles.successCircle}>
                  <MaterialCommunityIcons name="check" size={38} color={colors.white} />
                </View>
                <Text style={[styles.modalTitle, { color: colors.success }]}>Paiement réussi !</Text>
                <Text style={styles.modalSub}>Votre paiement a été traité avec succès.</Text>
                {lastReceiptUrl && (
                  <Pressable
                    style={styles.receiptBtn}
                    onPress={() => Linking.openURL(lastReceiptUrl)}
                    accessibilityRole="link"
                    accessibilityLabel="Télécharger le reçu PDF"
                  >
                    <MaterialCommunityIcons name="file-pdf-box" size={20} color={colors.primary} />
                    <Text style={styles.receiptBtnText}>Télécharger reçu PDF</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setPayStatus(null)}>
                  <Text style={styles.modalCancelText}>Fermer</Text>
                </Pressable>
              </>
            )}
            {payStatus === "failed" && (
              <>
                <MaterialCommunityIcons name="close-circle" size={52} color={colors.error} />
                <Text style={[styles.modalTitle, { color: colors.error }]}>Paiement refusé</Text>
                <Text style={styles.modalSub}>{errorMessage || "Une erreur est survenue."}</Text>
                <Pressable onPress={() => setPayStatus(null)} style={styles.modalPrimaryBtn}>
                  <Text style={styles.modalPrimaryBtnText}>Fermer</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 100, gap: 12 },

  headerBlock: { marginBottom: 4 },
  title: { fontSize: 24, fontWeight: "800", color: colors.gray900 },
  subtitle: { marginTop: 3, fontSize: 13, color: colors.gray500 },

  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  alertRow: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.errorLight, borderRadius: radii.lg, padding: 12, borderWidth: 1, borderColor: colors.errorBorder },
  alertText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "600" },

  // Progress card
  progressCard: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1, borderColor: colors.cardBorder, padding: 16 },
  progressHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressLabel: { fontSize: 11, textTransform: "uppercase", color: colors.gray500, fontWeight: "700", letterSpacing: 0.5 },
  progressPct: { fontSize: 18, color: colors.primary, fontWeight: "800" },
  progressTrack: { height: 8, borderRadius: 6, backgroundColor: colors.gray200, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: 6 },
  progressSub: { fontSize: 11, color: colors.gray500 },

  // Alerts
  overdueAlert: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.errorLight, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.errorBorder, padding: 12 },
  overdueAlertText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "700" },

  nextBanner: { backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1.5, borderColor: colors.primary + "55", padding: 14, flexDirection: "row", alignItems: "center", gap: 12 },
  nextBannerOverdue: { borderColor: colors.error + "66", backgroundColor: colors.errorLight },
  nextBannerLabel: { fontSize: 10, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  nextBannerDate: { fontSize: 14, fontWeight: "800", color: colors.gray900, marginTop: 2 },
  nextBannerAmount: { fontSize: 20, fontWeight: "800", color: colors.primary },

  // Group cards
  listSectionTitle: { marginTop: 6, fontSize: 11, color: colors.gray500, fontWeight: "900", textTransform: "uppercase", letterSpacing: 0.5 },
  groupCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, overflow: "hidden" },
  groupCardOverdue: { borderColor: colors.error + "55" },
  groupCardPaid: { borderColor: colors.success + "44" },

  groupHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 16, paddingBottom: 14 },
  groupIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  groupIconPaid: { backgroundColor: colors.successLight },
  groupIconOverdue: { backgroundColor: colors.errorLight },
  groupTitle: { fontSize: 15, fontWeight: "700", color: colors.gray900, lineHeight: 20 },
  groupMeta: { fontSize: 12, color: colors.gray500, marginTop: 2 },
  groupBadgeRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  pillOverdue: { backgroundColor: colors.errorLight, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.errorBorder },
  pillOverdueText: { color: colors.error, fontSize: 10, fontWeight: "700" },
  pillPaid: { backgroundColor: colors.successLight, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: colors.successBorder },
  pillPaidText: { color: colors.success, fontSize: 10, fontWeight: "700" },

  groupBarTrack: { height: 3, backgroundColor: colors.gray200 },
  groupBarFill: { height: "100%", backgroundColor: colors.primary },

  groupBody: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 4 },

  instRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 10 },
  instRowDivider: { borderTopWidth: 1, borderTopColor: colors.gray100 },
  instRowOverdue: { marginHorizontal: -16, paddingHorizontal: 16, backgroundColor: colors.errorLight + "55" },
  instBubble: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" },
  instBubblePaid: { backgroundColor: colors.successLight },
  instBubbleOverdue: { backgroundColor: colors.errorLight },
  instBubbleText: { fontSize: 12, fontWeight: "700", color: colors.gray600 },
  instTitle: { fontSize: 13, fontWeight: "600", color: colors.gray800 },
  instDate: { fontSize: 11, color: colors.gray500, marginTop: 1 },
  penaltyTag: { fontSize: 10, color: colors.error, marginTop: 2, fontWeight: "600" },
  instRight: { alignItems: "flex-end", gap: 5 },
  instAmount: { fontSize: 14, fontWeight: "700", color: colors.gray900 },

  badgePaid: { backgroundColor: colors.successLight, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, borderWidth: 1, borderColor: colors.successBorder + "60" },
  badgePaidText: { color: colors.success, fontSize: 11, fontWeight: "700" },

  payBtn: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 6, paddingHorizontal: 14 },
  payBtnOverdue: { backgroundColor: colors.error },
  payBtnDisabled: { opacity: 0.4 },
  payBtnText: { color: colors.white, fontSize: 12, fontWeight: "700" },

  // Group footer
  groupFooter: { margin: 12, marginTop: 4, backgroundColor: colors.surface, borderRadius: 14, padding: 14, gap: 10, borderWidth: 1, borderColor: colors.cardBorder },
  groupFooterInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  groupFooterLabel: { fontSize: 11, color: colors.gray500, fontWeight: "700", textTransform: "uppercase" },
  groupFooterAmount: { fontSize: 17, fontWeight: "800", color: colors.gray900 },
  payGroupBtn: { backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  payGroupBtnDisabled: { opacity: 0.45 },
  payGroupBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  // Global pay all
  globalPayBtn: { backgroundColor: colors.primary, borderRadius: radii.xxl, paddingVertical: 15, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 4 },
  globalPayBtnDisabled: { opacity: 0.45 },
  globalPayBtnText: { color: colors.white, fontWeight: "700", fontSize: 15 },

  // Empty state
  emptyCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.cardBorder, padding: 36, alignItems: "center", gap: 10 },
  emptyCardTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyCardSub: { fontSize: 13, color: colors.gray500, textAlign: "center" },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },

  // Modals
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.82)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalCard: { backgroundColor: colors.card, borderRadius: 24, borderWidth: 1, borderColor: colors.cardBorder, padding: 28, alignItems: "center", gap: 12, width: "100%", maxWidth: 320 },
  modalTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900, textAlign: "center" },
  modalSub: { fontSize: 13, color: colors.gray500, textAlign: "center", lineHeight: 20 },
  passwordInput: { width: "100%", borderWidth: 1, borderColor: colors.cardBorder, borderRadius: radii.lg, backgroundColor: colors.surface, color: colors.gray900, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  modalPrimaryBtn: { backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 13, paddingHorizontal: 24, alignItems: "center", width: "100%" },
  modalPrimaryBtnText: { color: colors.white, fontWeight: "700", fontSize: 14 },
  modalCancelText: { color: colors.gray500, fontSize: 13, fontWeight: "600", marginTop: 4 },
  successCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.success, alignItems: "center", justifyContent: "center" },
  receiptBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: colors.primaryBg, borderWidth: 1.5, borderColor: colors.primary + "55", borderRadius: radii.lg, paddingVertical: 12, paddingHorizontal: 20, width: "100%", justifyContent: "center" },
  receiptBtnText: { color: colors.primary, fontSize: 13, fontWeight: "700" },

  dangerButton: { backgroundColor: colors.error, borderRadius: radii.lg, paddingVertical: 14, alignItems: "center" },
  dangerText: { color: colors.white, fontSize: 14, fontWeight: "700" },
});

export default Installments;
