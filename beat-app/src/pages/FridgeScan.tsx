import { useState } from "react";
import { suggestMealsFromFridge } from "@/services/openai";
import type { MealSuggestion } from "@/services/types";

export default function FridgeScan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    const dataUrl = await toDataUrl(file);
    setPreview(dataUrl);
    setLoading(true);
    try {
      const m = await suggestMealsFromFridge(dataUrl);
      setMeals(m);
    } finally {
      setLoading(false);
    }
  }

  function addMissingToList(items: string[]) {
    // Persisted in localStorage so the Groceries page can pick it up.
    const existing = JSON.parse(localStorage.getItem("beat.groceries") || "[]") as { id: string; text: string; done: boolean; addedBy: string }[];
    const next = [
      ...existing,
      ...items.map((t) => ({ id: crypto.randomUUID(), text: t, done: false, addedBy: "fridge-scan" as const })),
    ];
    localStorage.setItem("beat.groceries", JSON.stringify(next));
    alert(`${items.length} item(s) added to your grocery list.`);
  }

  return (
    <>
      <div className="eyebrow">Fridge Scan</div>
      <h1 className="h1">Show Beat what you have.</h1>
      <p className="lede">Snap your fridge or pantry. Beat reads what&rsquo;s in there and suggests three clean meals you can actually make.</p>

      <div className="grid-2" style={{ marginTop: 24, alignItems: "start" }}>
        <section className="card">
          <h2 className="h2">Upload</h2>
          <label className="dropzone">
            <div style={{ fontSize: 36 }}>🧊</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>Click to choose a photo</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>or drag one in</div>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </label>

          {preview && (
            <div style={{ marginTop: 16 }}>
              <img className="preview-img" src={preview} alt="Your fridge" />
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="h2">What Beat suggests</h2>
          {loading ? (
            <div className="empty">Reading your shelves&hellip;</div>
          ) : meals.length === 0 ? (
            <div className="empty">Upload a photo to see three meals you can make right now.</div>
          ) : (
            <div>
              {meals.map((m) => (
                <div key={m.id} className="meal-card" style={{ marginBottom: 10 }}>
                  <div className="meal-thumb">{m.emoji}</div>
                  <div>
                    <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700 }}>{m.title}</div>
                    <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                      {m.minutes} min {m.calories ? `· ${m.calories} kcal` : ""}
                    </div>
                    <div style={{ fontSize: 13, marginTop: 6 }}>{m.why}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                      {m.ingredients.slice(0, 4).map((i) => (
                        <span key={i} className="tag go">{i}</span>
                      ))}
                      {m.missing.length > 0 && (
                        <span className="tag warn">+{m.missing.length} missing</span>
                      )}
                    </div>
                  </div>
                  <div>
                    {m.missing.length > 0 ? (
                      <button className="btn sm" onClick={() => addMissingToList(m.missing)}>
                        Add to list
                      </button>
                    ) : (
                      <span className="tag go">Make now</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}
