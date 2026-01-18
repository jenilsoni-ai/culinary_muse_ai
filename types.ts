
export enum DietType {
  VEG = 'Vegetarian',
  NON_VEG = 'Non-Vegetarian',
  VEGAN = 'Vegan',
  KETO = 'Keto'
}

export enum CityType {
  METRO = 'Metro (High Cost)',
  TIER_2 = 'Tier 2 (Moderate)',
  TIER_3 = 'Tier 3 (Budget Friendly)'
}

export enum KitchenSetup {
  MINIMAL = 'Minimal (Hot plate/Microwave)',
  STANDARD = 'Standard (Stove/Oven)',
  PRO = 'Pro (Air Fryer/Processor/Full Kit)'
}

export enum OptimizationGoal {
  TASTE = 'Taste',
  PROTEIN = 'High Protein',
  CHEAPEST = 'Cheapest',
  FASTEST = 'Fastest'
}

export interface UserPersona {
  age?: number;
  profession?: string;
  mentalState?: string;
  workload?: 'Low' | 'Medium' | 'High' | 'Extreme';
  upcomingEvents?: string;
}

export interface WorkoutDay {
  day: string;
  activity: string;
  focus: string;
}

export interface UserPreferences {
  dietType: DietType;
  ingredients: string[];
  lockedIngredients: string[];
  cityType: CityType;
  dailyBudget: number;
  kitchenSetup: KitchenSetup;
  days: number;
  timePerMeal: number;
  workoutPlanEnabled: boolean;
  selectedWorkoutDay?: WorkoutDay;
  optimizationGoal?: OptimizationGoal;
  persona?: UserPersona;
}

export interface Meal {
  mealName: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  recipeTitle: string;
  ingredients: { name: string; amount: string; estimatedCost: number }[];
  instructions: string[];
  substitutions: string[];
  prepTime: number;
  logicForWorkload?: string; // Why this meal fits the day's mental/physical state
}

export interface DayPlan {
  dayNumber: number;
  workoutInfo?: string;
  meals: Meal[];
  dailyCookingSequence: string[];
}

export interface MealPlanResponse {
  planTitle: string;
  days: DayPlan[];
  groceryList: { category: string; items: string[] }[];
  totalEstimatedCost: number;
  budgetStatus: 'Under Budget' | 'On Track' | 'Over Budget';
  fitnessNote?: string;
}

export const DUMMY_WORKOUT_PLAN: WorkoutDay[] = [
  { day: 'Monday', activity: 'Heavy Lifting: Legs', focus: 'High Protein & Complex Carbs' },
  { day: 'Tuesday', activity: 'HIIT Cardio', focus: 'Quick Energy & Electrolytes' },
  { day: 'Wednesday', activity: 'Rest & Recovery', focus: 'Anti-inflammatory & Light' },
  { day: 'Thursday', activity: 'Upper Body Power', focus: 'High Protein' },
  { day: 'Friday', activity: 'Yoga & Mobility', focus: 'Hydrating & Fiber' },
  { day: 'Saturday', activity: 'Endurance Run', focus: 'Carb Loading' },
  { day: 'Sunday', activity: 'Rest Day', focus: 'Low Carb / Clean' },
];

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
