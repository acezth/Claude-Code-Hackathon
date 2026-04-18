import type { GroceryItem } from "./types";

export const GROCERY_STORAGE_KEY = "beat.groceries";
export const GROCERY_SYNC_EVENT = "beat:groceries-updated";
const LEGACY_PANTRY_KEY = "beat.pantry";

interface LegacyPantryItem {
  id: string;
  text: string;
  addedAt: string;
}

function normalize(item: GroceryItem): GroceryItem {
  return {
    ...item,
    text: item.text?.trim() ?? "",
    done: Boolean(item.done),
    inInventory: Boolean(item.inInventory),
    purchasedAt: item.purchasedAt,
  };
}

function persist(items: GroceryItem[], emit: boolean) {
  localStorage.setItem(GROCERY_STORAGE_KEY, JSON.stringify(items));
  if (emit) {
    window.dispatchEvent(new CustomEvent(GROCERY_SYNC_EVENT, { detail: { count: items.length } }));
  }
}

function parseLegacyPantry(): LegacyPantryItem[] {
  try {
    const raw = JSON.parse(localStorage.getItem(LEGACY_PANTRY_KEY) || "[]") as LegacyPantryItem[];
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
}

export function readGroceries(): GroceryItem[] {
  let groceries: GroceryItem[];
  try {
    const raw = JSON.parse(localStorage.getItem(GROCERY_STORAGE_KEY) || "[]") as GroceryItem[];
    groceries = (Array.isArray(raw) ? raw : []).map(normalize).filter((item) => item.text.length > 0);
  } catch {
    groceries = [];
  }

  const legacyPantry = parseLegacyPantry();
  if (legacyPantry.length === 0) return groceries;

  let changed = false;
  const merged = [...groceries];
  const byName = new Map(merged.map((item, index) => [item.text.toLowerCase(), index]));

  legacyPantry.forEach((entry) => {
    const text = entry.text?.trim() ?? "";
    if (!text) return;
    const key = text.toLowerCase();
    const index = byName.get(key);
    if (index !== undefined) {
      const current = merged[index];
      if (!current.inInventory || current.done || !current.purchasedAt) {
        merged[index] = {
          ...current,
          inInventory: true,
          done: false,
          purchasedAt: current.purchasedAt ?? entry.addedAt,
        };
        changed = true;
      }
      return;
    }
    merged.push({
      id: entry.id || crypto.randomUUID(),
      text,
      done: false,
      addedBy: "user",
      inInventory: true,
      purchasedAt: entry.addedAt,
    });
    byName.set(key, merged.length - 1);
    changed = true;
  });

  localStorage.removeItem(LEGACY_PANTRY_KEY);
  if (changed) {
    persist(merged, false);
    return merged;
  }
  return merged;
}

export function writeGroceries(items: GroceryItem[]) {
  const normalized = items.map(normalize).filter((item) => item.text.length > 0);
  persist(normalized, true);
}

export function mergeIntoShoppingList(
  existing: GroceryItem[],
  entries: string[],
  addedBy: GroceryItem["addedBy"],
): { items: GroceryItem[]; addedCount: number } {
  const next = [...existing];
  const normalizedEntries = Array.from(
    new Set(entries.map((entry) => entry.trim().toLowerCase()).filter(Boolean)),
  );
  let addedCount = 0;

  normalizedEntries.forEach((name) => {
    const index = next.findIndex((item) => item.text.toLowerCase() === name);
    if (index >= 0) {
      const current = next[index];
      if (current.inInventory || current.done) {
        next[index] = {
          ...current,
          done: false,
          inInventory: false,
          purchasedAt: undefined,
          addedBy,
        };
        addedCount += 1;
      }
      return;
    }

    const original = entries.find((entry) => entry.trim().toLowerCase() === name)?.trim() ?? name;
    next.push({
      id: crypto.randomUUID(),
      text: original,
      done: false,
      addedBy,
      inInventory: false,
    });
    addedCount += 1;
  });

  return { items: next, addedCount };
}
