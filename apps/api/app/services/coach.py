from __future__ import annotations

from app.schemas.common import CoachAdviceRequest, CoachAdviceResponse


def build_daily_advice(request: CoachAdviceRequest) -> CoachAdviceResponse:
    if request.travel_day:
        return CoachAdviceResponse(
            title="Travel day steady-energy plan",
            habit_tip="Keep a protein-first snack within reach before transit gaps get long.",
            why_it_matters="Travel compresses meal windows and usually pushes people toward sugar-heavy convenience food.",
            action_for_today="Buy one portable protein option and one hydration option before your next leg of travel.",
        )

    if request.recent_workout:
        return CoachAdviceResponse(
            title="Recovery matters today",
            habit_tip="Try to eat a protein-rich meal within a couple hours of your workout.",
            why_it_matters="Recovery nutrition helps energy, hunger control, and muscle repair later in the day.",
            action_for_today="Make your next meal include protein, color, and one easy carb source.",
        )

    if request.next_event_minutes is not None and request.next_event_minutes <= 30:
        return CoachAdviceResponse(
            title="Eat before the crunch",
            habit_tip="When your next meeting is close, choose the healthiest fast option instead of delaying food.",
            why_it_matters="Waiting too long usually leads to a bigger crash and worse choices later.",
            action_for_today="Grab something you can finish in under 10 minutes before the block starts.",
        )

    return CoachAdviceResponse(
        title="Small habit, big payoff",
        habit_tip="Lead with protein earlier in the day to reduce afternoon energy swings.",
        why_it_matters="A steadier first meal can make the rest of your decisions easier.",
        action_for_today="Anchor your next meal around protein first, then add fruit, greens, or whole grains.",
    )
