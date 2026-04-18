import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { RecommendationCard } from "@/components/RecommendationCard";
import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { getNearbyRecommendations } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { NearbyFoodResponse } from "@/lib/types";

export default function NearbyScreen() {
  const [data, setData] = useState<NearbyFoodResponse | null>(null);

  useEffect(() => {
    getNearbyRecommendations().then(setData);
  }, []);

  if (!data) {
    return <ScreenShell />;
  }

  return (
    <ScreenShell>
      <SectionCard title="Nearby food" subtitle="Ranked for convenience and health together, not one without the other.">
        <Text style={styles.summary}>{data.coach_summary}</Text>
      </SectionCard>
      <SectionCard title="Best option">
        <RecommendationCard option={data.best_option} featured />
      </SectionCard>
      <SectionCard title="Backups">
        {data.backup_options.map((option) => (
          <RecommendationCard key={option.id} option={option} />
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
