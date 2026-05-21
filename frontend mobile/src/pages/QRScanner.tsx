import { useRef, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobileLayout from "@/components/MobileLayout";
import { resolveDeepLink } from "@/lib/deep-links";
import { useAppNavigation } from "@/lib/app-navigation";
import { colors, radii } from "@/lib/theme";

export default function QRScanner() {
  const { navigate } = useAppNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [error, setError] = useState("");
  const cooldown = useRef(false);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (cooldown.current || scanned) return;
    cooldown.current = true;
    setScanned(true);
    setError("");

    const parsed = resolveDeepLink(data);
    if (!parsed) {
      setError("QR code non reconnu. Scannez un QR CreditTN ou un lien produit valide.");
      cooldown.current = false;
      setTimeout(() => setScanned(false), 2000);
      return;
    }

    navigate(parsed.route, parsed.params);
  };

  const reset = () => {
    setScanned(false);
    setError("");
    cooldown.current = false;
  };

  if (!permission) {
    return (
      <MobileLayout>
        <View style={styles.center}>
          <Text style={styles.infoText}>Demande d'acces camera...</Text>
        </View>
      </MobileLayout>
    );
  }

  if (!permission.granted) {
    return (
      <MobileLayout>
        <View style={styles.center}>
          <MaterialCommunityIcons name="camera-off-outline" size={40} color={colors.gray500} />
          <Text style={styles.errorText}>Acces camera refuse.</Text>
          <TouchableOpacity onPress={requestPermission} style={[styles.retryButton, { marginTop: 12 }]}>
            <Text style={styles.retryText}>Autoriser la camera</Text>
          </TouchableOpacity>
        </View>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout noPadding>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigate("Home")} style={styles.backButton}>
            <MaterialCommunityIcons name="arrow-left" size={18} color={colors.white} />
            <Text style={styles.backText}>Retour</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Scanner un QR Code</Text>
        </View>

        <View style={styles.cameraWrapper}>
          <CameraView
            style={StyleSheet.absoluteFillObject}
            facing="back"
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          <View style={styles.overlay}>
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
          </View>
        </View>

        <View style={styles.bottom}>
          {error ? (
            <>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity onPress={reset} style={styles.retryButton}>
                <Text style={styles.retryText}>Reessayer</Text>
              </TouchableOpacity>
            </>
          ) : scanned ? (
            <View style={styles.successRow}>
              <MaterialCommunityIcons name="check-circle" size={22} color={colors.success} />
              <Text style={styles.successText}>QR detecte, ouverture en cours...</Text>
            </View>
          ) : (
            <Text style={styles.hint}>Pointez la camera vers un QR Code CreditTN</Text>
          )}
        </View>
      </View>
    </MobileLayout>
  );
}

const FRAME = 220;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8 },
  backText: { color: colors.white, fontSize: 14, fontWeight: "700" },
  title: { color: colors.white, fontSize: 18, fontWeight: "800", flex: 1 },
  cameraWrapper: { flex: 1, position: "relative" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(7,10,19,0.58)",
  },
  scanFrame: {
    width: FRAME,
    height: FRAME,
    position: "relative",
  },
  corner: {
    position: "absolute",
    width: 36,
    height: 36,
    borderColor: colors.primary,
    borderWidth: 4,
  },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: radii.sm },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: radii.sm },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: radii.sm },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: radii.sm },
  bottom: {
    padding: 24,
    backgroundColor: colors.background,
    alignItems: "center",
    minHeight: 110,
    justifyContent: "center",
  },
  hint: { color: colors.mutedForeground, fontSize: 14, textAlign: "center" },
  successRow: { alignItems: "center", gap: 8 },
  successText: { color: colors.success, fontSize: 15, fontWeight: "700" },
  errorText: { color: colors.error, fontSize: 14, textAlign: "center", marginBottom: 12 },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: radii.md,
  },
  retryText: { color: colors.white, fontWeight: "800", fontSize: 14 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 10 },
  infoText: { color: colors.mutedForeground, fontSize: 14 },
});
