import { useEffect, useState } from "react";
import { findNearbyStores, listTodaysEvents } from "@/services/google";
import { suggestStorePicks } from "@/services/openai";
import type { CalendarEvent, FoodPick, Store } from "@/services/types";

type Kind = Store["kind"];

const DEFAULT_LOCATION = { lat: 40.7128, lng: -74.006 }; // NYC, swap for geolocation

export default function SceneScan() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [minutes, setMinutes] = useState<number>(15);
  const [kinds, setKinds] = useState<Kind[]>(["grocery", "convenience", "restaurant"]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState<Store | null>(null);
  const [picks, setPicks] = useState<FoodPick[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { listTodaysEvents().then(setEvents); }, []);

  useEffect(() => {
    setLoading(true);
    findNearbyStores({ lat: DEFAULT_LOCATION.lat, lng: DEFAULT_LOCATION.lng, maxMinutes: minutes, kinds })
      .then((s) => {
        setStores(s);
        if (!selected && s.length > 0) setSelected(s[0]);
      })
      .finally(() => setLoading(false));
  }, [minutes, kinds.join(",")]);

  useEffect(() => {
    if (!selected) return;
    suggestStorePicks(selected, { events, now: new Date().toISOString() }).then(setPicks);
  }, [selected, events]);

  return (
    <>
      <div className="eyebrow">Scene Scan</div>
      <h1 className="h1">Three picks, five seconds.</h1>
      <p className="lede">
        Beat filters nearby spots by how much time you actually have, then picks the smartest thing to eat for your next few hours.
      </p>

      {/* filters */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ gap: 24 }}>
          <label>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>I have</div>
            <select className="select" value={minutes} onChange={(e) => setMinutes(Number(e.target.value))}>
              <option value={5}>5 minutes</option>
              <option value={10}>10 minutes</option>
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
            </select>
          </label>
          <div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 4 }}>Show me</div>
            <div className="row">
              {(["grocery", "convenience", "restaurant"] as Kind[]).map((k) => (
                <label key={k} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={kinds.includes(k)}
                    onChange={(e) =>
                      setKinds((prev) => (e.target.checked ? [...prev, k] : prev.filter((x) => x !== k)))
                    }
                  />
                  {labelFor(k)}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18, alignItems: "start" }}>
        {/* Stores */}
        <section className="card">
          <h2 className="h2">Near you</h2>
          {loading && stores.length === 0 ? (
            <div className="empty">Looking around&hellip;</div>
          ) : stores.length === 0 ? (
            <div className="empty">Nothing reachable in {minutes} min. Try expanding time.</div>
          ) : (
            <ul className="store-list">
              {stores
                .slice()
                .sort((a, b) => b.healthScore - a.healthScore)
                .map((s) => (
                <li
                  key={s.id}
                  className={selected?.id === s.id ? "active" : ""}
                  onClick={() => setSelected(s)}
                >
                  <div>
                    <div style={{ fontWeight: 600 }}>{s.name}</div>
                    <div className="store-meta">
                      <span>{labelFor(s.kind)}</span>
                      <span>·</span>
                      <span>{s.distanceMi} mi</span>
                      <span>·</span>
                      <span>{s.etaMin} min</span>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "var(--font-serif)", fontWeight: 700, fontSize: 20, color: scoreColor(s.healthScore) }}>
                      {s.healthScore.toFixed(1)}
                    </div>
                    <div className="muted" style={{ fontSize: 10, letterSpacing: ".08em" }}>HEALTH</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Picks */}
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h2">{selected ? selected.name : "Pick a store"}</h2>
            {selected && <span className="pill">AI picks</span>}
          </div>
          {!selected ? (
            <div className="empty">Select a store to see three ranked picks for your next few hours.</div>
          ) : picks.length === 0 ? (
            <div className="empty">Thinking&hellip;</div>
          ) : (
            <ol className="pick-list">
              {picks.map((p, i) => (
                <li key={p.id}>
                  <div className={`rank r${Math.min(i + 1, 3)}`}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{p.title}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{p.why}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                      {p.tags.map((t) => (
                        <span key={t} className={`tag ${t === "camera-safe" ? "go" : t === "salt-heavy" ? "warn" : ""}`}>
                          {t}
                        </span>
                      ))}
                      {p.priceUsd != null && <span className="tag">${p.priceUsd.toFixed(2)}</span>}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>
    </>
  );
}

function labelFor(k: Kind): string {
  return k === "grocery" ? "Grocery" : k === "convenience" ? "Convenience" : "Restaurant";
}
function scoreColor(s: number): string {
  if (s >= 8) return "var(--ok)";
  if (s >= 6) return "#B56E11";
  return "var(--warn)";
}
