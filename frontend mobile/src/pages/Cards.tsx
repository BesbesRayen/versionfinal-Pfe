import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import BottomNav from "@/components/BottomNav";
import { useAppNavigation } from "@/lib/app-navigation";
import {
  addCard,
  Card,
  CreateCardPayload,
  CardType,
  deleteCard,
  getCards,
  getMyInstallments,
  replaceCard,
  setDefaultCard,
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatCardNumber,
  normalizeCardNumber,
  validateCardNumber,
} from "@/lib/card-validation";
import { colors, radii } from "@/lib/theme";

// Live card preview shown while typing in the add-card modal.

const LiveCardPreview = ({
  cardDigits,
  expiryDigits,
  name,
  cardType,
}: {
  cardDigits: string;
  expiryDigits: string;
  name: string;
  cardType: CardType;
}) => {
  const formatPreviewNumber = () => {
    if (cardDigits.length === 0) return "**** **** **** ****";
    const padded = cardDigits.padEnd(16, "*");
    const groups = padded.match(/.{1,4}/g) ?? [];
    // Mask all but last group once enough digits entered
    if (cardDigits.length >= 13) {
      return groups.map((g, i) => (i < groups.length - 1 ? "****" : g.replace(/\*/g, "0"))).join(" ");
    }
    return groups.join(" ");
  };

  const formatExpiry = () => {
    if (expiryDigits.length === 0) return "MM/YY";
    if (expiryDigits.length <= 2) return expiryDigits.padEnd(2, "M") + "/YY";
    const yy = expiryDigits.slice(2).padEnd(2, "Y");
    return `${expiryDigits.slice(0, 2)}/${yy}`;
  };

  const isVisa = cardType === "VISA";

  return (
    <View style={previewStyles.card}>
      <View style={previewStyles.circle1} />
      <View style={previewStyles.circle2} />
      <View style={previewStyles.topRow}>
        <MaterialCommunityIcons name="chip" size={28} color="#ffd700" />
        <View style={previewStyles.contactless}>
          <MaterialCommunityIcons name="wifi" size={18} color="rgba(255,255,255,0.7)" />
        </View>
      </View>
      <Text style={previewStyles.cardNumber}>{formatPreviewNumber()}</Text>
      <View style={previewStyles.bottomRow}>
        <View>
          <Text style={previewStyles.fieldLabel}>CARD HOLDER</Text>
          <Text style={previewStyles.fieldValue}>{name.trim().toUpperCase() || "YOUR NAME"}</Text>
          <Text style={[previewStyles.fieldLabel, { marginTop: 6 }]}>EXPIRES</Text>
          <Text style={previewStyles.fieldValue}>{formatExpiry()}</Text>
        </View>
        <View style={previewStyles.brandArea}>
          {isVisa ? (
            <Text style={previewStyles.visaText}>VISA</Text>
          ) : (
            <View style={previewStyles.mastercardCircles}>
              <View style={[previewStyles.mcCircle, { backgroundColor: "#eb001b" }]} />
              <View style={[previewStyles.mcCircle, { backgroundColor: "#f79e1b", marginLeft: -12 }]} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};
const AnimatedCardWidget = ({ card }: { card: Card }) => {
  const shine = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shine, { toValue: 1, duration: 4000, easing: Easing.linear, useNativeDriver: true }),
    ).start();
  }, [shine]);

  const shimX = shine.interpolate({ inputRange: [0, 1], outputRange: [-200, 400] });
  const isVisa = card.type === "VISA";
  const isBlocked = card.status === "BLOCKED";
  const displayNumber = card.maskedNumber ?? `**** **** **** ${card.last4 ?? "****"}`;

  return (
    <View style={[styles.cardWidget, card.defaultCard && styles.cardWidgetDefault, isBlocked && styles.cardWidgetBlocked]}>
      <View style={styles.cardCircle1} />
      <View style={styles.cardCircle2} />
      <Animated.View style={[styles.cardShine, { transform: [{ translateX: shimX }] }]} />

      <View style={styles.cardTopRow}>
        <MaterialCommunityIcons name="chip" size={26} color="#ffd700" />
        <View style={{ transform: [{ rotate: "90deg" }] }}>
          <MaterialCommunityIcons name="wifi" size={16} color="rgba(255,255,255,0.6)" />
        </View>
      </View>

      <Text style={styles.cardNumber}>{displayNumber}</Text>

      <View style={styles.cardBottom}>
        <View>
          {!!card.cardholderName && (
            <>
              <Text style={styles.cardFieldLabel}>CARD HOLDER</Text>
              <Text style={styles.cardFieldValue}>{card.cardholderName.toUpperCase()}</Text>
            </>
          )}
          <Text style={[styles.cardFieldLabel, { marginTop: card.cardholderName ? 6 : 0 }]}>EXPIRES</Text>
          <Text style={styles.cardFieldValue}>{card.expiryDate}</Text>
        </View>
        <View style={styles.cardBrandRow}>
          {isBlocked && (
            <View style={styles.blockedBadge}><Text style={styles.blockedBadgeText}>BLOCKED</Text></View>
          )}
          {card.defaultCard && !isBlocked && (
            <View style={styles.defaultBadge}><Text style={styles.defaultBadgeText}>DEFAULT</Text></View>
          )}
          {isVisa ? (
            <Text style={styles.visaBrand}>VISA</Text>
          ) : (
            <View style={styles.mastercardBrand}>
              <View style={[styles.mcDot, { backgroundColor: "#eb001b" }]} />
              <View style={[styles.mcDot, { backgroundColor: "#f79e1b", marginLeft: -8 }]} />
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const ValidationLine = ({ state, text }: { state: "success" | "warning" | "error"; text: string }) => {
  const color = state === "success" ? colors.success : state === "warning" ? colors.warning : colors.error;
  return (
    <View style={styles.validationLine}>
      <MaterialCommunityIcons
        name={state === "success" ? "check-circle-outline" : state === "warning" ? "alert-circle-outline" : "close-circle-outline"}
        size={13}
        color={color}
      />
      <Text style={[styles.validationText, { color }]}>{text}</Text>
    </View>
  );
};

const Cards = () => {
  const { user } = useAuth();
  const { navigate } = useAppNavigation();

  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "replace">("add");
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Card | null>(null);
  const [pendingReplacePayload, setPendingReplacePayload] = useState<(CreateCardPayload & { password: string }) | null>(null);
  const [unpaidCount, setUnpaidCount] = useState(0);

  const [cardDigits, setCardDigits] = useState("");
  const [expiryDigits, setExpiryDigits] = useState("");
  const [cvv, setCvv] = useState("");
  const [cardholderName, setCardholderName] = useState("");
  const [cardType, setCardType] = useState<CardType>("VISA");
  const [makeDefault, setMakeDefault] = useState(false);
  const [verificationPassword, setVerificationPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const expiryRef = useRef<TextInput>(null);
  const nameRef = useRef<TextInput>(null);
  const cvvRef = useRef<TextInput>(null);

  const loadCards = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    setErrorMessage("");
    try {
      const [data, installments] = await Promise.all([
        getCards(user.userId),
        getMyInstallments(user.userId).catch(() => []),
      ]);
      setCards(data);
      setUnpaidCount(installments.filter((item) => item.status !== "PAID").length);
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Could not load cards");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadCards(); }, [loadCards]);

  const validateExpiry = (digits: string): string | null => {
    if (digits.length < 4) return "Expiry must be complete (MM/YY)";
    const mm = parseInt(digits.slice(0, 2), 10);
    const yy = parseInt(digits.slice(2, 4), 10);
    const now = new Date();
    const currentYY = now.getFullYear() % 100;
    const currentMonth = now.getMonth() + 1;
    if (mm < 1 || mm > 12) return "Invalid month - must be 01 to 12";
    if (yy < currentYY) return `Card expired - year must be ${currentYY} or later`;
    if (yy === currentYY && mm < currentMonth) return "Card expiry date must be in the future";
    return null;
  };

  const cardNumberError = cardDigits.length > 0 ? validateCardNumber(cardDigits) : null;
  const expiryErrorLive = expiryDigits.length > 0 ? validateExpiry(expiryDigits) : null;
  const cvvErrorLive = cvv.length > 0 && !/^\d{3}$/.test(cvv) ? "CVV must be exactly 3 digits" : null;
  const hasPendingPayments = unpaidCount > 0;
  const pendingPaymentMessage = "You must complete all remaining payments before changing this card.";

  const handleSubmitCard = async () => {
    if (!user) return;
    const cardError = validateCardNumber(cardDigits);
    if (cardError) {
      setErrorMessage(cardError);
      return;
    }
    const expiryError = validateExpiry(expiryDigits);
    if (expiryError) { setErrorMessage(expiryError); return; }
    if (!/^\d{3}$/.test(cvv)) {
      setErrorMessage("CVV must be exactly 3 digits");
      return;
    }
    if (modalMode === "replace" && !verificationPassword.trim()) {
      setErrorMessage("Password verification is required before replacing your card");
      return;
    }
    if (modalMode === "replace" && hasPendingPayments) {
      setErrorMessage(pendingPaymentMessage);
      return;
    }

    setErrorMessage("");
    const payload: CreateCardPayload = {
      cardNumber: cardDigits,
      expiryDate: `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`,
      cardholderName: cardholderName.trim() || undefined,
      type: cardType,
      cvv,
      defaultCard: makeDefault || cards.length === 0,
    };

    if (modalMode === "replace") {
      setPendingReplacePayload({ ...payload, password: verificationPassword });
      return;
    }

    setSubmitting(true);
    try {
        await addCard(user.userId, payload);
        setSuccessMessage("Card added successfully");
      setShowAddModal(false);
      resetForm();
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to save card");
    } finally {
      setSubmitting(false);
    }
  };

  const confirmReplace = async () => {
    if (!user || !selectedCard || !pendingReplacePayload) return;
    if (hasPendingPayments) {
      setPendingReplacePayload(null);
      setErrorMessage(pendingPaymentMessage);
      return;
    }
    setSubmitting(true);
    setErrorMessage("");
    try {
      await replaceCard(user.userId, selectedCard.id, pendingReplacePayload);
      setSuccessMessage("Card replaced and set as default");
      setPendingReplacePayload(null);
      setShowAddModal(false);
      resetForm();
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to replace card");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetDefault = async (cardId: number) => {
    if (!user) return;
    setErrorMessage(""); setSuccessMessage("");
    try {
      await setDefaultCard(user.userId, cardId);
      setSuccessMessage("Default card updated");
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to update default");
    }
  };

  const handleDelete = async () => {
    if (!user || !deleteTarget) return;
    if (hasPendingPayments) {
      setErrorMessage(pendingPaymentMessage);
      return;
    }
    if (!deletePassword.trim()) {
      setErrorMessage("Password verification is required before deleting your card");
      return;
    }
    setSubmitting(true);
    setErrorMessage(""); setSuccessMessage("");
    try {
      await deleteCard(user.userId, deleteTarget.id, { password: deletePassword });
      setSuccessMessage("Card removed successfully");
      setDeleteTarget(null);
      setDeletePassword("");
      await loadCards();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Failed to delete card");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setCardDigits(""); setExpiryDigits(""); setCvv("");
    setCardholderName(""); setCardType("VISA"); setMakeDefault(false);
    setVerificationPassword(""); setSelectedCard(null); setErrorMessage("");
  };

  const openAddModal = () => {
    resetForm();
    setModalMode("add");
    setShowAddModal(true);
  };

  const openReplaceModal = (card: Card) => {
    if (hasPendingPayments) {
      setErrorMessage(pendingPaymentMessage);
      return;
    }
    resetForm();
    setModalMode("replace");
    setSelectedCard(card);
    setMakeDefault(true);
    setShowAddModal(true);
  };

  const cardDisplay = formatCardNumber(cardDigits);
  // Slash is added only when 3+ digits are present (not at exactly 2).
  // This avoids the "stuck" state where backspace removes the auto-slash
  // but raw digit count stays the same, causing stale deletion detection.
  const expiryDisplay = expiryDigits.length > 2
    ? `${expiryDigits.slice(0, 2)}/${expiryDigits.slice(2)}`
    : expiryDigits;

  const handleCardChange = (text: string) => {
    setErrorMessage("");
    const raw = normalizeCardNumber(text);
    setCardDigits(raw);
    if (raw.length === 16) expiryRef.current?.focus();
  };

  const handleExpiryChange = (text: string) => {
    setErrorMessage("");
    const raw = text.replace(/\D/g, "").slice(0, 4);
    setExpiryDigits(raw);
    if (raw.length === 4) nameRef.current?.focus();
  };

  if (!user) {
    return (
      <MobileLayout>
        <View style={styles.emptyWrap}>
          <Text style={styles.title}>Session required</Text>
          <Pressable onPress={() => navigate("Login")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Go to login</Text>
          </Pressable>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Insérer votre carte</Text>
        <Text style={styles.subtitle}>Ajoutez, remplacez ou supprimez votre carte en toute sécurité.</Text>

        {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
        {!!successMessage && <Text style={styles.successText}>{successMessage}</Text>}
        {hasPendingPayments && (
          <View style={styles.warningBanner}>
            <MaterialCommunityIcons name="alert-circle-outline" size={18} color={colors.warning} />
            <Text style={styles.warningBannerText}>{pendingPaymentMessage}</Text>
          </View>
        )}
        {loading && <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />}

        {cards.map((card) => (
          <View key={card.id}>
            <AnimatedCardWidget card={card} />
            <View style={styles.cardActions}>
              {card.status === "ACTIVE" && !card.defaultCard && (
                <Pressable style={styles.actionBtn} onPress={() => handleSetDefault(card.id)}>
                  <MaterialCommunityIcons name="star-outline" size={14} color={colors.primary} />
                  <Text style={styles.actionBtnText}>Set default</Text>
                </Pressable>
              )}
              {card.status === "ACTIVE" && (
                <Pressable
                  style={[styles.actionBtn, hasPendingPayments && styles.actionBtnDisabled]}
                  onPress={() => openReplaceModal(card)}
                  disabled={hasPendingPayments}
                >
                  <MaterialCommunityIcons name="credit-card-refresh-outline" size={14} color={hasPendingPayments ? colors.gray500 : colors.primary} />
                  <Text style={[styles.actionBtnText, hasPendingPayments && styles.actionBtnDisabledText]}>Update Card</Text>
                </Pressable>
              )}
              {card.status === "ACTIVE" && (
                <Pressable
                  style={[styles.actionBtn, styles.actionBtnDanger, hasPendingPayments && styles.actionBtnDisabled]}
                  onPress={() => {
                    if (hasPendingPayments) {
                      setErrorMessage(pendingPaymentMessage);
                      return;
                    }
                    setDeleteTarget(card); setDeletePassword(""); setErrorMessage("");
                  }}
                  disabled={hasPendingPayments}
                >
                  <MaterialCommunityIcons name="trash-can-outline" size={14} color={hasPendingPayments ? colors.gray500 : colors.error} />
                  <Text style={[styles.actionBtnText, { color: hasPendingPayments ? colors.gray500 : colors.error }]}>Delete Card</Text>
                </Pressable>
              )}
            </View>
          </View>
        ))}

        {!loading && cards.length === 0 && (
          <View style={styles.emptyCard}>
            <MaterialCommunityIcons name="credit-card-plus-outline" size={40} color={colors.gray400} />
            <Text style={styles.emptyCardTitle}>No card inserted</Text>
            <Text style={styles.emptyCardSub}>
              Insert a new card to continue using BNPL and payment features.
            </Text>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={openAddModal}>
          <MaterialCommunityIcons name="plus" size={16} color={colors.white} />
          <Text style={styles.primaryButtonText}>Insert new card</Text>
        </Pressable>
      </ScrollView>
      <BottomNav />

      {/* Add Card Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => { setShowAddModal(false); resetForm(); }}
      >
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 24}
        >
          <Pressable style={styles.modalOverlay} onPress={() => {}} accessible={false}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{modalMode === "replace" ? "Update Card" : "Insert Card"}</Text>
                <Pressable onPress={() => { setShowAddModal(false); resetForm(); }}>
                  <MaterialCommunityIcons name="close" size={20} color={colors.gray500} />
                </Pressable>
              </View>

              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
                {/* Live card preview */}
                <LiveCardPreview cardDigits={cardDigits} expiryDigits={expiryDigits} name={cardholderName} cardType={cardType} />

                {/* Card Number */}
                <View>
                  <Text style={styles.fieldLabel}>CARD NUMBER</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="1234 5678 9012 3456"
                    placeholderTextColor={colors.gray500}
                    keyboardType="number-pad"
                    value={cardDisplay}
                    onChangeText={handleCardChange}
                    maxLength={19}
                    returnKeyType="next"
                      onSubmitEditing={() => expiryRef.current?.focus()}
                      blurOnSubmit={false}
                  />
                  {cardDigits.length > 0 && (
                    <ValidationLine
                      state={cardNumberError ? "error" : "success"}
                      text={cardNumberError ?? "Valid card number"}
                    />
                  )}
                </View>

                {/* Expiry + CVV */}
                <View style={styles.rowFields}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>EXPIRY</Text>
                    <TextInput
                      ref={expiryRef}
                      style={styles.input}
                      placeholder="MM/YY"
                      placeholderTextColor={colors.gray500}
                      keyboardType="number-pad"
                      value={expiryDisplay}
                      onChangeText={handleExpiryChange}
                      maxLength={5}
                      returnKeyType="next"
                      onSubmitEditing={() => nameRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    {expiryDigits.length > 0 && (
                      <ValidationLine state={expiryErrorLive ? "error" : "success"} text={expiryErrorLive ?? "Valid expiry date"} />
                    )}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>CVV</Text>
                    <TextInput
                      ref={cvvRef}
                      style={styles.input}
                      placeholder="123"
                      placeholderTextColor={colors.gray500}
                      keyboardType="number-pad"
                      secureTextEntry
                      value={cvv}
                      onChangeText={(t) => { setErrorMessage(""); setCvv(t.replace(/\D/g, "").slice(0, 3)); }}
                      maxLength={3}
                      returnKeyType="next"
                      onSubmitEditing={() => nameRef.current?.focus()}
                      blurOnSubmit={false}
                    />
                    {cvv.length > 0 && (
                      <ValidationLine state={cvvErrorLive ? "error" : "success"} text={cvvErrorLive ?? "Valid CVV"} />
                    )}
                  </View>
                </View>

                {/* Cardholder Name */}
                <View>
                  <Text style={styles.fieldLabel}>CARDHOLDER NAME</Text>
                  <TextInput
                    ref={nameRef}
                    style={styles.input}
                    placeholder="e.g. Rayen Besbes"
                    placeholderTextColor={colors.gray500}
                    autoCapitalize="words"
                    value={cardholderName}
                    onChangeText={(text) => { setErrorMessage(""); setCardholderName(text); }}
                    returnKeyType="next"
                    onSubmitEditing={() => cvvRef.current?.focus()}
                    blurOnSubmit={false}
                  />
                </View>

                {/* Card Type */}
                <View>
                  <Text style={styles.fieldLabel}>CARD TYPE</Text>
                  <View style={styles.typeRow}>
                    {(["VISA", "MASTERCARD"] as CardType[]).map((t) => (
                      <Pressable
                        key={t}
                        onPress={() => setCardType(t)}
                        style={[styles.typeBtn, cardType === t && styles.typeBtnActive]}
                      >
                        <MaterialCommunityIcons
                          name={t === "VISA" ? "credit-card-outline" : "credit-card-multiple-outline"}
                          size={18}
                          color={cardType === t ? colors.white : colors.gray500}
                        />
                        <Text style={[styles.typeBtnText, cardType === t && { color: colors.white }]}>{t}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                {modalMode === "replace" && (
                  <View>
                    <Text style={styles.fieldLabel}>PASSWORD VERIFICATION</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="Confirm your password"
                      placeholderTextColor={colors.gray500}
                      secureTextEntry
                      value={verificationPassword}
                      onChangeText={(text) => { setErrorMessage(""); setVerificationPassword(text); }}
                    />
                  </View>
                )}

                {modalMode === "add" ? (
                  <Pressable style={styles.checkRow} onPress={() => setMakeDefault(!makeDefault)}>
                    <View style={[styles.checkbox, makeDefault && styles.checkboxActive]}>
                      {makeDefault && <MaterialCommunityIcons name="check" size={12} color={colors.white} />}
                    </View>
                    <Text style={styles.checkLabel}>Set as default card</Text>
                  </Pressable>
                ) : (
                  <View style={styles.securityBanner}>
                    <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
                    <Text style={styles.securityBannerText}>Updated cards become default automatically after confirmation.</Text>
                  </View>
                )}

                {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}

                <Text style={styles.securityNote}>
                  CVV never stored · Card number encrypted · Luhn checked
                </Text>

                <Pressable
                  style={[styles.primaryButton, submitting && { opacity: 0.6 }]}
                  onPress={handleSubmitCard}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator color={colors.white} size="small" />
                    : <Text style={styles.primaryButtonText}>{modalMode === "replace" ? "Review Update" : "Insert Card"}</Text>
                  }
                </Pressable>
              </ScrollView>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={!!deleteTarget}
        animationType="fade"
        transparent
        onRequestClose={() => { setDeleteTarget(null); setDeletePassword(""); }}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIcon}>
              <MaterialCommunityIcons name="trash-can-outline" size={24} color={colors.error} />
            </View>
            <Text style={styles.confirmTitle}>Delete Card</Text>
            <Text style={styles.confirmText}>
              This permanently removes {deleteTarget?.maskedNumber ?? "this card"}. You will need to insert a new card to continue using payment features.
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Confirm your password"
              placeholderTextColor={colors.gray500}
              secureTextEntry
              value={deletePassword}
              onChangeText={setDeletePassword}
            />
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <View style={styles.confirmActions}>
              <Pressable style={styles.secondaryButton} onPress={() => { setDeleteTarget(null); setDeletePassword(""); setErrorMessage(""); }} disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.dangerButton, submitting && { opacity: 0.6 }]} onPress={handleDelete} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.dangerButtonText}>Delete Card</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={!!pendingReplacePayload}
        animationType="fade"
        transparent
        onRequestClose={() => setPendingReplacePayload(null)}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconWarning}>
              <MaterialCommunityIcons name="credit-card-refresh-outline" size={24} color={colors.warning} />
            </View>
            <Text style={styles.confirmTitle}>Confirm Card Update</Text>
            <Text style={styles.confirmText}>
              Your current card will be removed and the new card ending in {cardDigits.slice(-4)} will become the default payment method.
            </Text>
            {!!errorMessage && <Text style={styles.errorText}>{errorMessage}</Text>}
            <View style={styles.confirmActions}>
              <Pressable style={styles.secondaryButton} onPress={() => setPendingReplacePayload(null)} disabled={submitting}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </Pressable>
              <Pressable style={[styles.warningButton, submitting && { opacity: 0.6 }]} onPress={confirmReplace} disabled={submitting}>
                {submitting
                  ? <ActivityIndicator color={colors.white} size="small" />
                  : <Text style={styles.warningButtonText}>Update Card</Text>
                }
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </MobileLayout>
  );
};
const previewStyles = StyleSheet.create({
  card: {
    borderRadius: 20,
    backgroundColor: "#6C63FF",
    padding: 22,
    overflow: "hidden",
    shadowColor: "#6C63FF",
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
    minHeight: 180,
    position: "relative",
  },
  circle1: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
  },
  circle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -30,
  },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  contactless: { transform: [{ rotate: "90deg" }] },
  cardNumber: {
    fontSize: 19, fontWeight: "700", color: "#fff",
    letterSpacing: 3, marginTop: 22,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  bottomRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-end", marginTop: 20,
  },
  fieldLabel: { fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 1, textTransform: "uppercase" },
  fieldValue: { fontSize: 13, color: "#fff", fontWeight: "700", marginTop: 2, letterSpacing: 0.5 },
  brandArea: { justifyContent: "flex-end" },
  visaText: { fontSize: 22, fontWeight: "900", color: "#fff", fontStyle: "italic", letterSpacing: 1 },
  mastercardCircles: { flexDirection: "row", alignItems: "center" },
  mcCircle: { width: 26, height: 26, borderRadius: 13, opacity: 0.9 },
});
const styles = StyleSheet.create({
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 100, gap: 14 },
  title: { fontSize: 22, fontWeight: "700", color: colors.gray900 },
  subtitle: { fontSize: 14, color: colors.gray500 },
  errorText: { fontSize: 12, color: colors.error, fontWeight: "600" },
  successText: { fontSize: 12, color: colors.success, fontWeight: "600" },
  warningBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.warningSoft, borderWidth: 1, borderColor: colors.warningBorder,
    borderRadius: radii.lg, padding: 12,
  },
  warningBannerText: { flex: 1, color: colors.warning, fontSize: 12, fontWeight: "700", lineHeight: 18 },

  cardWidget: {
    borderRadius: 20, backgroundColor: "#6C63FF", padding: 20,
    overflow: "hidden", shadowColor: "#6C63FF", shadowOpacity: 0.5,
    shadowRadius: 18, shadowOffset: { width: 0, height: 6 },
    elevation: 10, minHeight: 170, position: "relative",
  },
  cardWidgetDefault: { borderWidth: 2, borderColor: "#a5b4fc" },
  cardWidgetBlocked: { opacity: 0.55 },
  cardCircle1: {
    position: "absolute", width: 180, height: 180, borderRadius: 90,
    backgroundColor: "rgba(255,255,255,0.07)", top: -60, right: -50,
  },
  cardCircle2: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    backgroundColor: "rgba(255,255,255,0.05)", bottom: -30, left: -30,
  },
  cardShine: {
    position: "absolute", top: 0, bottom: 0, width: 80,
    backgroundColor: "rgba(255,255,255,0.08)", transform: [{ skewX: "-15deg" }],
  },
  cardTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardNumber: {
    fontSize: 18, fontWeight: "700", color: colors.white,
    letterSpacing: 2.5, marginTop: 24,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", marginTop: 18 },
  cardFieldLabel: { fontSize: 9, color: "rgba(255,255,255,0.55)", letterSpacing: 1 },
  cardFieldValue: { fontSize: 13, color: colors.white, fontWeight: "700", marginTop: 2 },
  cardBrandRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  visaBrand: { fontSize: 20, fontWeight: "900", color: colors.white, fontStyle: "italic" },
  mastercardBrand: { flexDirection: "row", alignItems: "center" },
  mcDot: { width: 22, height: 22, borderRadius: 11, opacity: 0.9 },
  defaultBadge: {
    backgroundColor: "rgba(255,255,255,0.2)", borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  defaultBadgeText: { fontSize: 9, color: colors.white, fontWeight: "800" },
  blockedBadge: {
    backgroundColor: colors.error, borderRadius: radii.sm, paddingHorizontal: 6, paddingVertical: 2,
  },
  blockedBadgeText: { fontSize: 9, color: colors.white, fontWeight: "800" },

  cardActions: { flexDirection: "row", gap: 8, paddingTop: 4 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: radii.md,
    borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.primaryLight,
  },
  actionBtnDanger: { borderColor: colors.errorBorder, backgroundColor: colors.errorLight },
  actionBtnDisabled: { borderColor: colors.cardBorder, backgroundColor: colors.surfaceStrong, opacity: 0.65 },
  actionBtnText: { fontSize: 12, fontWeight: "700", color: colors.primary },
  actionBtnDisabledText: { color: colors.gray500 },

  emptyCard: {
    backgroundColor: colors.card, borderRadius: radii.xl, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 28, alignItems: "center", gap: 10,
  },
  emptyCardTitle: { fontSize: 16, fontWeight: "700", color: colors.gray900 },
  emptyCardSub: { fontSize: 13, color: colors.gray500, textAlign: "center", lineHeight: 20 },

  primaryButton: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: colors.primary, borderRadius: radii.lg, paddingVertical: 14,
  },
  primaryButtonText: { color: colors.white, fontWeight: "700", fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalContent: {
    backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 20, paddingBottom: Platform.OS === "ios" ? 34 : 24, maxHeight: "92%",
  },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: "700", color: colors.gray900 },

  fieldLabel: {
    marginBottom: 6, fontSize: 10, letterSpacing: 1.2,
    fontWeight: "800", color: colors.gray600, textTransform: "uppercase",
  },
  input: {
    borderWidth: 1, borderColor: colors.gray200, backgroundColor: colors.surface,
    borderRadius: radii.lg, paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: colors.gray900,
  },
  validationLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  validationText: { fontSize: 11, fontWeight: "700" },
  rowFields: { flexDirection: "row", gap: 10 },
  typeRow: { flexDirection: "row", gap: 10 },
  typeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: radii.lg, borderWidth: 1.5,
    borderColor: colors.gray200, backgroundColor: colors.surface,
  },
  typeBtnActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  typeBtnText: { fontSize: 13, fontWeight: "700", color: colors.gray500 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: {
    width: 20, height: 20, borderRadius: 5, borderWidth: 1.5,
    borderColor: colors.gray300, backgroundColor: colors.surface,
    alignItems: "center", justifyContent: "center",
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  checkLabel: { fontSize: 13, color: colors.gray700, fontWeight: "600" },
  securityNote: { fontSize: 11, color: colors.gray500, textAlign: "center" },
  securityBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primaryBorder,
    borderRadius: radii.lg, padding: 12,
  },
  securityBannerText: { flex: 1, color: colors.primary, fontSize: 12, fontWeight: "700", lineHeight: 17 },
  confirmOverlay: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center", padding: 20,
  },
  confirmCard: {
    backgroundColor: colors.card, borderRadius: radii.xxl, borderWidth: 1,
    borderColor: colors.cardBorder, padding: 20, gap: 14,
  },
  confirmIcon: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.errorLight,
    alignItems: "center", justifyContent: "center",
  },
  confirmIconWarning: {
    width: 48, height: 48, borderRadius: 24, backgroundColor: colors.warningSoft,
    alignItems: "center", justifyContent: "center",
  },
  confirmTitle: { fontSize: 18, fontWeight: "800", color: colors.gray900 },
  confirmText: { fontSize: 13, color: colors.gray600, lineHeight: 20 },
  confirmActions: { flexDirection: "row", gap: 10 },
  secondaryButton: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderRadius: radii.lg, borderWidth: 1, borderColor: colors.cardBorder,
    paddingVertical: 13, backgroundColor: colors.surface,
  },
  secondaryButtonText: { color: colors.gray700, fontSize: 14, fontWeight: "800" },
  dangerButton: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderRadius: radii.lg, paddingVertical: 13, backgroundColor: colors.error,
  },
  dangerButtonText: { color: colors.white, fontSize: 14, fontWeight: "800" },
  warningButton: {
    flex: 1, alignItems: "center", justifyContent: "center",
    borderRadius: radii.lg, paddingVertical: 13, backgroundColor: colors.warning,
  },
  warningButtonText: { color: colors.background, fontSize: 14, fontWeight: "800" },
  emptyWrap: { flex: 1, justifyContent: "center", paddingHorizontal: 20, gap: 12 },
});

export default Cards;
