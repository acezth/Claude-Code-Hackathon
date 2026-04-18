import { useEffect, useMemo, useState } from "react";
import { findNearbyStores, listTodaysEvents } from "@/services/google";
import { suggestStorePicks } from "@/services/openai";
import type { CalendarEvent, FoodPick, Store } from "@/services/types";

type Kind = Store["kind"];

type LocationState = {
  lat: number;
  lng: number;
  source: "current" | "fallback";
  message: string;
};

const DEFAULT_LOCATION: LocationState = {
  lat: 40.7128,
  lng: -74.006,
  source: "fallback",
  message: "Using the fallback location until your browser shares your current position.",
};

export default function SceneScan() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [minutes, setMinutes] = useState<number>(15);
  const [kinds, setKinds] = useState<Kind[]>(["grocery", "convenience", "restaurant"]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selected, setSelected] = useState<Store | null>(null);
  const [picks, setPicks] = useState<FoodPick[]>([]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationState>(DEFAULT_LOCATION);

  const kindKey = useMemo(() => kinds.slice().sort().join(","), [kinds]);

  useEffect(() => {
    listTodaysEvents().then(setEvents);
  }, []);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setLocation({
        ...DEFAULT_LOCATION,
        message: "Geolocation is unavailable in this browser, so Scene Scan is using the fallback location.",
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          source: "current",
          message: "Using your current location for nearby store picks.",
        });
      },
      () => {
        setLocation({
          ...DEFAULT_LOCATION,
          message: "Location permission was denied, so Scene Scan is using the fallback location.",
        });
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    findNearbyStores({
      lat: location.lat,
      lng: location.lng,
      maxMinutes: minutes,
      kinds,
    })
      .then((results) => {
        if (cancelled) return;
        setStores(results);
        setSelected((current) => {
          if (current) {
            const match = results.find((store) => store.id === current.id);
            if (match) return match;
          }
          return results[0] ?? null;
        });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [location.lat, location.lng, minutes, kindKey]);

  useEffect(() => {
    if (!selected) {
      setPicks([]);
      return;
    }

    suggestStorePicks(selected, { events, now: new Date().toISOString() }).then(setPicks);
  }, [selected, events]);

  return (
    <>
      <div className="eyebrow">Scene Scan</div>
      <h1 className="h1">Three picks, five seconds.</h1>
      <p className="lede">
        Beat filters nearby spots by how much time you actually have, then picks the smartest thing to eat for your next few hours.
      </p>

      <div className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ gap: 24, justifyContent: "space-between" }}>
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
                {(["grocery", "convenience", "restaurant"] as Kind[]).map((kind) => (
                  <label key={kind} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={kinds.includes(kind)}
                      onChange={(e) =>
                        setKinds((prev) =>
                          e.target.checked ? [...new Set([...prev, kind])] : prev.filter((value) => value !== kind)
                        )
                      }
                    />
                    {labelFor(kind)}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className={`scene-scan-location scene-scan-location-${location.source}`}>
            <div className="scene-scan-location-title">
              {location.source === "current" ? "Live location" : "Fallback location"}
            </div>
            <div className="muted">{location.message}</div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ marginTop: 18, alignItems: "start" }}>
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h2">Near you</h2>
            <span className="pill">{stores.length} matches</span>
          </div>
          {loading && stores.length === 0 ? (
            <div className="empty">Looking around...</div>
          ) : stores.length === 0 ? (
            <div className="empty">Nothing reachable in {minutes} min. Try expanding time or turning on location access.</div>
          ) : (
            <ul className="store-list">
              {stores
                .slice()
                .sort((a, b) => b.healthScore - a.healthScore)
                .map((store) => (
                  <li
                    key={store.id}
                    className={selected?.id === store.id ? "active" : ""}
                    onClick={() => setSelected(store)}
                  >
                    <div>
                      <div style={{ fontWeight: 600 }}>{store.name}</div>
                      <div className="store-meta">
                        <span>{labelFor(store.kind)}</span>
                        <span>|</span>
                        <span>{store.distanceMi} mi</span>
                        <span>|</span>
                        <span>{store.etaMin} min</span>
                      </div>
                      {store.address && (
                        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
                          {store.address}
                        </div>
                      )}
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontFamily: "var(--font-serif)",
                          fontWeight: 700,
                          fontSize: 20,
                          color: scoreColor(store.healthScore),
                        }}
                      >
                        {store.healthScore.toFixed(1)}
                      </div>
                      <div className="muted" style={{ fontSize: 10, letterSpacing: ".08em" }}>HEALTH</div>
                    </div>
                  </li>
                ))}
            </ul>
          )}
        </section>

        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h2">{selected ? selected.name : "Pick a store"}</h2>
            {selected && <span className="pill">AI picks</span>}
          </div>
          {!selected ? (
            <div className="empty">Select a store to see three ranked picks for your next few hours.</div>
          ) : picks.length === 0 ? (
            <div className="empty">Thinking...</div>
          ) : (
            <ol className="pick-list">
              {picks.map((pick, index) => (
                <li key={pick.id}>
                  <div className={`rank r${Math.min(index + 1, 3)}`}>{index + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700 }}>{pick.title}</div>
                    <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{pick.why}</div>
                    <div className="row" style={{ marginTop: 8 }}>
                      {pick.tags.map((tag) => (
                        <span key={tag} className={`tag ${tag === "camera-safe" ? "go" : tag === "salt-heavy" ? "warn" : ""}`}>
                          {tag}
                        </span>
                      ))}
                      {pick.priceUsd != null && <span className="tag">${pick.priceUsd.toFixed(2)}</span>}
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

function labelFor(kind: Kind): string {
  return kind === "grocery" ? "Grocery" : kind === "convenience" ? "Convenience" : "Restaurant";
}

function scoreColor(score: number): string {
  if (score >= 8) return "var(--ok)";
  if (score >= 6) return "#B56E11";
  return "var(--warn)";
}
