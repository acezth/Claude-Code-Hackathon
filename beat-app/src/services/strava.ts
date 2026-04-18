// Strava API — activity history for the "Your Activity" page.
//
// Auth flow (Strava uses OAuth 2):
//   1. Redirect the user to
//      https://www.strava.com/oauth/authorize?client_id=...&redirect_uri=...&response_type=code&scope=read,activity:read_all
//   2. Strava redirects back with ?code=...
//   3. Exchange the code for an access token at /oauth/token
//      (this step should ideally happen on a server to keep the client_secret safe).
//   4. Call the API with Bearer <access_token>.
//
// This stub returns mock workouts so the UI renders without a real connection.

import type { Workout } from "./types";
import { config } from "@/lib/config";

let accessToken: string | null = null;

export function buildStravaAuthUrl(): string {
  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: config.strava.redirectUri,
    response_type: "code",
    approval_prompt: "auto",
    scope: config.strava.scope,
  });
  return `https://www.strava.com/oauth/authorize?${params.toString()}`;
}

export async function exchangeStravaCode(code: string): Promise<void> {
  // TODO: POST to https://www.strava.com/oauth/token with client_id,
  // client_secret, code, grant_type=authorization_code.
  // Prefer a server proxy. Never ship client_secret to production.
  void code;
  accessToken = "mock-strava-token";
}

export function isStravaConnected(): boolean {
  return accessToken !== null;
}

export function disconnectStrava(): void {
  accessToken = null;
}

export async function listRecentWorkouts(max = 10): Promise<Workout[]> {
  // TODO: GET https://www.strava.com/api/v3/athlete/activities?per_page=...
  await new Promise((r) => setTimeout(r, 250));
  return MOCK_WORKOUTS.slice(0, max);
}

// ---------- mocks ----------------------------------------------------------

const MOCK_WORKOUTS: Workout[] = [
  { id: "w1", sport: "run",     title: "Shakeout along the river",  distanceKm: 5.1, movingSec: 29 * 60, startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),  calories: 410 },
  { id: "w2", sport: "walk",    title: "Hotel hallway + block",     distanceKm: 1.2, movingSec: 14 * 60, startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),  calories: 90 },
  { id: "w3", sport: "weights", title: "Hotel gym — upper",                          movingSec: 38 * 60, startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),  calories: 240 },
  { id: "w4", sport: "ride",    title: "Rental bike along Peachtree", distanceKm: 14.4, movingSec: 46 * 60, startedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),calories: 520 },
];
