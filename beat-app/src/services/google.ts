// Google APIs — Calendar, Gmail, Maps/Places.
//
// The AuthContext calls `setGoogleAccessToken` whenever the user signs in
// or out. The functions below use that token when it's present, and fall
// back to mock data when it isn't (so the app runs in demo mode).

import { config } from "../lib/config.ts";
import type { CalendarEvent, EmailSummary, Store } from "./types.ts";

// ---------- Token plumbing -------------------------------------------------

let accessToken: string | null = null;

export function setGoogleAccessToken(t: string | null): void {
  accessToken = t;
}

export function getGoogleAccessToken(): string | null {
  return accessToken;
}

export function isGoogleSignedIn(): boolean {
  // Any real OAuth flow sets a long access token. "demo-token" is the
  // marker our Login page uses for Demo Mode — we don't try to call real APIs with it.
  return accessToken !== null && accessToken !== "demo-token";
}

// Kept for backwards-compat with Settings.tsx. The real sign-in now
// lives on the Login page via @react-oauth/google's useGoogleLogin.
export async function signInWithGoogle(): Promise<void> {
  // No-op. Sign-in is performed on /login.
}
export function signOutGoogle(): void {
  accessToken = null;
}

// ---------- Calendar -------------------------------------------------------

export async function listTodaysEvents(): Promise<CalendarEvent[]> {
  if (!isGoogleSignedIn()) return MOCK_EVENTS;

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).toISOString();
  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59).toISOString();
  const url =
    `https://www.googleapis.com/calendar/v3/calendars/primary/events` +
    `?timeMin=${encodeURIComponent(startOfDay)}` +
    `&timeMax=${encodeURIComponent(endOfDay)}` +
    `&singleEvents=true&orderBy=startTime&maxResults=20`;

  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!res.ok) throw new Error(`Calendar API ${res.status}`);
    const data = (await res.json()) as { items?: GoogleEvent[] };
    return (data.items ?? []).map(toCalendarEvent);
  } catch (e) {
    console.warn("[google] calendar fetch failed, using mocks:", e);
    return MOCK_EVENTS;
  }
}

interface GoogleEvent {
  id: string;
  summary?: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
}

function toCalendarEvent(item: GoogleEvent): CalendarEvent {
  const summary = item.summary ?? "(no title)";
  return {
    id: item.id,
    title: summary,
    start: item.start.dateTime ?? item.start.date ?? new Date().toISOString(),
    end: item.end.dateTime ?? item.end.date ?? new Date().toISOString(),
    location: item.location,
    kind: inferKind(summary),
  };
}

function inferKind(title: string): CalendarEvent["kind"] {
  const t = title.toLowerCase();
  if (/(flight|redeye|red-eye|boarding)/.test(t)) return "flight";
  if (/(live|hit|on-air|on air|studio)/.test(t)) return "live_hit";
  if (/(file|filing|deadline)/.test(t)) return "filing";
  if (/(meeting|stand-up|standup|sync|call)/.test(t)) return "meeting";
  return "other";
}

// ---------- Gmail ----------------------------------------------------------

export async function listRecentEmails(max = 10): Promise<EmailSummary[]> {
  if (!isGoogleSignedIn()) return MOCK_EMAILS.slice(0, max);

  try {
    const listUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${max}&q=newer_than:1d`;
    const listRes = await fetch(listUrl, { headers: { Authorization: `Bearer ${accessToken}` } });
    if (!listRes.ok) throw new Error(`Gmail list ${listRes.status}`);
    const list = (await listRes.json()) as { messages?: { id: string }[] };

    const messages = await Promise.all(
      (list.messages ?? []).slice(0, max).map(async (m) => {
        const r = await fetch(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${m.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        return r.json();
      })
    );

    return messages.map((msg: any): EmailSummary => {
      const headers: { name: string; value: string }[] = msg.payload?.headers ?? [];
      const h = (k: string) => headers.find((x) => x.name.toLowerCase() === k.toLowerCase())?.value ?? "";
      return {
        id: msg.id,
        from: h("From"),
        subject: h("Subject") || "(no subject)",
        snippet: msg.snippet ?? "",
        receivedAt: new Date(Number(msg.internalDate ?? Date.now())).toISOString(),
      };
    });
  } catch (e) {
    console.warn("[google] gmail fetch failed, using mocks:", e);
    return MOCK_EMAILS.slice(0, max);
  }
}

// ---------- Maps / Places --------------------------------------------------

export interface NearbyQuery {
  lat: number;
  lng: number;
  maxMinutes?: number;
  kinds?: Store["kind"][];
}

export type WellnessFinderKind = "healthy_restaurant" | "gym";

export interface WellnessFinderQuery {
  lat: number;
  lng: number;
  category: WellnessFinderKind;
  maxResultCount?: number;
}

export interface WellnessPlace {
  id: string;
  name: string;
  category: WellnessFinderKind;
  address?: string;
  distanceMi: number;
  rating?: number;
  reviewCount?: number;
  openNow?: boolean;
  mapsUrl?: string;
  primaryType?: string;
  lat: number;
  lng: number;
}

interface GoogleLatLngLike {
  lat: number | (() => number);
  lng: number | (() => number);
}

interface GooglePlaceSearchResult {
  id?: string;
  displayName?: string | { text?: string };
  formattedAddress?: string;
  location?: GoogleLatLngLike;
  rating?: number;
  userRatingCount?: number;
  googleMapsURI?: string;
  googleMapsUri?: string;
  primaryType?: string;
  regularOpeningHours?: {
    openNow?: boolean;
  };
}

declare global {
  interface Window {
    google?: {
      maps?: {
        importLibrary?: (library: string) => Promise<Record<string, unknown>>;
        LatLng?: new (lat: number, lng: number) => unknown;
      };
    };
  }
}

let mapsPlacesPromise: Promise<void> | null = null;

export async function findNearbyStores(q: NearbyQuery): Promise<Store[]> {
  // TODO: Real Places API call (requires a separate Maps API key in config.google.mapsKey).
  //   POST https://places.googleapis.com/v1/places:searchNearby
  // Combined with the Distance Matrix API for ETAs.
  await new Promise((r) => setTimeout(r, 250));
  const kinds = q.kinds && q.kinds.length > 0 ? q.kinds : (["grocery", "convenience", "restaurant"] as Store["kind"][]);
  return MOCK_STORES
    .filter((s) => kinds.includes(s.kind))
    .filter((s) => (q.maxMinutes ? s.etaMin <= q.maxMinutes : true));
}

export async function findNearbyWellnessPlaces(q: WellnessFinderQuery): Promise<WellnessPlace[]> {
  await ensureGoogleMapsPlacesApi();

  const googleMaps = window.google?.maps;
  if (!googleMaps?.importLibrary) {
    throw new Error("Google Maps loaded, but the Places library is unavailable.");
  }

  const placesLibrary = (await googleMaps.importLibrary("places")) as {
    Place?: {
      searchNearby?: (request: Record<string, unknown>) => Promise<{
        places?: GooglePlaceSearchResult[];
      }>;
    };
    SearchNearbyRankPreference?: {
      DISTANCE?: string;
      POPULARITY?: string;
    };
  };

  const searchNearby = placesLibrary.Place?.searchNearby;
  if (!searchNearby) {
    throw new Error("Google Places Nearby Search is unavailable in this browser session.");
  }

  const center = googleMaps.LatLng ? new googleMaps.LatLng(q.lat, q.lng) : { lat: q.lat, lng: q.lng };
  const rankPreference = placesLibrary.SearchNearbyRankPreference?.DISTANCE ?? "DISTANCE";

  const response = await searchNearby({
    maxResultCount: q.maxResultCount ?? 6,
    includedPrimaryTypes: getWellnessPrimaryTypes(q.category),
    rankPreference,
    locationRestriction: {
      center,
      radius: getWellnessSearchRadiusMeters(q.category),
    },
    fields: [
      "id",
      "displayName",
      "formattedAddress",
      "location",
      "rating",
      "userRatingCount",
      "googleMapsURI",
      "primaryType",
      "regularOpeningHours",
    ],
  });

  return (response.places ?? [])
    .map((place) => normalizeWellnessPlace(place, q))
    .sort((a, b) => a.distanceMi - b.distanceMi);
}

export function buildWellnessTextQuery(category: WellnessFinderKind): string {
  return category === "gym" ? "gym" : "healthy restaurant";
}

export function buildWellnessMapsSearchQuery({
  lat,
  lng,
  category,
}: {
  lat: number;
  lng: number;
  category: WellnessFinderKind;
}): string {
  const location = `${lat.toFixed(4)},${lng.toFixed(4)}`;
  return `${labelForWellnessCategory(category)} near ${location}`;
}

export function getWellnessPrimaryTypes(category: WellnessFinderKind): string[] {
  if (category === "gym") {
    return ["gym", "fitness_center", "sports_club", "yoga_studio"];
  }

  return ["vegan_restaurant", "vegetarian_restaurant", "juice_shop", "mediterranean_restaurant", "restaurant"];
}

export function labelForWellnessCategory(category: WellnessFinderKind): string {
  return category === "gym" ? "Gym locations" : "Healthy restaurants";
}

export function buildWellnessMapEmbedUrl({
  apiKey = config.google.mapsKey,
  lat,
  lng,
  category,
  selectedPlace,
}: {
  apiKey?: string;
  lat: number;
  lng: number;
  category: WellnessFinderKind;
  selectedPlace?: Pick<WellnessPlace, "name" | "address">;
}): string {
  if (!apiKey) return "";

  const center = `${lat},${lng}`;
  const query = selectedPlace
    ? [selectedPlace.name, selectedPlace.address].filter(Boolean).join(", ")
    : buildWellnessMapsSearchQuery({ lat, lng, category });
  const mode = selectedPlace ? "place" : "search";

  return `https://www.google.com/maps/embed/v1/${mode}?key=${encodeURIComponent(apiKey)}&q=${encodeURIComponent(query)}&center=${encodeURIComponent(center)}&zoom=13`;
}

export function buildWellnessMapsUrl({
  lat,
  lng,
  category,
}: {
  lat: number;
  lng: number;
  category: WellnessFinderKind;
}): string {
  const query = buildWellnessMapsSearchQuery({ lat, lng, category });
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function normalizeWellnessPlace(
  place: GooglePlaceSearchResult,
  q: Pick<WellnessFinderQuery, "lat" | "lng" | "category">
): WellnessPlace {
  const normalizedLocation = normalizeLatLng(place.location);
  const name = readLocalizedText(place.displayName) || place.formattedAddress || "Nearby place";
  const address = place.formattedAddress;

  return {
    id: place.id || `${name}-${address ?? normalizedLocation.lat},${normalizedLocation.lng}`,
    name,
    category: q.category,
    address,
    distanceMi: roundToSingleDecimal(milesBetween(q.lat, q.lng, normalizedLocation.lat, normalizedLocation.lng)),
    rating: typeof place.rating === "number" ? place.rating : undefined,
    reviewCount: typeof place.userRatingCount === "number" ? place.userRatingCount : undefined,
    openNow: typeof place.regularOpeningHours?.openNow === "boolean" ? place.regularOpeningHours.openNow : undefined,
    mapsUrl: place.googleMapsURI ?? place.googleMapsUri,
    primaryType: place.primaryType,
    lat: normalizedLocation.lat,
    lng: normalizedLocation.lng,
  };
}

async function ensureGoogleMapsPlacesApi(): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Google Maps is only available in the browser.");
  }
  if (!config.google.mapsKey) {
    throw new Error("Google Maps is not configured. Add VITE_GOOGLE_MAPS_KEY to your local env.");
  }
  if (window.google?.maps?.importLibrary) return;
  if (mapsPlacesPromise) return mapsPlacesPromise;

  mapsPlacesPromise = new Promise<void>((resolve, reject) => {
    const finish = (): void => {
      if (window.google?.maps?.importLibrary) {
        resolve();
        return;
      }
      mapsPlacesPromise = null;
      reject(new Error("Google Maps loaded without the Places library."));
    };

    const fail = (): void => {
      mapsPlacesPromise = null;
      reject(new Error("Google Maps failed to load."));
    };

    const existingScript = document.querySelector<HTMLScriptElement>("script[data-beat-google-maps='true']");
    if (existingScript) {
      existingScript.addEventListener("load", finish, { once: true });
      existingScript.addEventListener("error", fail, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.google.mapsKey)}&v=weekly&loading=async&libraries=places`;
    script.async = true;
    script.defer = true;
    script.dataset.beatGoogleMaps = "true";
    script.addEventListener("load", finish, { once: true });
    script.addEventListener("error", fail, { once: true });
    document.head.appendChild(script);
  });

  return mapsPlacesPromise;
}

function normalizeLatLng(value: GoogleLatLngLike | undefined): { lat: number; lng: number } {
  const lat = typeof value?.lat === "function" ? value.lat() : value?.lat ?? 0;
  const lng = typeof value?.lng === "function" ? value.lng() : value?.lng ?? 0;
  return { lat, lng };
}

function getWellnessSearchRadiusMeters(category: WellnessFinderKind): number {
  return category === "gym" ? 12000 : 6000;
}

function readLocalizedText(value: GooglePlaceSearchResult["displayName"]): string {
  if (typeof value === "string") return value;
  return value?.text ?? "";
}

function milesBetween(startLat: number, startLng: number, endLat: number, endLng: number): number {
  const earthRadiusMi = 3958.8;
  const dLat = toRadians(endLat - startLat);
  const dLng = toRadians(endLng - startLng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(startLat)) * Math.cos(toRadians(endLat)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusMi * c;
}

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

function roundToSingleDecimal(value: number): number {
  return Math.round(value * 10) / 10;
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
  { id: "e1", from: "Desk <desk@bureau.com>", subject: "Rundown for 5pm",    snippet: "You lead the B-block. Need a 90-sec standup by 4:15.", receivedAt: iso(8, 15) },
  { id: "e2", from: "Producer",                subject: "Green room at 4:30", snippet: "New makeup artist — show up 15 early.",                 receivedAt: iso(10, 2) },
  { id: "e3", from: "Delta",                   subject: "Your flight tonight", snippet: "DL2147 ATL-LGA is on time.",                            receivedAt: iso(11, 45) },
];

const MOCK_STORES: Store[] = [
  { id: "s1", name: "Whole Foods Market", kind: "grocery",     distanceMi: 0.4, etaMin: 8,  healthScore: 9.2, address: "500 Main St" },
  { id: "s2", name: "CVS",                kind: "convenience", distanceMi: 0.1, etaMin: 2,  healthScore: 5.4, address: "120 Main St" },
  { id: "s3", name: "Sweetgreen",         kind: "restaurant",  distanceMi: 0.3, etaMin: 6,  healthScore: 8.6, address: "230 Main St" },
  { id: "s4", name: "Phillips 66",        kind: "convenience", distanceMi: 0.6, etaMin: 3,  healthScore: 4.1, address: "I-40 Exit 157" },
  { id: "s5", name: "Chipotle",           kind: "restaurant",  distanceMi: 0.5, etaMin: 10, healthScore: 7.3, address: "88 Elm" },
];
