import { StyleSheet } from "react-native";

export const colors = {
  background: "#070A12",
  card: "#111827",
  primary: "#6D5DFB",
  primaryForeground: "#FFFFFF",
  success: "#19C37D",
  warning: "#F0B75A",
  destructive: "#F07171",
  foreground: "#F7F8FF",
  mutedForeground: "#9AA4B8",
  border: "#26324A",
  ring: "#8B72FF",

  surface: "#0B1020",
  surfaceStrong: "#151B2E",
  primarySoft: "#1D1A3B",
  primaryBorder: "#5443A8",
  successSoft: "#0A2A20",
  successBorder: "#226B51",
  warningSoft: "#2E2412",
  warningBorder: "#7B5926",
  destructiveSoft: "#2D171C",
  destructiveBorder: "#74313A",
  foregroundSoft: "#202638",
  foregroundStrong: "#FFFFFF",
  navGlass: "#0B1020",
  shadow: "#000000",

  primaryLight: "#1D1A3B",
  primaryBg: "#1D1A3B",
  accent: "#19C37D",
  accentLight: "#0A2A20",
  successLight: "#0A2A20",

  error: "#F07171",
  errorLight: "#2D171C",
  errorBorder: "#74313A",

  warningLight: "#2E2412",

  white: "#FFFFFF",

  gray50: "#0B1020",
  gray100: "#151B2E",
  gray200: "#26324A",
  gray300: "#3A4258",
  gray400: "#6F7890",
  gray500: "#9AA4B8",
  gray600: "#B5BDD0",
  gray700: "#D4D9E8",
  gray800: "#EAEDFA",
  gray900: "#F7F8FF",

  pageBg: "#070A12",

  cardBorder: "#26324A",
  surfaceLight: "#0B1020",

  googleRed: "#F07171",
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
