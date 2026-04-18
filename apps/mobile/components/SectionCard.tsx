import { PropsWithChildren } from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { colors, radii, shadows } from "@/lib/theme";

type SectionCardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  style?: ViewStyle;
}>;

export function SectionCard({ children, title, subtitle, style }: SectionCardProps) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: radii.xl,
    padding: 18,
    gap: 12,
    ...shadows.card,
  },
  title: {
    fontSize: 22,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
