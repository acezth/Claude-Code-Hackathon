# RoamWell Architecture

## Product Slice

RoamWell is organized around one central question: "What is the healthiest realistic next move right now?" The MVP turns that into a few connected systems:

1. Location-aware nearby food ranking
2. Schedule-aware coaching
3. Fridge ingredients to meal suggestions
4. Grocery list generation
5. Activity tracking and Strava-ready sync

## Frontend

The mobile app uses Expo Router with a tab layout so each hackathon owner can move independently:

- `app/(tabs)/index.tsx`: home summary and primary CTA
- `app/(tabs)/nearby.tsx`: ranked food recommendations
- `app/(tabs)/fridge.tsx`: ingredients and meal ideas
- `app/(tabs)/grocery.tsx`: grouped grocery list
- `app/(tabs)/activity.tsx`: workouts and summary
- `app/(tabs)/coach.tsx`: coaching content
- `app/(tabs)/profile.tsx`: preferences and linked services

Shared presentation pieces live in `components/`, and `lib/api.ts` is the single place where API calls and demo fallbacks are defined.

## Backend

The backend is split into three layers:

- `schemas/`: Pydantic request and response models
- `services/`: domain logic for scoring, coaching, fridge analysis, and activity summaries
- `routers/`: HTTP endpoints

This keeps the MVP easy to demo while still making it simple to replace demo logic with production integrations later.

## Current Tradeoffs

- Persistence is in-memory for hackathon speed.
- Auth is demo-token based.
- Integrations are represented as stable APIs but not yet wired to external providers.
- Fridge analysis accepts detected ingredients now; image upload and model vision can slot into the same endpoint later.

## Suggested Next Steps

1. Replace in-memory store with PostgreSQL and SQLAlchemy.
2. Add Supabase Auth or Firebase Auth for production sign-in.
3. Wire Google Calendar, Gmail, Places, and Strava into the existing integration routes.
4. Swap coaching heuristics for OpenAI structured outputs.
5. Add camera upload, object storage, and image analysis pipeline for fridge scans.
