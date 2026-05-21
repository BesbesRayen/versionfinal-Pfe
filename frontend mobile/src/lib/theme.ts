import { StyleSheet } from "react-native";

export const colors = {
  background: "#070A13",
  card: "#171B2C",
  primary: "#7C5CFF",
  primaryForeground: "#FFFFFF",
  success: "#55D6A5",
  warning: "#F0B75A",
  destructive: "#F07171",
  foreground: "#F7F8FF",
  mutedForeground: "#9AA4B8",
  border: "#2B3145",
  ring: "#8B72FF",

  surface: "#111625",
  surfaceStrong: "#20263A",
  primarySoft: "#211A3D",
  primaryBorder: "#5443A8",
  successSoft: "#10291F",
  successBorder: "#226B51",
  warningSoft: "#2E2412",
  warningBorder: "#7B5926",
  destructiveSoft: "#2D171C",
  destructiveBorder: "#74313A",
  foregroundSoft: "#202638",
  foregroundStrong: "#FFFFFF",
  navGlass: "#151A2B",
  shadow: "#000000",

  primaryLight: "#211A3D",
  primaryBg: "#211A3D",
  accent: "#55D6A5",
  accentLight: "#10291F",
  successLight: "#10291F",

  error: "#F07171",
  errorLight: "#2D171C",
  errorBorder: "#74313A",

  warningLight: "#2E2412",

  white: "#FFFFFF",

  gray50: "#111625",
  gray100: "#202638",
  gray200: "#2B3145",
  gray300: "#3A4258",
  gray400: "#6F7890",
  gray500: "#9AA4B8",
  gray600: "#B5BDD0",
  gray700: "#D4D9E8",
  gray800: "#EAEDFA",
  gray900: "#F7F8FF",

  pageBg: "#070A13",

  cardBorder: "#2B3145",
  surfaceLight: "#111625",

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
    borderColor: colors.gray200,
    backgroundColor: colors.gray50,
    borderRadius: radii.lg,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 14,
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
    borderRadius: radii.lg,
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  primaryButtonText: {
    color: colors.white,
    fontWeight: "700" as const,
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: colors.gray100,
    borderRadius: radii.lg,
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
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 14,
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
