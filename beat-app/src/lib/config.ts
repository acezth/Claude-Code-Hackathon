// Centralized env config. All Vite env vars must be prefixed with VITE_.
// Do NOT expose server-only secrets to the browser in production.

function read(key: string): string {
  const env = typeof import.meta !== "undefined" && typeof import.meta.env === "object"
    ? (import.meta.env as Record<string, unknown>)
    : {};
  const v = env[key];
  return typeof v === "string" ? v : "";
}

function currentOrigin(): string {
  return typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
}

export const config = {
  google: {
    clientId: read("VITE_GOOGLE_CLIENT_ID"),
    apiKey: read("VITE_GOOGLE_API_KEY"),
    mapsKey: read("VITE_GOOGLE_MAPS_KEY"),
    scopes: [
      "https://www.googleapis.com/auth/calendar.readonly",
      "https://www.googleapis.com/auth/gmail.readonly",
    ].join(" "),
  },
  strava: {
    clientId: read("VITE_STRAVA_CLIENT_ID"),
    clientSecret: read("VITE_STRAVA_CLIENT_SECRET"),
    accessToken: read("VITE_STRAVA_ACCESS_TOKEN"),
    refreshToken: read("VITE_STRAVA_REFRESH_TOKEN"),
    tokenExpiresAt: read("VITE_STRAVA_TOKEN_EXPIRES_AT"),
    redirectUri: `${currentOrigin()}/settings`,
    scope: "read,profile:read_all,activity:read_all,activity:write",
  },
  openai: {
    apiKey: read("VITE_OPENAI_API_KEY"),
    model: read("VITE_OPENAI_MODEL") || "gpt-4o-mini",
  },
  anthropic: {
    apiKey: read("VITE_ANTHROPIC_API_KEY"),
    model: read("VITE_ANTHROPIC_MODEL") || "claude-3-5-sonnet-latest",
  },
};

export function isConfigured(section: keyof typeof config): boolean {
  const s = config[section] as Record<string, string>;
  return Object.values(s).some((v) => typeof v === "string" && v.length > 0 && !v.startsWith("http"));
}
