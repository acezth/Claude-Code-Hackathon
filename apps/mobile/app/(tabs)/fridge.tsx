import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { Pill } from "@/components/Pill";
import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { analyzeFridge } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import type { FridgeScanResponse } from "@/lib/types";

export default function FridgeScreen() {
  const [data, setData] = useState<FridgeScanResponse | null>(null);

  useEffect(() => {
    analyzeFridge().then(setData);
  }, []);

  if (!data) {
    return <ScreenShell />;
  }

  return (
    <ScreenShell>
      <SectionCard
        title="Fridge scan"
        subtitle="Vision-ready flow for turning ingredients into fast meals and grocery top-ups."
      >
        <Text style={styles.lead}>Detected ingredients</Text>
        <View style={styles.wrap}>
          {data.detected_ingredients.map((item) => (
            <Pill key={item} label={item} />
          ))}
        </View>
      </SectionCard>

      <SectionCard title="Meal suggestions">
        {data.meal_suggestions.map((meal) => (
          <View key={meal.name} style={styles.mealCard}>
            <Text style={styles.mealTitle}>{meal.name}</Text>
            <Text style={styles.meta}>{meal.prep_time_minutes} min • {meal.ingredients_used.join(", ")}</Text>
            <Text style={styles.body}>{meal.why_it_is_healthy}</Text>
            {meal.missing_ingredients.length ? (
              <Text style={styles.missing}>Missing: {meal.missing_ingredients.join(", ")}</Text>
            ) : (
              <Text style={styles.ready}>You already have everything you need.</Text>
            )}
          </View>
        ))}
      </SectionCard>

      <SectionCard title="Add to grocery list">
        <View style={styles.wrap}>
          {data.grocery_push_candidates.map((item) => (
            <Pill key={item} label={item} />
          ))}
        </View>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 16,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  mealCard: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: "#F4F8F3",
    gap: 6,
  },
  mealTitle: {
    fontSize: 22,
    color: colors.ink,
    fontFamily: "Newsreader_700Bold",
  },
  meta: {
    fontSize: 13,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  missing: {
    fontSize: 14,
    color: colors.coral,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  ready: {
    fontSize: 14,
    color: colors.forest,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
