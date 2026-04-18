from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import uuid4

from app.schemas.common import (
    ActivityEntry,
    GroceryList,
    GroceryListItem,
    IntegrationStatus,
    UserProfile,
)


def _now() -> datetime:
    return datetime.now(timezone.utc)


USER_ID = "demo-user"

user_profile = UserProfile(
    id=USER_ID,
    name="Taylor Roam",
    email="taylor@roamwell.app",
    dietary_preferences=["high protein", "travel friendly"],
    allergies=["peanuts"],
    goals=["more energy", "better recovery", "fewer crashes"],
    caffeine_preference="moderate",
    home_city="Austin",
)

integrations: dict[str, IntegrationStatus] = {
    "google_calendar": IntegrationStatus(
        provider_name="google_calendar",
        connected=True,
        last_synced_at=_now() - timedelta(hours=2),
        status_note="Calendar connected. 4 upcoming events cached.",
    ),
    "gmail": IntegrationStatus(
        provider_name="gmail",
        connected=False,
        status_note="Optional. Enable for travel confirmations and schedule hints.",
    ),
    "strava": IntegrationStatus(
        provider_name="strava",
        connected=True,
        last_synced_at=_now() - timedelta(hours=16),
        status_note="Connected. Last sync pulled 2 activities.",
    ),
}

grocery_lists: list[GroceryList] = [
    GroceryList(
        id=str(uuid4()),
        title="This week on the road",
        items=[
            GroceryListItem(
                id=str(uuid4()),
                item_name="Greek yogurt",
                category="dairy",
                quantity="4 cups",
            ),
            GroceryListItem(
                id=str(uuid4()),
                item_name="Baby spinach",
                category="produce",
                quantity="1 bag",
            ),
            GroceryListItem(
                id=str(uuid4()),
                item_name="Turkey slices",
                category="protein",
                quantity="1 pack",
            ),
            GroceryListItem(
                id=str(uuid4()),
                item_name="Sparkling water",
                category="beverages",
                quantity="8 cans",
                checked=True,
            ),
        ],
    )
]

workouts: list[ActivityEntry] = [
    ActivityEntry(
        id=str(uuid4()),
        source="strava",
        activity_type="Morning run",
        duration_minutes=42,
        distance_miles=4.8,
        calories=410,
        start_time=_now() - timedelta(days=1, hours=2),
        notes="Easy effort before travel",
    ),
    ActivityEntry(
        id=str(uuid4()),
        source="manual",
        activity_type="Hotel gym circuit",
        duration_minutes=28,
        distance_miles=None,
        calories=220,
        start_time=_now() - timedelta(days=2, hours=5),
        notes="Quick upper body and core",
    ),
]


def generate_id() -> str:
    return str(uuid4())
