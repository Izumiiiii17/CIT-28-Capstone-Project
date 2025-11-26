import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, Variants } from 'framer-motion';
import { Plus, Edit, ArrowLeft, Clock, Utensils, ChefHat, Save, RefreshCw, Heart, ShoppingCart, BookOpen, X, Check, AlertCircle, TrendingUp, Target } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/profileService';
import { DietPlanService } from '../services/dietPlanService';
import { NutritionTrackingService } from '../services/nutritionTrackingService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function MealPlanner() {
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePlan, setActivePlan] = useState<any>(null);
  const [currentDayMeal, setCurrentDayMeal] = useState<any>(null);
  const [editingMeal, setEditingMeal] = useState<any>(null);
  const [viewingRecipe, setViewingRecipe] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [shoppingList, setShoppingList] = useState<any[]>([]);
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [ratedMeals, setRatedMeals] = useState<{[key: string]: number}>({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadUserData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (userProfile) {
      loadMealPlan();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userProfile, selectedDate]);

  const loadUserData = async () => {
    try {
      const { data: profileData } = await ProfileService.getProfile();
      if (profileData) {
        const profile = ProfileService.profileRowToUserProfile(profileData);
        setUserProfile(profile);
      }
    } catch (error) {
      toast.error('Failed to load user profile');
    }
  };

  const loadMealPlan = async () => {
    setLoading(true);
    try {
      const { data: plansData } = await DietPlanService.getUserDietPlans();
      if (plansData && plansData.length > 0) {
        const plans = plansData.map(DietPlanService.dietPlanRowToDietPlan);
        const active = plans.find(plan => plan.isActive) || plans[0];
        setActivePlan(active);

        const dayMeal = active.meals.find((meal: any) => meal.date === selectedDate);
        setCurrentDayMeal(dayMeal || null);
        
        // Generate shopping list from the day's meals
        if (dayMeal) {
          generateShoppingList(dayMeal);
        }
      }
    } catch (error) {
      toast.error('Failed to load meal plan');
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingList = (dayMeal: any) => {
    const ingredients: any[] = [];
    
    // Add ingredients from main meals
    ['breakfast', 'lunch', 'dinner'].forEach(mealType => {
      const meal = dayMeal.meals[mealType];
      if (meal && meal.ingredients) {
        meal.ingredients.forEach((ingredient: any) => {
          ingredients.push({
            ...ingredient,
            mealType,
            mealName: meal.name
          });
        });
      }
    });
    
    // Add ingredients from snacks
    if (dayMeal.meals.snacks) {
      dayMeal.meals.snacks.forEach((snack: any) => {
        if (snack.ingredients) {
          snack.ingredients.forEach((ingredient: any) => {
            ingredients.push({
              ...ingredient,
              mealType: 'snack',
              mealName: snack.name
            });
          });
        }
      });
    }
    
    setShoppingList(ingredients);
  };

  const handleEditMeal = (mealType: string, meal: any) => {
    setEditingMeal({ type: mealType, data: meal });
  };

  const handleSaveMeal = async (updatedMeal: any) => {
    if (!activePlan || !currentDayMeal || !editingMeal) return;
    try {
      const updatedDayMeal = { ...currentDayMeal };
      updatedDayMeal.meals[editingMeal.type] = updatedMeal;
      const recalculatedDayMeal = NutritionTrackingService.recalculateDayMealTotals(updatedDayMeal);

      const updatedMeals = activePlan.meals.map((meal: any) =>
        meal.date === selectedDate ? recalculatedDayMeal : meal
      );

      const updatedPlan = { ...activePlan, meals: updatedMeals };
      await DietPlanService.updateDietPlan(activePlan.id, updatedPlan);
      setActivePlan(updatedPlan);
      setCurrentDayMeal(recalculatedDayMeal);
      setEditingMeal(null);
      toast.success('Meal updated successfully!');
    } catch (error) {
      toast.error('Failed to update meal');
    }
  };

  const handleRegenerateMeal = async (mealType: string) => {
    if (!activePlan || !currentDayMeal || !userProfile) return;
    try {
      setLoading(true);
      
      // In a real app, this would call an AI service with the user's diet preferences
      // For now, we'll simulate a regeneration based on diet type
      const dietType = userProfile.dietaryRestrictions.dietType;
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock regenerated meal based on diet type
      let newMeal;
      if (dietType === 'vegetarian') {
        newMeal = {
          ...currentDayMeal.meals[mealType],
          name: `New Vegetarian ${mealType}`,
          description: `A delicious vegetarian ${mealType} tailored to your preferences.`,
          ingredients: [
            { name: 'Quinoa', amount: 1, unit: 'cup' },
            { name: 'Mixed Vegetables', amount: 2, unit: 'cups' },
            { name: 'Olive Oil', amount: 2, unit: 'tbsp' },
            { name: 'Tofu', amount: 200, unit: 'g' }
          ]
        };
      } else if (dietType === 'vegan') {
        newMeal = {
          ...currentDayMeal.meals[mealType],
          name: `New Vegan ${mealType}`,
          description: `A delicious plant-based ${mealType} tailored to your preferences.`,
          ingredients: [
            { name: 'Chickpeas', amount: 1, unit: 'can' },
            { name: 'Spinach', amount: 2, unit: 'cups' },
            { name: 'Nutritional Yeast', amount: 2, unit: 'tbsp' },
            { name: 'Avocado', amount: 1, unit: 'whole' }
          ]
        };
      } else if (dietType === 'omnivore') {
        newMeal = {
          ...currentDayMeal.meals[mealType],
          name: `New ${mealType}`,
          description: `A delicious ${mealType} with balanced nutrition.`,
          ingredients: [
            { name: 'Chicken Breast', amount: 150, unit: 'g' },
            { name: 'Brown Rice', amount: 1, unit: 'cup' },
            { name: 'Broccoli', amount: 1, unit: 'cup' },
            { name: 'Olive Oil', amount: 1, unit: 'tbsp' }
          ]
        };
      } else {
        // Default for other diet types
        newMeal = {
          ...currentDayMeal.meals[mealType],
          name: `New ${mealType}`,
          description: `A delicious ${mealType} tailored to your ${dietType} diet.`,
          ingredients: [
            { name: 'Protein Source', amount: 150, unit: 'g' },
            { name: 'Complex Carbs', amount: 1, unit: 'cup' },
            { name: 'Vegetables', amount: 2, unit: 'cups' },
            { name: 'Healthy Fat', amount: 1, unit: 'tbsp' }
          ]
        };
      }
      
      // Update the meal in the current day meal
      const updatedDayMeal = { ...currentDayMeal };
      updatedDayMeal.meals[mealType] = newMeal;
      
      // Recalculate nutrition
      const recalculatedDayMeal = NutritionTrackingService.recalculateDayMealTotals(updatedDayMeal);
      
      // Update the plan
      const updatedMeals = activePlan.meals.map((meal: any) =>
        meal.date === selectedDate ? recalculatedDayMeal : meal
      );
      
      const updatedPlan = { ...activePlan, meals: updatedMeals };
      await DietPlanService.updateDietPlan(activePlan.id, updatedPlan);
      setActivePlan(updatedPlan);
      setCurrentDayMeal(recalculatedDayMeal);
      
      // Regenerate shopping list
      generateShoppingList(recalculatedDayMeal);
      
      toast.success(`${mealType} regenerated successfully based on your ${dietType} diet!`);
    } catch (error) {
      toast.error('Failed to regenerate meal');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomMeal = () => {
    setEditingMeal({
      type: 'custom',
      data: {
        id: `custom_${Date.now()}`,
        name: '',
        description: '',
        ingredients: [],
        instructions: [],
        nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0 },
        prepTime: 0,
        cookTime: 0,
        servings: 1,
        completed: false,
      }
    });
  };

  const handleViewRecipe = (meal: any) => {
    setViewingRecipe(meal);
  };

  const handleToggleFavorite = (mealId: string) => {
    setFavoriteMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
    
    const isFavorite = favoriteMeals.includes(mealId);
    toast(isFavorite ? 'Removed from favorites' : 'Added to favorites');
  };

  const handleRateMeal = (mealId: string, rating: number) => {
    setRatedMeals(prev => ({
      ...prev,
      [mealId]: rating
    }));
    toast(`Rated ${rating} stars`);
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🌅';
      case 'lunch': return '☀️';
      case 'dinner': return '🌙';
      default: return '🍎';
    }
  };

  const getDietTypeInfo = () => {
    if (!userProfile) return { label: 'Unknown', icon: '🍽️', color: 'gray' };
    
    switch (userProfile.dietaryRestrictions.dietType) {
      case 'omnivore':
        return { label: 'Omnivore', icon: '🥩', color: 'red' };
      case 'vegetarian':
        return { label: 'Vegetarian', icon: '🥗', color: 'green' };
      case 'vegan':
        return { label: 'Vegan', icon: '🌱', color: 'green' };
      case 'pescatarian':
        return { label: 'Pescatarian', icon: '🐟', color: 'blue' };
      case 'keto':
        return { label: 'Keto', icon: '🥑', color: 'yellow' };
      case 'paleo':
        return { label: 'Paleo', icon: '🦴', color: 'amber' };
      default:
        return { label: 'Unknown', icon: '🍽️', color: 'gray' };
    }
  };

  const calculateDailyNutritionProgress = () => {
    if (!currentDayMeal || !activePlan) return null;
    
    const completedNutrition = NutritionTrackingService.calculateCompletedNutrition(currentDayMeal);
    const dayNutrition = NutritionTrackingService.calculateDayNutrition(currentDayMeal);
    
    return {
      calories: {
        current: completedNutrition.completedCalories,
        target: activePlan.dailyCalories,
        percentage: Math.round((completedNutrition.completedCalories / activePlan.dailyCalories) * 100)
      },
      protein: {
        current: completedNutrition.completedProtein,
        target: dayNutrition.totalProtein,
        percentage: Math.round((completedNutrition.completedProtein / dayNutrition.totalProtein) * 100)
      },
      carbs: {
        current: completedNutrition.completedCarbs,
        target: dayNutrition.totalCarbs,
        percentage: Math.round((completedNutrition.completedCarbs / dayNutrition.totalCarbs) * 100)
      },
      fat: {
        current: completedNutrition.completedFat,
        target: dayNutrition.totalFat,
        percentage: Math.round((completedNutrition.completedFat / dayNutrition.totalFat) * 100)
      }
    };
  };

  const pageVariants: Variants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition: any = {
    type: 'tween' as const,
    ease: 'anticipate',
    duration: 0.5
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Meal Plan</h2>
          <p className="text-gray-600">Preparing your personalized meals...</p>
        </div>
      </div>
    );
  }

  const dietTypeInfo = getDietTypeInfo();
  const nutritionProgress = calculateDailyNutritionProgress();

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
              <p className="text-gray-600">Plan and customize your daily meals</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white px-3 py-2 rounded-lg border border-gray-200">
              <span className="text-lg">{dietTypeInfo.icon}</span>
              <span className="text-sm font-medium">{dietTypeInfo.label}</span>
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
            <Button onClick={() => setShowShoppingList(!showShoppingList)} variant="outline">
              <ShoppingCart className="w-4 h-4 mr-2" />
              Shopping List
            </Button>
            <Button onClick={handleAddCustomMeal}>
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Meal
            </Button>
          </div>
        </div>

        {/* Shopping List */}
        {showShoppingList && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <ShoppingCart className="w-5 h-5" />
                    <span>Shopping List</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => setShowShoppingList(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {shoppingList.length > 0 ? (
                  <div className="space-y-2">
                    {shoppingList.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" className="rounded" />
                          <span>{item.amount} {item.unit} {item.name}</span>
                        </div>
                        <span className="text-xs text-gray-500">for {item.mealName}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No items in your shopping list</p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {currentDayMeal ? (
          <div className="space-y-6">
            {/* Date Header and Nutrition Progress */}
            <Card>
              <CardContent>
                <div className="flex flex-col md:flex-row md:items-center justify-between">
                  <div className="mb-4 md:mb-0">
                    <h2 className="text-xl font-semibold text-gray-900">
                      {new Date(selectedDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h2>
                    <p className="text-gray-600">Total Calories: {currentDayMeal.totalCalories}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate Day
                    </Button>
                  </div>
                </div>
                
                {/* Nutrition Progress */}
                {nutritionProgress && (
                  <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-emerald-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Calories</span>
                        <span className="text-xs text-gray-500">
                          {nutritionProgress.calories.current}/{nutritionProgress.calories.target}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(nutritionProgress.calories.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Protein</span>
                        <span className="text-xs text-gray-500">
                          {nutritionProgress.protein.current}g/{nutritionProgress.protein.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(nutritionProgress.protein.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-orange-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Carbs</span>
                        <span className="text-xs text-gray-500">
                          {nutritionProgress.carbs.current}g/{nutritionProgress.carbs.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-orange-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(nutritionProgress.carbs.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="bg-purple-50 rounded-lg p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-medium text-gray-700">Fat</span>
                        <span className="text-xs text-gray-500">
                          {nutritionProgress.fat.current}g/{nutritionProgress.fat.target}g
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(nutritionProgress.fat.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Meals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Main Meals */}
              {['breakfast', 'lunch', 'dinner'].map((mealType) => {
                const meal = currentDayMeal.meals[mealType];
                if (!meal) return null; // Skip if meal is not present
                
                const mealId = `${selectedDate}-${mealType}`;
                const isFavorite = favoriteMeals.includes(mealId);
                const rating = ratedMeals[mealId] || 0;
                
                return (
                  <motion.div
                    key={mealType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className={`h-full ${meal.completed ? 'border-green-300 bg-green-50' : ''}`}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="text-2xl">{getMealIcon(mealType)}</span>
                            <span className="capitalize">{mealType}</span>
                            {meal.completed && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(mealId)}
                              className={isFavorite ? 'text-red-500' : ''}
                            >
                              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewRecipe(meal)}
                            >
                              <BookOpen className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditMeal(mealType, meal)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRegenerateMeal(mealType)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">{meal.name}</h3>
                            <p className="text-gray-600">{meal.description}</p>
                          </div>
                          
                          {/* Rating */}
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => handleRateMeal(mealId, star)}
                                className="text-gray-300 hover:text-yellow-500 focus:outline-none"
                              >
                                <span className={star <= rating ? 'text-yellow-500' : ''}>★</span>
                              </button>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center space-x-2">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>
                                {meal.prepTime || 0}m prep + {meal.cookTime || 0}m cook
                              </span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Utensils className="w-4 h-4 text-gray-400" />
                              <span>{meal.servings || 1} serving(s)</span>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-3">
                            <h4 className="font-medium text-gray-900 mb-2">Nutrition</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <span>Calories: {meal.nutrition?.calories ?? 0}</span>
                              <span>Protein: {meal.nutrition?.protein ?? 0}g</span>
                              <span>Carbs: {meal.nutrition?.carbs ?? 0}g</span>
                              <span>Fat: {meal.nutrition?.fat ?? 0}g</span>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900 mb-2">Ingredients</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                              {meal.ingredients?.slice(0, 3).map((ingredient: any, idx: number) => (
                                <li key={ingredient.name ?? idx}>
                                  {ingredient.amount} {ingredient.unit} {ingredient.name}
                                </li>
                              ))}
                              {meal.ingredients?.length > 3 && (
                                <li className="text-emerald-600 cursor-pointer">
                                  +{meal.ingredients.length - 3} more ingredients
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Snacks */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="lg:col-span-2"
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <span className="text-2xl">🍎</span>
                      <span>Snacks</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(currentDayMeal.meals.snacks ?? []).map((snack: any, idx: number) => {
                        const snackId = `${selectedDate}-snack-${idx}`;
                        const isFavorite = favoriteMeals.includes(snackId);
                        const rating = ratedMeals[snackId] || 0;
                        
                        return (
                          <div key={snack.id ?? idx} className={`bg-gray-50 rounded-lg p-4 ${snack.completed ? 'border-green-300 bg-green-50' : ''}`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2">
                                  <h4 className="font-medium text-gray-900">{snack.name}</h4>
                                  {snack.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">{snack.description}</p>
                                <div className="mt-2 text-xs text-gray-500">
                                  {snack.nutrition?.calories ?? 0} cal • {snack.nutrition?.protein ?? 0}g protein
                                </div>
                                
                                {/* Rating */}
                                <div className="flex items-center space-x-1 mt-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      onClick={() => handleRateMeal(snackId, star)}
                                      className="text-gray-300 hover:text-yellow-500 focus:outline-none"
                                    >
                                      <span className={star <= rating ? 'text-yellow-500' : ''}>★</span>
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center space-x-1 ml-4">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleFavorite(snackId)}
                                  className={isFavorite ? 'text-red-500' : ''}
                                >
                                  <Heart className={`w-3 h-3 ${isFavorite ? 'fill-current' : ''}`} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewRecipe(snack)}
                                >
                                  <BookOpen className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditMeal(`snack_${idx}`, snack)}
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRegenerateMeal(`snack_${idx}`)}
                                >
                                  <RefreshCw className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent>
              <div className="text-center py-12">
                <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-900 mb-2">No Meal Plan for This Date</h2>
                <p className="text-gray-600 mb-6">
                  There's no meal plan available for {new Date(selectedDate).toLocaleDateString()}.
                </p>
                <Button onClick={() => navigate('/profile')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Generate Meal Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Edit Meal Modal */}
        {editingMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold">Edit {editingMeal.type}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setEditingMeal(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <div className="space-y-4">
                <Input
                  label="Meal Name"
                  value={editingMeal.data.name}
                  onChange={(e) =>
                    setEditingMeal({
                      ...editingMeal,
                      data: { ...editingMeal.data, name: e.target.value }
                    })
                  }
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    rows={3}
                    value={editingMeal.data.description}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        data: { ...editingMeal.data, description: e.target.value }
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Prep Time (min)"
                    type="number"
                    value={editingMeal.data.prepTime}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        data: { ...editingMeal.data, prepTime: parseInt(e.target.value) || 0 }
                      })
                    }
                  />
                  <Input
                    label="Cook Time (min)"
                    type="number"
                    value={editingMeal.data.cookTime}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        data: { ...editingMeal.data, cookTime: parseInt(e.target.value) || 0 }
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Calories"
                    type="number"
                    value={editingMeal.data.nutrition.calories}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        data: {
                          ...editingMeal.data,
                          nutrition: {
                            ...editingMeal.data.nutrition,
                            calories: parseInt(e.target.value) || 0
                          }
                        }
                      })
                    }
                  />
                  <Input
                    label="Protein (g)"
                    type="number"
                    value={editingMeal.data.nutrition.protein}
                    onChange={(e) =>
                      setEditingMeal({
                        ...editingMeal,
                        data: {
                          ...editingMeal.data,
                          nutrition: {
                            ...editingMeal.data.nutrition,
                            protein: parseInt(e.target.value) || 0
                          }
                        }
                      })
                    }
                  />
                </div>
                <div className="flex justify-end space-x-4 pt-4">
                  <Button variant="outline" onClick={() => setEditingMeal(null)}>
                    Cancel
                  </Button>
                  <Button onClick={() => handleSaveMeal(editingMeal.data)}>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* View Recipe Modal */}
        {viewingRecipe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">{viewingRecipe.name}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewingRecipe(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-600">{viewingRecipe.description}</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Prep Time</h4>
                    <p className="text-gray-600">{viewingRecipe.prepTime || 0} minutes</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Cook Time</h4>
                    <p className="text-gray-600">{viewingRecipe.cookTime || 0} minutes</p>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Nutrition Information</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-emerald-600">{viewingRecipe.nutrition?.calories ?? 0}</p>
                      <p className="text-xs text-gray-600">Calories</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-600">{viewingRecipe.nutrition?.protein ?? 0}g</p>
                      <p className="text-xs text-gray-600">Protein</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-orange-600">{viewingRecipe.nutrition?.carbs ?? 0}g</p>
                      <p className="text-xs text-gray-600">Carbs</p>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-purple-600">{viewingRecipe.nutrition?.fat ?? 0}g</p>
                      <p className="text-xs text-gray-600">Fat</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Ingredients</h4>
                  <ul className="space-y-2">
                    {viewingRecipe.ingredients?.map((ingredient: any, idx: number) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <span className="text-emerald-600">•</span>
                        <span>{ingredient.amount} {ingredient.unit} {ingredient.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Instructions</h4>
                  <ol className="space-y-2">
                    {viewingRecipe.instructions?.map((instruction: string, idx: number) => (
                      <li key={idx} className="flex space-x-2">
                        <span className="font-medium text-emerald-600">{idx + 1}.</span>
                        <span>{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </motion.div>
  );
}