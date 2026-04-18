import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { getIntegrations, getProfile } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import type { IntegrationStatus, UserProfile } from "@/lib/types";

export default function ProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);

  useEffect(() => {
    getProfile().then(setProfile);
    getIntegrations().then(setIntegrations);
  }, []);

  return (
    <ScreenShell>
      <SectionCard title={profile?.name ?? "Profile"} subtitle={profile?.email ?? "Loading..."}>
        <Text style={styles.line}>Goals: {profile?.goals.join(", ")}</Text>
        <Text style={styles.line}>Dietary preferences: {profile?.dietary_preferences.join(", ")}</Text>
        <Text style={styles.line}>Allergies: {profile?.allergies.join(", ")}</Text>
        <Text style={styles.line}>Caffeine: {profile?.caffeine_preference}</Text>
      </SectionCard>

      <SectionCard title="Linked accounts">
        {integrations.map((integration) => (
          <View key={integration.provider_name} style={styles.integrationRow}>
            <View>
              <Text style={styles.integrationName}>{integration.provider_name.replace("_", " ")}</Text>
              <Text style={styles.integrationNote}>{integration.status_note}</Text>
            </View>
            <View style={[styles.badge, integration.connected ? styles.connected : styles.disconnected]}>
              <Text style={styles.badgeText}>{integration.connected ? "On" : "Off"}</Text>
            </View>
          </View>
        ))}
      </SectionCard>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  line: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  integrationRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: "#F6F5EF",
  },
  integrationName: {
    fontSize: 16,
    color: colors.ink,
    textTransform: "capitalize",
    fontFamily: "SpaceGrotesk_700Bold",
  },
  integrationNote: {
    maxWidth: 230,
    fontSize: 13,
    lineHeight: 19,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_400Regular",
  },
  badge: {
    minWidth: 48,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 8,
    alignItems: "center",
  },
  connected: {
    backgroundColor: colors.lime,
  },
  disconnected: {
    backgroundColor: "#F2E0D8",
  },
  badgeText: {
    color: colors.ink,
    fontSize: 13,
    fontFamily: "SpaceGrotesk_500Medium",
  },
});
