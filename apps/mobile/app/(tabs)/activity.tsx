import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { StatCard } from "@/components/StatCard";
import { getActivity } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import type { ActivitySummary } from "@/lib/types";

export default function ActivityScreen() {
  const [data, setData] = useState<ActivitySummary | null>(null);

  useEffect(() => {
    getActivity().then(setData);
  }, []);

  if (!data) {
    return <ScreenShell />;
  }

  return (
    <ScreenShell>
      <SectionCard title="Your activity" subtitle="Manual entries and Strava sync share one clean dashboard.">
        <View style={styles.statGrid}>
          <StatCard label="Workouts" value={String(data.weekly_workouts)} accent />
          <StatCard label="Minutes" value={String(data.weekly_minutes)} />
          <StatCard label="Miles" value={String(data.weekly_distance_miles)} />
          <StatCard label="Calories" value={String(data.calories_burned)} accent />
        </View>
        <Text style={styles.trend}>{data.trend_note}</Text>
      </SectionCard>

      <SectionCard title="Recent sessions">
        {data.workouts.map((workout) => (
          <View key={workout.id} style={styles.workoutCard}>
            <Text style={styles.workoutTitle}>{workout.activity_type}</Text>
            <Text style={styles.workoutMeta}>
              {workout.duration_minutes} min{workout.distance_miles ? ` • ${workout.distance_miles} mi` : ""}
              {workout.calories ? ` • ${workout.calories} cal` : ""}
            </Text>
            {workout.notes ? <Text style={styles.workoutBody}>{workout.notes}</Text> : null}
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  statGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  trend: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  workoutCard: {
    padding: 16,
    borderRadius: radii.lg,
    backgroundColor: "#F3F7F0",
    gap: 6,
  },
  workoutTitle: {
    fontSize: 22,
    color: colors.ink,
    fontFamily: "Newsreader_700Bold",
  },
  workoutMeta: {
    fontSize: 13,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  workoutBody: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
