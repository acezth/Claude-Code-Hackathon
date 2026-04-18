export type FoodOption = {
  id: string;
  name: string;
  category: "grocery" | "restaurant" | "cafe" | "convenience";
  address: string;
  distance_miles: number;
  travel_minutes: number;
  is_open: boolean;
  meal_suggestion: string;
  nutrition_score: number;
  distance_score: number;
  time_to_get_food_score: number;
  schedule_fit_score: number;
  user_preference_score: number;
  final_score: number;
  tags: string[];
  reason: string;
};

export type NearbyFoodResponse = {
  best_option: FoodOption;
  backup_options: FoodOption[];
  coach_summary: string;
  quick_tip: string;
};

export type MealSuggestion = {
  name: string;
  ingredients_used: string[];
  prep_time_minutes: number;
  why_it_is_healthy: string;
  missing_ingredients: string[];
};

export type FridgeScanResponse = {
  detected_ingredients: string[];
  meal_suggestions: MealSuggestion[];
  grocery_push_candidates: string[];
};

export type GroceryListItem = {
  id: string;
  item_name: string;
  category:
    | "produce"
    | "protein"
    | "dairy"
    | "pantry"
    | "frozen"
    | "snacks"
    | "beverages";
  quantity: string;
  checked: boolean;
};

export type GroceryList = {
  id: string;
  title: string;
  created_at: string;
  items: GroceryListItem[];
};

export type ActivityEntry = {
  id: string;
  source: "manual" | "strava";
  activity_type: string;
  duration_minutes: number;
  distance_miles?: number | null;
  calories?: number | null;
  start_time: string;
  notes?: string | null;
};

export type ActivitySummary = {
  weekly_workouts: number;
  weekly_minutes: number;
  weekly_distance_miles: number;
  calories_burned: number;
  trend_note: string;
  workouts: ActivityEntry[];
};

export type CoachAdviceResponse = {
  title: string;
  habit_tip: string;
  why_it_matters: string;
  action_for_today: string;
};

export type UserProfile = {
  id: string;
  name: string;
  email: string;
  dietary_preferences: string[];
  allergies: string[];
  goals: string[];
  caffeine_preference: string;
  home_city: string;
  coach_tone: string;
  created_at: string;
};

export type IntegrationStatus = {
  provider_name: string;
  connected: boolean;
  last_synced_at?: string | null;
  status_note: string;
};
