import { useEffect, useMemo, useState } from "react";
import {
  GROCERY_STORAGE_KEY,
  GROCERY_SYNC_EVENT,
  readGroceries,
  writeGroceries,
} from "@/services/groceries";
import type { GroceryItem, Store } from "@/services/types";

const OPENAI_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? "";
const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? "";
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

const MEAL_INPUT_KEY = "beat.grocery-meal-input";
const MEAL_PLAN_KEY = "beat.grocery-meal-plan";

interface PlanMeal {
  name: string;
  servings?: number;
  ingredients: string[];
  why?: string;
}

interface GroceryPlan {
  summary: string;
  meals: PlanMeal[];
  shoppingList: { text: string; category?: string }[];
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function sameGroceries(a: GroceryItem[], b: GroceryItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, index) => {
    const other = b[index];
    return (
      item.id === other.id &&
      item.text === other.text &&
      item.done === other.done &&
      item.addedBy === other.addedBy &&
      Boolean(item.inInventory) === Boolean(other.inInventory) &&
      (item.purchasedAt ?? "") === (other.purchasedAt ?? "")
    );
  });
}

export default function Groceries({ mode = "full" }: { mode?: "full" | "cook-only" }) {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [input, setInput] = useState("");
  const [inventoryInput, setInventoryInput] = useState("");
  const [mealInput, setMealInput] = useState("");
  const [generatedPlan, setGeneratedPlan] = useState<GroceryPlan | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [thinking, setThinking] = useState(false);
  const [locStatus, setLocStatus] = useState<"idle" | "asking" | "ok" | "denied" | "no-key">("idle");
  const [placesStatus, setPlacesStatus] = useState<"idle" | "loading" | "ok" | "error">("idle");
  const [placesError, setPlacesError] = useState<string>("");

  useEffect(() => {
    const syncItems = () =>
      setItems((prev) => {
        const next = readGroceries();
        return sameGroceries(prev, next) ? prev : next;
      });
    syncItems();
    setMealInput(loadJSON<string>(MEAL_INPUT_KEY, ""));
    setGeneratedPlan(loadJSON<GroceryPlan | null>(MEAL_PLAN_KEY, null));

    if (!MAPS_KEY) {
      setLocStatus("no-key");
      return;
    }
    if ("geolocation" in navigator) {
      setLocStatus("asking");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocStatus("ok");
          setPlacesStatus("loading");
          searchNearbyGroceries(pos.coords.latitude, pos.coords.longitude)
            .then((results) => {
              setStores(results);
              setPlacesStatus("ok");
              console.log(
                `[places] returned ${results.length} store(s) within 10 mi of ${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`,
              );
            })
            .catch((err: Error) => {
              console.warn("[places] error", err);
              setPlacesStatus("error");
              setPlacesError(err.message || String(err));
            });
        },
        (err) => {
          console.warn("[geolocation] denied:", err.message);
          setLocStatus("denied");
        },
        { timeout: 8000, maximumAge: 60_000 },
      );
    } else {
      setLocStatus("denied");
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === GROCERY_STORAGE_KEY) syncItems();
    };
    const onGroceriesUpdated = () => syncItems();
    const onVisibility = () => {
      if (document.visibilityState === "visible") syncItems();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener(GROCERY_SYNC_EVENT, onGroceriesUpdated);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(GROCERY_SYNC_EVENT, onGroceriesUpdated);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    writeGroceries(items);
  }, [items]);

  useEffect(() => {
    saveJSON(MEAL_INPUT_KEY, mealInput);
  }, [mealInput]);

  useEffect(() => {
    saveJSON(MEAL_PLAN_KEY, generatedPlan);
  }, [generatedPlan]);

  function addItem(text: string, addedBy: GroceryItem["addedBy"] = "user") {
    const clean = text.trim();
    if (!clean) return;
    setItems((prev) => {
      if (prev.some((item) => item.text.toLowerCase() === clean.toLowerCase())) {
        return prev.map((item) =>
          item.text.toLowerCase() === clean.toLowerCase()
            ? { ...item, done: false, inInventory: false, purchasedAt: undefined }
            : item,
        );
      }
      return [
        ...prev,
        {
          id: crypto.randomUUID(),
          text: clean,
          done: false,
          addedBy,
          inInventory: false,
        },
      ];
    });
  }

  function onAddItemClick() {
    addItem(input, "user");
    setInput("");
  }

  function toggleItem(id: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function markPickedAsPurchased() {
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.done
          ? { ...item, done: false, inInventory: true, purchasedAt: item.purchasedAt ?? now }
          : item,
      ),
    );
  }

  function addInventoryItem(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setItems((prev) => {
      if (prev.some((item) => item.text.toLowerCase() === clean.toLowerCase())) {
        return prev.map((item) =>
          item.text.toLowerCase() === clean.toLowerCase()
            ? {
                ...item,
                done: false,
                inInventory: true,
                purchasedAt: item.purchasedAt ?? new Date().toISOString(),
              }
            : item,
        );
      }
      return [
        {
          id: crypto.randomUUID(),
          text: clean,
          done: false,
          addedBy: "user",
          inInventory: true,
          purchasedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }

  function onAddInventory() {
    addInventoryItem(inventoryInput);
    setInventoryInput("");
  }

  function removeInventoryItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function moveInventoryBackToList(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, done: false, inInventory: false, purchasedAt: undefined } : item,
      ),
    );
  }

  function addAllFromPlan(plan: GroceryPlan) {
    plan.shoppingList.forEach((entry) => addItem(entry.text, "coach"));
  }

  async function generateMealFromIngredients() {
    const clean = mealInput.trim();
    if (!clean || thinking) return;
    setThinking(true);
    try {
      const plan = await generateMealPlan({
        ingredientsOnHand: clean,
        pantry: inventory.map((item) => item.text),
        shoppingList: todo.map((item) => item.text),
      });
      setGeneratedPlan(plan);
    } catch (err) {
      console.warn("[openai] error", err);
      setGeneratedPlan({
        summary: OPENAI_KEY
          ? "Beat hit an error generating a meal. Check the dev console."
          : "No OpenAI key is set. Add VITE_OPENAI_API_KEY to beat-app/.env.local and restart `npm run dev`.",
        meals: [],
        shoppingList: [],
      });
    } finally {
      setThinking(false);
    }
  }

  function useInventoryAsIngredients() {
    setMealInput(inventory.map((item) => item.text).join(", "));
  }

  function clearMealPlanner() {
    setMealInput("");
    setGeneratedPlan(null);
  }

  const shoppingItems = useMemo(() => items.filter((item) => !item.inInventory), [items]);
  const todo = useMemo(() => shoppingItems.filter((item) => !item.done), [shoppingItems]);
  const done = useMemo(() => shoppingItems.filter((item) => item.done), [shoppingItems]);
  const inventory = useMemo(
    () =>
      items
        .filter((item) => item.inInventory)
        .sort((a, b) => (b.purchasedAt ?? "").localeCompare(a.purchasedAt ?? "")),
    [items],
  );

  return (
    <>
      {mode === "full" && (
        <>
          <div className="eyebrow">Groceries</div>
          <h1 className="h1">Eat with a plan. Shop without thinking.</h1>
          <p className="lede">
            Type the ingredients you already have, generate a meal from them, then fill
            the shopping list only for what is missing.
          </p>
        </>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: mode === "full" ? "minmax(0, 1.4fr) minmax(0, 1fr)" : "1fr",
          gap: 18,
          marginTop: 18,
          alignItems: "start",
        }}
      >
        <div>
          <section className="card">
            <div
              className="row"
              style={{
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <h2 className="h2" style={{ margin: 0 }}>
                  Cook from what you have
                </h2>
                <div className="muted" style={{ marginTop: 4 }}>
                  {OPENAI_KEY
                    ? "Paste ingredients on hand and Beat will turn them into a practical meal."
                    : "Set VITE_OPENAI_API_KEY in .env.local to turn on meal generation."}
                </div>
              </div>
              <button className="btn sm ghost" onClick={clearMealPlanner}>
                Clear
              </button>
            </div>

            <div style={{ marginTop: 14 }}>
              <div className="coach-field-label">Ingredients on hand</div>
              <textarea
                className="textarea"
                placeholder="e.g. eggs, spinach, feta, tomatoes, olive oil"
                value={mealInput}
                onChange={(e) => setMealInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && !thinking) {
                    e.preventDefault();
                    void generateMealFromIngredients();
                  }
                }}
              />
              <div className="muted" style={{ marginTop: 8 }}>
                Separate ingredients with commas. Press Ctrl+Enter to generate.
              </div>
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <button
                className="btn"
                onClick={() => void generateMealFromIngredients()}
                disabled={thinking || !mealInput.trim()}
              >
                {thinking ? "Generating..." : "Generate meal"}
              </button>
              <button className="btn sm ghost" onClick={useInventoryAsIngredients} disabled={inventory.length === 0}>
                Use inventory
              </button>
            </div>

            <div className="divider" />

            {!generatedPlan ? (
              <div className="empty">
                Add ingredients to generate a meal idea and a matching shopping list.
              </div>
            ) : generatedPlan.meals.length === 0 ? (
              <div className="empty">{generatedPlan.summary}</div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: 12,
                    border: "1px solid var(--line)",
                    background: "#fbf7ef",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 15 }}>Meal plan</div>
                  <div className="muted" style={{ marginTop: 4 }}>
                    {generatedPlan.summary}
                  </div>
                </div>

                {generatedPlan.meals.map((meal, index) => (
                  <div
                    key={`${meal.name}-${index}`}
                    style={{
                      border: "1px solid var(--line)",
                      borderRadius: 12,
                      padding: "14px 16px",
                      background: "#fff",
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 16 }}>
                      {meal.name}
                      {meal.servings ? <span className="muted"> · {meal.servings} servings</span> : null}
                    </div>
                    {meal.why && (
                      <div className="muted" style={{ marginTop: 4 }}>
                        {meal.why}
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 6,
                        marginTop: 10,
                      }}
                    >
                      {meal.ingredients.map((ingredient, ingredientIndex) => (
                        <span key={`${ingredient}-${ingredientIndex}`} style={chipStyle}>
                          {ingredient}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}

                {generatedPlan.shoppingList.length > 0 && (
                  <div className="row" style={{ justifyContent: "space-between" }}>
                    <div className="muted">
                      {generatedPlan.shoppingList.length} missing item
                      {generatedPlan.shoppingList.length === 1 ? "" : "s"} ready for your shopping list.
                    </div>
                    <button className="btn sm" onClick={() => addAllFromPlan(generatedPlan)}>
                      Add all to shopping list
                    </button>
                  </div>
                )}
              </div>
            )}
          </section>

          {mode === "full" && (
          <section className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h2" style={{ margin: 0 }}>
                Shopping list <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({todo.length} to buy)</span>
              </h2>
              {done.length > 0 && (
                <button className="btn sm ghost" onClick={markPickedAsPurchased}>
                  Mark {done.length} as purchased
                </button>
              )}
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Add an item..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddItemClick()}
              />
              <button className="btn" onClick={onAddItemClick}>
                Add
              </button>
            </div>

            <div className="divider" />

            {todo.length === 0 ? (
              <div className="empty">
                Nothing left to buy. Generate a meal, or add something yourself.
              </div>
            ) : (
              todo.map((item) => (
                <div key={item.id} className="grocery">
                  <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                  <span className="text">{item.text}</span>
                  {item.addedBy !== "user" && (
                    <span className="tag" style={{ marginLeft: 8 }}>
                      {item.addedBy}
                    </span>
                  )}
                  <button className="remove" onClick={() => removeItem(item.id)} aria-label="remove">
                    x
                  </button>
                </div>
              ))
            )}

            {done.length > 0 && (
              <>
                <div className="divider" />
                <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                  Checked off items can be marked as purchased to move them into your inventory.
                </div>
                {done.map((item) => (
                  <div key={item.id} className="grocery">
                    <input type="checkbox" checked={item.done} onChange={() => toggleItem(item.id)} />
                    <span className="text done">{item.text}</span>
                    <button className="remove" onClick={() => removeItem(item.id)}>
                      x
                    </button>
                  </div>
                ))}
              </>
            )}
          </section>
          )}
        </div>

        {mode === "full" && (
        <div>
          <section className="card">
            <h2 className="h2" style={{ margin: 0 }}>
              Inventory <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>({inventory.length} item{inventory.length === 1 ? "" : "s"})</span>
            </h2>
            <div className="muted" style={{ marginTop: 4 }}>
              Everything you've already bought for recipes or stocked at home. Beat will avoid duplicating these.
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180 }}
                placeholder="Already have... (e.g. eggs)"
                value={inventoryInput}
                onChange={(e) => setInventoryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddInventory()}
              />
              <button className="btn" onClick={onAddInventory}>
                Add
              </button>
            </div>

            <div className="divider" />

            {inventory.length === 0 ? (
              <div className="empty">
                Nothing tracked yet. Mark shopping items as purchased to build this automatically.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {inventory.map((item) => (
                  <span key={item.id} style={chipStyle}>
                    {item.text}
                    <button
                      onClick={() => moveInventoryBackToList(item.id)}
                      aria-label="move back to shopping list"
                      style={chipBtnStyle}
                      title="Move back to shopping list"
                    >
                      +
                    </button>
                    <button onClick={() => removeInventoryItem(item.id)} aria-label="remove" style={chipBtnStyle}>
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          <section className="card" style={{ marginTop: 16 }}>
            <h2 className="h2" style={{ margin: 0 }}>
              Supermarkets nearby
            </h2>
            <div className="muted" style={{ marginTop: 4 }}>
              {locStatus === "asking" && "Asking your browser for location..."}
              {locStatus === "denied" && "Location denied or unavailable. Enable it in your browser to see real stores."}
              {locStatus === "no-key" && "Set VITE_GOOGLE_MAPS_KEY in .env.local to see real nearby stores."}
              {locStatus === "idle" && "Loading..."}
              {locStatus === "ok" && placesStatus === "loading" && "Location OK - querying Google Places..."}
              {locStatus === "ok" && placesStatus === "ok" && `Places API OK · ${stores.length} store${stores.length === 1 ? "" : "s"} within 10 mi, closest first.`}
              {locStatus === "ok" && placesStatus === "error" && (
                <>
                  Places API error. Key may be invalid, unrestricted wrong, or the "Places API (New)" isn't enabled on your project.
                </>
              )}
            </div>

            {placesStatus === "error" && placesError && (
              <pre
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  background: "#ffe0d6",
                  color: "var(--warn)",
                  border: "1px solid var(--line)",
                  borderRadius: 8,
                  fontSize: 12,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {placesError}
              </pre>
            )}

            <div className="divider" />

            {stores.length === 0 ? (
              <div className="empty">
                {locStatus === "ok" && placesStatus === "ok" ? "No grocery stores found within 10 miles." : "-"}
              </div>
            ) : (
              stores.map((store) => (
                <div
                  key={store.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 0",
                    borderBottom: "1px solid var(--line)",
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>{store.name}</div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {store.distanceMi} mi · ~{store.etaMin} min · {store.address ?? "-"}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="tag">{store.kind}</span>
                    <a
                      className="btn sm ghost"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name + " " + (store.address ?? ""))}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Map
                    </a>
                  </div>
                </div>
              ))
            )}
          </section>
        </div>
        )}
      </div>
    </>
  );
}

const chipStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "6px 10px",
  borderRadius: 999,
  background: "var(--cream)",
  border: "1px solid var(--line)",
  fontSize: 13,
  color: "var(--ink)",
};

const chipBtnStyle: React.CSSProperties = {
  background: "transparent",
  border: 0,
  color: "var(--mute)",
  fontSize: 14,
  lineHeight: 1,
  padding: "0 0 0 2px",
  cursor: "pointer",
};

async function generateMealPlan(args: {
  ingredientsOnHand: string;
  pantry: string[];
  shoppingList: string[];
}): Promise<GroceryPlan> {
  if (!OPENAI_KEY) {
    return {
      summary:
        "No OpenAI key configured - running in demo mode. Add VITE_OPENAI_API_KEY to .env.local to enable real meal generation.",
      meals: [
        {
          name: "Spinach feta scramble",
          servings: 2,
          ingredients: ["eggs", "spinach", "feta", "olive oil"],
          why: "Fast, flexible, and easy to finish with whatever veg you already have.",
        },
      ],
      shoppingList: [{ text: "feta", category: "dairy" }],
    };
  }

  const systemPrompt = `You are Beat, a practical meal builder.
Turn the user's available ingredients into one realistic meal idea.
Use what they already have first. Only add shopping list items if absolutely needed.
Respond with VALID JSON ONLY. Shape:
{
  "summary": "<one line>",
  "meals": [
    { "name": "...", "servings": 2, "ingredients": ["..."], "why": "..." }
  ],
  "shoppingList": [
    { "text": "...", "category": "produce|protein|dairy|pantry|frozen|other" }
  ]
}`;

  const pantryLine = args.pantry.length
    ? `Inventory already on hand: ${args.pantry.join(", ")}`
    : "Inventory: empty";
  const listLine = args.shoppingList.length
    ? `Current shopping list: ${args.shoppingList.join(", ")}`
    : "Shopping list: empty";

  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `${pantryLine}\n${listLine}` },
    {
      role: "user",
      content: `Ingredients on hand: ${args.ingredientsOnHand}\nMake one meal I can cook now and keep the shopping list minimal.`,
    },
  ];

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages,
      temperature: 0.4,
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`OpenAI ${res.status}: ${body}`);
  }

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const raw = json.choices?.[0]?.message?.content ?? "";
  const parsed = JSON.parse(raw) as Partial<GroceryPlan>;

  return {
    summary: parsed.summary ?? "Here's a meal you can make from what you have.",
    meals: Array.isArray(parsed.meals) ? parsed.meals : [],
    shoppingList: Array.isArray(parsed.shoppingList) ? parsed.shoppingList : [],
  };
}

async function searchNearbyGroceries(lat: number, lng: number): Promise<Store[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": MAPS_KEY,
      "X-Goog-FieldMask": [
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.location",
        "places.types",
        "places.primaryType",
        "places.rating",
      ].join(","),
    },
    body: JSON.stringify({
      includedTypes: ["grocery_store", "supermarket"],
      maxResultCount: 12,
      rankPreference: "DISTANCE",
      locationRestriction: {
        circle: {
          center: { latitude: lat, longitude: lng },
          radius: 16093,
        },
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places ${res.status}: ${body}`);
  }

  const data = (await res.json()) as {
    places?: Array<{
      id: string;
      displayName?: { text: string };
      formattedAddress?: string;
      location?: { latitude: number; longitude: number };
      rating?: number;
    }>;
  };

  return (data.places ?? [])
    .map((place): Store | null => {
      if (!place.location) return null;
      const distanceKm = haversineKm(lat, lng, place.location.latitude, place.location.longitude);
      const distanceMi = distanceKm * 0.621371;
      return {
        id: place.id,
        name: place.displayName?.text ?? "Unnamed",
        kind: "grocery",
        distanceMi: Math.round(distanceMi * 10) / 10,
        etaMin: Math.max(2, Math.round(distanceMi * 3)),
        healthScore: place.rating ? Math.min(10, place.rating * 2) : 7,
        address: place.formattedAddress,
      };
    })
    .filter((store): store is Store => store !== null);
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (degrees: number) => (degrees * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

