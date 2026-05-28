import { StyleSheet } from "react-native";

export const colors = {
  background: "#050816",
  card: "#101426",
  primary: "#8B5CF6",
  primaryForeground: "#FFFFFF",
  success: "#24E0A4",
  warning: "#F7C66B",
  destructive: "#FF6B8A",
  foreground: "#F8FAFF",
  mutedForeground: "#9AA7C7",
  border: "#2B3353",
  ring: "#B78CFF",

  surface: "#0A0F21",
  surfaceStrong: "#161B31",
  primarySoft: "rgba(139, 92, 246, 0.18)",
  primaryBorder: "rgba(183, 140, 255, 0.44)",
  successSoft: "rgba(36, 224, 164, 0.14)",
  successBorder: "rgba(36, 224, 164, 0.32)",
  warningSoft: "rgba(247, 198, 107, 0.14)",
  warningBorder: "rgba(247, 198, 107, 0.32)",
  destructiveSoft: "rgba(255, 107, 138, 0.14)",
  destructiveBorder: "rgba(255, 107, 138, 0.34)",
  foregroundSoft: "rgba(248, 250, 255, 0.08)",
  foregroundStrong: "#FFFFFF",
  navGlass: "rgba(10, 15, 33, 0.86)",
  shadow: "#000000",

  primaryLight: "rgba(139, 92, 246, 0.18)",
  primaryBg: "rgba(139, 92, 246, 0.18)",
  accent: "#2DD4FF",
  accentLight: "rgba(45, 212, 255, 0.14)",
  successLight: "rgba(36, 224, 164, 0.14)",

  error: "#FF6B8A",
  errorLight: "rgba(255, 107, 138, 0.13)",
  errorBorder: "rgba(255, 107, 138, 0.34)",

  warningLight: "rgba(247, 198, 107, 0.14)",

  white: "#FFFFFF",

  gray50: "#0A0F21",
  gray100: "#161B31",
  gray200: "#2B3353",
  gray300: "#454E70",
  gray400: "#747F9F",
  gray500: "#9AA7C7",
  gray600: "#B9C3DD",
  gray700: "#D9E0F4",
  gray800: "#EEF2FF",
  gray900: "#F8FAFF",

  pageBg: "#050816",

  cardBorder: "rgba(255, 255, 255, 0.11)",
  surfaceLight: "#0A0F21",

  googleRed: "#FF6B8A",
} as const;

export const radii = {
  sm: 8,
  md: 10,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
} as const;

export const commonStyles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 15,
    color: colors.gray900,
  },
  label: {
    marginBottom: 8,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: "700",
    color: colors.gray700,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radii.xl,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: colors.ring,
    shadowOpacity: 0.28,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 12 },
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "800" as const,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center" as const,
  },
  secondaryButtonText: {
    color: colors.gray700,
    fontWeight: "600" as const,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.22,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
  },
  errorText: {
    fontSize: 12,
    color: colors.error,
  },
  disabled: {
    opacity: 0.7,
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: radii.md,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  backText: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: colors.gray700,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.gray900,
  },
  subtitle: {
    fontSize: 14,
    color: colors.gray500,
  },
});
