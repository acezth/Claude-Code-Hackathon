from __future__ import annotations

from app.schemas.common import FoodOption, NearbyFoodRequest, NearbyFoodResponse


BASE_OPTIONS = [
    {
        "id": "sweetgreen-bowl",
        "name": "Sweetgreen",
        "category": "restaurant",
        "address": "142 Market St",
        "distance_miles": 0.4,
        "travel_minutes": 7,
        "meal_suggestion": "Chicken + sweet potato bowl",
        "nutrition_score": 0.92,
        "distance_score": 0.84,
        "time_to_get_food_score": 0.74,
        "tags": ["protein", "fiber", "steady energy"],
    },
    {
        "id": "publix-wrap",
        "name": "Publix",
        "category": "grocery",
        "address": "88 Riverside Ave",
        "distance_miles": 0.7,
        "travel_minutes": 9,
        "meal_suggestion": "Turkey wrap + fruit cup",
        "nutrition_score": 0.86,
        "distance_score": 0.76,
        "time_to_get_food_score": 0.82,
        "tags": ["grab and go", "portable", "protein"],
    },
    {
        "id": "whole-foods-box",
        "name": "Whole Foods Market",
        "category": "grocery",
        "address": "201 Congress Ave",
        "distance_miles": 1.1,
        "travel_minutes": 13,
        "meal_suggestion": "Salmon box + berries",
        "nutrition_score": 0.95,
        "distance_score": 0.62,
        "time_to_get_food_score": 0.64,
        "tags": ["recovery", "omega-3", "premium"],
    },
    {
        "id": "starbucks-snack",
        "name": "Starbucks",
        "category": "cafe",
        "address": "9 Congress Ave",
        "distance_miles": 0.2,
        "travel_minutes": 4,
        "meal_suggestion": "Egg bites + banana",
        "nutrition_score": 0.71,
        "distance_score": 0.95,
        "time_to_get_food_score": 0.93,
        "tags": ["fast", "caffeine optional", "airport friendly"],
    },
]


def _schedule_fit(request: NearbyFoodRequest, option: dict) -> float:
    next_event = request.next_event_minutes
    if next_event is None:
        return 0.7
    if next_event <= 15:
        return 0.98 if option["travel_minutes"] <= 6 else 0.55
    if next_event <= 30:
        return 0.92 if option["travel_minutes"] <= 10 else 0.68
    if request.goal == "light meal":
        return 0.88 if "fiber" in option["tags"] or "grab and go" in option["tags"] else 0.7
    return 0.84 if option["nutrition_score"] >= 0.8 else 0.67


def _user_preference_fit(request: NearbyFoodRequest, option: dict) -> float:
    goal = (request.goal or "").lower()
    if "protein" in goal:
        return 0.94 if "protein" in option["tags"] else 0.66
    if "energy" in goal:
        return 0.93 if "steady energy" in option["tags"] else 0.71
    if "light" in goal:
        return 0.88 if option["nutrition_score"] < 0.9 else 0.8
    return 0.78


def build_nearby_recommendations(request: NearbyFoodRequest) -> NearbyFoodResponse:
    scored: list[FoodOption] = []
    for option in BASE_OPTIONS:
        schedule_fit = _schedule_fit(request, option)
        user_pref = _user_preference_fit(request, option)
        final_score = (
            0.35 * option["nutrition_score"]
            + 0.20 * option["distance_score"]
            + 0.20 * option["time_to_get_food_score"]
            + 0.15 * schedule_fit
            + 0.10 * user_pref
        )
        scored.append(
            FoodOption(
                **option,
                schedule_fit_score=round(schedule_fit, 2),
                user_preference_score=round(user_pref, 2),
                final_score=round(final_score, 3),
                reason=_build_reason(request, option["meal_suggestion"], schedule_fit),
            )
        )

    ranked = sorted(scored, key=lambda item: item.final_score, reverse=True)
    best = ranked[0]
    coach_summary = (
        f"Best option right now is {best.meal_suggestion} from {best.name}. "
        f"It balances speed, protein, and schedule fit for the next part of your day."
    )
    quick_tip = _quick_tip(request)
    return NearbyFoodResponse(best_option=best, backup_options=ranked[1:4], coach_summary=coach_summary, quick_tip=quick_tip)


def _build_reason(request: NearbyFoodRequest, meal: str, schedule_fit: float) -> str:
    if request.next_event_minutes is not None and request.next_event_minutes <= 20:
        return f"{meal} is realistic before your next event and still gives you stable energy."
    if schedule_fit >= 0.84:
        return f"{meal} fits your available window and supports a steadier energy curve."
    return f"{meal} is a decent fallback when convenience has to win."


def _quick_tip(request: NearbyFoodRequest) -> str:
    if request.next_event_minutes is not None and request.next_event_minutes <= 20:
        return "Choose something portable and eat before the meeting block starts."
    if request.goal and "energy" in request.goal.lower():
        return "Pair protein with carbs now so your afternoon energy stays more stable."
    return "A solid option beats waiting for the perfect option when your schedule is packed."
