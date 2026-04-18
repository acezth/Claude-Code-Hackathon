# Home Nearby Map

This home-page change intentionally stays narrow to reduce merge conflict risk:

- The existing two-column home layout is unchanged.
- Only the left card on `src/pages/Home.tsx` was swapped from the Producer brief to a nearby Google Maps finder.
- The schedule, anchors, and recent activity sections were left alone.
- The Google-specific logic lives in `src/services/google.ts`, so teammates touching other pages should not be affected.

## What the card does

- Uses browser geolocation in the background to bias the search near the user
- Falls back to Midtown Manhattan when location is unavailable
- Lets the user switch between:
  - healthy restaurants
  - gym locations
- Uses Google Maps directly instead of calling Places search from Beat
- Keeps the card intentionally minimal:
  - category dropdown
  - open in Google Maps button

## Config

Add this to local env:

```env
VITE_GOOGLE_MAPS_KEY=...
```

The current home-page card only needs the standard Google Maps search URL handoff. It no longer embeds a Google map iframe and it no longer depends on Places API.

## Verification

Typecheck:

```bash
npm.cmd run typecheck
```

Targeted service tests:

```bash
node --experimental-strip-types src/services/google.test.ts
```
