import { config } from "../lib/config.ts";
import type {
  ActivityDashboard,
  AthleteActivityTotal,
  AthleteProfile,
  AthleteStats,
  ManualActivityInput,
  StrengthExercise,
  Workout,
  WorkoutLap,
  WorkoutSource,
  WorkoutSplit,
  WorkoutSport,
  WorkoutZone
} from "./types.ts";

const STRAVA_BASE_URL = "https://www.strava.com/api/v3";
const STRAVA_AUTH_URL = "https://www.strava.com/oauth/authorize";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";
const STORAGE_TOKEN_KEY = "beat.strava.token";
const STORAGE_MANUAL_KEY = "beat.activity.manual";
const STORAGE_ENV_DISABLED_KEY = "beat.strava.env.disabled";

interface StoredStravaToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  scopes: string[];
  athleteId?: string;
}

interface TokenExchangeResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  expires_in: number;
  athlete?: {
    id?: number;
  };
}

interface SummaryAthletePayload {
  id?: number;
  firstname?: string;
  lastname?: string;
  city?: string;
  state?: string;
  country?: string;
  profile_medium?: string;
  profile?: string;
  follower_count?: number;
  friend_count?: number;
  measurement_preference?: string;
  ftp?: number | null;
  weight?: number;
  bikes?: GearPayload[];
  shoes?: GearPayload[];
}

interface GearPayload {
  id?: string;
  name?: string;
  primary?: boolean;
  distance?: number;
}

interface ActivityTotalPayload {
  count?: number;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  elevation_gain?: number;
  achievement_count?: number;
}

interface AthleteStatsPayload {
  biggest_ride_distance?: number;
  biggest_climb_elevation_gain?: number;
  recent_ride_totals?: ActivityTotalPayload;
  recent_run_totals?: ActivityTotalPayload;
  recent_swim_totals?: ActivityTotalPayload;
  ytd_ride_totals?: ActivityTotalPayload;
  ytd_run_totals?: ActivityTotalPayload;
  ytd_swim_totals?: ActivityTotalPayload;
  all_ride_totals?: ActivityTotalPayload;
  all_run_totals?: ActivityTotalPayload;
  all_swim_totals?: ActivityTotalPayload;
}

interface SummaryGearPayload {
  id?: string;
  name?: string;
}

interface SplitPayload {
  split?: number;
  distance?: number;
  elapsed_time?: number;
  moving_time?: number;
  elevation_difference?: number;
  average_speed?: number;
  average_grade_adjusted_speed?: number;
  average_heartrate?: number;
  pace_zone?: number;
}

interface BucketPayload {
  min?: number;
  max?: number;
  time?: number;
}

interface ActivityZonePayload {
  type?: "heartrate" | "power";
  score?: number;
  points?: number;
  max?: number;
  sensor_based?: boolean;
  custom_zones?: boolean;
  distribution_buckets?: BucketPayload[];
}

interface LapPayload {
  id?: number;
  name?: string;
  elapsed_time?: number;
  moving_time?: number;
  start_date?: string;
  distance?: number;
  total_elevation_gain?: number;
  average_speed?: number;
  average_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  lap_index?: number;
  split?: number;
}

interface ActivityPayload {
  id?: number;
  name?: string;
  type?: string;
  sport_type?: string;
  distance?: number;
  moving_time?: number;
  elapsed_time?: number;
  total_elevation_gain?: number;
  start_date?: string;
  start_date_local?: string;
  timezone?: string;
  calories?: number;
  average_speed?: number;
  max_speed?: number;
  average_heartrate?: number;
  max_heartrate?: number;
  average_cadence?: number;
  average_watts?: number;
  weighted_average_watts?: number;
  kilojoules?: number;
  achievement_count?: number;
  kudos_count?: number;
  comment_count?: number;
  photo_count?: number;
  pr_count?: number;
  device_name?: string;
  trainer?: boolean;
  commute?: boolean;
  manual?: boolean;
  private?: boolean;
  description?: string;
  gear?: SummaryGearPayload;
  gear_id?: string;
  splits_metric?: SplitPayload[];
  splits_standard?: SplitPayload[];
}

interface ManualWorkoutRecord extends Workout {
  localId: string;
}

const MOCK_WORKOUTS: Workout[] = [
  {
    id: "mock-run-1",
    source: "manual",
    sport: "run",
    sportLabel: "Run",
    title: "Shakeout along the river",
    distanceKm: 5.1,
    movingSec: 29 * 60,
    elapsedSec: 29 * 60,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    calories: 410,
    localOnly: true
  },
  {
    id: "mock-walk-1",
    source: "manual",
    sport: "walk",
    sportLabel: "Walk",
    title: "Hotel hallway plus block",
    distanceKm: 1.2,
    movingSec: 14 * 60,
    elapsedSec: 14 * 60,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    calories: 90,
    localOnly: true
  },
  {
    id: "mock-weights-1",
    source: "manual",
    sport: "weights",
    sportLabel: "Weight Training",
    title: "Hotel gym upper body",
    movingSec: 38 * 60,
    elapsedSec: 38 * 60,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    calories: 240,
    exercises: [
      { id: "mock-ex-1", name: "Dumbbell bench press", sets: 3, reps: 10, weight: 50, unit: "lb" },
      { id: "mock-ex-2", name: "Seated row", sets: 3, reps: 12, weight: 100, unit: "lb" }
    ],
    localOnly: true
  },
  {
    id: "mock-ride-1",
    source: "manual",
    sport: "ride",
    sportLabel: "Ride",
    title: "Rental bike around downtown",
    distanceKm: 14.4,
    movingSec: 46 * 60,
    elapsedSec: 46 * 60,
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    calories: 520,
    localOnly: true
  }
];

const SPORT_LABELS: Record<string, string> = {
  Run: "Run",
  TrailRun: "Trail Run",
  Walk: "Walk",
  Hike: "Hike",
  Ride: "Ride",
  GravelRide: "Gravel Ride",
  MountainBikeRide: "Mountain Bike Ride",
  EBikeRide: "E-Bike Ride",
  EMountainBikeRide: "E-Mountain Bike Ride",
  Swim: "Swim",
  WeightTraining: "Weight Training",
  Crossfit: "CrossFit",
  Yoga: "Yoga",
  Workout: "Workout"
};

function hasWindow(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function makeId(prefix: string): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function readJson<T>(key: string, fallback: T): T {
  if (!hasWindow()) {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.setItem(key, JSON.stringify(value));
}

function clearStoredValue(key: string): void {
  if (!hasWindow()) {
    return;
  }

  window.localStorage.removeItem(key);
}

function isEnvBootstrapDisabled(): boolean {
  return readJson<boolean>(STORAGE_ENV_DISABLED_KEY, false);
}

function setEnvBootstrapDisabled(value: boolean): void {
  writeJson(STORAGE_ENV_DISABLED_KEY, value);
}

function readEnvBootstrapToken(): StoredStravaToken | null {
  if (!config.strava.accessToken || isEnvBootstrapDisabled()) {
    return null;
  }

  const expiresAt = Number(config.strava.tokenExpiresAt);

  return {
    accessToken: config.strava.accessToken.trim(),
    refreshToken: config.strava.refreshToken.trim(),
    expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : 0,
    scopes: config.strava.scope.split(",").map((scope) => scope.trim()).filter(Boolean),
    athleteId: undefined
  };
}

function getStoredToken(): StoredStravaToken | null {
  const stored = readJson<StoredStravaToken | null>(STORAGE_TOKEN_KEY, null);
  if (stored) {
    return stored;
  }

  const bootstrapped = readEnvBootstrapToken();
  if (bootstrapped) {
    saveToken(bootstrapped);
    return bootstrapped;
  }

  return null;
}

function saveToken(token: StoredStravaToken): void {
  setEnvBootstrapDisabled(false);
  writeJson(STORAGE_TOKEN_KEY, token);
}

function getTokenScopes(): string[] {
  const token = getStoredToken();
  if (!token) {
    return [];
  }

  return token.scopes.length
    ? token.scopes
    : config.strava.scope.split(",").map((scope) => scope.trim()).filter(Boolean);
}

function tokenHasScope(scope: string): boolean {
  return getTokenScopes().includes(scope);
}

function ensureConfiguredForStrava(): void {
  if (!config.strava.clientId) {
    throw new Error("Missing VITE_STRAVA_CLIENT_ID.");
  }

  if (!config.strava.clientSecret) {
    throw new Error("Missing VITE_STRAVA_CLIENT_SECRET. Token exchange and refresh require it.");
  }
}

function secondsNow(): number {
  return Math.floor(Date.now() / 1000);
}

async function readResponseError(response: Response): Promise<Error> {
  let message = `Strava request failed (${response.status})`;

  try {
    const payload = (await response.json()) as { message?: string; errors?: { code?: string; field?: string; resource?: string }[] };
    const details = (payload.errors || [])
      .map((entry) => [entry.resource, entry.field, entry.code].filter(Boolean).join("."))
      .filter(Boolean)
      .join(", ");
    message = payload.message || message;
    if (details) {
      message = `${message}: ${details}`;
    }
  } catch {
    // Ignore JSON parse errors.
  }

  return new Error(message);
}

async function postForm<T>(url: string, body: URLSearchParams): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  if (!response.ok) {
    throw await readResponseError(response);
  }

  return (await response.json()) as T;
}

function canRefreshToken(token: StoredStravaToken | null): boolean {
  return Boolean(
    token &&
    token.refreshToken &&
    config.strava.clientId &&
    config.strava.clientSecret
  );
}

async function refreshStoredToken(token: StoredStravaToken): Promise<StoredStravaToken> {
  ensureConfiguredForStrava();

  const refreshed = await postForm<TokenExchangeResponse>(
    STRAVA_TOKEN_URL,
    new URLSearchParams({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      grant_type: "refresh_token",
      refresh_token: token.refreshToken
    })
  );

  const nextToken: StoredStravaToken = {
    accessToken: refreshed.access_token,
    refreshToken: refreshed.refresh_token,
    expiresAt: refreshed.expires_at,
    scopes: token.scopes,
    athleteId: token.athleteId
  };

  saveToken(nextToken);
  return nextToken;
}

async function ensureAccessToken(): Promise<string> {
  const token = getStoredToken();
  if (!token) {
    throw new Error("Strava is not connected.");
  }

  if (token.expiresAt <= 0) {
    return token.accessToken;
  }

  if (token.expiresAt - secondsNow() > 3600) {
    return token.accessToken;
  }

  if (!canRefreshToken(token)) {
    return token.accessToken;
  }

  const refreshed = await refreshStoredToken(token);
  return refreshed.accessToken;
}

async function stravaRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const run = async (accessToken: string) => fetch(`${STRAVA_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(init?.headers || {})
    }
  });

  let response = await run(await ensureAccessToken());

  if (response.status === 401) {
    const token = getStoredToken();
    if (token && canRefreshToken(token)) {
      response = await run((await refreshStoredToken(token)).accessToken);
    }
  }

  if (!response.ok) {
    throw await readResponseError(response);
  }

  return (await response.json()) as T;
}

async function stravaFormRequest<T>(path: string, body: URLSearchParams): Promise<T> {
  const run = async (accessToken: string) => fetch(`${STRAVA_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  let response = await run(await ensureAccessToken());

  if (response.status === 401) {
    const token = getStoredToken();
    if (token && canRefreshToken(token)) {
      response = await run((await refreshStoredToken(token)).accessToken);
    }
  }

  if (!response.ok) {
    throw await readResponseError(response);
  }

  return (await response.json()) as T;
}

function metersToKm(value?: number): number | undefined {
  return typeof value === "number" ? Number((value / 1000).toFixed(1)) : undefined;
}

function metersPerSecondToKph(value?: number): number | undefined {
  return typeof value === "number" ? Number((value * 3.6).toFixed(1)) : undefined;
}

function sanitizeNumber(value: number | undefined, minimum = 0): number | undefined {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return undefined;
  }
  return value >= minimum ? value : undefined;
}

function normalizeWorkoutSport(sportType?: string, fallbackType?: string): WorkoutSport {
  const raw = (sportType || fallbackType || "").toLowerCase();

  if (raw.includes("run")) {
    return "run";
  }

  if (raw.includes("ride") || raw.includes("bike") || raw.includes("cycle")) {
    return "ride";
  }

  if (raw.includes("swim")) {
    return "swim";
  }

  if (raw.includes("walk") || raw.includes("hike")) {
    return "walk";
  }

  if (raw.includes("weight") || raw.includes("crossfit")) {
    return "weights";
  }

  return "other";
}

function formatSportLabel(sportType?: string, fallbackType?: string, customLabel?: string): string {
  if (customLabel) {
    return customLabel.trim();
  }

  const key = sportType || fallbackType || "Workout";
  return SPORT_LABELS[key] || key;
}

function mapGear(payload?: GearPayload | SummaryGearPayload): { id?: string; name?: string } {
  return {
    id: payload?.id,
    name: payload?.name
  };
}

function mapAthlete(payload: SummaryAthletePayload): AthleteProfile {
  return {
    id: String(payload.id || ""),
    firstName: payload.firstname || "Strava",
    lastName: payload.lastname || "Athlete",
    city: payload.city,
    state: payload.state,
    country: payload.country,
    profileMedium: payload.profile_medium,
    profile: payload.profile,
    followerCount: payload.follower_count,
    friendCount: payload.friend_count,
    measurementPreference: payload.measurement_preference,
    weightKg: payload.weight,
    ftp: payload.ftp,
    bikes: (payload.bikes || []).map((gear) => ({
      id: gear.id || makeId("bike"),
      name: gear.name || "Bike",
      primary: gear.primary,
      distanceKm: metersToKm(gear.distance)
    })),
    shoes: (payload.shoes || []).map((gear) => ({
      id: gear.id || makeId("shoe"),
      name: gear.name || "Shoes",
      primary: gear.primary,
      distanceKm: metersToKm(gear.distance)
    }))
  };
}

function normalizeActivityTotal(payload?: ActivityTotalPayload): AthleteActivityTotal {
  return {
    count: payload?.count || 0,
    distanceKm: Number(((payload?.distance || 0) / 1000).toFixed(1)),
    movingSec: payload?.moving_time || 0,
    elapsedSec: payload?.elapsed_time || 0,
    elevationGainM: Number((payload?.elevation_gain || 0).toFixed(0)),
    achievements: payload?.achievement_count || 0
  };
}

function mapAthleteStats(payload: AthleteStatsPayload): AthleteStats {
  return {
    biggestRideDistanceKm: Number(((payload.biggest_ride_distance || 0) / 1000).toFixed(1)),
    biggestClimbElevationGainM: Number((payload.biggest_climb_elevation_gain || 0).toFixed(0)),
    recentRideTotals: normalizeActivityTotal(payload.recent_ride_totals),
    recentRunTotals: normalizeActivityTotal(payload.recent_run_totals),
    recentSwimTotals: normalizeActivityTotal(payload.recent_swim_totals),
    ytdRideTotals: normalizeActivityTotal(payload.ytd_ride_totals),
    ytdRunTotals: normalizeActivityTotal(payload.ytd_run_totals),
    ytdSwimTotals: normalizeActivityTotal(payload.ytd_swim_totals),
    allRideTotals: normalizeActivityTotal(payload.all_ride_totals),
    allRunTotals: normalizeActivityTotal(payload.all_run_totals),
    allSwimTotals: normalizeActivityTotal(payload.all_swim_totals)
  };
}

function mapSplit(payload: SplitPayload): WorkoutSplit {
  const distanceKm = metersToKm(payload.distance);
  const movingSec = sanitizeNumber(payload.moving_time);

  return {
    split: payload.split || 0,
    distanceKm,
    elapsedSec: sanitizeNumber(payload.elapsed_time),
    movingSec,
    elevationDifferenceM: sanitizeNumber(payload.elevation_difference),
    averageSpeedKph: metersPerSecondToKph(payload.average_speed),
    averageGradeAdjustedSpeedKph: metersPerSecondToKph(payload.average_grade_adjusted_speed),
    averageHeartrate: sanitizeNumber(payload.average_heartrate),
    paceSecPerKm: distanceKm && movingSec ? Math.round(movingSec / distanceKm) : undefined
  };
}

function mapLap(payload: LapPayload): WorkoutLap {
  return {
    id: String(payload.id || makeId("lap")),
    name: payload.name || "Lap",
    elapsedSec: payload.elapsed_time || 0,
    movingSec: payload.moving_time,
    distanceKm: metersToKm(payload.distance),
    elevationGainM: sanitizeNumber(payload.total_elevation_gain),
    averageSpeedKph: metersPerSecondToKph(payload.average_speed),
    averageHeartrate: sanitizeNumber(payload.average_heartrate),
    averageCadence: sanitizeNumber(payload.average_cadence),
    averageWatts: sanitizeNumber(payload.average_watts),
    lapIndex: payload.lap_index,
    split: payload.split
  };
}

function mapZone(payload: ActivityZonePayload): WorkoutZone {
  return {
    type: payload.type || "heartrate",
    score: payload.score,
    points: payload.points,
    max: payload.max,
    sensorBased: payload.sensor_based,
    customZones: payload.custom_zones,
    buckets: (payload.distribution_buckets || []).map((bucket) => ({
      min: bucket.min,
      max: bucket.max,
      timeSec: bucket.time || 0
    }))
  };
}

function mapBaseActivity(payload: ActivityPayload, source: WorkoutSource = "strava"): Workout {
  const sport = normalizeWorkoutSport(payload.sport_type, payload.type);
  const gear = mapGear(payload.gear);

  return {
    id: String(payload.id || makeId("workout")),
    source,
    sport,
    sportLabel: formatSportLabel(payload.sport_type, payload.type),
    title: payload.name || "Untitled activity",
    distanceKm: metersToKm(payload.distance),
    movingSec: payload.moving_time || 0,
    elapsedSec: payload.elapsed_time,
    startedAt: payload.start_date || new Date().toISOString(),
    startedAtLocal: payload.start_date_local,
    calories: sanitizeNumber(payload.calories),
    elevationGainM: sanitizeNumber(payload.total_elevation_gain),
    averageSpeedKph: metersPerSecondToKph(payload.average_speed),
    maxSpeedKph: metersPerSecondToKph(payload.max_speed),
    averageHeartrate: sanitizeNumber(payload.average_heartrate),
    maxHeartrate: sanitizeNumber(payload.max_heartrate),
    averageCadence: sanitizeNumber(payload.average_cadence),
    averageWatts: sanitizeNumber(payload.average_watts),
    weightedAverageWatts: sanitizeNumber(payload.weighted_average_watts),
    kilojoules: sanitizeNumber(payload.kilojoules),
    achievements: payload.achievement_count || 0,
    kudos: payload.kudos_count || 0,
    comments: payload.comment_count || 0,
    photoCount: payload.photo_count || 0,
    prCount: payload.pr_count || 0,
    deviceName: payload.device_name,
    gearName: gear.name,
    description: payload.description,
    trainer: payload.trainer,
    commute: payload.commute,
    manual: payload.manual,
    private: payload.private,
    externalUrl: payload.id ? `https://www.strava.com/activities/${payload.id}` : undefined,
    rawSportType: payload.sport_type || payload.type,
    syncedToStrava: source === "strava",
    splits: (payload.splits_metric || []).map(mapSplit)
  };
}

export function mapSummaryActivity(payload: ActivityPayload): Workout {
  return mapBaseActivity(payload, "strava");
}

function mapDetailedActivity(payload: ActivityPayload, laps: LapPayload[] = [], zones: ActivityZonePayload[] = []): Workout {
  return {
    ...mapBaseActivity(payload, "strava"),
    laps: laps.map(mapLap),
    zones: zones.map(mapZone)
  };
}

function loadManualActivities(): ManualWorkoutRecord[] {
  return readJson<ManualWorkoutRecord[]>(STORAGE_MANUAL_KEY, []);
}

function saveManualActivities(workouts: ManualWorkoutRecord[]): void {
  writeJson(STORAGE_MANUAL_KEY, workouts);
}

function findManualActivity(workoutId: string): ManualWorkoutRecord | undefined {
  return loadManualActivities().find(
    (workout) => workout.id === workoutId || workout.localId === workoutId || workout.stravaActivityId === workoutId
  );
}

function overlayManualWorkout(base: Workout, manual: ManualWorkoutRecord): Workout {
  return {
    ...base,
    source: "manual",
    sport: manual.sport,
    sportLabel: manual.sportLabel || base.sportLabel,
    description: manual.description || base.description,
    exercises: manual.exercises,
    calories: manual.calories ?? base.calories,
    syncedToStrava: Boolean(manual.stravaActivityId),
    stravaActivityId: manual.stravaActivityId || base.id,
    syncError: manual.syncError
  };
}

export function mergeTrackedWorkouts(stravaWorkouts: Workout[], manualWorkouts: Workout[]): Workout[] {
  const stravaById = new Map(stravaWorkouts.map((workout) => [workout.id, workout]));
  const merged: Workout[] = [];
  const consumed = new Set<string>();

  for (const manual of manualWorkouts) {
    if (manual.stravaActivityId && stravaById.has(manual.stravaActivityId)) {
      consumed.add(manual.stravaActivityId);
      merged.push(overlayManualWorkout(stravaById.get(manual.stravaActivityId)!, manual as ManualWorkoutRecord));
      continue;
    }

    merged.push(manual);
  }

  for (const workout of stravaWorkouts) {
    if (!consumed.has(workout.id)) {
      merged.push(workout);
    }
  }

  return merged.sort((left, right) => new Date(right.startedAt).getTime() - new Date(left.startedAt).getTime());
}

function buildStrengthSummary(exercises: StrengthExercise[] = []): string {
  return exercises
    .filter((exercise) => exercise.name.trim())
    .map((exercise) => {
      const weight = exercise.weight > 0 ? ` @ ${trimNumber(exercise.weight)} ${exercise.unit}` : "";
      return `${exercise.name.trim()} ${trimNumber(exercise.sets)} x ${trimNumber(exercise.reps)}${weight}`;
    })
    .join("; ");
}

function trimNumber(value: number): string {
  if (Number.isInteger(value)) {
    return String(value);
  }

  return value.toFixed(1).replace(/\.0$/, "");
}

export function buildManualActivityDescription(input: ManualActivityInput): string {
  const parts = [input.description?.trim()];

  if (input.category === "weights" && input.exercises?.length) {
    parts.push(buildStrengthSummary(input.exercises));
  }

  if (input.category !== "weights" && typeof input.distanceKm === "number") {
    parts.push(`Distance: ${trimNumber(input.distanceKm)} km`);
  }

  return parts.filter(Boolean).join(" | ");
}

function manualInputToWorkout(input: ManualActivityInput, syncError?: string, stravaActivityId?: string): ManualWorkoutRecord {
  const startedAt = new Date(input.startedAtLocal);
  return {
    id: stravaActivityId || makeId("manual"),
    localId: makeId("manual-local"),
    source: "manual",
    sport: input.category,
    sportLabel: input.category === "other" ? (input.customSportLabel?.trim() || "Other") : formatSportLabel(stravaSportTypeForManual(input)),
    title: input.title.trim(),
    distanceKm: input.category === "run" || input.category === "ride" || input.category === "swim" || input.category === "walk"
      ? sanitizeNumber(input.distanceKm)
      : undefined,
    movingSec: Math.max(60, Math.round(input.durationMin * 60)),
    elapsedSec: Math.max(60, Math.round(input.durationMin * 60)),
    startedAt: startedAt.toISOString(),
    startedAtLocal: input.startedAtLocal,
    calories: sanitizeNumber(input.calories),
    description: buildManualActivityDescription(input),
    manual: true,
    syncedToStrava: Boolean(stravaActivityId),
    stravaActivityId,
    localOnly: !stravaActivityId,
    syncError,
    exercises: input.category === "weights"
      ? (input.exercises || []).filter((exercise) => exercise.name.trim())
      : undefined
  };
}

function stravaSportTypeForManual(input: ManualActivityInput): string {
  switch (input.category) {
    case "run":
      return "Run";
    case "ride":
      return "Ride";
    case "swim":
      return "Swim";
    case "walk":
      return "Walk";
    case "weights":
      return "WeightTraining";
    default:
      return "Workout";
  }
}

function formatLocalDateTime(value: string): string {
  const date = new Date(value);
  const offsetMinutes = -date.getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? "+" : "-";
  const absolute = Math.abs(offsetMinutes);
  const offsetHours = String(Math.floor(absolute / 60)).padStart(2, "0");
  const offsetMins = String(absolute % 60).padStart(2, "0");

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}${sign}${offsetHours}:${offsetMins}`;
}

async function createStravaManualActivity(input: ManualActivityInput): Promise<Workout> {
  const sportType = stravaSportTypeForManual(input);
  const params = new URLSearchParams({
    name: input.title.trim(),
    type: sportType,
    sport_type: sportType,
    start_date_local: formatLocalDateTime(input.startedAtLocal),
    elapsed_time: String(Math.max(60, Math.round(input.durationMin * 60))),
    description: buildManualActivityDescription(input)
  });

  if (typeof input.distanceKm === "number" && ["run", "ride", "swim", "walk"].includes(input.category)) {
    params.set("distance", String(Math.max(0, input.distanceKm) * 1000));
  }

  const response = await stravaFormRequest<ActivityPayload>("/activities", params);

  return mapSummaryActivity(response);
}

async function listStravaActivities(max = 20): Promise<Workout[]> {
  const activities = await stravaRequest<ActivityPayload[]>(
    `/athlete/activities?per_page=${Math.max(max, 1)}&page=1`
  );

  return activities.map(mapSummaryActivity);
}

async function getStravaAthlete(): Promise<AthleteProfile> {
  const payload = await stravaRequest<SummaryAthletePayload>("/athlete");
  return mapAthlete(payload);
}

async function getStravaAthleteStats(athleteId: string): Promise<AthleteStats> {
  const payload = await stravaRequest<AthleteStatsPayload>(`/athletes/${athleteId}/stats`);
  return mapAthleteStats(payload);
}

async function getStravaActivityDetail(activityId: string): Promise<Workout> {
  const [detail, laps, zones] = await Promise.all([
    stravaRequest<ActivityPayload>(`/activities/${activityId}?include_all_efforts=false`),
    stravaRequest<LapPayload[]>(`/activities/${activityId}/laps`).catch(() => []),
    stravaRequest<ActivityZonePayload[]>(`/activities/${activityId}/zones`).catch(() => [])
  ]);

  return mapDetailedActivity(detail, laps, zones);
}

export function buildStravaAuthUrl(): string {
  return buildStravaAuthUrlForPath("/settings");
}

export function buildStravaAuthUrlForPath(pathname: string): string {
  const setupError = getStravaSetupError();
  if (setupError) {
    return "#";
  }

  const redirectUri = resolveStravaRedirectUri(pathname);

  const params = new URLSearchParams({
    client_id: config.strava.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    approval_prompt: "force",
    scope: config.strava.scope
  });

  return `${STRAVA_AUTH_URL}?${params.toString()}`;
}

export async function completeStravaAuthFromCurrentUrl(): Promise<boolean> {
  const url = new URL(window.location.href);
  const code = url.searchParams.get("code");
  const scope = url.searchParams.get("scope");
  const error = url.searchParams.get("error");

  if (error) {
    throw new Error(`Strava authorization failed: ${error}.`);
  }

  if (!code) {
    return false;
  }

  await exchangeStravaCode(code, scope || undefined);
  url.searchParams.delete("code");
  url.searchParams.delete("scope");
  url.searchParams.delete("error");
  window.history.replaceState({}, "", url.toString());
  return true;
}

function resolveStravaRedirectUri(pathname: string): string {
  if (typeof window === "undefined") {
    return config.strava.redirectUri;
  }

  return new URL(pathname, window.location.origin).toString();
}

export async function exchangeStravaCode(code: string, grantedScope?: string | string[]): Promise<void> {
  ensureConfiguredForStrava();

  const response = await postForm<TokenExchangeResponse>(
    STRAVA_TOKEN_URL,
    new URLSearchParams({
      client_id: config.strava.clientId,
      client_secret: config.strava.clientSecret,
      code,
      grant_type: "authorization_code"
    })
  );

  const scopes = Array.isArray(grantedScope)
    ? grantedScope
    : typeof grantedScope === "string"
      ? grantedScope.split(",")
      : config.strava.scope.split(",");

  saveToken({
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    expiresAt: response.expires_at,
    scopes: scopes.map((scope) => scope.trim()).filter(Boolean),
    athleteId: response.athlete?.id ? String(response.athlete.id) : undefined
  });
}

export function isStravaConnected(): boolean {
  return getStoredToken() !== null;
}

export function disconnectStrava(): void {
  clearStoredValue(STORAGE_TOKEN_KEY);
  setEnvBootstrapDisabled(true);
}

export function hasStravaWriteAccess(): boolean {
  return tokenHasScope("activity:write");
}

export function getStravaSetupError(): string | null {
  if (!config.strava.clientId) {
    return "Missing VITE_STRAVA_CLIENT_ID in beat-app/.env.local.";
  }

  if (!/^\d+$/.test(config.strava.clientId.trim())) {
    return "VITE_STRAVA_CLIENT_ID must be your numeric Strava App ID from strava.com/settings/api.";
  }

  if (!config.strava.clientSecret) {
    return "Missing VITE_STRAVA_CLIENT_SECRET in beat-app/.env.local.";
  }

  return null;
}

export async function listRecentWorkouts(max = 10, options?: { includeFallback?: boolean }): Promise<Workout[]> {
  const manual = loadManualActivities();

  if (!isStravaConnected()) {
    if (manual.length > 0) {
      return manual.slice(0, max);
    }

    return options?.includeFallback === false ? [] : MOCK_WORKOUTS.slice(0, max);
  }

  try {
    const strava = await listStravaActivities(Math.max(max * 2, max));
    return mergeTrackedWorkouts(strava, manual).slice(0, max);
  } catch {
    if (manual.length > 0) {
      return manual.slice(0, max);
    }

    return options?.includeFallback === false ? [] : MOCK_WORKOUTS.slice(0, max);
  }
}

export async function loadActivityDashboard(max = 20): Promise<ActivityDashboard> {
  const manual = loadManualActivities();
  const errors: string[] = [];

  if (!isStravaConnected()) {
    return {
      connected: false,
      hasWriteAccess: false,
      workouts: manual.length > 0 ? manual.slice(0, max) : [],
      errors
    };
  }

  try {
    const athlete = await getStravaAthlete();
    const [stats, stravaWorkouts] = await Promise.all([
      getStravaAthleteStats(athlete.id).catch((error: unknown) => {
        errors.push(error instanceof Error ? error.message : "Unable to load Strava stats.");
        return undefined;
      }),
      listStravaActivities(Math.max(max * 2, max))
    ]);

    return {
      connected: true,
      hasWriteAccess: hasStravaWriteAccess(),
      athlete,
      stats,
      workouts: mergeTrackedWorkouts(stravaWorkouts, manual).slice(0, max),
      errors
    };
  } catch (error) {
    errors.push(error instanceof Error ? error.message : "Unable to load Strava activity.");
    return {
      connected: true,
      hasWriteAccess: hasStravaWriteAccess(),
      workouts: manual.slice(0, max),
      errors
    };
  }
}

export async function getWorkoutDetail(workoutId: string): Promise<Workout | null> {
  const manual = findManualActivity(workoutId);
  const stravaId = manual?.stravaActivityId || (manual?.source === "strava" ? manual.id : undefined) || (manual ? undefined : workoutId);

  if (!stravaId || !isStravaConnected()) {
    return manual || null;
  }

  const detail = await getStravaActivityDetail(stravaId);
  return manual ? overlayManualWorkout(detail, manual) : detail;
}

export async function createManualActivity(input: ManualActivityInput): Promise<Workout> {
  const shouldSync = input.syncToStrava !== false && isStravaConnected() && hasStravaWriteAccess();

  if (!shouldSync) {
    const local = manualInputToWorkout(input);
    saveManualActivities([local, ...loadManualActivities()]);
    return local;
  }

  try {
    const stravaWorkout = await createStravaManualActivity(input);
    const local = manualInputToWorkout(input, undefined, stravaWorkout.id);
    saveManualActivities([local, ...loadManualActivities()]);
    return overlayManualWorkout(stravaWorkout, local);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to sync manual activity to Strava.";
    const local = manualInputToWorkout(input, message);
    saveManualActivities([local, ...loadManualActivities()]);
    return local;
  }
}
