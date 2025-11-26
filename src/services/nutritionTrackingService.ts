import { DayMeal, Meal, UserProfile, NutritionGoal } from '../types';

export interface NutritionData {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitamins?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
  };
  minerals?: {
    calcium?: number;
    iron?: number;
    magnesium?: number;
    phosphorus?: number;
    potassium?: number;
    zinc?: number;
    copper?: number;
    manganese?: number;
    selenium?: number;
  };
}

export interface NutritionProgress {
  current: NutritionData;
  target: NutritionData;
  percentage: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
  };
  status: 'deficit' | 'optimal' | 'excess';
}

export interface NutritionReport {
  date: string;
  nutrition: NutritionData;
  goals: NutritionProgress;
  score: number;
  recommendations: string[];
  achievements: string[];
}

export interface WaterIntake {
  amount: number; // in ml
  time: string;
  type: 'water' | 'tea' | 'coffee' | 'juice' | 'other';
}

export class NutritionTrackingService {
  // Calculate nutrition for a single meal
  static calculateMealNutrition(meal: Meal): NutritionData {
    return {
      calories: meal.nutrition.calories || 0,
      protein: meal.nutrition.protein || 0,
      carbs: meal.nutrition.carbs || 0,
      fat: meal.nutrition.fat || 0,
      fiber: meal.nutrition.fiber || 0,
      sugar: meal.nutrition.sugar || 0,
      sodium: meal.nutrition.sodium || 0,
      cholesterol: meal.nutrition.cholesterol || 0,
      vitamins: {
        vitaminA: meal.nutrition.vitamins?.vitaminA || 0,
        vitaminC: meal.nutrition.vitamins?.vitaminC || 0,
        vitaminD: meal.nutrition.vitamins?.vitaminD || 0,
        vitaminE: meal.nutrition.vitamins?.vitaminE || 0,
        vitaminK: meal.nutrition.vitamins?.vitaminK || 0,
        thiamin: meal.nutrition.vitamins?.thiamin || 0,
        riboflavin: meal.nutrition.vitamins?.riboflavin || 0,
        niacin: meal.nutrition.vitamins?.niacin || 0,
        vitaminB6: meal.nutrition.vitamins?.vitaminB6 || 0,
        folate: meal.nutrition.vitamins?.folate || 0,
        vitaminB12: meal.nutrition.vitamins?.vitaminB12 || 0,
      },
      minerals: {
        calcium: meal.nutrition.minerals?.calcium || 0,
        iron: meal.nutrition.minerals?.iron || 0,
        magnesium: meal.nutrition.minerals?.magnesium || 0,
        phosphorus: meal.nutrition.minerals?.phosphorus || 0,
        potassium: meal.nutrition.minerals?.potassium || 0,
        zinc: meal.nutrition.minerals?.zinc || 0,
        copper: meal.nutrition.minerals?.copper || 0,
        manganese: meal.nutrition.minerals?.manganese || 0,
        selenium: meal.nutrition.minerals?.selenium || 0,
      },
    };
  }

  // Calculate total nutrition for a day
  static calculateDayNutrition(dayMeal: DayMeal): NutritionData {
    const breakfast = this.calculateMealNutrition(dayMeal.meals.breakfast);
    const lunch = this.calculateMealNutrition(dayMeal.meals.lunch);
    const dinner = this.calculateMealNutrition(dayMeal.meals.dinner);

    const snacksNutrition = dayMeal.meals.snacks.reduce(
      (acc, snack) => {
        const snackNutrition = this.calculateMealNutrition(snack);
        return this.addNutritionData(acc, snackNutrition);
      },
      this.createEmptyNutritionData()
    );

    const mainMealsNutrition = this.addNutritionData(
      this.addNutritionData(breakfast, lunch),
      dinner
    );

    return this.addNutritionData(mainMealsNutrition, snacksNutrition);
  }

  // Calculate nutrition for completed meals only
  static calculateCompletedNutrition(dayMeal: DayMeal): NutritionData {
    let completedNutrition = this.createEmptyNutritionData();

    if (dayMeal.meals.breakfast.completed) {
      completedNutrition = this.addNutritionData(
        completedNutrition,
        this.calculateMealNutrition(dayMeal.meals.breakfast)
      );
    }

    if (dayMeal.meals.lunch.completed) {
      completedNutrition = this.addNutritionData(
        completedNutrition,
        this.calculateMealNutrition(dayMeal.meals.lunch)
      );
    }

    if (dayMeal.meals.dinner.completed) {
      completedNutrition = this.addNutritionData(
        completedNutrition,
        this.calculateMealNutrition(dayMeal.meals.dinner)
      );
    }

    dayMeal.meals.snacks.forEach(snack => {
      if (snack.completed) {
        completedNutrition = this.addNutritionData(
          completedNutrition,
          this.calculateMealNutrition(snack)
        );
      }
    });

    return completedNutrition;
  }

  // Recalculate day meal totals
  static recalculateDayMealTotals(dayMeal: DayMeal): DayMeal {
    const nutrition = this.calculateDayNutrition(dayMeal);
    return {
      ...dayMeal,
      totalCalories: Math.round(nutrition.calories),
    };
  }

  // Calculate daily nutrition goals based on user profile
  static calculateDailyNutritionGoals(userProfile: UserProfile): NutritionData {
    const { weight, height, age, gender, activityLevel } = userProfile.personalDetails;
    const { primaryGoal } = userProfile.healthGoals;
    
    // Calculate BMR using Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Apply activity factor
    let activityFactor = 1.2; // sedentary
    if (activityLevel === 'light') activityFactor = 1.375;
    else if (activityLevel === 'moderate') activityFactor = 1.55;
    else if (activityLevel === 'active') activityFactor = 1.725;
    else if (activityLevel === 'very_active') activityFactor = 1.9;

    // Calculate TDEE (Total Daily Energy Expenditure)
    let tdee = bmr * activityFactor;

    // Adjust for goals
    if (primaryGoal === 'weight_loss') tdee *= 0.85; // 15% deficit
    else if (primaryGoal === 'muscle_gain') tdee *= 1.15; // 15% surplus

    // Calculate macronutrient goals based on diet type
    let proteinRatio = 0.3; // default 30%
    let fatRatio = 0.3; // default 30%
    let carbsRatio = 0.4; // default 40%

    // Adjust ratios based on diet type
    if (userProfile.dietaryRestrictions.dietType === 'keto') {
      proteinRatio = 0.25;
      fatRatio = 0.7;
      carbsRatio = 0.05;
    } else if (userProfile.dietaryRestrictions.dietType === 'vegan') {
      proteinRatio = 0.2;
      fatRatio = 0.3;
      carbsRatio = 0.5;
    } else if (userProfile.dietaryRestrictions.dietType === 'paleo') {
      proteinRatio = 0.35;
      fatRatio = 0.35;
      carbsRatio = 0.3;
    }

    // Calculate grams from calories
    const proteinCalories = tdee * proteinRatio;
    const fatCalories = tdee * fatRatio;
    const carbsCalories = tdee * carbsRatio;

    return {
      calories: Math.round(tdee),
      protein: Math.round(proteinCalories / 4), // 4 calories per gram
      carbs: Math.round(carbsCalories / 4), // 4 calories per gram
      fat: Math.round(fatCalories / 9), // 9 calories per gram
      fiber: Math.round(age * 0.5 + 10), // General fiber recommendation
      sugar: Math.round(tdee * 0.1 / 4), // Limit sugar to 10% of calories
      sodium: 2300, // General recommendation
      cholesterol: gender === 'male' ? 300 : 200, // General recommendation
      vitamins: {
        vitaminA: 900,
        vitaminC: 90,
        vitaminD: 20,
        vitaminE: 15,
        vitaminK: 120,
        thiamin: 1.2,
        riboflavin: 1.3,
        niacin: 16,
        vitaminB6: 1.3,
        folate: 400,
        vitaminB12: 2.4,
      },
      minerals: {
        calcium: 1000,
        iron: gender === 'male' ? 8 : 18,
        magnesium: 420,
        phosphorus: 700,
        potassium: 3500,
        zinc: 11,
        copper: 0.9,
        manganese: 2.3,
        selenium: 55,
      },
    };
  }

  // Calculate nutrition progress against goals
  static calculateNutritionProgress(
    current: NutritionData,
    target: NutritionData
  ): NutritionProgress {
    const percentage = {
      calories: Math.round((current.calories / target.calories) * 100),
      protein: Math.round((current.protein / target.protein) * 100),
      carbs: Math.round((current.carbs / target.carbs) * 100),
      fat: Math.round((current.fat / target.fat) * 100),
      fiber: Math.round((current.fiber / target.fiber) * 100),
    };

    // Determine overall status
    let status: 'deficit' | 'optimal' | 'excess' = 'optimal';
    
    // Check if any major nutrient is significantly off target
    if (
      percentage.calories < 80 ||
      percentage.protein < 80 ||
      percentage.carbs < 80 ||
      percentage.fat < 80
    ) {
      status = 'deficit';
    } else if (
      percentage.calories > 120 ||
      percentage.protein > 120 ||
      percentage.carbs > 120 ||
      percentage.fat > 120
    ) {
      status = 'excess';
    }

    return {
      current,
      target,
      percentage,
      status,
    };
  }

  // Generate nutrition recommendations based on current intake vs goals
  static generateNutritionRecommendations(
    progress: NutritionProgress,
    userProfile: UserProfile
  ): string[] {
    const recommendations: string[] = [];
    const { percentage, status } = progress;

    // Calorie recommendations
    if (percentage.calories < 80) {
      recommendations.push("You're not consuming enough calories. Consider adding nutrient-dense snacks or slightly larger portions.");
    } else if (percentage.calories > 120) {
      recommendations.push("You're exceeding your calorie goal. Consider reducing portion sizes or choosing lower-calorie options.");
    }

    // Protein recommendations
    if (percentage.protein < 80) {
      recommendations.push("Increase your protein intake. Add lean meats, fish, eggs, or plant-based proteins to your meals.");
    } else if (percentage.protein > 120) {
      recommendations.push("You're consuming more protein than needed. Consider balancing with more carbohydrates and healthy fats.");
    }

    // Fat recommendations
    if (percentage.fat < 80) {
      recommendations.push("Include more healthy fats in your diet. Add avocados, nuts, seeds, or olive oil to your meals.");
    } else if (percentage.fat > 120) {
      recommendations.push("Reduce your fat intake. Choose leaner protein sources and limit added oils and fats.");
    }

    // Carbs recommendations
    if (percentage.carbs < 80) {
      recommendations.push("Increase your carbohydrate intake. Add whole grains, fruits, and vegetables to your meals.");
    } else if (percentage.carbs > 120) {
      recommendations.push("Reduce your carbohydrate intake. Focus on complex carbs and limit refined sugars.");
    }

    // Fiber recommendations
    if (percentage.fiber < 80) {
      recommendations.push("Increase your fiber intake. Add more vegetables, fruits, whole grains, and legumes to your diet.");
    }

    // Diet-specific recommendations
    if (userProfile.dietaryRestrictions.dietType === 'vegetarian' || userProfile.dietaryRestrictions.dietType === 'vegan') {
      if (percentage.protein < 80) {
        recommendations.push("As a vegetarian/vegan, ensure you're getting complete proteins by combining different plant sources.");
      }
      recommendations.push("Consider fortified foods or supplements for vitamin B12, especially if you're vegan.");
    }

    // Goal-specific recommendations
    if (userProfile.healthGoals.primaryGoal === 'weight_loss' && status === 'excess') {
      recommendations.push("For weight loss, focus on creating a moderate calorie deficit while maintaining adequate protein.");
    } else if (userProfile.healthGoals.primaryGoal === 'muscle_gain' && status === 'deficit') {
      recommendations.push("For muscle gain, ensure you're in a slight calorie surplus with adequate protein intake.");
    }

    return recommendations;
  }

  // Calculate nutrition score (0-100)
  static calculateNutritionScore(progress: NutritionProgress): number {
    const { percentage } = progress;
    
    // Calculate score based on how close to targets
    let score = 0;
    
    // Calorie score (40% weight)
    const calorieScore = percentage.calories >= 90 && percentage.calories <= 110 
      ? 100 
      : percentage.calories >= 80 && percentage.calories <= 120 
        ? 80 
        : Math.max(0, 100 - Math.abs(percentage.calories - 100));
    
    // Macronutrient scores (20% weight each)
    const proteinScore = percentage.protein >= 90 && percentage.protein <= 110 
      ? 100 
      : percentage.protein >= 80 && percentage.protein <= 120 
        ? 80 
        : Math.max(0, 100 - Math.abs(percentage.protein - 100));
    
    const carbsScore = percentage.carbs >= 90 && percentage.carbs <= 110 
      ? 100 
      : percentage.carbs >= 80 && percentage.carbs <= 120 
        ? 80 
        : Math.max(0, 100 - Math.abs(percentage.carbs - 100));
    
    const fatScore = percentage.fat >= 90 && percentage.fat <= 110 
      ? 100 
      : percentage.fat >= 80 && percentage.fat <= 120 
        ? 80 
        : Math.max(0, 100 - Math.abs(percentage.fat - 100));
    
    // Fiber score (20% weight)
    const fiberScore = percentage.fiber >= 100 ? 100 : percentage.fiber * 1.25;
    
    // Calculate weighted score
    score = (
      calorieScore * 0.4 + 
      proteinScore * 0.2 + 
      carbsScore * 0.2 + 
      fatScore * 0.1 + 
      fiberScore * 0.1
    );
    
    return Math.round(score);
  }

  // Generate daily nutrition report
  static generateDailyReport(
    dayMeal: DayMeal,
    userProfile: UserProfile
  ): NutritionReport {
    const currentNutrition = this.calculateCompletedNutrition(dayMeal);
    const targetNutrition = this.calculateDailyNutritionGoals(userProfile);
    const progress = this.calculateNutritionProgress(currentNutrition, targetNutrition);
    const score = this.calculateNutritionScore(progress);
    const recommendations = this.generateNutritionRecommendations(progress, userProfile);
    
    // Generate achievements
    const achievements: string[] = [];
    if (progress.percentage.fiber >= 100) {
      achievements.push("Fiber Goal Achieved! Great job on your digestive health.");
    }
    if (progress.percentage.protein >= 100 && progress.percentage.protein <= 110) {
      achievements.push("Protein Goal Achieved! Perfect for muscle maintenance and growth.");
    }
    if (score >= 90) {
      achievements.push("Excellent Nutrition Score! You're meeting your nutritional needs perfectly.");
    }
    
    return {
      date: dayMeal.date,
      nutrition: currentNutrition,
      goals: progress,
      score,
      recommendations,
      achievements,
    };
  }

  // Calculate weekly nutrition trends
  static calculateWeeklyTrends(reports: NutritionReport[]): {
    averageScore: number;
    trend: 'improving' | 'stable' | 'declining';
    strongestArea: string;
    weakestArea: string;
  } {
    if (reports.length < 2) {
      return {
        averageScore: 0,
        trend: 'stable',
        strongestArea: 'N/A',
        weakestArea: 'N/A',
      };
    }

    const scores = reports.map(report => report.score);
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    
    // Determine trend
    let trend: 'improving' | 'stable' | 'declining' = 'stable';
    const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
    const secondHalf = scores.slice(Math.floor(scores.length / 2));
    const firstHalfAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
    
    if (secondHalfAvg > firstHalfAvg + 5) {
      trend = 'improving';
    } else if (secondHalfAvg < firstHalfAvg - 5) {
      trend = 'declining';
    }
    
    // Determine strongest and weakest areas
    const avgProtein = reports.reduce((sum, report) => sum + report.goals.percentage.protein, 0) / reports.length;
    const avgCarbs = reports.reduce((sum, report) => sum + report.goals.percentage.carbs, 0) / reports.length;
    const avgFat = reports.reduce((sum, report) => sum + report.goals.percentage.fat, 0) / reports.length;
    const avgFiber = reports.reduce((sum, report) => sum + report.goals.percentage.fiber, 0) / reports.length;
    
    const areas = [
      { name: 'Protein', value: avgProtein },
      { name: 'Carbohydrates', value: avgCarbs },
      { name: 'Fat', value: avgFat },
      { name: 'Fiber', value: avgFiber },
    ];
    
    areas.sort((a, b) => b.value - a.value);
    
    return {
      averageScore: Math.round(averageScore),
      trend,
      strongestArea: areas[0].name,
      weakestArea: areas[areas.length - 1].name,
    };
  }

  // Track water intake
  static trackWaterIntake(
    currentIntake: WaterIntake[],
    newIntake: WaterIntake
  ): WaterIntake[] {
    return [...currentIntake, newIntake];
  }

  // Calculate daily water intake goal
  static calculateWaterGoal(weight: number, activityLevel: string): number {
    // Base water intake: 35ml per kg of body weight
    let baseIntake = weight * 35;
    
    // Adjust for activity level
    if (activityLevel === 'light') baseIntake *= 1.1;
    else if (activityLevel === 'moderate') baseIntake *= 1.2;
    else if (activityLevel === 'active') baseIntake *= 1.3;
    else if (activityLevel === 'very_active') baseIntake *= 1.4;
    
    return Math.round(baseIntake);
  }

  // Check for nutrient deficiencies
  static checkNutrientDeficiencies(
    nutrition: NutritionData,
    goals: NutritionData
  ): string[] {
    const deficiencies: string[] = [];
    
    if (nutrition.protein < goals.protein * 0.8) {
      deficiencies.push("Protein deficiency detected. Increase protein intake.");
    }
    
    if (nutrition.fiber < goals.fiber * 0.8) {
      deficiencies.push("Low fiber intake. Add more fruits, vegetables, and whole grains.");
    }
    
    if (nutrition.vitamins?.vitaminC && goals.vitamins?.vitaminC && 
        nutrition.vitamins.vitaminC < goals.vitamins.vitaminC * 0.8) {
      deficiencies.push("Vitamin C deficiency. Include more citrus fruits, berries, or vegetables.");
    }
    
    if (nutrition.minerals?.iron && goals.minerals?.iron && 
        nutrition.minerals.iron < goals.minerals.iron * 0.8) {
      deficiencies.push("Iron deficiency. Include more lean meats, beans, or leafy greens.");
    }
    
    if (nutrition.minerals?.calcium && goals.minerals?.calcium && 
        nutrition.minerals.calcium < goals.minerals.calcium * 0.8) {
      deficiencies.push("Calcium deficiency. Include more dairy products, leafy greens, or fortified foods.");
    }
    
    return deficiencies;
  }

  // Helper function to add two nutrition data objects
  private static addNutritionData(
    data1: NutritionData,
    data2: NutritionData
  ): NutritionData {
    return {
      calories: data1.calories + data2.calories,
      protein: data1.protein + data2.protein,
      carbs: data1.carbs + data2.carbs,
      fat: data1.fat + data2.fat,
      fiber: (data1.fiber || 0) + (data2.fiber || 0),
      sugar: (data1.sugar || 0) + (data2.sugar || 0),
      sodium: (data1.sodium || 0) + (data2.sodium || 0),
      cholesterol: (data1.cholesterol || 0) + (data2.cholesterol || 0),
      vitamins: {
        vitaminA: (data1.vitamins?.vitaminA || 0) + (data2.vitamins?.vitaminA || 0),
        vitaminC: (data1.vitamins?.vitaminC || 0) + (data2.vitamins?.vitaminC || 0),
        vitaminD: (data1.vitamins?.vitaminD || 0) + (data2.vitamins?.vitaminD || 0),
        vitaminE: (data1.vitamins?.vitaminE || 0) + (data2.vitamins?.vitaminE || 0),
        vitaminK: (data1.vitamins?.vitaminK || 0) + (data2.vitamins?.vitaminK || 0),
        thiamin: (data1.vitamins?.thiamin || 0) + (data2.vitamins?.thiamin || 0),
        riboflavin: (data1.vitamins?.riboflavin || 0) + (data2.vitamins?.riboflavin || 0),
        niacin: (data1.vitamins?.niacin || 0) + (data2.vitamins?.niacin || 0),
        vitaminB6: (data1.vitamins?.vitaminB6 || 0) + (data2.vitamins?.vitaminB6 || 0),
        folate: (data1.vitamins?.folate || 0) + (data2.vitamins?.folate || 0),
        vitaminB12: (data1.vitamins?.vitaminB12 || 0) + (data2.vitamins?.vitaminB12 || 0),
      },
      minerals: {
        calcium: (data1.minerals?.calcium || 0) + (data2.minerals?.calcium || 0),
        iron: (data1.minerals?.iron || 0) + (data2.minerals?.iron || 0),
        magnesium: (data1.minerals?.magnesium || 0) + (data2.minerals?.magnesium || 0),
        phosphorus: (data1.minerals?.phosphorus || 0) + (data2.minerals?.phosphorus || 0),
        potassium: (data1.minerals?.potassium || 0) + (data2.minerals?.potassium || 0),
        zinc: (data1.minerals?.zinc || 0) + (data2.minerals?.zinc || 0),
        copper: (data1.minerals?.copper || 0) + (data2.minerals?.copper || 0),
        manganese: (data1.minerals?.manganese || 0) + (data2.minerals?.manganese || 0),
        selenium: (data1.minerals?.selenium || 0) + (data2.minerals?.selenium || 0),
      },
    };
  }

  // Helper function to create empty nutrition data
  private static createEmptyNutritionData(): NutritionData {
    return {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
      vitamins: {
        vitaminA: 0,
        vitaminC: 0,
        vitaminD: 0,
        vitaminE: 0,
        vitaminK: 0,
        thiamin: 0,
        riboflavin: 0,
        niacin: 0,
        vitaminB6: 0,
        folate: 0,
        vitaminB12: 0,
      },
      minerals: {
        calcium: 0,
        iron: 0,
        magnesium: 0,
        phosphorus: 0,
        potassium: 0,
        zinc: 0,
        copper: 0,
        manganese: 0,
        selenium: 0,
      },
    };
  }
}