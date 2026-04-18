from __future__ import annotations

from datetime import datetime, timezone
from typing import Literal

from pydantic import BaseModel, Field


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: str


class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    dietary_preferences: list[str] = Field(default_factory=list)
    allergies: list[str] = Field(default_factory=list)
    goals: list[str] = Field(default_factory=list)
    caffeine_preference: str = "moderate"
    home_city: str = "New York"
    coach_tone: str = "supportive"
    created_at: datetime = Field(default_factory=utc_now)


class ProfileUpdate(BaseModel):
    name: str | None = None
    dietary_preferences: list[str] | None = None
    allergies: list[str] | None = None
    goals: list[str] | None = None
    caffeine_preference: str | None = None
    home_city: str | None = None
    coach_tone: str | None = None


class SignUpRequest(BaseModel):
    name: str
    email: str
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class IntegrationStatus(BaseModel):
    provider_name: str
    connected: bool
    last_synced_at: datetime | None = None
    status_note: str


class SyncResponse(BaseModel):
    provider_name: str
    synced_records: int
    summary: str
    last_synced_at: datetime = Field(default_factory=utc_now)


class FoodOption(BaseModel):
    id: str
    name: str
    category: Literal["grocery", "restaurant", "cafe", "convenience"]
    address: str
    distance_miles: float
    travel_minutes: int
    is_open: bool = True
    meal_suggestion: str
    nutrition_score: float
    distance_score: float
    time_to_get_food_score: float
    schedule_fit_score: float
    user_preference_score: float
    final_score: float
    tags: list[str] = Field(default_factory=list)
    reason: str


class NearbyFoodRequest(BaseModel):
    lat: float
    lng: float
    radius: int = 2000
    current_time: datetime
    goal: str | None = None
    next_event_minutes: int | None = None
    include_email_context: bool = False


class NearbyFoodResponse(BaseModel):
    best_option: FoodOption
    backup_options: list[FoodOption]
    coach_summary: str
    quick_tip: str


class MealSuggestion(BaseModel):
    name: str
    ingredients_used: list[str]
    prep_time_minutes: int
    why_it_is_healthy: str
    missing_ingredients: list[str] = Field(default_factory=list)


class FridgeScanRequest(BaseModel):
    image_url: str | None = None
    detected_ingredients: list[str] | None = None
    goal: str | None = None


class FridgeScanResponse(BaseModel):
    detected_ingredients: list[str]
    meal_suggestions: list[MealSuggestion]
    grocery_push_candidates: list[str]


class GroceryListItem(BaseModel):
    id: str
    item_name: str
    category: Literal[
        "produce",
        "protein",
        "dairy",
        "pantry",
        "frozen",
        "snacks",
        "beverages",
    ]
    quantity: str = "1"
    checked: bool = False


class GroceryList(BaseModel):
    id: str
    title: str
    created_at: datetime = Field(default_factory=utc_now)
    items: list[GroceryListItem] = Field(default_factory=list)


class GroceryListCreate(BaseModel):
    title: str


class GroceryItemCreate(BaseModel):
    item_name: str
    category: Literal[
        "produce",
        "protein",
        "dairy",
        "pantry",
        "frozen",
        "snacks",
        "beverages",
    ]
    quantity: str = "1"


class GroceryItemUpdate(BaseModel):
    item_name: str | None = None
    category: Literal[
        "produce",
        "protein",
        "dairy",
        "pantry",
        "frozen",
        "snacks",
        "beverages",
    ] | None = None
    quantity: str | None = None
    checked: bool | None = None


class GroceryFromMealRequest(BaseModel):
    title: str = "Meal top-up"
    items: list[str]


class ActivityEntry(BaseModel):
    id: str
    source: Literal["manual", "strava"]
    activity_type: str
    duration_minutes: int
    distance_miles: float | None = None
    calories: int | None = None
    start_time: datetime
    notes: str | None = None


class ActivitySummary(BaseModel):
    weekly_workouts: int
    weekly_minutes: int
    weekly_distance_miles: float
    calories_burned: int
    trend_note: str
    workouts: list[ActivityEntry]


class ManualWorkoutCreate(BaseModel):
    activity_type: str
    duration_minutes: int
    distance_miles: float | None = None
    calories: int | None = None
    start_time: datetime
    notes: str | None = None


class CoachAdviceRequest(BaseModel):
    goal: str | None = None
    next_event_minutes: int | None = None
    schedule_intensity: Literal["light", "medium", "heavy"] = "medium"
    recent_workout: bool = False
    travel_day: bool = False


class CoachAdviceResponse(BaseModel):
    title: str
    habit_tip: str
    why_it_matters: str
    action_for_today: str

