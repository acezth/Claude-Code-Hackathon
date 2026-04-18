// Google APIs — Calendar, Gmail, Maps/Places.
//
// This file is intentionally thin. It exposes the functions the UI
// needs and stubs them with mock data so the app runs end-to-end
// before any real OAuth is wired up.
//
// When you're ready, replace the mock bodies with real calls using
// the official Google JS client (https://github.com/google/google-api-javascript-client)
// or direct fetch() against the REST endpoints with an OAuth access token.

import type { CalendarEvent, EmailSummary, Store } from "./types";
import { config } from "@/lib/config";

// ---------- OAuth (stubs) --------------------------------------------------

let accessToken: string | null = null;

export async function signInWithGoogle(): Promise<void> {
  // TODO: Use Google Identity Services (GIS) popup flow.
  // Example sketch (requires the gsi client script loaded):
  //
  //   const tokenClient = google.accounts.oauth2.initTokenClient({
  //     client_id: config.google.clientId,
  //     scope: config.google.scopes,
  //     callback: (resp) => { accessToken = resp.access_token; },
  //   });
  //   tokenClient.requestAccessToken();
  //
  // For now we just pretend.
  accessToken = "mock-token";
  await new Promise((r) => setTimeout(r, 300));
}

export function isGoogleSignedIn(): boolean {
  return accessToken !== null;
}

export function signOutGoogle(): void {
  accessToken = null;
}

// ---------- Calendar -------------------------------------------------------

export async function listTodaysEvents(): Promise<CalendarEvent[]> {
  // TODO: Call https://www.googleapis.com/calendar/v3/calendars/primary/events
  //       with timeMin = today 00:00, timeMax = today 23:59.
  if (!isGoogleSignedIn()) return MOCK_EVENTS;
  return MOCK_EVENTS;
}

// ---------- Gmail ----------------------------------------------------------

export async function listRecentEmails(max = 10): Promise<EmailSummary[]> {
  // TODO: gmail.users.messages.list + batch get for headers + snippet.
  if (!isGoogleSignedIn()) return MOCK_EMAILS.slice(0, max);
  return MOCK_EMAILS.slice(0, max);
}

// ---------- Maps / Places --------------------------------------------------

export interface NearbyQuery {
  lat: number;
  lng: number;
  maxMinutes?: number; // filter: show only stores reachable in <= this many minutes
  kinds?: Store["kind"][];
}

export async function findNearbyStores(q: NearbyQuery): Promise<Store[]> {
  // TODO: Places API Nearby Search
  //   GET https://places.googleapis.com/v1/places:searchNearby
  // combined with the Distance Matrix API to compute ETAs.
  //
  // For walking ETAs, use mode=walking; for driving, mode=driving.
  // Filter results to the `maxMinutes` the user has available.
  //
  // Health score: aggregate your own heuristic on top of place_type
  // + optional OpenAI pass that reads the menu / top product list.
  await new Promise((r) => setTimeout(r, 250));
  const kinds = q.kinds && q.kinds.length > 0 ? q.kinds : (["grocery", "convenience", "restaurant"] as Store["kind"][]);
  return MOCK_STORES
    .filter((s) => kinds.includes(s.kind))
    .filter((s) => (q.maxMinutes ? s.etaMin <= q.maxMinutes : true));
}

// ---------- mocks ----------------------------------------------------------

const today = new Date();
function iso(hours: number, mins = 0): string {
  const d = new Date(today);
  d.setHours(hours, mins, 0, 0);
  return d.toISOString();
}

const MOCK_EVENTS: CalendarEvent[] = [
  { id: "1", title: "Morning stand-up",    start: iso(9, 0),  end: iso(9, 30),  kind: "meeting" },
  { id: "2", title: "Filing: Ohio piece",  start: iso(13, 0), end: iso(14, 30), kind: "filing" },
  { id: "3", title: "Live hit — 5pm bloc", start: iso(17, 0), end: iso(17, 15), kind: "live_hit", location: "Bureau studio B" },
  { id: "4", title: "Red-eye ATL → LGA",   start: iso(22, 40), end: iso(24, 0), kind: "flight", location: "ATL" },
];

const MOCK_EMAILS: EmailSummary[] = [
  { id: "e1", from: "Desk <desk@bureau.com>", subject: "Rundown for 5pm",       snippet: "You lead the B-block. Need a 90-sec standup by 4:15.", receivedAt: iso(8, 15) },
  { id: "e2", from: "Producer",                subject: "Green room at 4:30",    snippet: "New makeup artist — show up 15 early.",                 receivedAt: iso(10, 2) },
  { id: "e3", from: "Delta",                   subject: "Your flight tonight",    snippet: "DL2147 ATL-LGA is on time.",                             receivedAt: iso(11, 45) },
];

const MOCK_STORES: Store[] = [
  { id: "s1", name: "Whole Foods Market",    kind: "grocery",     distanceMi: 0.4, etaMin: 8,  healthScore: 9.2, address: "500 Main St" },
  { id: "s2", name: "CVS",                   kind: "convenience", distanceMi: 0.1, etaMin: 2,  healthScore: 5.4, address: "120 Main St" },
  { id: "s3", name: "Sweetgreen",            kind: "restaurant",  distanceMi: 0.3, etaMin: 6,  healthScore: 8.6, address: "230 Main St" },
  { id: "s4", name: "Phillips 66",           kind: "convenience", distanceMi: 0.6, etaMin: 3,  healthScore: 4.1, address: "I-40 Exit 157" },
  { id: "s5", name: "Chipotle",              kind: "restaurant",  distanceMi: 0.5, etaMin: 10, healthScore: 7.3, address: "88 Elm" },
];
