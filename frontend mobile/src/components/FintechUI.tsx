/* eslint-disable react-refresh/only-export-components */

import { ReactNode, useEffect, useMemo, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { colors, radii } from "@/lib/theme";

export const money = (value?: number) => `${(value ?? 0).toFixed(2)} DT`;

export const prettyDate = (dateIso?: string | null) => {
  if (!dateIso) return "-";
  return new Date(dateIso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
};

export const FintechCard = ({ children, style }: { children: ReactNode; style?: object }) => (
  <View style={[styles.card, style]}>{children}</View>
);

export const FadeInView = ({ children, delay = 0, style }: { children: ReactNode; delay?: number; style?: object }) => {
  const value = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(value, {
      toValue: 1,
      duration: 360,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [delay, value]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: value,
          transform: [
            {
              translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
};

export const ProgressRing = ({
  percent,
  size = 88,
  strokeWidth = 9,
  color = colors.primary,
  label,
}: {
  percent: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}) => {
  const clamped = Math.max(0, Math.min(100, percent));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.foregroundSoft}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          rotation="-90"
          originX={size / 2}
          originY={size / 2}
        />
      </Svg>
      <View style={styles.ringCenter}>
        <Text style={styles.ringValue}>{Math.round(clamped)}%</Text>
        {!!label && <Text style={styles.ringLabel}>{label}</Text>}
      </View>
    </View>
  );
};

export const MiniStat = ({
  label,
  value,
  icon,
  color = colors.primary,
}: {
  label: string;
  value: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color?: string;
}) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: `${color}22` }]}>
      <MaterialCommunityIcons name={icon} size={17} color={color} />
    </View>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
  </View>
);

export const SkeletonLine = ({ width = "100%", height = 12 }: { width?: number | string; height?: number }) => {
  const pulse = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [pulse]);

  const computedStyle = useMemo(() => ({ width, height }), [height, width]);
  return <Animated.View style={[styles.skeleton, computedStyle, { opacity: pulse }]} />;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.xxl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 16,
    shadowColor: colors.shadow,
    shadowOpacity: 0.24,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 14 },
    elevation: 6,
  },
  ringCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  ringValue: {
    color: colors.foreground,
    fontSize: 18,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  ringLabel: {
    color: colors.mutedForeground,
    fontSize: 9,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statCard: {
    flex: 1,
    minWidth: 104,
    backgroundColor: colors.surface,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: 12,
    gap: 7,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  statLabel: {
    color: colors.mutedForeground,
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  statValue: {
    color: colors.foreground,
    fontSize: 16,
    fontWeight: "900",
    fontVariant: ["tabular-nums"],
  },
  skeleton: {
    backgroundColor: colors.surfaceStrong,
    borderRadius: radii.full,
  },
});
