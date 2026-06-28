import { useCallback, useEffect, useState } from "react";
import {
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
import { useAuth } from "@/lib/auth";
import { AppNotification, getNotifications, markAllNotificationsAsRead, markNotificationAsRead } from "@/lib/api";
import { colors, radii } from "@/lib/theme";

const TYPE_ICON: Record<string, { icon: string; color: string }> = {
  CREDIT_APPROVED: { icon: "check-circle-outline", color: "#22C55E" },
  CREDIT_REJECTED: { icon: "close-circle-outline", color: "#EF4444" },
  PAYMENT_CONFIRMED: { icon: "cash-check", color: "#22C55E" },
  PAYMENT_PENDING: { icon: "clock-fast", color: "#F59E0B" },
  PAYMENT_FAILED: { icon: "cash-remove", color: "#EF4444" },
  PAYMENT_REFUNDED: { icon: "cash-refund", color: "#38BDF8" },
  PAYMENT_REMINDER: { icon: "calendar-alert", color: "#F59E0B" },
  KYC_APPROVED: { icon: "shield-check-outline", color: "#22C55E" },
  KYC_REJECTED: { icon: "shield-off-outline", color: "#EF4444" },
  KYC_SUBMITTED: { icon: "shield-account-outline", color: "#F59E0B" },
  INSTALLMENT_DUE: { icon: "clock-alert-outline", color: "#F59E0B" },
  INSTALLMENT_OVERDUE: { icon: "clock-remove-outline", color: "#EF4444" },
  SCORE_UPDATE: { icon: "speedometer", color: "#6C63FF" },
  DEFAULT: { icon: "bell-outline", color: "#6b6b80" },
};

const getIconData = (type: string) => TYPE_ICON[type] ?? TYPE_ICON.DEFAULT;

const TITLE_TRANSLATIONS: Record<string, string> = {
  "Payment reminder": "Rappel de paiement",
  "Payment method added": "Moyen de paiement ajouté",
  "Payment method replaced": "Moyen de paiement remplacé",
  "Payment method removed": "Moyen de paiement supprimé",
  "Autopay Failed": "Échec du paiement automatique",
  "Autopay Successful": "Paiement automatique réussi",
  "Installment Overdue": "Échéance en retard",
  "Credit Approved": "Crédit approuvé",
  "Credit Rejected": "Crédit refusé",
  "Financial profile updated": "Profil financier mis à jour",
  "KYC verified": "Identité vérifiée",
  "KYC Rejected": "Vérification d’identité refusée",
  "KYC Manual Review": "Vérification manuelle de l’identité",
  "Payment Confirmed": "Paiement confirmé",
  "All Installments Paid": "Toutes les échéances sont payées",
  "Purchase confirmed": "Achat confirmé",
  "Credit purchase confirmed": "Achat à crédit confirmé",
};

const translateMessage = (message: string) => {
  const replacements: Array<[RegExp, string]> = [
    [/^Your card (.+) has been linked successfully\.$/, "Votre carte se terminant par $1 a été ajoutée avec succès."],
    [/^Your default payment card has been updated\.$/, "Votre carte de paiement par défaut a été mise à jour."],
    [/^Your card ending in (.+) has been removed\.$/, "Votre carte se terminant par $1 a été supprimée."],
    [/^Add an active default payment card to auto-pay installment due on (.+)$/, "Ajoutez une carte active par défaut pour payer automatiquement l’échéance du $1."],
    [/^Insufficient wallet balance for installment due on (.+)\. Required: (.+) TND$/, "Solde insuffisant pour l’échéance du $1. Montant requis : $2 TND."],
    [/^Auto-payment of (.+) TND processed for installment due (.+)\. Ref: (.+)$/, "Paiement automatique de $1 TND effectué pour l’échéance du $2. Réf. : $3."],
    [/^Your installment of (.+) DT due on (.+) is overdue\. A 5% penalty has been applied\.$/, "Votre échéance de $1 DT prévue le $2 est en retard. Une pénalité de 5 % a été appliquée."],
    [/^Your credit request of (.+) DT has been approved\.$/, "Votre demande de crédit de $1 DT a été approuvée."],
    [/^Your credit request has been approved\.$/, "Votre demande de crédit a été approuvée."],
    [/^Your credit request has been rejected\.$/, "Votre demande de crédit a été refusée."],
    [/^Your salary profile is now complete\. You can request credit\.$/, "Votre profil financier est complet. Vous pouvez demander un crédit."],
    [/^Your identity has been verified successfully\.$/, "Votre identité a été vérifiée avec succès."],
    [/^Your identity verification was rejected\. Reason: (.+)$/, "La vérification de votre identité a été refusée. Motif : $1."],
    [/^Your identity verification needs manual review\. Reason: (.+)$/, "La vérification de votre identité nécessite un contrôle manuel. Motif : $1."],
    [/^Payment of (.+) DT confirmed\. Receipt: (.+)$/, "Paiement de $1 DT confirmé. Reçu : $2."],
    [/^All your due installments have been paid successfully\.$/, "Toutes vos échéances ont été payées avec succès."],
    [/^All installments for this purchase have been paid successfully\.$/, "Toutes les échéances de cet achat ont été payées avec succès."],
    [/^Outstanding installments collected by admin$/, "Les échéances impayées ont été encaissées par l’administrateur."],
    [/^Cash purchase confirmed for (.+)\. Ref: (.+)$/, "Achat au comptant confirmé pour $1. Réf. : $2."],
    [/^Your order for (.+) is active on (\d+) installments\.$/, "Votre commande de $1 est active avec $2 échéances."],
    [/^Reminder: installment for (.+) is due tomorrow \((.+)\), amount (.+) TND\.$/, "Rappel : l’échéance de $1 est prévue demain ($2), pour un montant de $3 TND."],
    [/^Reminder: installment for (.+) is due in 2 days \((.+)\), amount (.+) TND\.$/, "Rappel : l’échéance de $1 est prévue dans 2 jours ($2), pour un montant de $3 TND."],
  ];

  for (const [pattern, translation] of replacements) {
    if (pattern.test(message)) {
      return message.replace(pattern, translation);
    }
  }
  return message;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "À l’instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `Il y a ${diffD}j`;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
};

const Notifications = () => {
  const { navigate } = useAppNavigation();
  const { user, creditSyncVersion } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const load = useCallback(async () => {
    if (!user) {
      setNotifications([]);
      setErrorMessage("Session expirée. Connectez-vous pour voir vos notifications.");
      return;
    }
    try {
      const data = await getNotifications(user.userId);
      setNotifications(data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de charger les notifications.");
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    load().finally(() => setLoading(false));
  }, [load, creditSyncVersion]);

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRead = async (n: AppNotification) => {
    if (n.read) return;
    try {
      await markNotificationAsRead(n.id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Impossible de marquer la notification comme lue.");
    }
  };

  const markAllAsRead = async () => {
    const unread = notifications.filter((item) => !item.read);
    if (unread.length === 0) return;

    const previous = notifications;
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    try {
      await markAllNotificationsAsRead();
      setErrorMessage("");
    } catch (error) {
      setNotifications(previous);
      setErrorMessage(error instanceof Error ? error.message : "Impossible de tout marquer comme lu.");
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <MobileLayout noPadding>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => navigate("Home")} style={styles.backBtn}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.gray500} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.title}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} style={styles.readAllButton}>
              <Text style={styles.readAllText}>Tout marquer comme lu</Text>
            </Pressable>
          )}
        </View>

        {!!errorMessage && (
          <View style={styles.errorBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.error} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        )}

        {loading && (
          <Text style={styles.infoText}>Chargement...</Text>
        )}

        {!loading && notifications.length === 0 && (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off-outline" size={48} color={colors.gray500} />
            <Text style={styles.emptyText}>Aucune notification</Text>
          </View>
        )}

        {notifications.map((n) => {
          const { icon, color } = getIconData(n.type);
          return (
            <Pressable
              key={n.id}
              onPress={() => handleRead(n)}
              style={[styles.notifCard, !n.read && styles.notifCardUnread]}
            >
              <View style={[styles.iconBox, { backgroundColor: color + "22" }]}>
                <MaterialCommunityIcons name={icon as never} size={20} color={color} />
              </View>
              <View style={styles.notifBody}>
                <View style={styles.notifTopRow}>
                <Text style={styles.notifTitle}>{TITLE_TRANSLATIONS[n.title] ?? n.title}</Text>
                  {!n.read && <View style={styles.unreadDot} />}
                </View>
                <Text style={styles.notifMessage}>{translateMessage(n.message)}</Text>
                <Text style={styles.notifDate}>{formatDate(n.createdAt)}</Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
      <BottomNav />
    </MobileLayout>
  );
};

const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backBtn: { padding: 8, backgroundColor: colors.card, borderRadius: radii.md, borderWidth: 1, borderColor: colors.cardBorder },
  headerText: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  title: { fontSize: 20, fontWeight: "700", color: colors.gray900 },
  badge: { backgroundColor: colors.primary, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "700" },
  readAllButton: { paddingHorizontal: 12, paddingVertical: 9, backgroundColor: colors.primarySoft, borderRadius: radii.full, borderWidth: 1, borderColor: colors.primaryBorder },
  readAllText: { color: colors.gray900, fontSize: 12, fontWeight: "800" },
  infoText: { fontSize: 13, color: colors.gray500, textAlign: "center", paddingTop: 24 },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderWidth: 1, borderColor: colors.errorBorder, backgroundColor: colors.errorLight, borderRadius: radii.lg },
  errorText: { flex: 1, color: colors.error, fontSize: 12, fontWeight: "700" },
  emptyContainer: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.gray500 },
  notifCard: { flexDirection: "row", gap: 12, backgroundColor: colors.card, borderRadius: radii.lg, padding: 14, borderWidth: 1, borderColor: colors.cardBorder },
  notifCardUnread: { borderColor: colors.primary + "40", backgroundColor: colors.primaryLight },
  iconBox: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifBody: { flex: 1, gap: 4 },
  notifTopRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontSize: 13, fontWeight: "700", color: colors.gray900, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  notifMessage: { fontSize: 12, color: colors.gray600, lineHeight: 18 },
  notifDate: { fontSize: 11, color: colors.gray500 },
});

export default Notifications;
