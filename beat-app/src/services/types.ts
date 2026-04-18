// Shared types used across services and pages.

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string;   // ISO
  location?: string;
  kind?: "live_hit" | "flight" | "meeting" | "filing" | "other";
}

export interface EmailSummary {
  id: string;
  from: string;
  subject: string;
  snippet: string;
  receivedAt: string;
}

export interface Store {
  id: string;
  name: string;
  kind: "grocery" | "convenience" | "restaurant";
  distanceMi: number;
  etaMin: number;      // walking or driving, whichever makes sense
  healthScore: number; // 0-10, aggregate of what's available here
  address?: string;
}

export interface FoodPick {
  id: string;
  storeId: string;
  title: string;
  why: string;
  tags: ("camera-safe" | "salt-heavy" | "cheap" | "fast" | "protein" | "fiber")[];
  priceUsd?: number;
  healthScore: number; // 0-10
}

export interface MealSuggestion {
  id: string;
  title: string;
  emoji: string;
  ingredients: string[]; // drawn from what Beat saw in the fridge
  missing: string[];     // add to grocery list
  minutes: number;
  calories?: number;
  why: string;
}

export interface GroceryItem {
  id: string;
  text: string;
  done: boolean;
  addedBy: "user" | "fridge-scan" | "coach";
}

export interface Workout {
  id: string;
  sport: "run" | "ride" | "swim" | "walk" | "weights" | "other";
  title: string;
  distanceKm?: number;
  movingSec: number;
  startedAt: string;
  calories?: number;
}

export interface Lesson {
  id: string;
  title: string;
  body: string;
  minutes: number;
  tag: "nutrition" | "sleep" | "travel" | "on-camera" | "mental";
}

export interface CoachReply {
  text: string;
  suggestions?: string[];
}
