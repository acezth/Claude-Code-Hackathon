// Anthropic - meal suggestions, meal scan vision, coach Q&A.
//
// For the hackathon, you can call the API directly from the browser
// using VITE_ANTHROPIC_API_KEY. For production, proxy through a server
// so the key stays secret.
//
// All calls here fall back to mock responses when the key isn't
// configured, so the UI stays runnable.

import type {
  CalendarEvent,
  CoachMealPlan,
  CoachMealPreferences,
  CoachReply,
  FoodPick,
  MacroEstimate,
  MealSuggestion,
  Store,
  Workout,
} from "./types";
import { config } from "@/lib/config";

const MIN_CONFIDENCE_PCT = 80;
const hasKey = () => config.anthropic.apiKey.length > 0;

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };
type ContentBlock =
  | { type: "text"; text: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };
type AnthropicMessage =
  | { role: "user" | "assistant"; content: string }
  | { role: "user" | "assistant"; content: ContentBlock[] };

async function callChat(messages: ChatMessage[]): Promise<string> {
  return callAnthropic(
    messages
      .filter((message) => message.role !== "system")
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content })),
    messages
      .filter((message) => message.role === "system")
      .map((message) => message.content.trim())
      .filter(Boolean)
      .join("\n\n")
  );
}

async function callAnthropic(messages: AnthropicMessage[], system?: string): Promise<string> {
  if (!hasKey()) throw new Error("ANTHROPIC_KEY_MISSING");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: 900,
      system: system || undefined,
      messages,
      temperature: 0.4,
    }),
  });

  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);

  const json = await res.json();
  return Array.isArray(json.content)
    ? json.content
        .filter((block: { type?: string; text?: string }) => block.type === "text" && typeof block.text === "string")
        .map((block: { text?: string }) => block.text ?? "")
        .join("\n")
    : "";
}

export async function suggestStorePicks(
  store: Store,
  context: { events: CalendarEvent[]; now: string }
): Promise<FoodPick[]> {
  if (!hasKey()) return MOCK_PICKS(store.id);

  try {
    const prompt = `Store: ${store.name} (${store.kind}). Next event: ${context.events[0]?.title ?? "n/a"}. Time: ${context.now}. Return 3 short ranked picks for a correspondent who's live in a few hours. JSON array only with fields: title, why, tags, priceUsd, healthScore (0-10).`;
    const raw = await callChat([
      { role: "system", content: "You are Beat, a direct, imperative nutrition coach. Output JSON only." },
      { role: "user", content: prompt },
    ]);
    const parsed = JSON.parse(extractJson(raw)) as Omit<FoodPick, "id" | "storeId">[];
    return parsed.map((pick, index) => ({ ...pick, id: `${store.id}-${index}`, storeId: store.id }));
  } catch {
    return MOCK_PICKS(store.id);
  }
}

export async function suggestMealsFromFridge(imageDataUrl: string): Promise<MealSuggestion[]> {
  void imageDataUrl;
  await new Promise((resolve) => setTimeout(resolve, 700));
  return MOCK_MEALS;
}

export async function estimateMacrosFromImage(imageDataUrl: string): Promise<MacroEstimate> {
  if (!hasKey()) return MOCK_MACROS;

  try {
    const imageBlock = dataUrlToAnthropicImage(imageDataUrl);
    const raw = await callAnthropic(
      [
        {
          role: "user",
          content: [
            imageBlock,
            {
              type: "text",
              text: [
                "Estimate nutrition for the PRIMARY visible food item only.",
                "Use realistic serving assumptions if portion is unclear.",
                "If the image is unclear, set confidence to low and explain uncertainty in note.",
                "Return STRICT JSON only with EXACT keys:",
                "item, visualDescription, serving, calories, proteinG, carbsG, fatG, confidence, confidencePct, note",
                "Rules:",
                "- confidence must be one of: low, medium, high",
                "- confidencePct must be a number from 0 to 100",
                "- numeric fields must be non-negative numbers",
                "- keep note concise",
              ].join("\n"),
            },
          ],
        },
      ],
      "You are a nutrition assistant specialized in visual macro estimates. Output JSON only."
    );

    const parsed = JSON.parse(extractJsonObject(raw)) as Partial<MacroEstimate>;
    const confidence = parsed.confidence === "low" || parsed.confidence === "high" ? parsed.confidence : "medium";
    const confidencePct = toConfidencePct(parsed.confidencePct, confidence);

    if (confidencePct < MIN_CONFIDENCE_PCT) {
      throw new Error(`LOW_CONFIDENCE:${confidencePct}`);
    }

    return {
      item: parsed.item ?? MOCK_MACROS.item,
      visualDescription: parsed.visualDescription ?? MOCK_MACROS.visualDescription,
      serving: parsed.serving ?? MOCK_MACROS.serving,
      calories: toSafeNumber(parsed.calories, MOCK_MACROS.calories),
      proteinG: toSafeNumber(parsed.proteinG, MOCK_MACROS.proteinG),
      carbsG: toSafeNumber(parsed.carbsG, MOCK_MACROS.carbsG),
      fatG: toSafeNumber(parsed.fatG, MOCK_MACROS.fatG),
      confidence,
      confidencePct,
      note: parsed.note ?? "Estimated from image; values may vary.",
    };
  } catch (err) {
    if (err instanceof Error && err.message.startsWith("LOW_CONFIDENCE:")) {
      throw err;
    }
    return MOCK_MACROS;
  }
}

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
      ? `Upcoming: ${ctx.events.slice(0, 3).map((event) => event.title).join("; ")}.`
      : "";
    const raw = await callChat([
      {
        role: "system",
        content:
          "You are Beat - a health coach for a national correspondent. You are direct, imperative, and kind. Keep replies under 4 sentences. Prefer concrete actions over theory.",
      },
      { role: "user", content: `${contextLine}\n\nUser: ${question}` },
    ]);
    return { text: raw };
  } catch {
    return { text: "Beat is offline right now. Try again in a sec." };
  }
}

export async function suggestCoachMeals(
  preferences: CoachMealPreferences,
  ctx?: { events?: CalendarEvent[]; workouts?: Workout[] }
): Promise<CoachMealPlan> {
  if (!hasKey()) return mockCoachMealPlan(preferences, ctx);

  try {
    const contextBlock = buildCoachContext(ctx);
    const raw = await callChat([
      {
        role: "system",
        content:
          "You are Beat, a nutrition coach for a national correspondent. Output valid JSON only. Return an object with fields: summary, meals, groceryStaples, followUps. meals must be an array of exactly 3 objects with fields: title, emoji, why, ingredients, missing, minutes, calories, bestFor. These are 3 alternative meal options to choose from, not a breakfast-lunch-dinner plan. Keep advice practical, specific, and tied to the user's schedule, budget, and cooking access.",
      },
      {
        role: "user",
        content: [
          "Build three meal options for this user.",
          `Goal: ${preferences.goal}`,
          `Dietary style: ${preferences.dietaryStyle}`,
          `Allergies or restrictions: ${preferences.allergies || "none"}`,
          `Dislikes: ${preferences.dislikes || "none"}`,
          `Current location: ${preferences.location}`,
          `Cooking access: ${preferences.cookingAccess}`,
          `Time available: ${preferences.timeAvailableMin} minutes`,
          `Budget: ${preferences.budget}`,
          contextBlock,
          "Favor meals that reduce guesswork. Missing should only include ingredients that are likely not on hand.",
        ].join("\n"),
      },
    ]);

    const parsed = JSON.parse(extractJson(raw)) as Omit<CoachMealPlan, "meals"> & {
      meals: Omit<CoachMealPlan["meals"][number], "id">[];
    };

    return {
      summary: parsed.summary,
      groceryStaples: parsed.groceryStaples ?? [],
      followUps: parsed.followUps ?? [],
      meals: (parsed.meals ?? []).slice(0, 3).map((meal, index) => ({
        ...meal,
        id: `coach-meal-${index + 1}`,
      })),
    };
  } catch {
    return mockCoachMealPlan(preferences, ctx);
  }
}

function MOCK_PICKS(storeId: string): FoodPick[] {
  return [
    {
      id: `${storeId}-1`,
      storeId,
      title: "String cheese + apple + water",
      why: "Steady protein, won't bloat you on camera, 3-hour runway.",
      tags: ["camera-safe", "cheap", "protein"],
      priceUsd: 4.1,
      healthScore: 8.2,
    },
    {
      id: `${storeId}-2`,
      storeId,
      title: "Hard-boiled eggs",
      why: "Pair with the coffee you already had. Lands before the live hit.",
      tags: ["camera-safe", "protein"],
      priceUsd: 3.29,
      healthScore: 7.8,
    },
    {
      id: `${storeId}-3`,
      storeId,
      title: "Beef jerky (original, not teriyaki)",
      why: "Salt is OK - you're dehydrated. Teriyaki crashes in 90 min.",
      tags: ["salt-heavy", "protein"],
      priceUsd: 7.99,
      healthScore: 6.1,
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
    why: "Makes four portions - future-you on a busy day will thank present-you.",
  },
];

const MOCK_MACROS: MacroEstimate = {
  item: "Cheese Burger",
  visualDescription: "A medium bowl with chopped chicken, mixed greens, tomatoes, cucumber, and creamy dressing.",
  serving: "1 medium bowl",
  calories: 420,
  proteinG: 32,
  carbsG: 18,
  fatG: 24,
  confidence: "high",
  confidencePct: 86,
  note: "Estimated visually. Dressing and portion size can change totals.",
};

function buildCoachContext(ctx?: { events?: CalendarEvent[]; workouts?: Workout[] }): string {
  const events = ctx?.events?.slice(0, 3) ?? [];
  const workouts = ctx?.workouts?.slice(0, 2) ?? [];

  const eventLine = events.length
    ? `Upcoming events: ${events
        .map((event) => `${event.title} at ${new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`)
        .join("; ")}.`
    : "Upcoming events: none loaded.";

  const workoutLine = workouts.length
    ? `Recent workouts: ${workouts.map((workout) => workout.title).join("; ")}.`
    : "Recent workouts: none loaded.";

  return `${eventLine}\n${workoutLine}`;
}

function mockCoachMealPlan(
  preferences: CoachMealPreferences,
  ctx?: { events?: CalendarEvent[]; workouts?: Workout[] }
): CoachMealPlan {
  const eventHint = ctx?.events?.[0]?.title ?? "your next work block";
  const restrictionText = preferences.allergies || preferences.dislikes;
  const avoidLine = restrictionText ? ` Skip ${restrictionText.toLowerCase()}.` : "";

  const templates = buildMealTemplates(preferences);
  return {
    summary: `Choose one of these three meal options based on what sounds best right now. They all fit ${eventHint}, a ${preferences.timeAvailableMin}-minute window, a ${preferences.budget} budget, and ${preferences.cookingAccess} access.${avoidLine}`,
    meals: templates,
    groceryStaples: buildStaples(preferences),
    followUps: [
      "Give me three airport options instead.",
      "Turn this into a 2-day meal plan.",
      "What should I eat 90 minutes before going on camera?",
    ],
  };
}

function buildMealTemplates(preferences: CoachMealPreferences) {
  const quick = preferences.timeAvailableMin <= 10 || preferences.cookingAccess === "no-cook";
  const noCook = preferences.cookingAccess === "no-cook";
  const microwave = preferences.cookingAccess === "microwave";
  const proteinBase =
    preferences.dietaryStyle === "vegetarian"
      ? ["Greek yogurt", "cottage cheese", "edamame", "lentils"]
      : preferences.dietaryStyle === "vegan"
        ? ["tofu", "edamame", "chickpeas", "hummus"]
        : ["rotisserie chicken", "Greek yogurt", "eggs", "turkey"];
  const carbBase = preferences.goal.toLowerCase().includes("lose")
    ? ["berries", "apple", "quinoa"]
    : ["oats", "rice", "sweet potato"];

  return [
    {
      id: "coach-meal-1",
      title: quick ? "Protein bowl in one minute" : "Fast reset bowl",
      emoji: "🥗",
      why: `High protein, steady energy, and no crash before ${preferences.location === "airport" ? "boarding" : "your next block"}.`,
      ingredients: [proteinBase[0], carbBase[0], "nuts", "water"],
      missing: [carbBase[0], "nuts"].filter((item) => item !== "water"),
      minutes: noCook ? 2 : 6,
      calories: preferences.goal.toLowerCase().includes("lose") ? 340 : 430,
      bestFor: "Best when you need to eat now and stay sharp.",
    },
    {
      id: "coach-meal-2",
      title: microwave ? "Microwave grain + protein cup" : noCook ? "Desk-safe snack plate" : "Eggs + greens skillet",
      emoji: microwave ? "🥣" : noCook ? "🧺" : "🍳",
      why: `Built for ${preferences.cookingAccess.replace("-", " ")} access and a ${preferences.budget} budget.`,
      ingredients: microwave
        ? ["microwave rice", proteinBase[1], "spinach", "olive oil"]
        : noCook
          ? [proteinBase[1], "fruit", "trail mix", "sparkling water"]
          : ["eggs", "spinach", "toast", "olive oil"],
      missing: microwave ? ["microwave rice", "spinach"] : noCook ? ["fruit"] : ["spinach"],
      minutes: noCook ? 3 : microwave ? 5 : 10,
      calories: preferences.goal.toLowerCase().includes("muscle") ? 510 : 390,
      bestFor: "Best for a hotel room, green room, or late landing.",
    },
    {
      id: "coach-meal-3",
      title: noCook ? "Road-trip grocery kit" : "Make-once recovery plate",
      emoji: noCook ? "🚗" : "🍲",
      why: "This gives you one meal now and one less decision later in the day.",
      ingredients: noCook
        ? [proteinBase[2], "baby carrots", "whole-grain crackers", "banana"]
        : [proteinBase[3], "frozen vegetables", carbBase[1], "seasoning"],
      missing: noCook ? ["baby carrots", "whole-grain crackers"] : ["frozen vegetables", carbBase[1]],
      minutes: noCook ? 4 : Math.min(Math.max(preferences.timeAvailableMin, 12), 20),
      calories: preferences.goal.toLowerCase().includes("lose") ? 360 : 560,
      bestFor: "Best if the rest of your day is unpredictable.",
    },
  ];
}

function buildStaples(preferences: CoachMealPreferences): string[] {
  const base =
    preferences.dietaryStyle === "vegan"
      ? ["tofu", "hummus", "microwave rice", "fruit"]
      : preferences.dietaryStyle === "vegetarian"
        ? ["Greek yogurt", "eggs", "fruit", "spinach"]
        : ["Greek yogurt", "eggs", "rotisserie chicken", "spinach"];

  if (preferences.cookingAccess === "no-cook") return [...base, "nuts", "protein bar"];
  if (preferences.cookingAccess === "microwave") return [...base, "microwave oats", "steam-in-bag vegetables"];
  return [...base, "olive oil", "rice"];
}

function dataUrlToAnthropicImage(dataUrl: string): ContentBlock {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) throw new Error("INVALID_IMAGE_DATA_URL");
  return {
    type: "image",
    source: {
      type: "base64",
      media_type: match[1],
      data: match[2],
    },
  };
}

function extractJson(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

function extractJsonObject(input: string): string {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return "{}";
  return input.slice(start, end + 1);
}

function toSafeNumber(value: unknown, fallback = 0): number {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.round(number));
}

function toConfidencePct(value: unknown, confidence: MacroEstimate["confidence"]): number {
  const number = Number(value);
  if (Number.isFinite(number)) {
    return Math.max(0, Math.min(100, Math.round(number)));
  }
  if (confidence === "high") return 90;
  if (confidence === "medium") return 70;
  return 50;
}
