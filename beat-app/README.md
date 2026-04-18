# Beat — frontend template

A **React + TypeScript + Vite** scaffold for the Beat product: a nutrition
coach built for national correspondents on the road. This is a starter
you can build off of — every page renders with mock data, and every API
integration is stubbed in `src/services/` with a clear TODO.

## Quick start

```bash
cd beat-app
npm install
cp .env.example .env.local   # then fill in keys (optional — the app runs without them)
npm run dev
```

Open <http://localhost:5173>. You'll be routed to `/login`. Click
**"Continue in demo mode"** to see every page rendered with mock data,
or set a Google Client ID (below) and click **"Continue with Google"**
to pull your real calendar + inbox into the Home page.

## Sign-in & auth

Beat uses [Google Identity Services](https://developers.google.com/identity)
via the [`@react-oauth/google`](https://github.com/MomenSherif/react-oauth) library.

- **One click = identity + data scopes.** The "Continue with Google"
  button asks for profile + `calendar.readonly` + `gmail.readonly` in
  a single consent screen, so users don't see a second "connect your
  calendar" step.
- **Auth state** lives in `src/contexts/AuthContext.tsx` and is
  persisted to `localStorage` under the `beat.auth` key. The
  context calls `setGoogleAccessToken(...)` on every change, which is
  what `src/services/google.ts` reads when it fires real API calls.
- **Route guard:** `src/components/RequireAuth.tsx` wraps every
  authenticated route. Unauthed visitors get bounced to `/login` with
  the original path stashed in history state, so sign-in returns them
  to the page they wanted.
- **Demo mode:** the Login page has a "Continue in demo mode" button
  that stores a fake user and a sentinel token (`"demo-token"`).
  `isGoogleSignedIn()` treats that sentinel as not-signed-in, so all
  services fall back to mocks. Useful for UI work without hitting a
  quota.

### Setting up your Google OAuth Client ID

1. Go to <https://console.cloud.google.com/apis/credentials>.
2. Create a project if you don't have one. Then **Enable APIs**: Google Calendar API, Gmail API, Places API, Maps JavaScript API.
3. **Configure consent screen** → External → fill in app name, your email, add `../auth/calendar.readonly` and `../auth/gmail.readonly` scopes, add yourself as a test user.
4. **Create credentials → OAuth 2.0 Client ID → Web application.**
5. Under **Authorized JavaScript origins**, add:
   - `http://localhost:5173`
   - (and whatever you'll deploy to, e.g. `https://beat.yourdomain.com`)
6. Copy the Client ID and paste it into `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=123456789-abcdefg.apps.googleusercontent.com
   ```
7. Restart `npm run dev` (Vite only picks up env changes at boot).

Until you do this the Login page shows an inline notice and only the
demo-mode button is active — the rest of the app still works against
mock data.

## What's in here

```
beat-app/
├── src/
│   ├── App.tsx              # router — /login is public, everything else is wrapped in RequireAuth
│   ├── main.tsx             # <GoogleOAuthProvider> + <AuthProvider> + <BrowserRouter>
│   ├── components/
│   │   ├── Layout.tsx       # sidebar + main shell + user chip + sign-out
│   │   └── RequireAuth.tsx  # route guard — bounces unauthed users to /login
│   ├── contexts/
│   │   └── AuthContext.tsx  # user + accessToken state, persisted to localStorage
│   ├── pages/
│   │   ├── Login.tsx        # Google sign-in + demo mode
│   │   ├── Home.tsx         # Today — producer brief, schedule, anchors, recent activity
│   │   ├── SceneScan.tsx    # nearby stores filtered by time + AI picks per store
│   │   ├── FridgeScan.tsx   # photo upload → AI meal suggestions → add missing to groceries
│   │   ├── Groceries.tsx    # checklist, persisted in localStorage, auto-fed by FridgeScan
│   │   ├── Activity.tsx     # Strava workouts, weekly stats, manual log
│   │   ├── Coach.tsx        # AI chat + short lesson feed
│   │   └── Settings.tsx     # API connection toggles + env status
│   ├── services/
│   │   ├── google.ts        # real calendar + gmail calls; places stub; token plumbing
│   │   ├── strava.ts        # oauth URL builder + activities stub
│   │   ├── openai.ts        # picks, fridge vision, coach Q&A stubs
│   │   └── types.ts         # shared TS types
│   └── lib/config.ts        # env var reader
└── .env.example
```

## APIs to wire up

Everything below has a working mock and a clearly marked `// TODO:` in the
service file. Swap the mocks for real calls when you're ready.

### Google — Calendar, Gmail, Maps / Places
- **Where:** `src/services/google.ts`
- **What's stubbed:** `signInWithGoogle`, `listTodaysEvents`, `listRecentEmails`, `findNearbyStores`
- **You need:** Client ID from <https://console.cloud.google.com/apis/credentials>, enable Calendar API, Gmail API, Places API, Maps JavaScript API.
- **Auth:** Google Identity Services popup flow — see the comment block in `signInWithGoogle()`.
- **Hint:** For nearby stores, combine `places:searchNearby` (find candidates) with the Distance Matrix API (compute ETA). Filter to the `maxMinutes` the user has available.

### Strava
- **Where:** `src/services/strava.ts`
- **What's stubbed:** `buildStravaAuthUrl`, `exchangeStravaCode`, `listRecentWorkouts`
- **You need:** App at <https://www.strava.com/settings/api>. Register the redirect URI as `http://localhost:5173/settings`.
- **Auth flow:** redirect to `/oauth/authorize` → Strava redirects back with `?code=...` to `/settings` → the Settings page auto-exchanges the code.
- **Security note:** the token exchange should ideally happen on a server so `client_secret` never reaches the browser.

### OpenAI
- **Where:** `src/services/openai.ts`
- **What's stubbed:** `suggestStorePicks`, `suggestMealsFromFridge`, `askCoach`
- **You need:** API key from <https://platform.openai.com/api-keys>, set `VITE_OPENAI_API_KEY`.
- **Model:** defaults to `gpt-4o-mini` (fast + cheap). Change with `VITE_OPENAI_MODEL`.
- **Vision:** `suggestMealsFromFridge` has a TODO showing how to wire the vision model with a base64 data URL.
- **Production:** move the key to a server proxy. Don't ship a browser bundle with your key.

## Where the features map to code

| Feature you mentioned | Page | Service |
|---|---|---|
| Connect Google Calendar | `Home.tsx` + `Settings.tsx` | `services/google.ts#listTodaysEvents` |
| Connect Gmail | `Settings.tsx` | `services/google.ts#listRecentEmails` |
| Healthiest food at nearby stores, filtered by time / store type | `SceneScan.tsx` | `services/google.ts#findNearbyStores` + `services/openai.ts#suggestStorePicks` |
| Take picture of fridge, AI suggests meals | `FridgeScan.tsx` | `services/openai.ts#suggestMealsFromFridge` |
| Grocery list | `Groceries.tsx` | `localStorage` (auto-populated by FridgeScan) |
| Personal coach teaching healthy habits | `Coach.tsx` | Static `LESSONS[]` + `services/openai.ts#askCoach` |
| Your Activity page with Strava | `Activity.tsx` | `services/strava.ts#listRecentWorkouts` |
| Personalized advice from calendar context | `Home.tsx`, `Coach.tsx` | `askCoach({events, workouts})` passes context into the prompt |

## Design notes

Visual language inherits the Beat brand from the pitch deck: ink navy (`#0F2A47`),
coral accent (`#FF5A36`), cream background (`#F7F1E8`), Georgia serif for headings,
system sans for body. Tokens live at the top of `src/styles.css`.

The tone in the copy is intentionally **direct and imperative** ("eat now,
nothing after 4") because the core insight of the product is that the
enemy isn't calories, it's cognitive load.

## Scripts

```bash
npm run dev         # Vite dev server on :5173
npm run build       # typecheck + production build into dist/
npm run preview     # serve the production build
npm run typecheck   # tsc --noEmit
```

## Next steps

1. `npm install` and confirm `npm run dev` renders the Home page with mock data.
2. Pick one integration to go end-to-end first — I'd recommend **Google Calendar** (fastest win — Home page starts pulling the real schedule immediately).
3. Then OpenAI for Scene Scan picks (that's the "wow" feature).
4. Strava and fridge vision last — they're net-new content surfaces.

Happy building.
