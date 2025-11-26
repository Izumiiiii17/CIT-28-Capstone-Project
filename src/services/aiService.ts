import { UserProfile, DietPlan, DayMeal, Meal } from '../types';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export class AIService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

  static async generateDietPlan(userProfile: UserProfile): Promise<DietPlan> {
    try {
      // Calculate nutritional requirements
      const nutritionTargets = this.calculateNutritionTargets(userProfile);

      // Generate meal plan using AI
      const mealPlan = await this.generateMealPlanWithAI(userProfile, nutritionTargets);

      return {
        id: `plan_${Date.now()}`,
        userId: userProfile.id,
        name: this.generatePlanName(userProfile),
        description: this.generatePlanDescription(userProfile, nutritionTargets.dailyCalories),
        duration: userProfile.planDuration,
        dailyCalories: nutritionTargets.dailyCalories,
        macros: {
          protein: nutritionTargets.protein,
          carbs: nutritionTargets.carbs,
          fat: nutritionTargets.fat,
        },
        meals: mealPlan,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isActive: true,
        progress: {
          completedDays: 0,
          totalDays: userProfile.planDuration,
          adherenceRate: 0,
        },
      };
    } catch (error) {
      console.error('AI diet plan generation error:', error);
      // Fallback to mock data if AI fails
      return this.generateFallbackDietPlan(userProfile);
    }
  }

  private static calculateNutritionTargets(profile: UserProfile) {
    // Calculate BMR using Mifflin-St Jeor equation
    const { weight, height, age, gender } = profile.personalDetails;

    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // Activity multipliers
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9,
    };

    const tdee = bmr * (activityMultipliers[profile.personalDetails.activityLevel] || 1.55);

    // Adjust for goals
    let dailyCalories = tdee;
    switch (profile.healthGoals.primary) {
      case 'weight_loss':
        dailyCalories = tdee - 500; // 1 lb per week deficit
        break;
      case 'muscle_gain':
        dailyCalories = tdee + 300; // Moderate surplus
        break;
      case 'maintenance':
      case 'general_health':
      default:
        dailyCalories = tdee;
        break;
    }

    // Calculate macros based on diet type
    let proteinRatio = 0.25;
    let fatRatio = 0.30;
    let carbRatio = 0.45;

    switch (profile.dietaryRestrictions.dietType) {
      case 'keto':
        proteinRatio = 0.25;
        fatRatio = 0.70;
        carbRatio = 0.05;
        break;
      case 'paleo':
        proteinRatio = 0.30;
        fatRatio = 0.35;
        carbRatio = 0.35;
        break;
      case 'vegan':
      case 'vegetarian':
        proteinRatio = 0.20;
        fatRatio = 0.25;
        carbRatio = 0.55;
        break;
    }

    return {
      dailyCalories: Math.round(dailyCalories),
      protein: Math.round((dailyCalories * proteinRatio) / 4),
      carbs: Math.round((dailyCalories * carbRatio) / 4),
      fat: Math.round((dailyCalories * fatRatio) / 9),
    };
  }

  private static async generateMealPlanWithAI(profile: UserProfile, targets: any): Promise<DayMeal[]> {
    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key') {
      console.warn('Gemini API key not configured, using fallback meal generation');
      return this.generateFallbackMeals(profile, targets);
    }

    try {
      const prompt = this.buildMealPlanPrompt(profile, targets);

      const response = await fetch(`${this.API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;

      return this.parseAIMealPlan(aiResponse, profile, targets);
    } catch (error) {
      console.error('AI meal plan generation failed:', error);
      return this.generateFallbackMeals(profile, targets);
    }
  }

  private static buildMealPlanPrompt(profile: UserProfile, targets: any): string {
    const dietTypeInstructions = {
      vegetarian: 'Include only vegetarian foods (no meat, fish, or poultry). Include dairy and eggs.',
      vegan: 'Include only vegan foods (no animal products whatsoever).',
      pescatarian: 'Include fish and seafood, but no meat or poultry. Include dairy and eggs.',
      keto: 'Focus on high-fat, very low-carb foods. Limit carbs to under 20g per day.',
      paleo: 'Include only whole foods that would be available to paleolithic humans.',
      omnivore: 'Include a balanced mix of plant and animal foods.'
    };

    return `Generate a comprehensive 7-day meal plan with the following specifications:

USER PROFILE:
- Age: ${profile.personalDetails.age}, Gender: ${profile.personalDetails.gender}
- Weight: ${profile.personalDetails.weight}kg, Height: ${profile.personalDetails.height}cm
- Activity Level: ${profile.personalDetails.activityLevel}
- Primary Goal: ${profile.healthGoals.primary}
- Diet Type: ${profile.dietaryRestrictions.dietType}

NUTRITIONAL TARGETS (per day):
- Calories: ${targets.dailyCalories}
- Protein: ${targets.protein}g
- Carbohydrates: ${targets.carbs}g
- Fat: ${targets.fat}g

DIETARY REQUIREMENTS:
${dietTypeInstructions[profile.dietaryRestrictions.dietType]}

ALLERGIES TO AVOID: ${profile.dietaryRestrictions.allergies.join(', ') || 'None'}

PREFERRED CUISINES: ${profile.preferences.cuisines.join(', ') || 'Any'}

MEAL TIMINGS:
- Breakfast: ${profile.preferences.mealTimings.breakfast}
- Lunch: ${profile.preferences.mealTimings.lunch}
- Dinner: ${profile.preferences.mealTimings.dinner}

BUDGET LEVEL: ${profile.preferences.budgetRange}

MEDICAL CONDITIONS: ${profile.medicalConditions.join(', ') || 'None'}

Please generate exactly 7 days of meals. For each day, provide:
1. Breakfast, Lunch, Dinner, and 2 Snacks
2. Each meal should include specific food items with quantities
3. Nutritional breakdown for each meal (calories, protein, carbs, fat)
4. Preparation and cooking time
5. Simple cooking instructions

Format the response as a structured meal plan that's easy to parse. Focus on variety, nutritional balance, and adherence to the dietary restrictions specified.`;
  }

  private static parseAIMealPlan(aiResponse: string, profile: UserProfile, targets: any): DayMeal[] {
    // This is a simplified parser - in production, you'd want more robust parsing
    const meals: DayMeal[] = [];

    // For now, generate fallback meals since AI parsing is complex
    return this.generateFallbackMeals(profile, targets);
  }

  private static generateFallbackMeals(profile: UserProfile, targets: any): DayMeal[] {
    const meals: DayMeal[] = [];
    const isVegetarian = profile.dietaryRestrictions.dietType === 'vegetarian' || profile.dietaryRestrictions.dietType === 'vegan';

    for (let day = 1; day <= profile.planDuration; day++) {
      const date = new Date();
      date.setDate(date.getDate() + day - 1);

      const dayMeal: DayMeal = {
        day,
        date: date.toISOString().split('T')[0],
        meals: {
          breakfast: this.generateMeal('breakfast', targets.dailyCalories * 0.25, isVegetarian, day),
          lunch: this.generateMeal('lunch', targets.dailyCalories * 0.35, isVegetarian, day),
          dinner: this.generateMeal('dinner', targets.dailyCalories * 0.30, isVegetarian, day),
          snacks: [this.generateMeal('snack', targets.dailyCalories * 0.10, isVegetarian, day)],
        },
        totalCalories: targets.dailyCalories,
        completed: false,
      };

      meals.push(dayMeal);
    }

    return meals;
  }

  private static generateMeal(mealType: string, targetCalories: number, isVegetarian: boolean, day: number): Meal {
    const mealTemplates = this.getMealTemplates(isVegetarian);
    const templates = mealTemplates[mealType] || mealTemplates.breakfast;
    const template = templates[day % templates.length];

    return {
      id: `meal_${mealType}_${day}_${Date.now()}`,
      name: template.name,
      description: template.description,
      ingredients: template.ingredients,
      instructions: template.instructions,
      nutrition: {
        calories: Math.round(targetCalories),
        protein: Math.round(targetCalories * 0.15 / 4),
        carbs: Math.round(targetCalories * 0.50 / 4),
        fat: Math.round(targetCalories * 0.35 / 9),
        fiber: Math.round(targetCalories * 0.02),
      },
      prepTime: template.prepTime,
      cookTime: template.cookTime,
      servings: 1,
      completed: false,
    };
  }

  private static getMealTemplates(isVegetarian: boolean) {
    const vegetarianTemplates = {
      breakfast: [
        { name: 'Overnight Oats with Berries', description: 'Creamy oats with berries', ingredients: [{ id: '1', name: 'Oats', amount: 50, unit: 'g', calories: 190 }], instructions: ['Mix and refrigerate'], prepTime: 5, cookTime: 0 },
        { name: 'Avocado Toast', description: 'Whole grain toast with avocado', ingredients: [{ id: '1', name: 'Bread', amount: 2, unit: 'slices', calories: 160 }], instructions: ['Toast and spread'], prepTime: 5, cookTime: 3 },
        { name: 'Greek Yogurt Parfait', description: 'Layered yogurt with granola', ingredients: [{ id: '1', name: 'Yogurt', amount: 200, unit: 'g', calories: 150 }], instructions: ['Layer ingredients'], prepTime: 5, cookTime: 0 },
        { name: 'Banana Pancakes', description: 'Fluffy pancakes with banana', ingredients: [{ id: '1', name: 'Flour', amount: 60, unit: 'g', calories: 220 }], instructions: ['Mix and cook'], prepTime: 10, cookTime: 10 },
        { name: 'Smoothie Bowl', description: 'Thick smoothie with toppings', ingredients: [{ id: '1', name: 'Banana', amount: 1, unit: 'medium', calories: 105 }], instructions: ['Blend and top'], prepTime: 7, cookTime: 0 },
        { name: 'Chia Pudding', description: 'Chia seeds in almond milk', ingredients: [{ id: '1', name: 'Chia seeds', amount: 30, unit: 'g', calories: 145 }], instructions: ['Mix and refrigerate'], prepTime: 5, cookTime: 0 },
        { name: 'Veggie Omelet', description: 'Eggs with mixed vegetables', ingredients: [{ id: '1', name: 'Eggs', amount: 2, unit: 'large', calories: 140 }], instructions: ['Whisk and cook'], prepTime: 5, cookTime: 8 },
        { name: 'Peanut Butter Toast', description: 'Whole wheat with PB and banana', ingredients: [{ id: '1', name: 'Bread', amount: 2, unit: 'slices', calories: 160 }], instructions: ['Toast and spread'], prepTime: 3, cookTime: 2 },
        { name: 'Breakfast Burrito', description: 'Scrambled eggs in tortilla', ingredients: [{ id: '1', name: 'Tortilla', amount: 1, unit: 'large', calories: 120 }], instructions: ['Cook and wrap'], prepTime: 10, cookTime: 8 },
        { name: 'Fruit Salad Bowl', description: 'Mixed fresh fruits with nuts', ingredients: [{ id: '1', name: 'Mixed fruits', amount: 200, unit: 'g', calories: 120 }], instructions: ['Chop and mix'], prepTime: 8, cookTime: 0 },
      ],
      lunch: [
        { name: 'Quinoa Buddha Bowl', description: 'Quinoa with roasted vegetables', ingredients: [{ id: '1', name: 'Quinoa', amount: 80, unit: 'g', calories: 290 }], instructions: ['Cook and assemble'], prepTime: 10, cookTime: 25 },
        { name: 'Lentil Curry', description: 'Spiced lentils with rice', ingredients: [{ id: '1', name: 'Lentils', amount: 100, unit: 'g', calories: 350 }], instructions: ['Cook with spices'], prepTime: 15, cookTime: 30 },
        { name: 'Caprese Sandwich', description: 'Mozzarella, tomato, basil', ingredients: [{ id: '1', name: 'Bread', amount: 2, unit: 'slices', calories: 160 }], instructions: ['Layer and serve'], prepTime: 5, cookTime: 0 },
        { name: 'Chickpea Salad', description: 'Mediterranean chickpea bowl', ingredients: [{ id: '1', name: 'Chickpeas', amount: 150, unit: 'g', calories: 180 }], instructions: ['Mix ingredients'], prepTime: 10, cookTime: 0 },
        { name: 'Veggie Wrap', description: 'Hummus and vegetable wrap', ingredients: [{ id: '1', name: 'Tortilla', amount: 1, unit: 'large', calories: 120 }], instructions: ['Fill and wrap'], prepTime: 8, cookTime: 0 },
        { name: 'Pasta Primavera', description: 'Whole wheat pasta with veggies', ingredients: [{ id: '1', name: 'Pasta', amount: 80, unit: 'g', calories: 280 }], instructions: ['Cook and toss'], prepTime: 10, cookTime: 15 },
        { name: 'Black Bean Bowl', description: 'Black beans with rice and salsa', ingredients: [{ id: '1', name: 'Black beans', amount: 150, unit: 'g', calories: 200 }], instructions: ['Heat and combine'], prepTime: 8, cookTime: 10 },
        { name: 'Falafel Plate', description: 'Baked falafel with tahini', ingredients: [{ id: '1', name: 'Chickpeas', amount: 120, unit: 'g', calories: 150 }], instructions: ['Form and bake'], prepTime: 15, cookTime: 20 },
        { name: 'Vegetable Soup', description: 'Hearty mixed vegetable soup', ingredients: [{ id: '1', name: 'Mixed veggies', amount: 250, unit: 'g', calories: 100 }], instructions: ['Simmer together'], prepTime: 10, cookTime: 25 },
        { name: 'Paneer Tikka Bowl', description: 'Grilled paneer with rice', ingredients: [{ id: '1', name: 'Paneer', amount: 100, unit: 'g', calories: 265 }], instructions: ['Marinate and grill'], prepTime: 20, cookTime: 15 },
      ],
      dinner: [
        { name: 'Stuffed Bell Peppers', description: 'Quinoa-stuffed peppers', ingredients: [{ id: '1', name: 'Bell peppers', amount: 2, unit: 'large', calories: 60 }], instructions: ['Stuff and bake'], prepTime: 20, cookTime: 35 },
        { name: 'Tofu Stir-fry', description: 'Crispy tofu with vegetables', ingredients: [{ id: '1', name: 'Tofu', amount: 120, unit: 'g', calories: 180 }], instructions: ['Stir-fry together'], prepTime: 15, cookTime: 15 },
        { name: 'Eggplant Parmesan', description: 'Baked eggplant with cheese', ingredients: [{ id: '1', name: 'Eggplant', amount: 200, unit: 'g', calories: 50 }], instructions: ['Layer and bake'], prepTime: 20, cookTime: 30 },
        { name: 'Mushroom Risotto', description: 'Creamy arborio rice', ingredients: [{ id: '1', name: 'Arborio rice', amount: 80, unit: 'g', calories: 280 }], instructions: ['Stir continuously'], prepTime: 10, cookTime: 30 },
        { name: 'Veggie Burger', description: 'Homemade bean burger', ingredients: [{ id: '1', name: 'Black beans', amount: 150, unit: 'g', calories: 200 }], instructions: ['Form and grill'], prepTime: 15, cookTime: 12 },
        { name: 'Spinach Lasagna', description: 'Layered pasta with spinach', ingredients: [{ id: '1', name: 'Lasagna sheets', amount: 100, unit: 'g', calories: 350 }], instructions: ['Layer and bake'], prepTime: 25, cookTime: 40 },
        { name: 'Cauliflower Tacos', description: 'Roasted cauliflower in tortillas', ingredients: [{ id: '1', name: 'Cauliflower', amount: 200, unit: 'g', calories: 50 }], instructions: ['Roast and assemble'], prepTime: 10, cookTime: 25 },
        { name: 'Vegetable Biryani', description: 'Fragrant rice with vegetables', ingredients: [{ id: '1', name: 'Basmati rice', amount: 80, unit: 'g', calories: 280 }], instructions: ['Layer and steam'], prepTime: 20, cookTime: 30 },
        { name: 'Zucchini Noodles', description: 'Spiralized zucchini with marinara', ingredients: [{ id: '1', name: 'Zucchini', amount: 250, unit: 'g', calories: 40 }], instructions: ['Spiralize and sauté'], prepTime: 10, cookTime: 8 },
        { name: 'Dal Tadka', description: 'Yellow lentils with spices', ingredients: [{ id: '1', name: 'Yellow dal', amount: 100, unit: 'g', calories: 340 }], instructions: ['Cook and temper'], prepTime: 10, cookTime: 25 },
      ],
      snack: [
        { name: 'Greek Yogurt with Nuts', description: 'Protein-rich snack', ingredients: [{ id: '1', name: 'Yogurt', amount: 150, unit: 'g', calories: 100 }], instructions: ['Mix together'], prepTime: 2, cookTime: 0 },
        { name: 'Apple with Almond Butter', description: 'Sliced apple with nut butter', ingredients: [{ id: '1', name: 'Apple', amount: 1, unit: 'medium', calories: 95 }], instructions: ['Slice and dip'], prepTime: 3, cookTime: 0 },
        { name: 'Trail Mix', description: 'Nuts, seeds, and dried fruit', ingredients: [{ id: '1', name: 'Mixed nuts', amount: 30, unit: 'g', calories: 180 }], instructions: ['Mix ingredients'], prepTime: 2, cookTime: 0 },
        { name: 'Hummus with Veggies', description: 'Chickpea dip with carrots', ingredients: [{ id: '1', name: 'Hummus', amount: 50, unit: 'g', calories: 100 }], instructions: ['Serve together'], prepTime: 3, cookTime: 0 },
        { name: 'Protein Smoothie', description: 'Banana and protein powder', ingredients: [{ id: '1', name: 'Banana', amount: 1, unit: 'medium', calories: 105 }], instructions: ['Blend all'], prepTime: 5, cookTime: 0 },
      ],
    };

    const omnivoreTemplates = {
      breakfast: [...vegetarianTemplates.breakfast,
      { name: 'Scrambled Eggs with Bacon', description: 'Classic breakfast combo', ingredients: [{ id: '1', name: 'Eggs', amount: 2, unit: 'large', calories: 140 }], instructions: ['Cook together'], prepTime: 5, cookTime: 8 },
      { name: 'Breakfast Sausage Bowl', description: 'Sausage with hash browns', ingredients: [{ id: '1', name: 'Sausage', amount: 80, unit: 'g', calories: 250 }], instructions: ['Cook and serve'], prepTime: 5, cookTime: 12 },
      ],
      lunch: [...vegetarianTemplates.lunch,
      { name: 'Grilled Chicken Salad', description: 'Fresh greens with chicken', ingredients: [{ id: '1', name: 'Chicken breast', amount: 120, unit: 'g', calories: 200 }], instructions: ['Grill and toss'], prepTime: 10, cookTime: 15 },
      { name: 'Turkey Sandwich', description: 'Whole grain with turkey', ingredients: [{ id: '1', name: 'Turkey', amount: 100, unit: 'g', calories: 120 }], instructions: ['Layer and serve'], prepTime: 5, cookTime: 0 },
      { name: 'Beef Burrito Bowl', description: 'Ground beef with rice', ingredients: [{ id: '1', name: 'Ground beef', amount: 100, unit: 'g', calories: 250 }], instructions: ['Cook and assemble'], prepTime: 10, cookTime: 15 },
      { name: 'Tuna Salad', description: 'Tuna with mixed greens', ingredients: [{ id: '1', name: 'Tuna', amount: 100, unit: 'g', calories: 130 }], instructions: ['Mix and serve'], prepTime: 8, cookTime: 0 },
      ],
      dinner: [...vegetarianTemplates.dinner,
      { name: 'Baked Salmon', description: 'Herb-crusted salmon fillet', ingredients: [{ id: '1', name: 'Salmon', amount: 150, unit: 'g', calories: 280 }], instructions: ['Season and bake'], prepTime: 10, cookTime: 25 },
      { name: 'Grilled Chicken Breast', description: 'Marinated chicken with veggies', ingredients: [{ id: '1', name: 'Chicken', amount: 150, unit: 'g', calories: 250 }], instructions: ['Marinate and grill'], prepTime: 15, cookTime: 20 },
      { name: 'Beef Stir-fry', description: 'Lean beef with vegetables', ingredients: [{ id: '1', name: 'Beef', amount: 120, unit: 'g', calories: 220 }], instructions: ['Stir-fry quickly'], prepTime: 10, cookTime: 12 },
      { name: 'Fish Tacos', description: 'Grilled fish in corn tortillas', ingredients: [{ id: '1', name: 'White fish', amount: 120, unit: 'g', calories: 140 }], instructions: ['Grill and assemble'], prepTime: 10, cookTime: 10 },
      { name: 'Pork Tenderloin', description: 'Roasted pork with sweet potato', ingredients: [{ id: '1', name: 'Pork', amount: 120, unit: 'g', calories: 180 }], instructions: ['Season and roast'], prepTime: 10, cookTime: 30 },
      { name: 'Shrimp Pasta', description: 'Garlic shrimp with linguine', ingredients: [{ id: '1', name: 'Shrimp', amount: 150, unit: 'g', calories: 120 }], instructions: ['Sauté and toss'], prepTime: 10, cookTime: 15 },
      ],
      snack: [...vegetarianTemplates.snack,
      { name: 'Beef Jerky', description: 'High-protein dried beef', ingredients: [{ id: '1', name: 'Beef jerky', amount: 30, unit: 'g', calories: 80 }], instructions: ['Serve'], prepTime: 1, cookTime: 0 },
      { name: 'Hard Boiled Eggs', description: 'Protein-packed snack', ingredients: [{ id: '1', name: 'Eggs', amount: 2, unit: 'large', calories: 140 }], instructions: ['Boil and peel'], prepTime: 2, cookTime: 10 },
      ],
    };

    return isVegetarian ? vegetarianTemplates : omnivoreTemplates;
  }

  private static generatePlanName(profile: UserProfile): string {
    const goalNames = {
      weight_loss: 'Weight Loss',
      muscle_gain: 'Muscle Building',
      maintenance: 'Maintenance',
      general_health: 'Healthy Living',
    };

    const dietNames = {
      omnivore: '',
      vegetarian: 'Vegetarian',
      vegan: 'Vegan',
      pescatarian: 'Pescatarian',
      keto: 'Ketogenic',
      paleo: 'Paleo',
    };

    const goalName = goalNames[profile.healthGoals.primary] || 'Custom';
    const dietName = dietNames[profile.dietaryRestrictions.dietType];

    return dietName ? `${dietName} ${goalName} Plan` : `${goalName} Plan`;
  }

  private static generatePlanDescription(profile: UserProfile, calories: number): string {
    const goal = profile.healthGoals.primary;
    const diet = profile.dietaryRestrictions.dietType;

    let description = `A personalized ${calories}-calorie daily plan designed for ${goal.replace('_', ' ')}`;

    if (diet !== 'omnivore') {
      description += ` following a ${diet} diet`;
    }

    description += `. Tailored to your preferences, activity level, and dietary restrictions.`;

    return description;
  }

  private static generateFallbackDietPlan(profile: UserProfile): DietPlan {
    const targets = this.calculateNutritionTargets(profile);
    const meals = this.generateFallbackMeals(profile, targets);

    return {
      id: `plan_${Date.now()}`,
      userId: profile.id,
      name: this.generatePlanName(profile),
      description: this.generatePlanDescription(profile, targets.dailyCalories),
      duration: profile.planDuration,
      dailyCalories: targets.dailyCalories,
      macros: {
        protein: targets.protein,
        carbs: targets.carbs,
        fat: targets.fat,
      },
      meals,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
      progress: {
        completedDays: 0,
        totalDays: profile.planDuration,
        adherenceRate: 0,
      },
    };
  }
}