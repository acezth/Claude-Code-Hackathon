import { StyleSheet, Text, View } from "react-native";

import { colors } from "@/lib/theme";

export function Pill({ label }: { label: string }) {
  return (
    <View style={styles.pill}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    backgroundColor: colors.lime,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignSelf: "flex-start",
  },
  label: {
    color: colors.forest,
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
