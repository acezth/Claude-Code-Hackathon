# Activity + Strava Integration Notes

This activity implementation is intentionally scoped to avoid merge conflicts:

- Shared layout and routing were left alone.
- The visual structure of `src/pages/Activity.tsx` stays close to the original page.
- Most of the new behavior lives in `src/services/strava.ts` and the shared activity types.

## What Beat now supports

- OAuth connection to Strava with persisted tokens in local storage
- Token refresh using `refresh_token`
- Athlete profile fetch
- Athlete stats fetch
- Recent activity sync
- Detail fetch per activity, including:
  - core metrics
  - laps
  - split metrics
  - zone distributions when Strava provides them
- Manual activity logging for:
  - running
  - biking
  - swimming
  - walking
  - weight lifting
  - other custom categories
- Rich weight lifting storage in Beat:
  - exercise name
  - sets
  - reps
  - weight
  - unit
- Manual sync back to Strava when the user granted `activity:write`

## Relevant Strava scopes

The app now requests:

- `read`
- `profile:read_all`
- `activity:read_all`
- `activity:write`

If teammates previously authenticated with a smaller scope set, they should disconnect and reconnect Strava so the browser token carries the new write scope.

## Relevant Strava endpoints used

- `POST /oauth/token`
- `GET /athlete`
- `GET /athletes/{id}/stats`
- `GET /athlete/activities`
- `GET /activities/{id}`
- `GET /activities/{id}/laps`
- `GET /activities/{id}/zones`
- `POST /activities`

## Important product limitation

Strava manual activities do not natively support a structured strength schema with per-exercise sets, reps, and weight. Beat stores that detail locally and syncs a summary activity to Strava with the lifting breakdown embedded in the description.

## Verification

Typecheck:

```bash
npm.cmd run typecheck
```

Targeted service tests:

```bash
node --experimental-strip-types src/services/strava.test.ts
```
