import { useEffect, useState } from "react";
import { listTodaysEvents } from "@/services/google";
import { askCoach } from "@/services/openai";
import { listRecentWorkouts } from "@/services/strava";
import type { CalendarEvent, CoachReply, Workout } from "@/services/types";

export default function Home() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [brief, setBrief] = useState<CoachReply | null>(null);

  useEffect(() => {
    listTodaysEvents().then(setEvents);
    listRecentWorkouts(3).then(setWorkouts);
  }, []);

  useEffect(() => {
    if (events.length === 0) return;
    askCoach("Give me a 2-sentence briefing for today based on my schedule.", { events, workouts }).then(setBrief);
  }, [events, workouts]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <>
      <div className="eyebrow">Today · {now.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
      <h1 className="h1">{greeting}, Suleyman.</h1>
      <p className="lede">Here&rsquo;s your day, and the one decision Beat has pre-made for you.</p>

      <div className="grid-2" style={{ marginTop: 24 }}>
        {/* Producer brief */}
        <section className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <h2 className="h2">The Producer</h2>
            <span className="pill">LIVE</span>
          </div>
          {brief ? (
            <p style={{ fontFamily: "var(--font-serif)", fontSize: 20, lineHeight: 1.35 }}>
              &ldquo;{brief.text}&rdquo;
            </p>
          ) : (
            <p className="muted">Thinking through your day&hellip;</p>
          )}
          <div className="row" style={{ marginTop: 8 }}>
            <a className="btn sm" href="/scan">Scene Scan</a>
            <a className="btn sm ghost" href="/coach">Ask coach</a>
          </div>
        </section>

        {/* Today's schedule */}
        <section className="card">
          <h2 className="h2">Today&rsquo;s schedule</h2>
          {events.length === 0 ? (
            <div className="empty">No events yet. Connect Google Calendar in Settings.</div>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {events.map((e) => (
                <li key={e.id} style={{ padding: "10px 0", borderBottom: "1px solid var(--line)", display: "grid", gridTemplateColumns: "80px 1fr auto", gap: 12 }}>
                  <span className="muted">{fmtTime(e.start)}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{e.title}</div>
                    {e.location && <div className="muted" style={{ fontSize: 12 }}>{e.location}</div>}
                  </div>
                  {e.kind === "live_hit" && <span className="tag warn">On camera</span>}
                  {e.kind === "flight" && <span className="tag">Flight</span>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Anchors strip */}
      <section className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Your three anchors</h2>
          <span className="muted" style={{ fontSize: 12 }}>Context-triggered, not clock-triggered</span>
        </div>
        <div className="grid-3" style={{ marginTop: 10 }}>
          <Anchor n="01" title="Water on wake" status="done" meta="16 oz, 7:02 am" />
          <Anchor n="02" title="Protein within 60 min of landing" status="pending" meta="You land at 4:40 pm" />
          <Anchor n="03" title="10-min walk before sleep" status="upcoming" meta="Nudge at 10:30 pm" />
        </div>
      </section>

      {/* Recent workouts */}
      <section className="card" style={{ marginTop: 18 }}>
        <div className="row" style={{ justifyContent: "space-between" }}>
          <h2 className="h2">Recent activity</h2>
          <a className="muted" href="/activity" style={{ fontSize: 13 }}>View all &rarr;</a>
        </div>
        {workouts.map((w) => (
          <div key={w.id} className="workout">
            <div className="sport">{sportEmoji(w.sport)}</div>
            <div>
              <div className="title">{w.title}</div>
              <div className="sub">
                {w.distanceKm ? `${w.distanceKm} km · ` : ""}
                {Math.round(w.movingSec / 60)} min · {new Date(w.startedAt).toLocaleDateString()}
              </div>
            </div>
            <div className="muted">{w.calories ?? "—"} kcal</div>
          </div>
        ))}
      </section>
    </>
  );
}

function Anchor({ n, title, status, meta }: { n: string; title: string; status: "done" | "pending" | "upcoming"; meta: string }) {
  const color = status === "done" ? "var(--ok)" : status === "pending" ? "var(--coral)" : "var(--mute)";
  const label = status === "done" ? "Done" : status === "pending" ? "Do now" : "Upcoming";
  return (
    <div style={{ border: "1px solid var(--line)", borderRadius: 12, padding: 14, background: "#fff" }}>
      <div className="muted" style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 700 }}>{n}</div>
      <div style={{ fontFamily: "var(--font-serif)", fontSize: 18, marginTop: 4 }}>{title}</div>
      <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{meta}</div>
      <div style={{ marginTop: 10, color, fontSize: 12, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
function sportEmoji(s: Workout["sport"]): string {
  return { run: "🏃", ride: "🚴", swim: "🏊", walk: "🚶", weights: "🏋️", other: "⚡" }[s];
}
