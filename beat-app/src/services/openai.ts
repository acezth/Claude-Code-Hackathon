// OpenAI/Claude — meal suggestions, meal scan vision, coach Q&A.
//
// For the hackathon, you can call the API directly from the browser
// using VITE_OPENAI_API_KEY. For production, proxy through a server
// so the key stays secret.
//
// All calls here fall back to mock responses when the key isn't
// configured, so the UI stays runnable.

import type { CalendarEvent, FoodPick, MacroEstimate, MealSuggestion, Store, CoachReply, Workout } from "./types";
import { config } from "@/lib/config";

type AIProvider = "openai" | "claude";

const hasOpenAiKey = () => config.openai.apiKey.length > 0;
const hasClaudeKey = () => config.anthropic.apiKey.length > 0;
const hasAnyAiKey = () => hasOpenAiKey() || hasClaudeKey();
const MIN_CONFIDENCE_PCT = 70;

async function callChat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
  const provider = getActiveProvider();
  if (!provider) throw new Error("AI_KEY_MISSING");
  return provider === "openai" ? callOpenAiChat(messages) : callClaudeChat(messages);
}

function getActiveProvider(): AIProvider | null {
  if (hasOpenAiKey()) return "openai";
  if (hasClaudeKey()) return "claude";
  return null;
}

async function callOpenAiChat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
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

async function callClaudeChat(messages: { role: "system" | "user" | "assistant"; content: string }[]): Promise<string> {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const claudeMessages = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role,
      content: [{ type: "text", text: m.content }],
    }));

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: 700,
      temperature: 0.4,
      system,
      messages: claudeMessages,
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const json = await res.json();
  return String(json.content?.[0]?.text ?? "");
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
  if (!hasAnyAiKey()) return MOCK_PICKS(store.id);

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

export async function estimateMacrosFromImage(imageDataUrl: string): Promise<MacroEstimate> {
  const provider = getActiveProvider();
  if (!provider) return MOCK_MACROS;
  try {
    const raw = provider === "openai"
      ? await callOpenAiVisionForMacros(imageDataUrl)
      : await callClaudeVisionForMacros(imageDataUrl);
    const parsed = JSON.parse(extractJsonObject(raw)) as Partial<MacroEstimate>;
    const confidence = parsed.confidence === "low" || parsed.confidence === "high" ? parsed.confidence : "medium";
    const confidencePct = toConfidencePct(parsed.confidencePct, confidence);
    if (confidencePct < MIN_CONFIDENCE_PCT) {
      throw new Error(`LOW_CONFIDENCE:${confidencePct}`);
    }
    return {
      item: parsed.item ?? "Unknown food",
      visualDescription: parsed.visualDescription ?? "No visual description provided.",
      serving: parsed.serving ?? "1 serving",
      calories: toSafeNumber(parsed.calories),
      proteinG: toSafeNumber(parsed.proteinG),
      carbsG: toSafeNumber(parsed.carbsG),
      fatG: toSafeNumber(parsed.fatG),
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

// ---------- Coach Q&A ------------------------------------------------------

export async function askCoach(question: string, ctx?: { events?: CalendarEvent[]; workouts?: Workout[] }): Promise<CoachReply> {
  if (!hasAnyAiKey()) {
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

const MACRO_SYSTEM_PROMPT = [
  "You are a nutrition assistant specialized in visual macro estimates.",
  "Estimate nutrition for the PRIMARY visible food item only.",
  "Use realistic serving assumptions if portion is unclear.",
  "If the image is unclear, set confidence to low and explain uncertainty in note.",
  "Return STRICT JSON only with EXACT keys:",
  "item, visualDescription, serving, calories, proteinG, carbsG, fatG, confidence, confidencePct, note",
  "Rules:",
  "- confidence must be one of: low, medium, high",
  "- confidencePct must be a number from 0 to 100",
  "- numeric fields must be non-negative numbers",
  "- keep note concise (max ~20 words)",
].join("\n");

const MACRO_USER_PROMPT = [
  "Calorie Estimation Prompt",
  "Instructions: Upload your photo and paste the following text into the chat. Fill in the bracketed information [ ] based on your specific meal.",
  "",
  "Act as a professional nutritionist and AI vision specialist. I am providing an image of a meal. To ensure the highest possible accuracy in your estimation, please use the following context:",
  "",
  "Physical Scale: [Not provided].",
  "Hidden Components: [Not provided].",
  "Preparation Style: [Not provided].",
  "Specific Brands/Ingredients: [Not provided].",
  "",
  "Please provide:",
  "- A detailed item-by-item breakdown of the plate.",
  "- Estimated volume (cups/tbsp) and weight (grams) for each component.",
  "- Estimated Macros (Protein, Carbs, Fats) and total Calories.",
  "- A 95% confidence interval (e.g., 600-700 calories) based on visual uncertainty.",
  "",
  "For app output, still return STRICT JSON only with EXACT keys:",
  "item, visualDescription, serving, calories, proteinG, carbsG, fatG, confidence, confidencePct, note",
  "Use note to summarize uncertainty and include the calorie interval.",
].join("\n");

async function callOpenAiVisionForMacros(imageDataUrl: string): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.openai.apiKey}`,
    },
    body: JSON.stringify({
      model: config.openai.model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: MACRO_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: MACRO_USER_PROMPT },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${res.status}`);
  const json = await res.json();
  return String(json.choices?.[0]?.message?.content ?? "{}");
}

async function callClaudeVisionForMacros(imageDataUrl: string): Promise<string> {
  const image = toClaudeImageSource(imageDataUrl);
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": config.anthropic.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: config.anthropic.model,
      max_tokens: 700,
      temperature: 0.2,
      system: MACRO_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: MACRO_USER_PROMPT },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: image.mediaType,
                data: image.base64,
              },
            },
          ],
        },
      ],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic error: ${res.status}`);
  const json = await res.json();
  return String(json.content?.[0]?.text ?? "{}");
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

function extractJsonObject(input: string): string {
  const start = input.indexOf("{");
  const end = input.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return "{}";
  return input.slice(start, end + 1);
}

function toClaudeImageSource(dataUrl: string): { mediaType: string; base64: string } {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    throw new Error("INVALID_IMAGE_DATA_URL");
  }
  return { mediaType: match[1], base64: match[2] };
}

function toSafeNumber(value: unknown): number {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.round(n));
}

function toConfidencePct(value: unknown, confidence: MacroEstimate["confidence"]): number {
  const n = Number(value);
  if (Number.isFinite(n)) {
    return Math.max(0, Math.min(100, Math.round(n)));
  }
  if (confidence === "high") return 90;
  if (confidence === "medium") return 70;
  return 50;
}
