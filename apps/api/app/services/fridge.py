from __future__ import annotations

from app.schemas.common import FridgeScanRequest, FridgeScanResponse, MealSuggestion


DEFAULT_INGREDIENTS = [
    "eggs",
    "spinach",
    "Greek yogurt",
    "berries",
    "tortillas",
]


def analyze_fridge(request: FridgeScanRequest) -> FridgeScanResponse:
    detected = request.detected_ingredients or DEFAULT_INGREDIENTS
    normalized = sorted({item.strip().lower() for item in detected if item.strip()})
    suggestions = _build_meals(normalized)
    grocery_push = sorted(
        {ingredient for meal in suggestions for ingredient in meal.missing_ingredients}
    )
    return FridgeScanResponse(
        detected_ingredients=normalized,
        meal_suggestions=suggestions,
        grocery_push_candidates=grocery_push,
    )


def _build_meals(ingredients: list[str]) -> list[MealSuggestion]:
    ingredient_set = set(ingredients)
    meals: list[MealSuggestion] = []

    if {"eggs", "spinach"}.issubset(ingredient_set):
        meals.append(
            MealSuggestion(
                name="Spinach egg wrap",
                ingredients_used=["eggs", "spinach", "tortillas"],
                prep_time_minutes=10,
                why_it_is_healthy="Fast protein plus greens makes this a strong travel-day meal.",
                missing_ingredients=[] if "tortillas" in ingredient_set else ["whole wheat tortillas"],
            )
        )

    if {"greek yogurt", "berries"}.issubset(ingredient_set):
        meals.append(
            MealSuggestion(
                name="Berry yogurt bowl",
                ingredients_used=["greek yogurt", "berries"],
                prep_time_minutes=5,
                why_it_is_healthy="Protein, calcium, and fruit make it light but filling.",
                missing_ingredients=["granola"],
            )
        )

    meals.append(
        MealSuggestion(
            name="Quick breakfast tacos",
            ingredients_used=[item for item in ["eggs", "spinach", "tortillas"] if item in ingredient_set],
            prep_time_minutes=12,
            why_it_is_healthy="Balanced mix of protein and carbs that works well before a busy block.",
            missing_ingredients=[item for item in ["salsa", "avocado"] if item not in ingredient_set],
        )
    )
    return meals[:3]
