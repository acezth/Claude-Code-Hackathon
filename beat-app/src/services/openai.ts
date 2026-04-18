// OpenAI — meal suggestions, fridge vision, coach Q&A.
//
// For the hackathon, you can call the API directly from the browser
// using VITE_OPENAI_API_KEY. For production, proxy through a server
// so the key stays secret.
//
// All calls here fall back to mock responses when the key isn't
// configured, so the UI stays runnable.

import type { CalendarEvent, FoodPick, MealSuggestion, Store, CoachReply, Workout } from "./types";
import { config } from "@/lib/config";

const hasKey = () => config.openai.apiKey.length > 0;

async function callChat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
  if (!hasKey()) throw new Error("OPENAI_KEY_MISSING");
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      messages,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content ?? "";
}

// ---------- Scene Scan picks -----------------------------------------------

export async function suggestStorePicks(
  store: Store,
  context: { events: CalendarEvent[]; now: string }
): Promise<FoodPick[]> {
  // TODO: Replace with a real prompt + JSON-mode response.
  // System prompt should be something like:
  //   "You are Beat — a nutrition coach for a national correspondent.
  //    Given this store, the user's next few events, and the current time,
  //    return 3 ranked food picks as JSON."
  void context;
  if (!hasKey()) return MOCK_PICKS(store.id);

  try {
    const prompt = `Store: ${store.name} (${store.kind}). Next event: ${context.events[0]?.title ?? "n/a"}. Time: ${context.now}. Return 3 short ranked picks for a correspondent who's live in a few hours. JSON array only with fields: title, why, tags, priceUsd, healthScore (0-10).`;
    const raw = await callChat([
      { role: "system", content: "You are Beat, a direct, imperative nutrition coach. Output JSON only." },
      { role: "user", content: prompt },
    ]);
    const parsed = JSON.parse(raw) as Omit<FoodPick, "id" | "storeId">[];
    return parsed.map((p, i) => ({ ...p, id: `${store.id}-${i}`, storeId: store.id }));
  } catch {
    return MOCK_PICKS(store.id);
  }
}

// ---------- Fridge vision --------------------------------------------------

export async function suggestMealsFromFridge(imageDataUrl: string): Promise<MealSuggestion[]> {
  // TODO: Use the vision-capable model. Example body:
  //   messages: [{
  //     role: "user",
  //     content: [
  //       { type: "text", text: "List what you see. Then suggest 3 healthy meals..." },
  //       { type: "image_url", image_url: { url: imageDataUrl } }
  //     ]
  //   }]
  void imageDataUrl;
  await new Promise((r) => setTimeout(r, 700));
  return MOCK_MEALS;
}

// ---------- Coach Q&A ------------------------------------------------------

export async function askCoach(question: string, ctx?: { events?: CalendarEvent[]; workouts?: Workout[] }): Promise<CoachReply> {
  if (!hasKey()) {
    return {
      text:
        "You're running on five hours of sleep and you've got a live hit at 5. Eat a protein + complex carb in the next 20 minutes, then nothing heavy till after the hit. Water now.",
      suggestions: ["What should I eat on a red-eye?", "How do I handle the 3pm crash on air?"],
    };
  }
  try {
    const contextLine = ctx?.events
      ? `Upcoming: ${ctx.events.slice(0, 3).map((e) => e.title).join("; ")}.`
      : "";
    const raw = await callChat([
      {
        role: "system",
        content:
          "You are Beat — a health coach for a national correspondent. You are direct, imperative, and kind. Keep replies under 4 sentences. Prefer concrete actions over theory.",
      },
      { role: "user", content: `${contextLine}\n\nUser: ${question}` },
    ]);
    return { text: raw };
  } catch {
    return { text: "Beat is offline right now. Try again in a sec." };
  }
}

// ---------- mocks ----------------------------------------------------------

function MOCK_PICKS(storeId: string): FoodPick[] {
  return [
    {
      id: `${storeId}-1`, storeId,
      title: "String cheese + apple + water",
      why: "Steady protein, won't bloat you on camera, 3-hour runway.",
      tags: ["camera-safe", "cheap", "protein"], priceUsd: 4.10, healthScore: 8.2,
    },
    {
      id: `${storeId}-2`, storeId,
      title: "Hard-boiled eggs",
      why: "Pair with the coffee you already had. Lands before the live hit.",
      tags: ["camera-safe", "protein"], priceUsd: 3.29, healthScore: 7.8,
    },
    {
      id: `${storeId}-3`, storeId,
      title: "Beef jerky (original, not teriyaki)",
      why: "Salt is OK — you're dehydrated. Teriyaki crashes in 90 min.",
      tags: ["salt-heavy", "protein"], priceUsd: 7.99, healthScore: 6.1,
    },
  ];
}

const MOCK_MEALS: MealSuggestion[] = [
  {
    id: "m1",
    title: "Greek-yogurt bowl with berries + walnuts",
    emoji: "🥣",
    ingredients: ["Greek yogurt", "blueberries", "walnuts", "honey"],
    missing: [],
    minutes: 3,
    calories: 310,
    why: "High protein, slow sugar. Solid after a 5-hour sleep and before a filing block.",
  },
  {
    id: "m2",
    title: "Tomato-basil omelet with spinach",
    emoji: "🍳",
    ingredients: ["eggs", "tomato", "spinach", "basil", "feta"],
    missing: ["feta"],
    minutes: 8,
    calories: 360,
    why: "Protein + veg, keeps you level through an afternoon of calls.",
  },
  {
    id: "m3",
    title: "Sheet-pan chicken + broccoli + rice",
    emoji: "🍗",
    ingredients: ["chicken thighs", "broccoli", "olive oil", "garlic", "rice"],
    missing: ["rice"],
    minutes: 25,
    calories: 540,
    why: "Makes four portions — future-you on a busy day will thank present-you.",
  },
];
