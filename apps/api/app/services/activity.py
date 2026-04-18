from __future__ import annotations

from app.schemas.common import ActivityEntry, ActivitySummary


def summarize_activity(workouts: list[ActivityEntry]) -> ActivitySummary:
    weekly_workouts = len(workouts)
    weekly_minutes = sum(item.duration_minutes for item in workouts)
    weekly_distance = round(sum(item.distance_miles or 0 for item in workouts), 1)
    calories_burned = sum(item.calories or 0 for item in workouts)
    trend_note = (
        "You are keeping momentum even with a variable schedule."
        if weekly_workouts >= 3
        else "A short movement session today would keep the streak alive."
    )
    return ActivitySummary(
        weekly_workouts=weekly_workouts,
        weekly_minutes=weekly_minutes,
        weekly_distance_miles=weekly_distance,
        calories_burned=calories_burned,
        trend_note=trend_note,
        workouts=sorted(workouts, key=lambda item: item.start_time, reverse=True),
    )
