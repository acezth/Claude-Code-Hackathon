import { useEffect, useState } from "react";
import { listTodaysEvents } from "@/services/google";
import { askCoach, suggestCoachMeals } from "@/services/openai";
import { listRecentWorkouts } from "@/services/strava";
import type {
  CalendarEvent,
  CoachMealPlan,
  CoachMealPreferences,
  Lesson,
  Workout,
} from "@/services/types";

const LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "Your energy dip is usually dehydration first",
    body: "Even mild dehydration can make you feel foggy, hungry, and more tired than you really are. Before you reach for more caffeine, drink water and wait 10 minutes. A lot of 'I need a snack' moments are actually hydration misses.",
    minutes: 2,
    tag: "nutrition",
  },
  {
    id: "l2",
    title: "A 10-minute walk after eating helps more than people think",
    body: "A short walk after a meal can blunt the blood-sugar spike that leads to a crash later. It also helps digestion and gives you a cleaner reset between work blocks. You do not need a full workout for this to matter.",
    minutes: 3,
    tag: "mental",
  },
  {
    id: "l3",
    title: "Protein earlier in the day usually means fewer bad decisions at night",
    body: "When breakfast and lunch are light on protein, evening cravings hit harder and convenience food gets much harder to resist. Front-loading protein tends to stabilize appetite, mood, and focus across the whole day.",
    minutes: 2,
    tag: "sleep",
  },
];

const STORAGE_KEY = "beat.coach.preferences";
const PLAN_STORAGE_KEY = "beat.coach.plan";
const MESSAGES_STORAGE_KEY = "beat.coach.messages";

const DEFAULT_PREFERENCES: CoachMealPreferences = {
  goal: "Stay full and steady between live hits",
  dietaryStyle: "high-protein omnivore",
  allergies: "",
  dislikes: "",
  location: "home",
  cookingAccess: "full-kitchen",
  timeAvailableMin: 15,
  budget: "medium",
};

export default function Coach() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState<{ role: "you" | "beat"; text: string }[]>(loadMessages);
  const [preferences, setPreferences] = useState<CoachMealPreferences>(loadPreferences);
  const [plan, setPlan] = useState<CoachMealPlan | null>(() => loadStoredPlan().plan);
  const [busy, setBusy] = useState(false);
  const [planning, setPlanning] = useState(false);
  const [notice, setNotice] = useState("");
  const [planDirty, setPlanDirty] = useState(() => !samePreferences(loadStoredPlan().preferences, loadPreferences()));

  useEffect(() => {
    listTodaysEvents().then(setEvents);
    listRecentWorkouts(5).then(setWorkouts);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  useEffect(() => {
    localStorage.setItem(MESSAGES_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const stored = loadStoredPlan();
    setPlanDirty(!samePreferences(stored.preferences, preferences));
  }, [preferences]);

  useEffect(() => {
    if (!plan) void generatePlan();
  }, [plan]);

  async function send(nextQuestion?: string) {
    const question = (nextQuestion ?? q).trim();
    if (!question) return;
    setMessages((m) => [...m, { role: "you", text: question }]);
    setQ("");
    setBusy(true);
    try {
      const r = await askCoach(question, { events, workouts });
      setMessages((m) => [...m, { role: "beat", text: r.text }]);
    } finally {
      setBusy(false);
    }
  }

  async function generatePlan() {
    setPlanning(true);
    setNotice("");
    try {
      const nextPlan = await suggestCoachMeals(preferences, { events, workouts });
      setPlan(nextPlan);
      setPlanDirty(false);
      localStorage.setItem(PLAN_STORAGE_KEY, JSON.stringify({ plan: nextPlan, preferences }));
    } finally {
      setPlanning(false);
    }
  }

  function updatePreference<K extends keyof CoachMealPreferences>(key: K, value: CoachMealPreferences[K]) {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  }

  function addMissingToList(items: string[]) {
    const existing = JSON.parse(localStorage.getItem("beat.groceries") || "[]") as {
      id: string;
      text: string;
      done: boolean;
      addedBy: string;
    }[];
    const seen = new Set(existing.map((item) => item.text.toLowerCase()));
    const unique = items.filter((item) => !seen.has(item.toLowerCase()));
    const next = [
      ...existing,
      ...unique.map((text) => ({ id: crypto.randomUUID(), text, done: false, addedBy: "coach" as const })),
    ];
    localStorage.setItem("beat.groceries", JSON.stringify(next));
    setNotice(unique.length === 0 ? "Those staples are already on your grocery list." : `${unique.length} item(s) added to groceries.`);
  }

  function useFollowUp(text: string) {
    setQ(text);
    void send(text);
  }

  const nextEvent = events[0];

  return (
    <>
      <div className="eyebrow">Coach</div>
      <h1 className="h1">Meal advice that works in real life.</h1>
      <p className="lede">
        Beat now gives you three meal options based on your preferences, your cooking setup, and what the next few hours actually look like.
      </p>

      <section className="card coach-planner" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 className="h2">Get 3 meal options</h2>
            <div className="muted" style={{ maxWidth: 620 }}>
              Fill this out once, tweak it when your day changes, and Beat will generate three realistic options you can choose from right now instead of generic nutrition advice.
            </div>
          </div>
          <button className="btn" onClick={() => void generatePlan()} disabled={planning}>
            {planning ? "Planning..." : "Refresh plan"}
          </button>
        </div>

        <div className="coach-form-grid" style={{ marginTop: 16 }}>
          <label>
            <div className="coach-field-label">Goal</div>
            <input
              className="input"
              value={preferences.goal}
              onChange={(e) => updatePreference("goal", e.target.value)}
              placeholder="Stay sharp through a long filing day"
            />
          </label>
          <label>
            <div className="coach-field-label">Diet style</div>
            <select
              className="select"
              value={preferences.dietaryStyle}
              onChange={(e) => updatePreference("dietaryStyle", e.target.value)}
            >
              <option value="high-protein omnivore">High-protein omnivore</option>
              <option value="vegetarian">Vegetarian</option>
              <option value="vegan">Vegan</option>
              <option value="low-carb">Low-carb</option>
              <option value="gluten-conscious">Gluten-conscious</option>
            </select>
          </label>
          <label>
            <div className="coach-field-label">Location</div>
            <select
              className="select"
              value={preferences.location}
              onChange={(e) => updatePreference("location", e.target.value as CoachMealPreferences["location"])}
            >
              <option value="home">Home</option>
              <option value="airport">Airport</option>
              <option value="hotel">Hotel</option>
              <option value="on-the-road">On the road</option>
            </select>
          </label>
          <label>
            <div className="coach-field-label">Cooking access</div>
            <select
              className="select"
              value={preferences.cookingAccess}
              onChange={(e) => updatePreference("cookingAccess", e.target.value as CoachMealPreferences["cookingAccess"])}
            >
              <option value="full-kitchen">Full kitchen</option>
              <option value="microwave">Microwave only</option>
              <option value="no-cook">No-cook only</option>
            </select>
          </label>
          <label>
            <div className="coach-field-label">Time available</div>
            <select
              className="select"
              value={String(preferences.timeAvailableMin)}
              onChange={(e) => updatePreference("timeAvailableMin", Number(e.target.value))}
            >
              <option value="5">5 minutes</option>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
            </select>
          </label>
          <label>
            <div className="coach-field-label">Budget</div>
            <select
              className="select"
              value={preferences.budget}
              onChange={(e) => updatePreference("budget", e.target.value as CoachMealPreferences["budget"])}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <label>
            <div className="coach-field-label">Allergies or restrictions</div>
            <input
              className="input"
              value={preferences.allergies}
              onChange={(e) => updatePreference("allergies", e.target.value)}
              placeholder="Peanuts, dairy, shellfish"
            />
          </label>
          <label>
            <div className="coach-field-label">Foods you dislike</div>
            <input
              className="input"
              value={preferences.dislikes}
              onChange={(e) => updatePreference("dislikes", e.target.value)}
              placeholder="Mushrooms, tuna, mayo"
            />
          </label>
        </div>

        <div className="coach-context-strip">
          <div className="coach-context-card">
            <div className="coach-field-label">Next event</div>
            <div className="coach-context-value">{nextEvent ? nextEvent.title : "No event loaded"}</div>
            <div className="muted">{nextEvent ? fmtTime(nextEvent.start) : "Connect Google Calendar in Settings"}</div>
          </div>
          <div className="coach-context-card">
            <div className="coach-field-label">Recent activity</div>
            <div className="coach-context-value">{workouts[0]?.title ?? "No workout loaded"}</div>
            <div className="muted">{workouts[0] ? `${Math.round(workouts[0].movingSec / 60)} min` : "Connect Strava or log a workout"}</div>
          </div>
          <div className="coach-context-card">
            <div className="coach-field-label">Options status</div>
            <div className="coach-context-value">{plan ? (planDirty ? "Refresh" : "Ready") : "Building"}</div>
            <div className="muted">
              {plan
                ? (planDirty ? "Preferences changed. Refresh to update these saved options." : "Your last three personalized choices are saved.")
                : "Generating your first set of options."}
            </div>
          </div>
        </div>

        {notice && <div className="inline-alert ok" style={{ marginTop: 14 }}>{notice}</div>}

        <div style={{ marginTop: 18 }}>
          {planning && !plan ? (
            <div className="empty">Building three meal options for your current setup...</div>
          ) : !plan ? (
            <div className="empty">No options yet. Hit refresh and Beat will generate three meal choices.</div>
          ) : (
            <>
              <div className="coach-plan-summary">
                <div>
                  <div className="coach-field-label">How to use these</div>
                  <div style={{ fontSize: 15 }}>{plan.summary}</div>
                </div>
                {plan.groceryStaples.length > 0 && (
                  <button className="btn sm ghost" onClick={() => addMissingToList(plan.groceryStaples)}>
                    Add staples to groceries
                  </button>
                )}
              </div>

              {planDirty && (
                <div className="inline-alert warn" style={{ marginBottom: 14 }}>
                  Your saved meal options are from your previous preferences. Hit Refresh plan to update them.
                </div>
              )}

              <div className="coach-meal-grid">
                {plan.meals.map((meal) => (
                  <article key={meal.id} className="coach-meal-card">
                    <div className="coach-meal-header">
                      <div className="meal-thumb">{meal.emoji}</div>
                      <div>
                        <div style={{ fontFamily: "var(--font-serif)", fontSize: 22, lineHeight: 1.1 }}>{meal.title}</div>
                        <div className="muted">
                          {meal.minutes} min{meal.calories ? ` · ${meal.calories} kcal` : ""}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, marginTop: 12 }}>{meal.why}</div>
                    <div className="coach-meal-note">{meal.bestFor}</div>
                    <div className="row" style={{ marginTop: 10 }}>
                      {meal.ingredients.map((ingredient) => (
                        <span key={ingredient} className="tag go">{ingredient}</span>
                      ))}
                      {meal.missing.length > 0 && <span className="tag warn">+{meal.missing.length} to buy</span>}
                    </div>
                    <div className="row" style={{ marginTop: 14 }}>
                      {meal.missing.length > 0 ? (
                        <button className="btn sm" onClick={() => addMissingToList(meal.missing)}>
                          Add missing items
                        </button>
                      ) : (
                        <span className="tag go">Ready now</span>
                      )}
                      <button
                        className="btn sm ghost"
                        onClick={() => useFollowUp(`Give me a variation on "${meal.title}" that still fits my current preferences.`)}
                      >
                        Ask for variation
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {plan.followUps.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="coach-field-label" style={{ marginBottom: 8 }}>Need a different set?</div>
                  <div className="row">
                    {plan.followUps.map((question) => (
                      <button key={question} className="btn sm ghost" onClick={() => useFollowUp(question)}>
                        {question}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      <div className="grid-2" style={{ marginTop: 20, alignItems: "start" }}>
        <section className="card">
          <h2 className="h2">Ask the coach</h2>
          <div className="coach-chat-shell">
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div className="coach-message-role" data-role={m.role}>
                  {m.role === "beat" ? "BEAT" : "YOU"}
                </div>
                <div style={{ fontSize: 14 }}>{m.text}</div>
              </div>
            ))}
            {busy && <div className="muted" style={{ fontSize: 13 }}>Beat is thinking...</div>}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="What should I eat before a 5pm live hit?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void send()}
            />
            <button className="btn" onClick={() => void send()} disabled={busy}>Send</button>
          </div>
        </section>

        <section>
          <h2 className="h2">3 smart health facts for today</h2>
          {LESSONS.map((l) => (
            <div key={l.id} className="lesson">
              <div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="tag">{l.tag}</span>
                  <span className="time">{l.minutes} min read</span>
                </div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginTop: 6 }}>{l.title}</div>
                <div style={{ fontSize: 13, color: "var(--ink-2)", marginTop: 4 }}>{l.body}</div>
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}

function loadPreferences(): CoachMealPreferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...(JSON.parse(raw) as Partial<CoachMealPreferences>) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

function loadStoredPlan(): { plan: CoachMealPlan | null; preferences: CoachMealPreferences | null } {
  try {
    const raw = localStorage.getItem(PLAN_STORAGE_KEY);
    if (!raw) return { plan: null, preferences: null };
    const parsed = JSON.parse(raw) as { plan?: CoachMealPlan; preferences?: CoachMealPreferences };
    return {
      plan: parsed.plan ?? null,
      preferences: parsed.preferences ?? null,
    };
  } catch {
    return { plan: null, preferences: null };
  }
}

function loadMessages(): { role: "you" | "beat"; text: string }[] {
  try {
    const raw = localStorage.getItem(MESSAGES_STORAGE_KEY);
    if (!raw) return defaultMessages();
    const parsed = JSON.parse(raw) as { role: "you" | "beat"; text: string }[];
    return parsed.length > 0 ? parsed : defaultMessages();
  } catch {
    return defaultMessages();
  }
}

function defaultMessages(): { role: "you" | "beat"; text: string }[] {
  return [
    {
      role: "beat",
      text: "I'm your coach. Tell me your schedule, your constraints, or what food decision you want off your plate. I'll keep it practical.",
    },
  ];
}

function samePreferences(a: CoachMealPreferences | null, b: CoachMealPreferences | null): boolean {
  if (!a || !b) return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
