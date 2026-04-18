import { useEffect, useState } from "react";
import { StyleSheet, Text } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { getCoachAdvice } from "@/lib/api";
import { colors } from "@/lib/theme";
import type { CoachAdviceResponse } from "@/lib/types";

export default function CoachScreen() {
  const [data, setData] = useState<CoachAdviceResponse | null>(null);

  useEffect(() => {
    getCoachAdvice().then(setData);
  }, []);

  if (!data) {
    return <ScreenShell />;
  }

  return (
    <ScreenShell>
      <SectionCard title="Today’s coach note" subtitle={data.why_it_matters}>
        <Text style={styles.tip}>{data.habit_tip}</Text>
      </SectionCard>
      <SectionCard title="Action for today">
        <Text style={styles.body}>{data.action_for_today}</Text>
      </SectionCard>
      <SectionCard title="Why RoamWell says this">
        <Text style={styles.body}>
          Recommendations are designed to feel like a practical coach: short, contextual, and realistic for messy days.
        </Text>
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  tip: {
    fontSize: 28,
    lineHeight: 34,
    color: colors.ink,
    fontFamily: "Newsreader_700Bold",
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
