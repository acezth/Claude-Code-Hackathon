import { StyleSheet, Text, View } from "react-native";

import { colors, radii } from "@/lib/theme";

export function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <View style={[styles.card, accent && styles.accent]}>
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: 140,
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: "#EEF4ED",
    gap: 4,
  },
  accent: {
    backgroundColor: "#FFF1E8",
  },
  value: {
    fontSize: 28,
    color: colors.ink,
    fontFamily: "Newsreader_700Bold",
  },
  label: {
    fontSize: 13,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
