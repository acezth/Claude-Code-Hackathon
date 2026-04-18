import { useEffect, useState } from "react";
import { listTodaysEvents } from "@/services/google";
import { askCoach } from "@/services/openai";
import { listRecentWorkouts } from "@/services/strava";
import type { CalendarEvent, Lesson, Workout } from "@/services/types";

const LESSONS: Lesson[] = [
  {
    id: "l1",
    title: "Why salt at 4pm = puffy at 5pm",
    body: "Sodium pulls water into your cheeks and under-eye area in about 45-60 minutes. If you're going live, think salt-light from 3pm onward and hydrate with 12 oz water at the top of the 4pm hour.",
    minutes: 2,
    tag: "on-camera",
  },
  {
    id: "l2",
    title: "The red-eye recovery playbook",
    body: "Eat your biggest meal before boarding, not on the plane. Aim for protein + vegetables. Skip alcohol. Hydrate every 30 minutes. Walk the aisle twice per hour.",
    minutes: 3,
    tag: "travel",
  },
  {
    id: "l3",
    title: "What to eat within 60 min of landing",
    body: "Your gut is sluggish after a flight. Something simple and clean: Greek yogurt, a banana, a handful of nuts. Skip anything fried or spicy for the first hour.",
    minutes: 2,
    tag: "nutrition",
  },
  {
    id: "l4",
    title: "How to cut the 3pm crash without more caffeine",
    body: "A 10-minute walk + 12 oz water + a protein snack beats a fourth coffee almost every time. Caffeine after 2pm also cuts an hour off your deep sleep.",
    minutes: 3,
    tag: "nutrition",
  },
  {
    id: "l5",
    title: "Sleep anchors that travel",
    body: "Same wind-down in every hotel: 10-minute walk → shower → no screens → the same playlist or podcast. Your body learns 'this = sleep' even when the room changes.",
    minutes: 2,
    tag: "sleep",
  },
];

export default function Coach() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [q, setQ] = useState("");
  const [messages, setMessages] = useState<{ role: "you" | "beat"; text: string }[]>([
    {
      role: "beat",
      text:
        "Hey. I&rsquo;m your coach. Ask me anything &mdash; what to eat before a live hit, how to sleep on a red-eye, how to handle three airport meals in a row. I&rsquo;ll keep it short.",
    },
  ]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listTodaysEvents().then(setEvents);
    listRecentWorkouts(5).then(setWorkouts);
  }, []);

  async function send() {
    if (!q.trim()) return;
    const question = q.trim();
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

  return (
    <>
      <div className="eyebrow">Coach</div>
      <h1 className="h1">Short answers. Real moments.</h1>
      <p className="lede">Your personal coach &mdash; tuned to your calendar, your workouts, and the next four hours in front of you.</p>

      <div className="grid-2" style={{ marginTop: 20, alignItems: "start" }}>
        {/* Chat */}
        <section className="card">
          <h2 className="h2">Ask the coach</h2>
          <div style={{ border: "1px solid var(--line)", borderRadius: 10, padding: 12, background: "#fafaf6", minHeight: 220, maxHeight: 380, overflowY: "auto" }}>
            {messages.map((m, i) => (
              <div key={i} style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, letterSpacing: ".1em", textTransform: "uppercase", color: m.role === "beat" ? "var(--coral)" : "var(--mute)", fontWeight: 700 }}>
                  {m.role === "beat" ? "BEAT" : "YOU"}
                </div>
                <div style={{ fontSize: 14 }} dangerouslySetInnerHTML={{ __html: m.text }} />
              </div>
            ))}
            {busy && <div className="muted" style={{ fontSize: 13 }}>Beat is thinking&hellip;</div>}
          </div>
          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="input"
              style={{ flex: 1 }}
              placeholder="What should I eat before a 5pm live hit?"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
            />
            <button className="btn" onClick={send} disabled={busy}>Send</button>
          </div>
        </section>

        {/* Lessons */}
        <section>
          <h2 className="h2">Short lessons, built for the road</h2>
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
