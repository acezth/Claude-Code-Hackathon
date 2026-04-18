import { StyleSheet, Text, View } from "react-native";

import { Pill } from "@/components/Pill";
import { colors, radii } from "@/lib/theme";
import type { FoodOption } from "@/lib/types";

export function RecommendationCard({ option, featured = false }: { option: FoodOption; featured?: boolean }) {
  return (
    <View style={[styles.card, featured && styles.featured]}>
      <View style={styles.row}>
        <Text style={styles.name}>{option.name}</Text>
        <Text style={styles.score}>{Math.round(option.final_score * 100)}</Text>
      </View>
      <Text style={styles.meal}>{option.meal_suggestion}</Text>
      <Text style={styles.meta}>
        {option.travel_minutes} min away • {option.distance_miles.toFixed(1)} mi • {option.address}
      </Text>
      <Text style={styles.reason}>{option.reason}</Text>
      <View style={styles.tags}>
        {option.tags.map((tag) => (
          <Pill key={tag} label={tag} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: "#F9F6EF",
    borderWidth: 1,
    borderColor: "#E6DECF",
    gap: 8,
  },
  featured: {
    backgroundColor: "#FFF6EB",
    borderColor: colors.gold,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  name: {
    fontSize: 20,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  score: {
    fontSize: 18,
    color: colors.coral,
    fontFamily: "Newsreader_600SemiBold",
  },
  meal: {
    fontSize: 16,
    color: colors.forest,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  meta: {
    fontSize: 13,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  reason: {
    fontSize: 14,
    lineHeight: 20,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  tags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
});
