import { useState } from "react";
import { estimateMacrosFromImage, MACRO_MIN_CONFIDENCE_PCT, suggestMealsFromFridge } from "@/services/openai";
import type { MacroEstimate, MealSuggestion } from "@/services/types";

export default function FridgeScan() {
  const [preview, setPreview] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealSuggestion[]>([]);
  const [macro, setMacro] = useState<MacroEstimate | null>(null);
  const [macroError, setMacroError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleFile(file: File) {
    const dataUrl = await toDataUrl(file);
    setPreview(dataUrl);
    setMacro(null);
    setMacroError(null);
    setLoading(true);
    try {
      const [m, macroEstimate] = await Promise.all([
        suggestMealsFromFridge(dataUrl),
        estimateMacrosFromImage(dataUrl),
      ]);
      setMeals(m);
      setMacro(macroEstimate);
    } catch (err) {
      if (err instanceof Error && err.message.startsWith("LOW_CONFIDENCE:")) {
        const pct = err.message.split(":")[1] ?? "0";
        setMacroError(`Macro scan failed loudly: confidence ${pct}% is below required ${MACRO_MIN_CONFIDENCE_PCT}%. Upload a clearer meal image.`);
      } else {
        setMacroError("Could not analyze macros from this image. Try a clearer photo.");
      }
    } finally {
      setLoading(false);
    }
  }

  function addMissingToList(items: string[]) {
    // Persisted in localStorage so the Groceries page can pick it up.
    const existing = JSON.parse(localStorage.getItem("beat.groceries") || "[]") as { id: string; text: string; done: boolean; addedBy: string }[];
    const next = [
      ...existing,
      ...items.map((t) => ({ id: crypto.randomUUID(), text: t, done: false, addedBy: "meal-scan" as const })),
    ];
    localStorage.setItem("beat.groceries", JSON.stringify(next));
    alert(`${items.length} item(s) added to your grocery list.`);
  }

  return (
    <>
      <div className="eyebrow">Meal Scan</div>
      <h1 className="h1">Show Beat what you have.</h1>
      <p className="lede">Snap your meal. Beat estimates macros from the plate and suggests three clean follow-up meals you can actually make.</p>

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
              <img className="preview-img" src={preview} alt="Your meal" />
            </div>
          )}
        </section>

        <section className="card">
          <h2 className="h2">Macro tracker</h2>
          {loading ? (
            <div className="empty">Estimating macros from your image&hellip;</div>
          ) : macroError ? (
            <div className="empty">{macroError}</div>
          ) : !macro ? (
            <div className="empty">Upload a food photo to estimate calories and macros.</div>
          ) : (
            <div className="meal-card" style={{ marginBottom: 14 }}>
              <div className="meal-thumb">📊</div>
              <div>
                <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, fontWeight: 700 }}>{macro.item}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Serving: {macro.serving} · Confidence: {macro.confidence} ({macro.confidencePct}%)
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>{macro.visualDescription}</div>
                <div className="row" style={{ marginTop: 8 }}>
                  <span className="tag go">{macro.calories} kcal</span>
                  <span className="tag">{macro.proteinG}g protein</span>
                  <span className="tag">{macro.carbsG}g carbs</span>
                  <span className="tag">{macro.fatG}g fat</span>
                </div>
                <div style={{ fontSize: 13, marginTop: 8 }}>{macro.note}</div>
              </div>
            </div>
          )}

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
