/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_CLIENT_ID: string;
  readonly VITE_GOOGLE_API_KEY: string;
  readonly VITE_GOOGLE_MAPS_KEY: string;
  readonly VITE_STRAVA_CLIENT_ID: string;
  readonly VITE_STRAVA_CLIENT_SECRET: string;
  readonly VITE_STRAVA_ACCESS_TOKEN: string;
  readonly VITE_STRAVA_REFRESH_TOKEN: string;
  readonly VITE_STRAVA_TOKEN_EXPIRES_AT: string;
  readonly VITE_ANTHROPIC_API_KEY: string;
  readonly VITE_ANTHROPIC_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
