# Beat App Feature Overview

This document summarizes the current feature set of the Beat app and is designed to serve as source material for a slide deck presentation.

## Product Summary

Beat is a mobile-first nutrition and wellness assistant built for people with unpredictable, high-pressure schedules. The app helps users make better food, activity, and recovery decisions in real time by combining schedule context, nearby options, photo-based meal scanning, grocery planning, coaching, and workout tracking.

## Core Value Proposition

- Reduces decision fatigue around food and recovery
- Personalizes suggestions using schedule, activity, and environment
- Works both in live mode and demo mode
- Supports users on the road, at home, at the airport, or between events

## Main Features

## 1. Personalized Home Dashboard

The Home page acts as the daily control center for the user.

- Surfaces the user’s day at a glance
- Pulls calendar context from Google Calendar when connected
- Pulls recent email context from Gmail when connected
- Highlights timely recommendations based on what is coming next
- Gives the user a quick overview of schedule pressure, wellness signals, and activity

Presentation angle:
Beat starts with context, not generic advice. The app understands what the user’s day looks like before making recommendations.

## 2. Scene Scan: Local Food Discovery

Scene Scan helps users find realistic food options nearby when they are short on time.

- Uses the user’s current location when location access is enabled
- Falls back gracefully if geolocation is unavailable
- Searches nearby grocery stores, convenience stores, and restaurants
- Filters results based on how much time the user has available
- Uses Google Places data when configured
- Ranks stores by health relevance and convenience
- Generates three AI-recommended food picks for the selected location

Presentation angle:
Instead of telling users to “eat healthier,” Beat helps them choose the smartest option available within the time they actually have.

## 3. Meal Scan / Fridge Scan

Meal Scan helps users understand what they are eating and what to eat next.

- Lets the user upload a food photo
- Shows a stable image preview inside the upload card
- Estimates calories and macros from the uploaded image
- Generates three follow-up meal suggestions based on the scan
- Identifies missing ingredients for each suggestion
- Lets the user add missing ingredients directly to the grocery list

Presentation angle:
Beat turns a single meal photo into immediate nutrition insight plus practical next-step meal ideas.

## 4. Grocery List Management

The Groceries page turns recommendations into action.

- Stores grocery items in persistent local state
- Allows users to manually manage grocery items
- Accepts ingredient additions from Meal Scan
- Accepts grocery staples and missing ingredients from Coach meal suggestions
- Preserves grocery data across sessions

Presentation angle:
Beat does not stop at advice. It converts recommendations into a usable shopping workflow.

## 5. AI Coach

The Coach page is the app’s personalized nutrition planning and coaching experience.

- Collects user preferences such as goal, dietary style, allergies, dislikes, budget, available time, cooking access, and location context
- Generates three personalized meal options to choose from
- Makes clear that the outputs are alternatives, not a full-day meal plan
- Stores the latest generated meal options so they remain visible when the user switches tabs or returns later
- Allows users to refresh recommendations when preferences change
- Adds recommended ingredients or staples to the grocery list
- Includes short, engaging daily-style health facts and practical advice
- Supports conversational coaching through an AI chat interface

Presentation angle:
Beat behaves like an adaptive coach, not a static meal planner. It responds to constraints and keeps recommendations persistent and actionable.

## 6. Activity Tracking and Workout Awareness

The Activity page connects nutrition and recovery decisions to training load.

- Integrates with Strava
- Displays recent workouts and training summaries
- Supports manual workout logging
- Tracks multiple activity types such as running, riding, swimming, walking, and strength work
- Supports workout details such as distance, duration, calories, pace, heart rate, power, and splits when available
- Handles limited-permission Strava states more gracefully

Presentation angle:
Beat links food guidance to real physical output, making recommendations more relevant for active users.

## 7. Google Integration

Google services provide real-world context for recommendations.

- Google sign-in support
- Google Calendar integration
- Gmail integration
- Google Maps / Places integration for nearby store discovery
- Demo mode fallback when Google APIs are not configured

Presentation angle:
The app becomes smarter by understanding where the user is and what the user’s day looks like.

## 8. Strava Integration

Strava powers workout-aware personalization.

- Connects a user’s Strava account
- Reads activity history and training metrics
- Supports token refresh and reconnect flows
- Supports env-based bootstrap for local development
- Falls back safely when permissions are limited or tokens are invalid

Presentation angle:
Beat adapts nutrition and recovery recommendations to how the user is actually training, not just how they say they are training.

## 9. Multi-Provider AI Support

The app is designed to work with more than one LLM provider.

- Supports Anthropic API keys
- Supports OpenAI API keys
- Chooses the active provider dynamically at runtime
- Falls back to mock responses in demo mode

Presentation angle:
The architecture is flexible and developer-friendly, making the product easier to demo, extend, and maintain.

## 10. Demo Mode and Resilience

Beat is built to be usable even when live integrations are unavailable.

- Demo mode allows full product walkthrough without external API setup
- Mock data keeps every main page functional
- Fallback behavior exists for missing location access, missing API keys, and limited third-party permissions
- Persistent local storage preserves key user state across sessions

Presentation angle:
This makes Beat reliable for hackathon demos, user testing, onboarding, and staged rollout.

## Feature Highlights for a Slide Deck

If you need a concise feature slide, these are the strongest points to emphasize:

- Context-aware wellness assistant for busy, high-pressure users
- Real-time local food discovery based on time and location
- Photo-based meal scan with macro estimation
- Personalized AI meal planning with persistent recommendations
- Grocery list automation from meal and coach suggestions
- Workout-aware guidance through Strava integration
- Calendar- and inbox-aware daily decision support
- Dual-provider AI support with demo-safe fallbacks

## Suggested Slide Structure

If helpful, this document can map directly into a deck outline:

1. Problem: healthy decisions break down under time pressure
2. Solution: Beat as a real-time nutrition and recovery assistant
3. Daily dashboard and context awareness
4. Scene Scan for nearby food decisions
5. Meal Scan and grocery automation
6. AI Coach and personalized meal options
7. Activity and Strava integration
8. Technical flexibility: Google, Strava, OpenAI, Anthropic, demo mode
9. Why it matters: lower cognitive load, better consistency, more actionable wellness support

## Current Technical Foundation

The current implementation is a frontend application built with:

- React
- TypeScript
- Vite
- React Router
- Google OAuth
- Google Calendar / Gmail / Places integrations
- Strava integration
- Anthropic and OpenAI provider support

## Short One-Line Product Pitch

Beat is an AI-powered nutrition and recovery coach that helps busy users make smarter food and wellness decisions based on their schedule, location, meals, and activity.
