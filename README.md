# RoamWell

RoamWell is a mobile-first health assistant for people with unpredictable schedules, travel-heavy days, and messy meal timing. This repo now contains a hackathon-ready starter with an Expo mobile app and a FastAPI backend shaped around the MVP flows:

- nearby healthy food recommendations
- schedule-aware coaching
- fridge scan to meal suggestions
- grocery list management
- activity dashboard with Strava-ready structure
- profile and linked integrations

## Repo Layout

```text
apps/
  api/      FastAPI backend with typed schemas and demo data
  mobile/   Expo Router app with MVP screens and API client
docs/
  architecture.md
```

## Backend

Location: `apps/api`

Endpoints included:

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `GET /api/user/profile`
- `PATCH /api/user/profile`
- `GET /api/integrations/`
- `GET /api/integrations/{provider}/connect`
- `POST /api/integrations/{provider}/sync`
- `POST /api/recommendations/nearby-food`
- `POST /api/fridge/analyze`
- `GET /api/grocery-lists/`
- `POST /api/grocery-lists/`
- `POST /api/grocery-lists/{id}/items`
- `PATCH /api/grocery-lists/{id}/items/{item_id}`
- `DELETE /api/grocery-lists/{id}/items/{item_id}`
- `POST /api/grocery-lists/from-meal`
- `GET /api/activity/`
- `POST /api/activity/manual`
- `POST /api/activity/strava-sync`
- `POST /api/coach/daily-advice`
- `POST /api/coach/meal-advice`
- `POST /api/coach/habit-tip`

Run it with:

```bash
cd apps/api
uvicorn app.main:app --reload
```

## Mobile

Location: `apps/mobile`

The Expo app includes tabbed screens for:

- Home
- Nearby
- Fridge
- Grocery
- Activity
- Coach
- Profile

The mobile client tries the backend first and falls back to local seeded demo data if the API is unavailable. Set `EXPO_PUBLIC_API_BASE_URL` if your backend is not on `http://127.0.0.1:8000/api`.

Run it with:

```bash
cd apps/mobile
npm install
npx expo start
```

## Hackathon Notes

- Current integrations are mocked behind stable endpoint shapes so the team can swap in Google, Gmail, Places, Strava, and OpenAI without redesigning the app.
- The backend uses in-memory seed data right now for speed. PostgreSQL, auth persistence, and OAuth token storage are the next production steps.
- Recommendation logic is explicit and weighted so it is easy to demo and tune.
