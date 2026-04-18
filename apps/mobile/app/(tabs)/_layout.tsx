import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { colors } from "@/lib/theme";

const iconMap = {
  index: "sparkles",
  nearby: "navigate",
  fridge: "nutrition",
  grocery: "cart",
  activity: "barbell",
  coach: "chatbubbles",
  profile: "person-circle",
} as const;

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.coral,
        tabBarInactiveTintColor: colors.moss,
        tabBarStyle: {
          height: 82,
          paddingTop: 8,
          backgroundColor: "#FFFCF6",
          borderTopColor: "#EADFCF",
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: "SpaceGrotesk_500Medium",
        },
        tabBarIcon: ({ color, size }) => (
          <Ionicons
            name={iconMap[route.name as keyof typeof iconMap]}
            size={size}
            color={color}
          />
        ),
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="nearby" options={{ title: "Nearby" }} />
      <Tabs.Screen name="fridge" options={{ title: "Fridge" }} />
      <Tabs.Screen name="grocery" options={{ title: "Grocery" }} />
      <Tabs.Screen name="activity" options={{ title: "Activity" }} />
      <Tabs.Screen name="coach" options={{ title: "Coach" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
