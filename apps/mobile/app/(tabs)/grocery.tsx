import { useEffect, useMemo, useState } from "react";
import { StyleSheet, Text, View } from "react-native";

import { ScreenShell } from "@/components/ScreenShell";
import { SectionCard } from "@/components/SectionCard";
import { getGroceryLists } from "@/lib/api";
import { colors, radii } from "@/lib/theme";
import type { GroceryList } from "@/lib/types";

export default function GroceryScreen() {
  const [lists, setLists] = useState<GroceryList[]>([]);

  useEffect(() => {
    getGroceryLists().then(setLists);
  }, []);

  const currentList = lists[0];
  const groupedItems = useMemo(() => {
    if (!currentList) {
      return [];
    }
    return Object.entries(
      currentList.items.reduce<Record<string, GroceryList["items"]>>((acc, item) => {
        acc[item.category] = [...(acc[item.category] ?? []), item];
        return acc;
      }, {}),
    );
  }, [currentList]);

  return (
    <ScreenShell>
      <SectionCard
        title={currentList?.title ?? "Grocery list"}
        subtitle="Manual, meal-generated, and travel-friendly staples can all live in one place."
      >
        <Text style={styles.summary}>
          {currentList ? `${currentList.items.filter((item) => !item.checked).length} items left to grab.` : "Loading list..."}
        </Text>
      </SectionCard>

      {groupedItems.map(([category, items]) => (
        <SectionCard key={category} title={category}>
          {items.map((item) => (
            <View key={item.id} style={[styles.itemRow, item.checked && styles.checkedRow]}>
              <View style={[styles.checkbox, item.checked && styles.checked]} />
              <View style={styles.itemCopy}>
                <Text style={styles.itemName}>{item.item_name}</Text>
                <Text style={styles.itemMeta}>{item.quantity}</Text>
              </View>
            </View>
          ))}
        </SectionCard>
      ))}
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  summary: {
    fontSize: 16,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_500Medium",
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: radii.lg,
    backgroundColor: "#F7F5EF",
  },
  checkedRow: {
    opacity: 0.55,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.moss,
  },
  checked: {
    backgroundColor: colors.forest,
    borderColor: colors.forest,
  },
  itemCopy: {
    gap: 2,
  },
  itemName: {
    fontSize: 16,
    color: colors.ink,
    fontFamily: "SpaceGrotesk_500Medium",
    textTransform: "capitalize",
  },
  itemMeta: {
    fontSize: 13,
    color: colors.moss,
    fontFamily: "SpaceGrotesk_400Regular",
  },
});
