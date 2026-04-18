import assert from "node:assert/strict";

import {
  buildManualActivityDescription,
  mapSummaryActivity,
  mergeTrackedWorkouts
} from "./strava.ts";
import type { Workout } from "./types.ts";

run("mapSummaryActivity normalizes Strava sport types and core metrics", () => {
  const workout = mapSummaryActivity({
    id: 42,
    name: "Lunch ride",
    sport_type: "Ride",
    distance: 25600,
    moving_time: 3600,
    elapsed_time: 3900,
    start_date: "2026-04-18T14:00:00Z",
    start_date_local: "2026-04-18T10:00:00-04:00",
    average_speed: 7.1,
    max_speed: 12.5,
    calories: 640,
    average_watts: 210,
    achievement_count: 2,
    kudos_count: 5,
    comment_count: 1
  });

  assert.equal(workout.id, "42");
  assert.equal(workout.source, "strava");
  assert.equal(workout.sport, "ride");
  assert.equal(workout.distanceKm, 25.6);
  assert.equal(workout.averageSpeedKph, 25.6);
  assert.equal(workout.maxSpeedKph, 45);
  assert.equal(workout.averageWatts, 210);
  assert.equal(workout.kudos, 5);
});

run("buildManualActivityDescription summarizes lifting details for local plus Strava sync", () => {
  const description = buildManualActivityDescription({
    category: "weights",
    title: "Hotel gym",
    startedAtLocal: "2026-04-18T08:30",
    durationMin: 40,
    description: "Quick strength reset",
    exercises: [
      { id: "e1", name: "Goblet squat", sets: 4, reps: 8, weight: 55, unit: "lb" },
      { id: "e2", name: "Single-arm row", sets: 3, reps: 10, weight: 35, unit: "lb" }
    ]
  });

  assert.match(description, /Quick strength reset/);
  assert.match(description, /Goblet squat 4 x 8 @ 55 lb/);
  assert.match(description, /Single-arm row 3 x 10 @ 35 lb/);
});

run("mergeTrackedWorkouts overlays synced manual workouts instead of duplicating them", () => {
  const stravaWorkout: Workout = {
    id: "123",
    source: "strava",
    sport: "weights",
    sportLabel: "Weight Training",
    title: "Morning lift",
    movingSec: 1800,
    elapsedSec: 1800,
    startedAt: "2026-04-18T10:00:00Z",
    syncedToStrava: true
  };

  const manualWorkout: Workout = {
    id: "123",
    source: "manual",
    sport: "weights",
    sportLabel: "Weight Training",
    title: "Morning lift",
    movingSec: 1800,
    elapsedSec: 1800,
    startedAt: "2026-04-18T10:00:00Z",
    syncedToStrava: true,
    stravaActivityId: "123",
    exercises: [
      { id: "bench", name: "Bench press", sets: 3, reps: 5, weight: 185, unit: "lb" }
    ]
  };

  const merged = mergeTrackedWorkouts([stravaWorkout], [manualWorkout]);

  assert.equal(merged.length, 1);
  assert.equal(merged[0].source, "manual");
  assert.equal(merged[0].stravaActivityId, "123");
  assert.equal(merged[0].exercises?.[0]?.name, "Bench press");
});

console.log("All Strava activity service checks passed.");

function run(name: string, fn: () => void): void {
  try {
    fn();
    console.log(`ok - ${name}`);
  } catch (error) {
    console.error(`not ok - ${name}`);
    throw error;
  }
}
