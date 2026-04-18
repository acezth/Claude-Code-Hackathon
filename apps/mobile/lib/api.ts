import { mockActivity, mockCoach, mockFridge, mockGroceryLists, mockIntegrations, mockNearby, mockProfile } from "@/lib/mock";
import type {
  ActivitySummary,
  CoachAdviceResponse,
  FridgeScanResponse,
  GroceryList,
  IntegrationStatus,
  NearbyFoodResponse,
  UserProfile,
} from "@/lib/types";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000/api";

async function fetchOrFallback<T>(path: string, fallback: T, init?: RequestInit): Promise<T> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
      },
      ...init,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch {
    return fallback;
  }
}

export function getNearbyRecommendations(): Promise<NearbyFoodResponse> {
  return fetchOrFallback(
    "/recommendations/nearby-food",
    mockNearby,
    {
      method: "POST",
      body: JSON.stringify({
        lat: 30.2672,
        lng: -97.7431,
        radius: 2000,
        current_time: new Date().toISOString(),
        goal: "more energy",
        next_event_minutes: 35,
      }),
    },
  );
}

export function analyzeFridge(): Promise<FridgeScanResponse> {
  return fetchOrFallback(
    "/fridge/analyze",
    mockFridge,
    {
      method: "POST",
      body: JSON.stringify({
        detected_ingredients: mockFridge.detected_ingredients,
        goal: "high protein",
      }),
    },
  );
}

export function getGroceryLists(): Promise<GroceryList[]> {
  return fetchOrFallback("/grocery-lists/", mockGroceryLists);
}

export function getActivity(): Promise<ActivitySummary> {
  return fetchOrFallback("/activity/", mockActivity);
}

export function getCoachAdvice(): Promise<CoachAdviceResponse> {
  return fetchOrFallback(
    "/coach/daily-advice",
    mockCoach,
    {
      method: "POST",
      body: JSON.stringify({
        goal: "more energy",
        next_event_minutes: 35,
        schedule_intensity: "heavy",
        recent_workout: true,
        travel_day: false,
      }),
    },
  );
}

export function getProfile(): Promise<UserProfile> {
  return fetchOrFallback("/user/profile", mockProfile);
}

export function getIntegrations(): Promise<IntegrationStatus[]> {
  return fetchOrFallback("/integrations/", mockIntegrations);
}
