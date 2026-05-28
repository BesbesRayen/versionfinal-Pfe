import { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";

interface MobileLayoutProps {
  children: ReactNode;
  noPadding?: boolean;
}

const MobileLayout = ({ children, noPadding = false }: MobileLayoutProps) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.auraTop} />
      <View style={styles.auraMid} />
      <View style={styles.auraBottom} />
      <View style={[styles.container, !noPadding && styles.withPadding]}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.pageBg,
    overflow: "hidden",
  },
  container: {
    flex: 1,
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    zIndex: 2,
  },
  withPadding: {
    paddingHorizontal: 20,
  },
  auraTop: {
    position: "absolute",
    top: -110,
    right: -110,
    width: 270,
    height: 270,
    borderRadius: 135,
    backgroundColor: "rgba(139, 92, 246, 0.30)",
    opacity: 0.82,
  },
  auraMid: {
    position: "absolute",
    top: 230,
    left: -150,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: "rgba(45, 212, 255, 0.12)",
    opacity: 0.78,
  },
  auraBottom: {
    position: "absolute",
    bottom: -170,
    alignSelf: "center",
    width: 390,
    height: 260,
    borderRadius: 195,
    backgroundColor: "rgba(183, 140, 255, 0.14)",
  },
});

export default MobileLayout;
