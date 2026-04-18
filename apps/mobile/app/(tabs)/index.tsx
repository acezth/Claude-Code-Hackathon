import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Link } from "expo-router";

import { RecommendationCard } from "@/components/RecommendationCard";
import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { getCoachAdvice, getNearbyRecommendations, getProfile } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import type { CoachAdviceResponse, NearbyFoodResponse, UserProfile } from "@/lib/types";

export default function HomeScreen() {
  const [nearby, setNearby] = useState<NearbyFoodResponse | null>(null);
  const [coach, setCoach] = useState<CoachAdviceResponse | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    getNearbyRecommendations().then(setNearby);
    getCoachAdvice().then(setCoach);
    getProfile().then(setProfile);
  }, []);

  return (
    <ScreenShell>
      <SectionCard style={styles.hero}>
        <Text style={styles.eyebrow}>RoamWell</Text>
        <Text style={styles.heroTitle}>Health guidance for the kind of days that refuse to stay predictable.</Text>
        <Text style={styles.heroBody}>
          {profile ? `Good morning, ${profile.name.split(" ")[0]}.` : "Good morning."} You have a late-afternoon crunch coming, so today’s best move is to front-load steadier energy.
        </Text>
        <View style={styles.heroActions}>
          <Link href="/nearby" asChild>
            <Pressable style={[styles.button, styles.primaryButton]}>
              <Text style={styles.primaryButtonText}>What should I eat right now?</Text>
            </Pressable>
          </Link>
          <Link href="/fridge" asChild>
            <Pressable style={styles.button}>
              <Text style={styles.secondaryButtonText}>Scan my fridge</Text>
            </Pressable>
          </Link>
        </View>
      </SectionCard>

      {nearby ? (
        <SectionCard
          title="Current recommendation"
          subtitle="Built from time pressure, distance, and steadier-energy heuristics."
        >
          <RecommendationCard option={nearby.best_option} featured />
          <Text style={styles.supportText}>{nearby.quick_tip}</Text>
        </SectionCard>
      ) : null}

      <SectionCard title="Next event" subtitle="A quick schedule-aware preview for the rest of your day.">
        <Text style={styles.eventTitle}>Design review in 35 minutes</Text>
        <Text style={styles.supportText}>
          You have enough time for one fast pickup, but not enough time to wait until after the meeting block.
        </Text>
      </SectionCard>

      {coach ? (
        <SectionCard title={coach.title} subtitle={coach.why_it_matters}>
          <Text style={styles.coachTip}>{coach.habit_tip}</Text>
          <Text style={styles.supportText}>Action: {coach.action_for_today}</Text>
        </SectionCard>
      ) : null}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: colors.ink,
  },
  eyebrow: {
    color: colors.gold,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "SpaceGrotesk_500Medium",
  },
  heroTitle: {
    color: colors.white,
    fontSize: 38,
    lineHeight: 42,
    fontFamily: "Newsreader_700Bold",
  },
  heroBody: {
    color: "#E5EFE7",
    fontSize: 16,
    lineHeight: 24,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  heroActions: {
    gap: 12,
    marginTop: 6,
  },
  button: {
    borderRadius: radii.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: "#4D6A5B",
  },
  primaryButton: {
    backgroundColor: colors.peach,
    borderColor: colors.peach,
  },
  primaryButtonText: {
    color: colors.ink,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_700Bold",
  },
  secondaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  eventTitle: {
    fontSize: 24,
    color: colors.forest,
    fontFamily: "Newsreader_700Bold",
  },
  coachTip: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  supportText: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
