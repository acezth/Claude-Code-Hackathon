// Shared types used across services and pages.

export interface CalendarEvent {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
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
  etaMin: number;
  healthScore: number;
  address?: string;
}

export interface FoodPick {
  id: string;
  storeId: string;
  title: string;
  why: string;
  tags: ("camera-safe" | "salt-heavy" | "cheap" | "fast" | "protein" | "fiber")[];
  priceUsd?: number;
  healthScore: number;
}

export interface MealSuggestion {
  id: string;
  title: string;
  emoji: string;
  ingredients: string[];
  missing: string[];
  minutes: number;
  calories?: number;
  why: string;
}

export interface MacroEstimate {
  item: string;
  visualDescription: string;
  serving: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: "low" | "medium" | "high";
  confidencePct: number;
  note: string;
}

export interface GroceryItem {
  id: string;
  text: string;
  done: boolean;
  addedBy: "user" | "fridge-scan" | "meal-scan" | "coach";
}

export type WorkoutSport = "run" | "ride" | "swim" | "walk" | "weights" | "other";

export type WorkoutSource = "strava" | "manual";

export interface StrengthExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  weight: number;
  unit: "lb" | "kg";
}

export interface WorkoutLap {
  id: string;
  name: string;
  elapsedSec: number;
  movingSec?: number;
  distanceKm?: number;
  elevationGainM?: number;
  averageSpeedKph?: number;
  averageHeartrate?: number;
  averageCadence?: number;
  averageWatts?: number;
  lapIndex?: number;
  split?: number;
}

export interface WorkoutZoneBucket {
  min?: number;
  max?: number;
  timeSec: number;
}

export interface WorkoutZone {
  type: "heartrate" | "power";
  score?: number;
  points?: number;
  max?: number;
  sensorBased?: boolean;
  customZones?: boolean;
  buckets: WorkoutZoneBucket[];
}

export interface WorkoutSplit {
  split: number;
  distanceKm?: number;
  elapsedSec?: number;
  movingSec?: number;
  elevationDifferenceM?: number;
  averageSpeedKph?: number;
  averageGradeAdjustedSpeedKph?: number;
  averageHeartrate?: number;
  paceSecPerKm?: number;
}

export interface Workout {
  id: string;
  source: WorkoutSource;
  sport: WorkoutSport;
  sportLabel: string;
  title: string;
  distanceKm?: number;
  movingSec: number;
  elapsedSec?: number;
  startedAt: string;
  startedAtLocal?: string;
  calories?: number;
  elevationGainM?: number;
  averageSpeedKph?: number;
  maxSpeedKph?: number;
  averageHeartrate?: number;
  maxHeartrate?: number;
  averageCadence?: number;
  averageWatts?: number;
  weightedAverageWatts?: number;
  kilojoules?: number;
  achievements?: number;
  kudos?: number;
  comments?: number;
  photoCount?: number;
  prCount?: number;
  deviceName?: string;
  gearName?: string;
  description?: string;
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  externalUrl?: string;
  rawSportType?: string;
  syncedToStrava?: boolean;
  stravaActivityId?: string;
  localOnly?: boolean;
  syncError?: string;
  exercises?: StrengthExercise[];
  laps?: WorkoutLap[];
  zones?: WorkoutZone[];
  splits?: WorkoutSplit[];
}

export interface AthleteGear {
  id: string;
  name: string;
  distanceKm?: number;
  primary?: boolean;
}

export interface AthleteProfile {
  id: string;
  firstName: string;
  lastName: string;
  city?: string;
  state?: string;
  country?: string;
  profileMedium?: string;
  profile?: string;
  followerCount?: number;
  friendCount?: number;
  measurementPreference?: string;
  weightKg?: number;
  ftp?: number | null;
  bikes: AthleteGear[];
  shoes: AthleteGear[];
}

export interface AthleteActivityTotal {
  count: number;
  distanceKm: number;
  movingSec: number;
  elapsedSec: number;
  elevationGainM: number;
  achievements: number;
}

export interface AthleteStats {
  biggestRideDistanceKm: number;
  biggestClimbElevationGainM: number;
  recentRideTotals: AthleteActivityTotal;
  recentRunTotals: AthleteActivityTotal;
  recentSwimTotals: AthleteActivityTotal;
  ytdRideTotals: AthleteActivityTotal;
  ytdRunTotals: AthleteActivityTotal;
  ytdSwimTotals: AthleteActivityTotal;
  allRideTotals: AthleteActivityTotal;
  allRunTotals: AthleteActivityTotal;
  allSwimTotals: AthleteActivityTotal;
}

export interface ActivityDashboard {
  connected: boolean;
  hasWriteAccess: boolean;
  athlete?: AthleteProfile;
  stats?: AthleteStats;
  workouts: Workout[];
  errors: string[];
}

export interface ManualActivityInput {
  category: WorkoutSport;
  customSportLabel?: string;
  title: string;
  startedAtLocal: string;
  durationMin: number;
  distanceKm?: number;
  calories?: number;
  description?: string;
  exercises?: StrengthExercise[];
  syncToStrava?: boolean;
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
