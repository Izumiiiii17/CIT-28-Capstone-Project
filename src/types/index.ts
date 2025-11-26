export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phoneNumber: string;
  personalDetails: {
    age: number;
    gender: 'male' | 'female' | 'other';
    weight: number; // kg
    height: number; // cm
    activityLevel: 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
  };
  healthGoals: {
    primary: 'weight_loss' | 'muscle_gain' | 'maintenance' | 'general_health';
    targetWeight?: number;
    timeframe?: string;
  };
  dietaryRestrictions: {
    allergies: string[];
    intolerances: string[];
    dietType: 'omnivore' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto' | 'paleo';
    restrictions: string[];
  };
  preferences: {
    cuisines: string[];
    mealTimings: {
      breakfast: string;
      lunch: string;
      dinner: string;
      snacks: string[];
    };
    budgetRange: 'low' | 'medium' | 'high';
  };
  medicalConditions: string[];
  sportActivities: string[];
  planDuration: number;
  planDurationType: 'days' | 'weeks' | 'months';
  createdAt: string;
  updatedAt: string;
}

export interface DietPlan {
  id: string;
  userId: string;
  name: string;
  description: string;
  duration: number; // days
  dailyCalories: number;
  macros: {
    protein: number; // grams
    carbs: number; // grams
    fat: number; // grams
  };
  meals: DayMeal[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  progress: {
    completedDays: number;
    totalDays: number;
    adherenceRate: number;
  };
}

export interface DayMeal {
  day: number;
  date: string;
  meals: {
    breakfast: Meal;
    lunch: Meal;
    dinner: Meal;
    snacks: Meal[];
  };
  totalCalories: number;
  completed: boolean;
  notes?: string;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string[];
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  completed: boolean;
  rating?: number;
  notes?: string;
  modifications?: string[];
}

export interface Ingredient {
  id: string;
  name: string;
  amount: number;
  unit: string;
  calories: number;
  optional?: boolean;
}

export interface NotificationSettings {
  smsEnabled: boolean;
  emailEnabled: boolean;
  mealReminders: boolean;
  progressUpdates: boolean;
  phoneNumber: string;
}

export interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface SMSNotification {
  to: string;
  message: string;
  type: 'meal_reminder' | 'progress_update' | 'plan_generated';
  scheduledTime?: string;
}