import type {
  ActivitySummary,
  CoachAdviceResponse,
  FridgeScanResponse,
  GroceryList,
  IntegrationStatus,
  NearbyFoodResponse,
  UserProfile,
} from "@/lib/types";

export const mockNearby: NearbyFoodResponse = {
  best_option: {
    id: "sweetgreen-bowl",
    name: "Sweetgreen",
    category: "restaurant",
    address: "142 Market St",
    distance_miles: 0.4,
    travel_minutes: 7,
    is_open: true,
    meal_suggestion: "Chicken + sweet potato bowl",
    nutrition_score: 0.92,
    distance_score: 0.84,
    time_to_get_food_score: 0.74,
    schedule_fit_score: 0.86,
    user_preference_score: 0.93,
    final_score: 0.859,
    tags: ["protein", "fiber", "steady energy"],
    reason:
      "It fits your window before the next meeting and gives you steadier energy than a pastry or snack-only stop.",
  },
  backup_options: [
    {
      id: "publix-wrap",
      name: "Publix",
      category: "grocery",
      address: "88 Riverside Ave",
      distance_miles: 0.7,
      travel_minutes: 9,
      is_open: true,
      meal_suggestion: "Turkey wrap + fruit cup",
      nutrition_score: 0.86,
      distance_score: 0.76,
      time_to_get_food_score: 0.82,
      schedule_fit_score: 0.9,
      user_preference_score: 0.94,
      final_score: 0.844,
      tags: ["grab and go", "portable", "protein"],
      reason: "A strong backup if you need the fastest realistic healthy option.",
    },
    {
      id: "starbucks-snack",
      name: "Starbucks",
      category: "cafe",
      address: "9 Congress Ave",
      distance_miles: 0.2,
      travel_minutes: 4,
      is_open: true,
      meal_suggestion: "Egg bites + banana",
      nutrition_score: 0.71,
      distance_score: 0.95,
      time_to_get_food_score: 0.93,
      schedule_fit_score: 0.98,
      user_preference_score: 0.71,
      final_score: 0.838,
      tags: ["fast", "caffeine optional"],
      reason: "Best pure speed option when your time window is extremely tight.",
    },
  ],
  coach_summary:
    "You have a late meeting block coming up, so the best move is a protein-forward lunch that is still quick to grab.",
  quick_tip:
    "Prioritize protein plus a carb now so your energy stays stable through the afternoon.",
};

export const mockFridge: FridgeScanResponse = {
  detected_ingredients: ["eggs", "spinach", "greek yogurt", "berries", "tortillas"],
  meal_suggestions: [
    {
      name: "Spinach egg wrap",
      ingredients_used: ["eggs", "spinach", "tortillas"],
      prep_time_minutes: 10,
      why_it_is_healthy:
        "Quick protein and greens make this ideal when you need something substantial but fast.",
      missing_ingredients: [],
    },
    {
      name: "Berry yogurt bowl",
      ingredients_used: ["greek yogurt", "berries"],
      prep_time_minutes: 5,
      why_it_is_healthy:
        "Light, high-protein, and easy when you need something refreshing.",
      missing_ingredients: ["granola"],
    },
    {
      name: "Quick breakfast tacos",
      ingredients_used: ["eggs", "spinach", "tortillas"],
      prep_time_minutes: 12,
      why_it_is_healthy:
        "A balanced mix of protein and carbs that works especially well before a busy block.",
      missing_ingredients: ["salsa", "avocado"],
    },
  ],
  grocery_push_candidates: ["avocado", "granola", "salsa"],
};

export const mockGroceryLists: GroceryList[] = [
  {
    id: "week-1",
    title: "This week on the road",
    created_at: "2026-04-18T10:00:00Z",
    items: [
      { id: "1", item_name: "Greek yogurt", category: "dairy", quantity: "4 cups", checked: false },
      { id: "2", item_name: "Baby spinach", category: "produce", quantity: "1 bag", checked: false },
      { id: "3", item_name: "Turkey slices", category: "protein", quantity: "1 pack", checked: false },
      { id: "4", item_name: "Sparkling water", category: "beverages", quantity: "8 cans", checked: true },
    ],
  },
];

export const mockActivity: ActivitySummary = {
  weekly_workouts: 3,
  weekly_minutes: 128,
  weekly_distance_miles: 9.6,
  calories_burned: 930,
  trend_note: "You are keeping momentum even with a variable schedule.",
  workouts: [
    {
      id: "run-1",
      source: "strava",
      activity_type: "Morning run",
      duration_minutes: 42,
      distance_miles: 4.8,
      calories: 410,
      start_time: "2026-04-17T07:30:00Z",
      notes: "Easy effort before travel",
    },
    {
      id: "gym-1",
      source: "manual",
      activity_type: "Hotel gym circuit",
      duration_minutes: 28,
      calories: 220,
      start_time: "2026-04-16T06:45:00Z",
      notes: "Quick upper body and core",
    },
  ],
};

export const mockCoach: CoachAdviceResponse = {
  title: "Eat before the crunch",
  habit_tip:
    "When your schedule tightens, the smartest move is the healthiest fast option, not waiting for the perfect one.",
  why_it_matters:
    "Long gaps make later choices harder and increase the odds of an energy crash.",
  action_for_today:
    "Get one meal or snack in before your next packed block starts, even if it is simple.",
};

export const mockProfile: UserProfile = {
  id: "demo-user",
  name: "Taylor Roam",
  email: "taylor@roamwell.app",
  dietary_preferences: ["high protein", "travel friendly"],
  allergies: ["peanuts"],
  goals: ["more energy", "better recovery", "fewer crashes"],
  caffeine_preference: "moderate",
  home_city: "Austin",
  coach_tone: "supportive",
  created_at: "2026-04-10T10:00:00Z",
};

export const mockIntegrations: IntegrationStatus[] = [
  {
    provider_name: "google_calendar",
    connected: true,
    last_synced_at: "2026-04-18T09:20:00Z",
    status_note: "Calendar connected. 4 upcoming events cached.",
  },
  {
    provider_name: "gmail",
    connected: false,
    status_note: "Optional. Enable for travel confirmations and schedule hints.",
  },
  {
    provider_name: "strava",
    connected: true,
    last_synced_at: "2026-04-17T18:30:00Z",
    status_note: "Connected. Last sync pulled 2 activities.",
  },
];
