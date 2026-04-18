// Centralized env config. All Vite env vars must be prefixed with VITE_.
// Do NOT expose server-only secrets to the browser in production.

function read(key: string): string {
  const v = import.meta.env[key];
  return typeof v === "string" ? v : "";
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
    redirectUri: `${window.location.origin}/settings`,
    scope: "read,activity:read_all",
  },
  openai: {
    apiKey: read("VITE_OPENAI_API_KEY"),
    model: read("VITE_OPENAI_MODEL") || "gpt-4o-mini",
  },
};

export function isConfigured(section: keyof typeof config): boolean {
  const s = config[section] as Record<string, string>;
  return Object.values(s).some((v) => typeof v === "string" && v.length > 0 && !v.startsWith("http"));
}
