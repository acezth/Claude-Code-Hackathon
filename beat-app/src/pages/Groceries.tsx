import { useEffect, useMemo, useRef, useState } from "react";
import type { GroceryItem, Store } from "@/services/types";

// ---------- env keys --------------------------------------------------------
// Read directly from Vite env so this page is self-contained.
const OPENAI_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined) ?? "";
const MAPS_KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY as string | undefined) ?? "";
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined) ?? "gpt-4o-mini";

// ---------- storage keys ----------------------------------------------------
const GROC_KEY = "beat.groceries";
const PANTRY_KEY = "beat.pantry";
const CHAT_KEY = "beat.grocery-chat";

// ---------- local types -----------------------------------------------------
interface PantryItem {
  id: string;
  text: string;
  addedAt: string;
}

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

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  plan?: GroceryPlan;
}

// ---------- localStorage helpers --------------------------------------------
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

// ---------- quick prompts ---------------------------------------------------
const QUICK_PROMPTS = [
  "Plan 4 dinners for this week",
  "Something quick for tonight",
  "Five grab-and-go breakfasts",
  "High-protein, low-bloat for camera days",
];

// ---------- page ------------------------------------------------------------
export default function Groceries() {
  const [items, setItems] = useState<GroceryItem[]>([]);
  const [pantry, setPantry] = useState<PantryItem[]>([]);
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pantryInput, setPantryInput] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [thinking, setThinking] = useState(false);
  const [locStatus, setLocStatus] = useState<
    "idle" | "asking" | "ok" | "denied" | "no-key"
  >("idle");
  const [placesStatus, setPlacesStatus] = useState<
    "idle" | "loading" | "ok" | "error"
  >("idle");
  const [placesError, setPlacesError] = useState<string>("");
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Bootstrap.
  useEffect(() => {
    setItems(loadJSON<GroceryItem[]>(GROC_KEY, []));
    setPantry(loadJSON<PantryItem[]>(PANTRY_KEY, []));
    const existing = loadJSON<ChatMessage[]>(CHAT_KEY, []);
    if (existing.length > 0) {
      setChat(existing);
    } else {
      setChat([
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content:
            "I'm your grocery coach. Tell me what you want to eat — a week plan, a quick dinner, breakfasts — and I'll build the list and route it to stores near you.",
        },
      ]);
    }

    // Location + Places.
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
              // eslint-disable-next-line no-console
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
  }, []);

  // Persist.
  useEffect(() => {
    saveJSON(GROC_KEY, items);
  }, [items]);
  useEffect(() => {
    saveJSON(PANTRY_KEY, pantry);
  }, [pantry]);
  useEffect(() => {
    saveJSON(CHAT_KEY, chat);
  }, [chat]);

  // Auto-scroll chat.
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, thinking]);

  // ---------- list ops ------------------------------------------------------
  function addItem(text: string, addedBy: GroceryItem["addedBy"] = "user") {
    const clean = text.trim();
    if (!clean) return;
    setItems((prev) => {
      if (prev.some((i) => i.text.toLowerCase() === clean.toLowerCase()))
        return prev;
      return [
        ...prev,
        { id: crypto.randomUUID(), text: clean, done: false, addedBy },
      ];
    });
  }
  function onAddItemClick() {
    addItem(input, "user");
    setInput("");
  }
  function toggleItem(id: string) {
    setItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, done: !i.done } : i)),
    );
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  // Move checked items into the pantry — "you bought them, you have them."
  function movePickedToPantry() {
    const picked = items.filter((i) => i.done);
    const now = new Date().toISOString();
    setPantry((p) => [
      ...p,
      ...picked
        .filter(
          (d) =>
            !p.some((x) => x.text.toLowerCase() === d.text.toLowerCase()),
        )
        .map((d) => ({ id: crypto.randomUUID(), text: d.text, addedAt: now })),
    ]);
    setItems((prev) => prev.filter((i) => !i.done));
  }

  // ---------- pantry ops ----------------------------------------------------
  function addPantry(text: string) {
    const clean = text.trim();
    if (!clean) return;
    setPantry((prev) => {
      if (prev.some((p) => p.text.toLowerCase() === clean.toLowerCase()))
        return prev;
      return [
        {
          id: crypto.randomUUID(),
          text: clean,
          addedAt: new Date().toISOString(),
        },
        ...prev,
      ];
    });
  }
  function onAddPantry() {
    addPantry(pantryInput);
    setPantryInput("");
  }
  function removePantry(id: string) {
    setPantry((prev) => prev.filter((p) => p.id !== id));
  }

  // ---------- chat ----------------------------------------------------------
  async function sendChat(text: string) {
    const clean = text.trim();
    if (!clean || thinking) return;
    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content: clean,
    };
    const nextHistory = [...chat, userMsg];
    setChat(nextHistory);
    setChatInput("");
    setThinking(true);
    try {
      const { reply, plan } = await callGroceryCoach({
        request: clean,
        history: nextHistory,
        pantry: pantry.map((p) => p.text),
        shoppingList: items.map((i) => i.text),
      });
      setChat((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: reply, plan },
      ]);
    } catch (err) {
      console.warn("[openai] error", err);
      setChat((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: OPENAI_KEY
            ? "The coach hit an error talking to OpenAI. Check the dev console."
            : "No OpenAI key is set. Add VITE_OPENAI_API_KEY to beat-app/.env.local and restart `npm run dev`.",
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  function addAllFromPlan(plan: GroceryPlan) {
    plan.shoppingList.forEach((entry) => addItem(entry.text, "coach"));
  }

  function clearChat() {
    setChat([
      {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "Fresh slate. What do you want to eat this week?",
      },
    ]);
  }

  // ---------- derived -------------------------------------------------------
  const todo = useMemo(() => items.filter((i) => !i.done), [items]);
  const done = useMemo(() => items.filter((i) => i.done), [items]);

  // ---------- render --------------------------------------------------------
  return (
    <>
      <div className="eyebrow">Groceries</div>
      <h1 className="h1">Eat with a plan. Shop without thinking.</h1>
      <p className="lede">
        Ask the coach what to cook. It builds the list, routes it to stores near
        you, and keeps track of what you&rsquo;ve already bought.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.4fr) minmax(0, 1fr)",
          gap: 18,
          marginTop: 18,
          alignItems: "start",
        }}
      >
        {/* ============= LEFT: coach + list ============= */}
        <div>
          {/* Coach */}
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
                  Grocery coach
                </h2>
                <div className="muted" style={{ marginTop: 4 }}>
                  {OPENAI_KEY
                    ? "Ask for a week plan, a quick dinner, or an ingredient swap."
                    : "Set VITE_OPENAI_API_KEY in .env.local to turn on the real coach."}
                </div>
              </div>
              <button className="btn sm ghost" onClick={clearChat}>
                New chat
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                maxHeight: 420,
                minHeight: 220,
                overflowY: "auto",
                padding: "10px 4px",
                border: "1px solid var(--line)",
                borderRadius: 12,
                background: "#fbf7ef",
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {chat.map((m) => (
                <ChatBubble
                  key={m.id}
                  msg={m}
                  onAddAll={() => m.plan && addAllFromPlan(m.plan)}
                />
              ))}
              {thinking && (
                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <div style={bubbleStyle(false)}>
                    <ThinkingDots />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="row" style={{ gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {QUICK_PROMPTS.map((p) => (
                <button
                  key={p}
                  className="pill"
                  onClick={() => sendChat(p)}
                  disabled={thinking}
                >
                  {p}
                </button>
              ))}
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="What do you want to eat?"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && !thinking && sendChat(chatInput)
                }
                disabled={thinking}
              />
              <button
                className="btn"
                onClick={() => sendChat(chatInput)}
                disabled={thinking || !chatInput.trim()}
              >
                Ask
              </button>
            </div>
          </section>

          {/* Shopping list */}
          <section className="card" style={{ marginTop: 16 }}>
            <div className="row" style={{ justifyContent: "space-between" }}>
              <h2 className="h2" style={{ margin: 0 }}>
                Shopping list{" "}
                <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                  ({todo.length} to buy)
                </span>
              </h2>
              {done.length > 0 && (
                <button className="btn sm ghost" onClick={movePickedToPantry}>
                  Move {done.length} to pantry
                </button>
              )}
            </div>

            <div className="row" style={{ marginTop: 10 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 200 }}
                placeholder="Add an item…"
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
                List is empty. Ask the coach for a plan, or add something
                yourself.
              </div>
            ) : (
              todo.map((i) => (
                <div key={i.id} className="grocery">
                  <input
                    type="checkbox"
                    checked={i.done}
                    onChange={() => toggleItem(i.id)}
                  />
                  <span className="text">{i.text}</span>
                  {i.addedBy !== "user" && (
                    <span className="tag" style={{ marginLeft: 8 }}>
                      {i.addedBy}
                    </span>
                  )}
                  <button
                    className="remove"
                    onClick={() => removeItem(i.id)}
                    aria-label="remove"
                  >
                    ×
                  </button>
                </div>
              ))
            )}

            {done.length > 0 && (
              <>
                <div className="divider" />
                <div className="muted" style={{ fontSize: 13, marginBottom: 6 }}>
                  Checked off — press &ldquo;Move to pantry&rdquo; above when
                  you&rsquo;re home.
                </div>
                {done.map((i) => (
                  <div key={i.id} className="grocery">
                    <input
                      type="checkbox"
                      checked={i.done}
                      onChange={() => toggleItem(i.id)}
                    />
                    <span className="text done">{i.text}</span>
                    <button
                      className="remove"
                      onClick={() => removeItem(i.id)}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </>
            )}
          </section>
        </div>

        {/* ============= RIGHT: pantry + stores ============= */}
        <div>
          {/* Pantry */}
          <section className="card">
            <h2 className="h2" style={{ margin: 0 }}>
              Pantry{" "}
              <span className="muted" style={{ fontSize: 13, fontWeight: 400 }}>
                ({pantry.length} item{pantry.length === 1 ? "" : "s"})
              </span>
            </h2>
            <div className="muted" style={{ marginTop: 4 }}>
              What&rsquo;s already in your kitchen. The coach won&rsquo;t
              duplicate these.
            </div>

            <div className="row" style={{ marginTop: 12 }}>
              <input
                className="input"
                style={{ flex: 1, minWidth: 180 }}
                placeholder="I have… (e.g. eggs)"
                value={pantryInput}
                onChange={(e) => setPantryInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && onAddPantry()}
              />
              <button className="btn" onClick={onAddPantry}>
                Add
              </button>
            </div>

            <div className="divider" />

            {pantry.length === 0 ? (
              <div className="empty">
                Nothing tracked yet. Check off grocery items to fill this.
              </div>
            ) : (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {pantry.map((p) => (
                  <span key={p.id} style={chipStyle}>
                    {p.text}
                    <button
                      onClick={() => removePantry(p.id)}
                      aria-label="remove"
                      style={chipBtnStyle}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Stores */}
          <section className="card" style={{ marginTop: 16 }}>
            <h2 className="h2" style={{ margin: 0 }}>
              Supermarkets nearby
            </h2>
            <div className="muted" style={{ marginTop: 4 }}>
              {locStatus === "asking" && "Asking your browser for location…"}
              {locStatus === "denied" &&
                "Location denied or unavailable. Enable it in your browser to see real stores."}
              {locStatus === "no-key" &&
                "Set VITE_GOOGLE_MAPS_KEY in .env.local to see real nearby stores."}
              {locStatus === "idle" && "Loading…"}
              {locStatus === "ok" &&
                placesStatus === "loading" &&
                "Location OK — querying Google Places…"}
              {locStatus === "ok" &&
                placesStatus === "ok" &&
                `Places API OK · ${stores.length} store${stores.length === 1 ? "" : "s"} within 10 mi, closest first.`}
              {locStatus === "ok" && placesStatus === "error" && (
                <>
                  Places API error. Key may be invalid, unrestricted wrong, or
                  the &ldquo;Places API (New)&rdquo; isn&rsquo;t enabled on your
                  project.
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
                {locStatus === "ok" && placesStatus === "ok"
                  ? "No grocery stores found within 10 miles."
                  : "—"}
              </div>
            ) : (
              stores.map((s) => (
                <div
                  key={s.id}
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
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                      {s.name}
                    </div>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {s.distanceMi} mi · ~{s.etaMin} min ·{" "}
                      {s.address ?? "—"}
                    </div>
                  </div>
                  <div className="row" style={{ gap: 6 }}>
                    <span className="tag">{s.kind}</span>
                    <a
                      className="btn sm ghost"
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + " " + (s.address ?? ""))}`}
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
      </div>
    </>
  );
}

// ---------- ChatBubble ------------------------------------------------------
function ChatBubble({
  msg,
  onAddAll,
}: {
  msg: ChatMessage;
  onAddAll: () => void;
}) {
  const isUser = msg.role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div style={bubbleStyle(isUser)}>
        <div>{msg.content}</div>

        {msg.plan && msg.plan.meals.length > 0 && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 10,
              borderTop: isUser
                ? "1px solid rgba(255,255,255,.25)"
                : "1px solid var(--line)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {msg.plan.summary && (
              <div style={{ fontStyle: "italic", fontSize: 13.5 }}>
                {msg.plan.summary}
              </div>
            )}
            {msg.plan.meals.map((m, idx) => (
              <div
                key={idx}
                style={{
                  background: isUser
                    ? "rgba(255,255,255,.12)"
                    : "#fff8ee",
                  border: isUser
                    ? "1px solid rgba(255,255,255,.25)"
                    : "1px solid var(--line)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 14 }}>
                  {m.name}
                  {m.servings ? (
                    <span className="muted"> · {m.servings} servings</span>
                  ) : null}
                </div>
                {m.why && (
                  <div className="muted" style={{ fontSize: 13 }}>
                    {m.why}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 6,
                    marginTop: 8,
                  }}
                >
                  {m.ingredients.map((ing, i) => (
                    <span
                      key={i}
                      style={{ ...chipStyle, background: "#F3EADB" }}
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {msg.plan && msg.plan.shoppingList.length > 0 && (
          <button
            className="btn sm"
            style={{ marginTop: 10 }}
            onClick={onAddAll}
          >
            + Add all {msg.plan.shoppingList.length} items to shopping list
          </button>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  return (
    <span aria-label="thinking">
      <Dot delay={0} />
      <Dot delay={0.15} />
      <Dot delay={0.3} />
    </span>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 6,
        height: 6,
        borderRadius: "50%",
        background: "var(--mute)",
        marginRight: 4,
        animation: `beatThink 1.2s infinite ease-in-out`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// ---------- inline styles shared across bubbles/chips -----------------------
function bubbleStyle(isUser: boolean): React.CSSProperties {
  return {
    maxWidth: "82%",
    padding: "10px 14px",
    borderRadius: 14,
    fontSize: 14,
    lineHeight: 1.5,
    wordWrap: "break-word",
    border: "1px solid var(--line)",
    background: isUser ? "var(--coral)" : "#fff",
    color: isUser ? "#fff" : "var(--ink)",
    borderColor: isUser ? "var(--coral)" : "var(--line)",
    boxShadow: "var(--shadow-sm)",
  };
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

// ---------- OpenAI call -----------------------------------------------------
async function callGroceryCoach(args: {
  request: string;
  history: ChatMessage[];
  pantry: string[];
  shoppingList: string[];
}): Promise<{ reply: string; plan?: GroceryPlan }> {
  if (!OPENAI_KEY) {
    return {
      reply:
        "No OpenAI key configured — running in demo mode. Add VITE_OPENAI_API_KEY to .env.local to enable the real coach.",
    };
  }

  const systemPrompt = `You are Beat, a grocery-planning coach.
Your goal: turn a vague request into a concrete grocery plan — meals + a shopping list.
Be direct and concise. Never repeat ingredients the user already has in their pantry.
Respond with VALID JSON ONLY (no markdown, no prose outside JSON). Shape:
{
  "reply": "<one or two sentences summarizing the plan>",
  "plan": {
    "summary": "<one line>",
    "meals": [
      { "name": "...", "servings": 2, "ingredients": ["..."], "why": "..." }
    ],
    "shoppingList": [
      { "text": "...", "category": "produce|protein|dairy|pantry|frozen|other" }
    ]
  }
}`;

  const pantryLine = args.pantry.length
    ? `Pantry (already have, do NOT include on shopping list): ${args.pantry.join(", ")}`
    : "Pantry: empty";
  const listLine = args.shoppingList.length
    ? `Current shopping list: ${args.shoppingList.join(", ")}`
    : "Shopping list: empty";

  // Convert chat history into OpenAI messages.
  const messages = [
    { role: "system", content: systemPrompt },
    { role: "system", content: `${pantryLine}\n${listLine}` },
    ...args.history.map((m) => ({ role: m.role, content: m.content })),
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

  const json = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const raw = json.choices?.[0]?.message?.content ?? "";

  try {
    const parsed = JSON.parse(raw) as { reply?: string; plan?: GroceryPlan };
    return {
      reply: parsed.reply ?? "Here's a plan.",
      plan: parsed.plan,
    };
  } catch {
    // Model ignored the JSON instruction — show the raw reply.
    return { reply: raw || "The coach didn't return anything." };
  }
}

// ---------- Places API (New) ------------------------------------------------
async function searchNearbyGroceries(
  lat: number,
  lng: number,
): Promise<Store[]> {
  const res = await fetch(
    "https://places.googleapis.com/v1/places:searchNearby",
    {
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
            radius: 16093, // 10 miles in meters
          },
        },
      }),
    },
  );

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
      types?: string[];
      primaryType?: string;
      rating?: number;
    }>;
  };

  return (data.places ?? [])
    .map((p): Store | null => {
      if (!p.location) return null;
      const distanceKm = haversineKm(
        lat,
        lng,
        p.location.latitude,
        p.location.longitude,
      );
      const distanceMi = distanceKm * 0.621371;
      const etaMin = Math.max(2, Math.round(distanceMi * 3)); // ~20 mph urban estimate
      return {
        id: p.id,
        name: p.displayName?.text ?? "Unnamed",
        kind: "grocery",
        distanceMi: Math.round(distanceMi * 10) / 10,
        etaMin,
        healthScore: p.rating ? Math.min(10, p.rating * 2) : 7,
        address: p.formattedAddress,
      };
    })
    .filter((s): s is Store => s !== null);
}

function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

// ---------- keyframes (injected once) ---------------------------------------
if (
  typeof document !== "undefined" &&
  !document.getElementById("beat-think-kf")
) {
  const style = document.createElement("style");
  style.id = "beat-think-kf";
  style.textContent = `
@keyframes beatThink {
  0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
  40% { opacity: 1; transform: translateY(-3px); }
}`;
  document.head.appendChild(style);
}
