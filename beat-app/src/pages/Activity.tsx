import { useEffect, useState } from "react";
import { buildStravaAuthUrl, isStravaConnected, listRecentWorkouts } from "@/services/strava";
import type { Workout } from "@/services/types";

export default function Activity() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [connected, setConnected] = useState<boolean>(isStravaConnected());

  useEffect(() => { listRecentWorkouts(20).then(setWorkouts); }, []);

  const totalKm = workouts.reduce((s, w) => s + (w.distanceKm ?? 0), 0);
  const totalMin = Math.round(workouts.reduce((s, w) => s + w.movingSec, 0) / 60);
  const totalCal = workouts.reduce((s, w) => s + (w.calories ?? 0), 0);

  return (
    <>
      <div className="eyebrow">Your Activity</div>
      <h1 className="h1">Move however your day lets you.</h1>
      <p className="lede">
        Beat auto-syncs your workouts from Strava &mdash; runs, rides, hotel-gym sessions, hallway walks. Anchor #3 counts here too.
      </p>

      {!connected && (
        <section className="card" style={{ marginTop: 20, borderLeft: "4px solid var(--coral)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2 className="h2" style={{ margin: 0 }}>Connect Strava</h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>Auto-pull every activity, no manual logging.</p>
            </div>
            <a className="btn" href={buildStravaAuthUrl()}>Connect</a>
          </div>
        </section>
      )}

      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="stat">{totalKm.toFixed(1)}<small>KM THIS WEEK</small></div>
        </div>
        <div className="card">
          <div className="stat">{totalMin}<small>MIN MOVING</small></div>
        </div>
        <div className="card">
          <div className="stat">{totalCal}<small>KCAL</small></div>
        </div>
      </div>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="h2">Recent workouts</h2>
        {workouts.length === 0 ? (
          <div className="empty">No workouts yet. Connect Strava to pull in the last few weeks.</div>
        ) : (
          workouts.map((w) => (
            <div key={w.id} className="workout">
              <div className="sport">{sportEmoji(w.sport)}</div>
              <div>
                <div className="title">{w.title}</div>
                <div className="sub">
                  {w.distanceKm ? `${w.distanceKm} km · ` : ""}
                  {Math.round(w.movingSec / 60)} min · {new Date(w.startedAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}
                </div>
              </div>
              <div className="muted">{w.calories ?? "—"} kcal</div>
            </div>
          ))
        )}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="h2">Upload something Strava didn&rsquo;t catch</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Hotel-gym session? 20-min walk around the bureau block? Log it here &mdash; Beat will fold it into today&rsquo;s recovery math.
        </p>
        <div className="row">
          <input className="input" placeholder="What did you do?" />
          <input className="input" placeholder="Minutes" style={{ maxWidth: 120 }} />
          <button className="btn sm">Log</button>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
          TODO: wire this form up to POST to Strava&rsquo;s /uploads endpoint, or write it to local state.
        </p>
      </section>
    </>
  );
}

function sportEmoji(s: Workout["sport"]): string {
  return { run: "🏃", ride: "🚴", swim: "🏊", walk: "🚶", weights: "🏋️", other: "⚡" }[s];
}
