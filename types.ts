
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

export enum PersonaType {
  PROFESSIONAL = 'Working Professional',
  STUDENT = 'Student',
  HOUSEHOLD = 'Large Household'
}

export interface SchedulingConfig {
  reminderTime: 'Morning' | 'Evening' | 'Both';
  cookingWindowStart: string;
  cookingWindowEnd: string;
  remindersPerDay: 1 | 2;
}

export interface FlexSlot {
  label: string;
  start: string;
  end: string;
}

export interface CalendarEvent {
  title: string;
  description: string;
  start: string;
  end: string;
  type: 'shopping' | 'prep' | 'cooking';
  alternativeSlots?: FlexSlot[]; // Added for uncertain schedules
}

export interface GroundingSource {
  title: string;
  uri: string;
  type: 'web' | 'maps';
}

export interface UserPersona {
  type: PersonaType;
  age?: number;
  mentalState?: string;
  workload?: 'Low' | 'Medium' | 'High' | 'Extreme';
  dislikes: string[];
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
  optimizationGoal?: OptimizationGoal;
  persona: UserPersona;
  scheduling: SchedulingConfig;
  onboardingStep: number;
}

export interface Meal {
  mealName: string;
  type: 'Breakfast' | 'Lunch' | 'Dinner';
  recipeTitle: string;
  ingredients: { name: string; amount: string; estimatedCost: number }[];
  instructions: string[];
  prepTime: number;
  logicForWorkload?: string;
}

export interface DayPlan {
  dayNumber: number;
  meals: Meal[];
  prepReminders: string[];
}

export interface GroceryStore {
  name: string;
  uri: string;
}

export interface MealPlanResponse {
  planTitle: string;
  days: DayPlan[];
  groceryList: { category: string; items: string[] }[];
  totalEstimatedCost: number;
  budgetStatus: string;
  fitnessNote?: string;
  calendarEvents: CalendarEvent[];
  groundingSources?: GroundingSource[];
  nearbyStores?: GroceryStore[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}
