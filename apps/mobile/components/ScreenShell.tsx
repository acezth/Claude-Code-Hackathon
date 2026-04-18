import { PropsWithChildren } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";

import { colors } from "@/lib/theme";

export function ScreenShell({ children }: PropsWithChildren) {
  return (
    <LinearGradient colors={[colors.cream, "#F0E9D8", "#E3F0DC"]} style={styles.gradient}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inner}>{children}</View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  inner: {
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 16,
  },
});
