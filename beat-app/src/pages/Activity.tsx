import { FormEvent, useEffect, useState } from "react";
import stravaLogo from "@/assets/strava-logo.jpg";
import {
  buildStravaAuthUrlForPath,
  completeStravaAuthFromCurrentUrl,
  createManualActivity,
  getWorkoutDetail,
  getStravaSetupError,
  loadActivityDashboard
} from "@/services/strava";
import type {
  ActivityDashboard,
  AthleteActivityTotal,
  ManualActivityInput,
  StrengthExercise,
  Workout,
  WorkoutSport,
  WorkoutZoneBucket
} from "@/services/types";

type ManualFormState = {
  category: WorkoutSport;
  customSportLabel: string;
  title: string;
  startedAtLocal: string;
  durationMin: string;
  distanceKm: string;
  calories: string;
  description: string;
  syncToStrava: boolean;
  exercises: StrengthExercise[];
};

const EMPTY_DASHBOARD: ActivityDashboard = {
  connected: false,
  hasWriteAccess: false,
  workouts: [],
  errors: []
};

const CATEGORY_OPTIONS: { value: WorkoutSport; label: string }[] = [
  { value: "run", label: "Running" },
  { value: "ride", label: "Biking" },
  { value: "swim", label: "Swimming" },
  { value: "walk", label: "Walking" },
  { value: "weights", label: "Weight lifting" },
  { value: "other", label: "Other" }
];

export default function Activity() {
  const [dashboard, setDashboard] = useState<ActivityDashboard>(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, Workout>>({});
  const [loadingDetailsId, setLoadingDetailsId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<{ tone: "ok" | "warn"; message: string } | null>(null);
  const [stravaConnectError, setStravaConnectError] = useState<string>("");
  const [form, setForm] = useState<ManualFormState>(createInitialFormState());
  const stravaSetupError = getStravaSetupError();

  useEffect(() => {
    void refreshDashboard();
  }, []);

  useEffect(() => {
    completeStravaAuthFromCurrentUrl()
      .then((didConnect) => {
        if (didConnect) {
          setStravaConnectError("");
          void refreshDashboard();
        }
      })
      .catch((error: unknown) => {
        setStravaConnectError(error instanceof Error ? error.message : "Unable to finish Strava connection here. Try Settings.");
      });
  }, []);

  async function refreshDashboard() {
    setLoading(true);
    try {
      const next = await loadActivityDashboard(20);
      setDashboard(next);
    } finally {
      setLoading(false);
    }
  }

  async function toggleDetails(workout: Workout) {
    if (expandedId === workout.id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(workout.id);

    if (detailsById[workout.id]) {
      return;
    }

    setLoadingDetailsId(workout.id);
    try {
      const detail = await getWorkoutDetail(workout.id);
      if (detail) {
        setDetailsById((current) => ({ ...current, [workout.id]: detail }));
      }
    } finally {
      setLoadingDetailsId(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveState(null);

    const input = formToInput(form, dashboard.hasWriteAccess && dashboard.connected);
    if (typeof input === "string") {
      setSaveState({ tone: "warn", message: input });
      return;
    }

    const saved = await createManualActivity(input);
    const tone = saved.syncError ? "warn" : "ok";
    const message = saved.syncError
      ? `Saved locally. Strava sync did not go through: ${saved.syncError}`
      : saved.syncedToStrava
        ? "Saved and synced to Strava."
        : "Saved locally to Beat.";

    setSaveState({ tone, message });
    setForm(createInitialFormState(form.category));
    await refreshDashboard();
  }

  function updateExercise(exerciseId: string, patch: Partial<StrengthExercise>) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.map((exercise) => (
        exercise.id === exerciseId ? { ...exercise, ...patch } : exercise
      ))
    }));
  }

  function addExercise() {
    setForm((current) => ({
      ...current,
      exercises: [...current.exercises, createExercise()]
    }));
  }

  function removeExercise(exerciseId: string) {
    setForm((current) => ({
      ...current,
      exercises: current.exercises.filter((exercise) => exercise.id !== exerciseId)
    }));
  }

  const weekWorkouts = dashboard.workouts.filter((workout) => isWithinLastDays(workout.startedAt, 7));
  const totalKm = weekWorkouts.reduce((sum, workout) => sum + (workout.distanceKm || 0), 0);
  const totalMin = Math.round(weekWorkouts.reduce((sum, workout) => sum + workout.movingSec, 0) / 60);
  const totalCal = weekWorkouts.reduce((sum, workout) => sum + (workout.calories || 0), 0);

  return (
    <>
      <div className="eyebrow">Your Activity</div>
      <h1 className="h1">Move however your day lets you.</h1>
      <p className="lede">
        Beat auto-syncs your workouts from Strava and lets you log everything Strava misses,
        from open-water swims to hotel-gym lifting sessions.
      </p>

      {!dashboard.connected && (
        <section className="card" style={{ marginTop: 20, borderLeft: "4px solid var(--coral)" }}>
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <h2 className="h2" style={{ margin: 0 }}>Connect Strava</h2>
              <p className="muted" style={{ margin: "4px 0 0" }}>
                Pull in recent activity automatically and sync manual cardio or workout summaries back to Strava.
              </p>
              {stravaSetupError && (
                <p className="muted" style={{ margin: "8px 0 0", color: "var(--warn)" }}>
                  {stravaSetupError}
                </p>
              )}
              {stravaConnectError && (
                <p className="muted" style={{ margin: "8px 0 0", color: "var(--warn)" }}>
                  {stravaConnectError}
                </p>
              )}
            </div>
            {stravaSetupError ? (
              <a className="btn ghost" href="/settings">Open Settings</a>
            ) : (
              <a className="btn" href={buildStravaAuthUrlForPath("/activity")}>Connect</a>
            )}
          </div>
        </section>
      )}

      {dashboard.errors.length > 0 && (
        <section className="card" style={{ marginTop: 20, borderLeft: "4px solid var(--warn)" }}>
          <h2 className="h2" style={{ marginBottom: 8 }}>Strava sync needs attention</h2>
          {dashboard.errors.map((error) => (
            <p key={error} className="muted" style={{ margin: "6px 0" }}>{error}</p>
          ))}
        </section>
      )}

      <div className="grid-3" style={{ marginTop: 20 }}>
        <div className="card">
          <div className="stat">{totalKm.toFixed(1)}<small>KM THIS WEEK</small></div>
        </div>
        <div className="card">
          <div className="stat">{totalMin}<small>MIN MOVING</small></div>
        </div>
        <div className="card">
          <div className="stat">{totalCal}<small>KCAL</small></div>
        </div>
      </div>

      {dashboard.connected && dashboard.athlete && (
        <section className="card" style={{ marginTop: 20 }}>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start" }}>
            <div className="row" style={{ gap: 14, alignItems: "center" }}>
              {dashboard.athlete.profileMedium ? (
                <img className="activity-avatar" src={dashboard.athlete.profileMedium} alt="Strava athlete profile" />
              ) : (
                <div className="activity-avatar activity-avatar-fallback" aria-label="Strava">
                  <img className="activity-avatar-logo" src={stravaLogo} alt="Strava logo" />
                </div>
              )}
              <div>
                <h2 className="h2" style={{ margin: 0 }}>
                  {dashboard.athlete.firstName} {dashboard.athlete.lastName}
                </h2>
                <p className="muted" style={{ margin: "4px 0 0" }}>
                  {locationLine(dashboard.athlete)}
                </p>
              </div>
            </div>
            <div className="row" style={{ gap: 8 }}>
              <span className="pill">Auto sync on</span>
              <span className={`status ${dashboard.hasWriteAccess ? "on" : "off"}`}>
                <span className="dot" /> {dashboard.hasWriteAccess ? "Can write manual activities" : "Read only scope"}
              </span>
            </div>
          </div>

          <div className="activity-summary-grid" style={{ marginTop: 18 }}>
            <SummaryStat title="Recent runs" total={dashboard.stats?.recentRunTotals} unit="km" />
            <SummaryStat title="Recent rides" total={dashboard.stats?.recentRideTotals} unit="km" />
            <SummaryStat title="Recent swims" total={dashboard.stats?.recentSwimTotals} unit="km" />
            <MiniMetric label="Followers" value={String(dashboard.athlete.followerCount || 0)} />
            <MiniMetric label="Biggest ride" value={`${dashboard.stats?.biggestRideDistanceKm || 0} km`} />
            <MiniMetric label="Biggest climb" value={`${dashboard.stats?.biggestClimbElevationGainM || 0} m`} />
          </div>
        </section>
      )}

      <section className="card" style={{ marginTop: 20 }}>
        <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
          <h2 className="h2" style={{ marginBottom: 0 }}>Recent workouts</h2>
          {loading && <span className="muted">Refreshing...</span>}
        </div>
        {dashboard.workouts.length === 0 ? (
          <div className="empty">
            No workouts yet. Connect Strava or add one manually below.
          </div>
        ) : (
          dashboard.workouts.map((workout) => {
            const detail = detailsById[workout.id];
            const isExpanded = expandedId === workout.id;

            return (
              <div key={workout.id}>
                <div className="workout">
                  <div className="sport">{sportEmoji(workout.sport)}</div>
                  <div>
                    <div className="title">{workout.title}</div>
                    <div className="sub">
                      {workout.distanceKm ? `${trimNumber(workout.distanceKm)} km · ` : ""}
                      {Math.round(workout.movingSec / 60)} min · {formatDateTime(workout.startedAt)}
                    </div>
                    <div className="row" style={{ gap: 6, marginTop: 8 }}>
                      <span className="tag">{workout.sportLabel}</span>
                      <span className={`tag ${workout.source === "strava" ? "go" : ""}`}>
                        {workout.source === "strava" ? "Strava" : "Manual"}
                      </span>
                      {workout.syncedToStrava && workout.source === "manual" && (
                        <span className="tag go">Synced</span>
                      )}
                      {workout.syncError && <span className="tag warn">Local only</span>}
                    </div>
                  </div>
                  <div className="workout-side">
                    <div className="muted">{workout.calories ?? "--"} kcal</div>
                    <button className="btn sm ghost" onClick={() => void toggleDetails(workout)} type="button">
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="workout-detail">
                    {loadingDetailsId === workout.id && !detail ? (
                      <div className="muted">Loading detail...</div>
                    ) : (
                      <WorkoutDetailPanel workout={detail || workout} />
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      <section className="card" style={{ marginTop: 20 }}>
        <h2 className="h2">Log something Strava did not catch</h2>
        <p className="muted" style={{ fontSize: 13 }}>
          Running, riding, swimming, walking, lifting, or some custom category. Beat keeps the rich details here
          and syncs what Strava can support.
        </p>

        {saveState && (
          <div className={`inline-alert ${saveState.tone}`} style={{ marginTop: 12 }}>
            {saveState.message}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
          <div className="activity-form-grid">
            <label>
              <div className="muted">Category</div>
              <select
                className="select"
                value={form.category}
                onChange={(event) => setForm((current) => ({
                  ...current,
                  category: event.target.value as WorkoutSport,
                  exercises: event.target.value === "weights" ? current.exercises : createInitialFormState().exercises
                }))}
              >
                {CATEGORY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label>
              <div className="muted">Title</div>
              <input
                className="input"
                value={form.title}
                onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                placeholder="Morning swim, bureau walk, lower body"
              />
            </label>

            <label>
              <div className="muted">Start time</div>
              <input
                className="input"
                type="datetime-local"
                value={form.startedAtLocal}
                onChange={(event) => setForm((current) => ({ ...current, startedAtLocal: event.target.value }))}
              />
            </label>

            <label>
              <div className="muted">Minutes</div>
              <input
                className="input"
                type="number"
                min="1"
                value={form.durationMin}
                onChange={(event) => setForm((current) => ({ ...current, durationMin: event.target.value }))}
                placeholder="45"
              />
            </label>

            {showsDistance(form.category) && (
              <label>
                <div className="muted">Distance (km)</div>
                <input
                  className="input"
                  type="number"
                  min="0"
                  step="0.1"
                  value={form.distanceKm}
                  onChange={(event) => setForm((current) => ({ ...current, distanceKm: event.target.value }))}
                  placeholder="5.0"
                />
              </label>
            )}

            <label>
              <div className="muted">Calories (optional)</div>
              <input
                className="input"
                type="number"
                min="0"
                value={form.calories}
                onChange={(event) => setForm((current) => ({ ...current, calories: event.target.value }))}
                placeholder="300"
              />
            </label>

            {form.category === "other" && (
              <label>
                <div className="muted">Custom label</div>
                <input
                  className="input"
                  value={form.customSportLabel}
                  onChange={(event) => setForm((current) => ({ ...current, customSportLabel: event.target.value }))}
                  placeholder="Mobility, paddling, hiking"
                />
              </label>
            )}
          </div>

          <label style={{ display: "block", marginTop: 14 }}>
            <div className="muted">Notes</div>
            <textarea
              className="textarea"
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Optional notes, route context, recovery notes, or what made this session weird."
            />
          </label>

          {form.category === "weights" && (
            <div className="strength-editor">
              <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 className="h2" style={{ fontSize: 18, marginBottom: 2 }}>Exercises</h3>
                  <p className="muted" style={{ margin: 0 }}>
                    Beat stores sets, reps, and weight here. Strava only receives a workout summary.
                  </p>
                </div>
                <button className="btn sm ghost" type="button" onClick={addExercise}>
                  Add exercise
                </button>
              </div>

              <div className="strength-list">
                {form.exercises.map((exercise) => (
                  <div key={exercise.id} className="strength-row">
                    <input
                      className="input"
                      value={exercise.name}
                      onChange={(event) => updateExercise(exercise.id, { name: event.target.value })}
                      placeholder="Exercise"
                    />
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={exercise.sets}
                      onChange={(event) => updateExercise(exercise.id, { sets: Number(event.target.value) || 0 })}
                      placeholder="Sets"
                    />
                    <input
                      className="input"
                      type="number"
                      min="1"
                      value={exercise.reps}
                      onChange={(event) => updateExercise(exercise.id, { reps: Number(event.target.value) || 0 })}
                      placeholder="Reps"
                    />
                    <input
                      className="input"
                      type="number"
                      min="0"
                      step="0.5"
                      value={exercise.weight}
                      onChange={(event) => updateExercise(exercise.id, { weight: Number(event.target.value) || 0 })}
                      placeholder="Weight"
                    />
                    <select
                      className="select"
                      value={exercise.unit}
                      onChange={(event) => updateExercise(exercise.id, { unit: event.target.value as "lb" | "kg" })}
                    >
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                    </select>
                    <button className="btn sm ghost" type="button" onClick={() => removeExercise(exercise.id)}>
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="row" style={{ justifyContent: "space-between", marginTop: 18 }}>
            <label className="sync-checkbox">
              <input
                type="checkbox"
                checked={form.syncToStrava}
                onChange={(event) => setForm((current) => ({ ...current, syncToStrava: event.target.checked }))}
                disabled={!dashboard.connected}
              />
              <span>
                Sync to Strava when possible
                {!dashboard.connected && " (connect Strava first)"}
              </span>
            </label>

            <button className="btn" type="submit">Log activity</button>
          </div>

          <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
            Strava manual activities support title, sport type, start time, elapsed time, description, and distance.
            Detailed lifting sets stay in Beat and are summarized when syncing.
          </p>
        </form>
      </section>
    </>
  );
}

function SummaryStat({ title, total, unit }: { title: string; total?: AthleteActivityTotal; unit: string }) {
  return (
    <div className="summary-stat">
      <div className="summary-stat-title">{title}</div>
      <div className="summary-stat-value">{total ? `${trimNumber(total.distanceKm)} ${unit}` : "--"}</div>
      <div className="muted">{total ? `${total.count} activities · ${Math.round(total.movingSec / 60)} min` : "No data yet"}</div>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="mini-metric">
      <div className="mini-metric-label">{label}</div>
      <div className="mini-metric-value">{value}</div>
    </div>
  );
}

function WorkoutDetailPanel({ workout }: { workout: Workout }) {
  const metrics = [
    workout.distanceKm ? { label: "Distance", value: `${trimNumber(workout.distanceKm)} km` } : null,
    workout.elevationGainM ? { label: "Climb", value: `${trimNumber(workout.elevationGainM)} m` } : null,
    workout.averageSpeedKph ? { label: "Avg speed", value: `${trimNumber(workout.averageSpeedKph)} km/h` } : null,
    workout.averageHeartrate ? { label: "Avg HR", value: `${trimNumber(workout.averageHeartrate)} bpm` } : null,
    workout.averageWatts ? { label: "Avg power", value: `${trimNumber(workout.averageWatts)} w` } : null,
    workout.kudos !== undefined ? { label: "Kudos", value: String(workout.kudos) } : null
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <div>
      {workout.description && (
        <p className="muted" style={{ marginTop: 0 }}>{workout.description}</p>
      )}

      {metrics.length > 0 && (
        <div className="detail-metric-grid">
          {metrics.map((metric) => (
            <div key={metric.label} className="mini-metric">
              <div className="mini-metric-label">{metric.label}</div>
              <div className="mini-metric-value">{metric.value}</div>
            </div>
          ))}
        </div>
      )}

      {workout.exercises && workout.exercises.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="detail-section-title">Strength breakdown</div>
          <div className="exercise-list">
            {workout.exercises.map((exercise) => (
              <div key={exercise.id} className="exercise-pill">
                <strong>{exercise.name}</strong> {exercise.sets} x {exercise.reps}
                {exercise.weight > 0 ? ` @ ${trimNumber(exercise.weight)} ${exercise.unit}` : ""}
              </div>
            ))}
          </div>
        </div>
      )}

      {workout.laps && workout.laps.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="detail-section-title">Laps</div>
          <div className="detail-list">
            {workout.laps.slice(0, 6).map((lap) => (
              <div key={lap.id} className="detail-list-row">
                <span>{lap.name}</span>
                <span className="muted">
                  {lap.distanceKm ? `${trimNumber(lap.distanceKm)} km · ` : ""}
                  {Math.round(lap.elapsedSec / 60)} min
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {workout.zones && workout.zones.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="detail-section-title">Zone time</div>
          <div className="zone-list">
            {workout.zones.map((zone) => (
              <div key={zone.type} className="zone-card">
                <div className="zone-title">{zone.type === "heartrate" ? "Heart rate" : "Power"}</div>
                {zone.buckets.length === 0 ? (
                  <div className="muted">No zone detail returned.</div>
                ) : (
                  zone.buckets.map((bucket, index) => (
                    <div key={`${zone.type}-${index}`} className="detail-list-row">
                      <span>{formatZoneRange(bucket)}</span>
                      <span className="muted">{formatMinutes(bucket.timeSec)}</span>
                    </div>
                  ))
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function createInitialFormState(category: WorkoutSport = "run"): ManualFormState {
  return {
    category,
    customSportLabel: "",
    title: "",
    startedAtLocal: defaultDateTimeLocal(),
    durationMin: "30",
    distanceKm: "",
    calories: "",
    description: "",
    syncToStrava: true,
    exercises: [createExercise()]
  };
}

function createExercise(): StrengthExercise {
  return {
    id: `exercise-${Math.random().toString(36).slice(2, 10)}`,
    name: "",
    sets: 3,
    reps: 10,
    weight: 0,
    unit: "lb"
  };
}

function defaultDateTimeLocal(): string {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 16);
}

function formToInput(form: ManualFormState, canWriteToStrava: boolean): ManualActivityInput | string {
  const title = form.title.trim();
  if (!title) {
    return "Give the activity a title.";
  }

  const durationMin = Number(form.durationMin);
  if (!Number.isFinite(durationMin) || durationMin <= 0) {
    return "Minutes must be greater than zero.";
  }

  if (!form.startedAtLocal) {
    return "Pick a start time.";
  }

  const distanceKm = form.distanceKm ? Number(form.distanceKm) : undefined;
  if (showsDistance(form.category) && (!Number.isFinite(distanceKm) || (distanceKm || 0) <= 0)) {
    return "Distance sports need a distance in kilometers.";
  }

  if (form.category === "other" && !form.customSportLabel.trim()) {
    return "Add a custom label for the other category.";
  }

  const exercises = form.category === "weights"
    ? form.exercises
        .filter((exercise) => exercise.name.trim())
        .map((exercise) => ({
          ...exercise,
          sets: Math.max(1, exercise.sets),
          reps: Math.max(1, exercise.reps),
          weight: Math.max(0, exercise.weight)
        }))
    : undefined;

  if (form.category === "weights" && (!exercises || exercises.length === 0)) {
    return "Add at least one exercise for weight lifting.";
  }

  return {
    category: form.category,
    customSportLabel: form.customSportLabel.trim() || undefined,
    title,
    startedAtLocal: form.startedAtLocal,
    durationMin,
    distanceKm,
    calories: form.calories ? Number(form.calories) : undefined,
    description: form.description.trim() || undefined,
    exercises,
    syncToStrava: canWriteToStrava && form.syncToStrava
  };
}

function showsDistance(category: WorkoutSport): boolean {
  return category === "run" || category === "ride" || category === "swim" || category === "walk";
}

function isWithinLastDays(isoDate: string, days: number): boolean {
  return Date.now() - new Date(isoDate).getTime() <= days * 24 * 60 * 60 * 1000;
}

function formatDateTime(isoDate: string): string {
  return new Date(isoDate).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function formatMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`;
}

function formatZoneRange(bucket: WorkoutZoneBucket): string {
  if (bucket.min !== undefined && bucket.max !== undefined) {
    return `${trimNumber(bucket.min)}-${trimNumber(bucket.max)}`;
  }

  if (bucket.min !== undefined) {
    return `${trimNumber(bucket.min)}+`;
  }

  if (bucket.max !== undefined) {
    return `Up to ${trimNumber(bucket.max)}`;
  }

  return "Zone bucket";
}

function locationLine(athlete: ActivityDashboard["athlete"]): string {
  if (!athlete) {
    return "";
  }

  return [athlete.city, athlete.state, athlete.country].filter(Boolean).join(", ") || "Strava athlete";
}

function trimNumber(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function sportEmoji(sport: Workout["sport"]): string {
  return {
    run: "🏃",
    ride: "🚴",
    swim: "🏊",
    walk: "🚶",
    weights: "🏋️",
    other: "⚡"
  }[sport];
}
