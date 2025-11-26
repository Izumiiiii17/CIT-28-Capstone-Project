import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Calendar, TrendingUp, Settings, Bell, Play, CheckCircle, Target, Utensils, Activity, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/profileService';
import { DietPlanService } from '../services/dietPlanService';
import { NutritionTrackingService } from '../services/nutritionTrackingService';
import { NotificationService } from '../services/notificationService';
import { DietPlan, DayMeal, UserProfile } from '../types';
import { smsService } from '../services/smsService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [activePlan, setActivePlan] = useState<DietPlan | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [currentDayMeal, setCurrentDayMeal] = useState<DayMeal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadDashboardData();
  }, [user, navigate]);

  useEffect(() => {
    if (activePlan) {
      const dayMeal = activePlan.meals.find(meal => meal.date === selectedDate);
      setCurrentDayMeal(dayMeal || null);
    }
  }, [activePlan, selectedDate]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Load user profile
      const { data: profileData } = await ProfileService.getProfile();
      if (profileData) {
        const profile = ProfileService.profileRowToUserProfile(profileData);
        setUserProfile(profile);

        // Setup meal reminders automatically
        const settings = NotificationService.getNotificationSettings();
        if (settings.browserNotifications && settings.mealReminders) {
          NotificationService.scheduleMealReminders(profile);
        }
      }

      // Load diet plans
      const { data: plansData } = await DietPlanService.getUserDietPlans();
      if (plansData) {
        const plans = plansData.map(DietPlanService.dietPlanRowToDietPlan);
        setDietPlans(plans);

        // Find active plan
        const active = plans.find(plan => plan.isActive);
        setActivePlan(active || null);
      }
    } catch (error) {
      console.error('Dashboard data loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMealComplete = async (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack', snackIndex?: number) => {
    if (!activePlan || !currentDayMeal) return;

    const updatedDayMeal = { ...currentDayMeal };

    if (mealType === 'snack' && snackIndex !== undefined) {
      updatedDayMeal.meals.snacks[snackIndex].completed = true;
    } else if (mealType === 'breakfast' || mealType === 'lunch' || mealType === 'dinner') {
      updatedDayMeal.meals[mealType].completed = true;
    }

    // Recalculate nutrition totals
    const recalculatedDayMeal = NutritionTrackingService.recalculateDayMealTotals(updatedDayMeal);

    // Check if all meals are completed
    const allMealsCompleted =
      recalculatedDayMeal.meals.breakfast.completed &&
      recalculatedDayMeal.meals.lunch.completed &&
      recalculatedDayMeal.meals.dinner.completed &&
      recalculatedDayMeal.meals.snacks.every(snack => snack.completed);

    if (allMealsCompleted) {
      recalculatedDayMeal.completed = true;
    }

    // Update the plan
    const updatedMeals = activePlan.meals.map(meal =>
      meal.date === selectedDate ? recalculatedDayMeal : meal
    );

    const completedDays = updatedMeals.filter(meal => meal.completed).length;
    const adherenceRate = Math.round((completedDays / activePlan.duration) * 100);

    const updatedPlan = {
      ...activePlan,
      meals: updatedMeals,
      progress: {
        ...activePlan.progress,
        completedDays,
        adherenceRate,
      },
    };

    await DietPlanService.updateDietPlan(activePlan.id, updatedPlan);
    setActivePlan(updatedPlan);
    setCurrentDayMeal(recalculatedDayMeal);

    toast.success(`${mealType.charAt(0).toUpperCase() + mealType.slice(1)} marked as completed!`);

    // Send progress update SMS if enabled
    if (userProfile?.phoneNumber && allMealsCompleted) {
      await smsService.sendProgressUpdate(
        userProfile.phoneNumber,
        completedDays,
        activePlan.duration,
        adherenceRate
      );
    }
  };

  const handlePlanSwitch = async (planId: string) => {
    await DietPlanService.setActiveDietPlan(planId);
    loadDashboardData(); // Reload to get updated active plan
  };

  const handlePlanDelete = async (planId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent plan switch when clicking delete
    if (window.confirm('Are you sure you want to delete this diet plan? This action cannot be undone.')) {
      try {
        await DietPlanService.deleteDietPlan(planId);
        toast.success('Diet plan deleted successfully');
        loadDashboardData(); // Reload to update the plans list
      } catch (error) {
        console.error('Error deleting diet plan:', error);
        toast.error('Failed to delete diet plan');
      }
    }
  };

  const handleSettings = () => {
    navigate('/profile');
  };

  const handleNotifications = () => {
    navigate('/notifications');
  };

  const handleViewFullPlan = () => {
    if (activePlan) {
      navigate('/results');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Dashboard</h2>
          <p className="text-gray-600">Getting your nutrition data...</p>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Complete Your Profile</h2>
              <p className="text-gray-600 mb-4">Create your profile to access your personalized dashboard.</p>
              <Button onClick={() => navigate('/profile')}>
                <User className="w-4 h-4 mr-2" />
                Create Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!activePlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center">
              <Utensils className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Diet Plan</h2>
              <p className="text-gray-600 mb-4">Create a diet plan to get started with your nutrition journey.</p>
              <Button onClick={() => navigate('/profile')}>
                <Target className="w-4 h-4 mr-2" />
                Create Diet Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const todaysMeals = currentDayMeal?.meals;
  const completedMealsToday = todaysMeals ? [
    todaysMeals.breakfast.completed,
    todaysMeals.lunch.completed,
    todaysMeals.dinner.completed,
    ...todaysMeals.snacks.map(s => s.completed)
  ].filter(Boolean).length : 0;

  const totalMealsToday = todaysMeals ? 3 + todaysMeals.snacks.length : 0;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, {userProfile.name}!</h1>
              <p className="text-gray-600 mt-1">
                Track your progress and stay on top of your nutrition goals
              </p>
            </div>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <Button variant="outline" size="sm" onClick={handleSettings}>
                <Settings className="w-4 h-4 mr-2" />
                New Plan
              </Button>
            </div>
          </div>

          {/* Plan Selector */}
          {dietPlans.length > 1 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Your Diet Plans</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {dietPlans.map((plan) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${plan.id === activePlan?.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                        }`}
                      onClick={() => handlePlanSwitch(plan.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-gray-900">{plan.name}</h3>
                          <p className="text-sm text-gray-600 mt-1">{plan.description}</p>
                          <div className="mt-2 text-xs text-gray-500">
                            Progress: {plan.progress.completedDays}/{plan.duration} days
                          </div>
                        </div>
                        {!plan.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={(e) => handlePlanDelete(plan.id, e)}
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M3 6h18" />
                              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Today's Progress</p>
                    <p className="text-2xl font-bold text-emerald-600">
                      {completedMealsToday}/{totalMealsToday}
                    </p>
                    <p className="text-xs text-gray-500">Meals completed</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Calories</p>
                    <p className="text-2xl font-bold text-blue-600">{activePlan.dailyCalories}</p>
                    <p className="text-xs text-gray-500">Target calories</p>
                  </div>
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Plan Progress</p>
                    <p className="text-2xl font-bold text-orange-600">{activePlan.progress.adherenceRate}%</p>
                    <p className="text-xs text-gray-500">Adherence rate</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Days Completed</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {activePlan.progress.completedDays}
                    </p>
                    <p className="text-xs text-gray-500">of {activePlan.duration} days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Today's Meals */}
          {currentDayMeal && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Utensils className="w-5 h-5 text-emerald-600" />
                      <span>Today's Meals</span>
                      <span className="text-sm text-gray-500">
                        ({new Date(selectedDate).toLocaleDateString()})
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Breakfast */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-4 rounded-lg border-2 transition-all ${currentDayMeal.meals.breakfast.completed
                          ? 'border-green-300 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                          }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              🌅 Breakfast
                            </h4>
                            <p className="text-sm text-gray-600">
                              {currentDayMeal.meals.breakfast.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {currentDayMeal.meals.breakfast.nutrition.calories} cal •
                              {currentDayMeal.meals.breakfast.prepTime + currentDayMeal.meals.breakfast.cookTime} min
                            </p>
                          </div>
                          {!currentDayMeal.meals.breakfast.completed && (
                            <Button
                              size="sm"
                              onClick={() => handleMealComplete('breakfast')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          {currentDayMeal.meals.breakfast.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Lunch */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-4 rounded-lg border-2 transition-all ${currentDayMeal.meals.lunch.completed
                          ? 'border-green-300 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                          }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              ☀️ Lunch
                            </h4>
                            <p className="text-sm text-gray-600">
                              {currentDayMeal.meals.lunch.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {currentDayMeal.meals.lunch.nutrition.calories} cal •
                              {currentDayMeal.meals.lunch.prepTime + currentDayMeal.meals.lunch.cookTime} min
                            </p>
                          </div>
                          {!currentDayMeal.meals.lunch.completed && (
                            <Button
                              size="sm"
                              onClick={() => handleMealComplete('lunch')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          {currentDayMeal.meals.lunch.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Dinner */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`p-4 rounded-lg border-2 transition-all ${currentDayMeal.meals.dinner.completed
                          ? 'border-green-300 bg-green-50 shadow-md'
                          : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                          }`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">
                              🌙 Dinner
                            </h4>
                            <p className="text-sm text-gray-600">
                              {currentDayMeal.meals.dinner.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {currentDayMeal.meals.dinner.nutrition.calories} cal •
                              {currentDayMeal.meals.dinner.prepTime + currentDayMeal.meals.dinner.cookTime} min
                            </p>
                          </div>
                          {!currentDayMeal.meals.dinner.completed && (
                            <Button
                              size="sm"
                              onClick={() => handleMealComplete('dinner')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Complete
                            </Button>
                          )}
                          {currentDayMeal.meals.dinner.completed && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: "spring", stiffness: 500 }}
                            >
                              <CheckCircle className="w-6 h-6 text-green-600" />
                            </motion.div>
                          )}
                        </div>
                      </motion.div>

                      {/* Snacks */}
                      {currentDayMeal.meals.snacks.map((snack, index) => (
                        <motion.div
                          key={index}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className={`p-4 rounded-lg border-2 transition-all ${snack.completed
                            ? 'border-green-300 bg-green-50 shadow-md'
                            : 'border-gray-200 hover:border-emerald-300 hover:shadow-sm'
                            }`}>
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                🍎 Snack {index + 1}
                              </h4>
                              <p className="text-sm text-gray-600">{snack.name}</p>
                              <p className="text-xs text-gray-500">
                                {snack.nutrition.calories} cal • {snack.prepTime} min prep
                              </p>
                            </div>
                            {!snack.completed && (
                              <Button
                                size="sm"
                                onClick={() => handleMealComplete('snack', index)}
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Complete
                              </Button>
                            )}
                            {snack.completed && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500 }}
                              >
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Nutrition Summary & Progress */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Activity className="w-5 h-5 text-blue-600" />
                      <span>Nutrition Summary</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {(() => {
                        const completedNutrition = NutritionTrackingService.calculateCompletedNutrition(currentDayMeal);
                        const dayNutrition = NutritionTrackingService.calculateDayNutrition(currentDayMeal);

                        return (
                          <>
                            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-lg p-4 mb-4">
                              <div className="flex justify-between items-center">
                                <div>
                                  <p className="text-sm font-medium text-gray-700">Today's Progress</p>
                                  <p className="text-xs text-gray-600 mt-1">
                                    {completedNutrition.calories} of {dayNutrition.calories} cal consumed
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="text-2xl font-bold text-emerald-600">
                                    {Math.round((completedNutrition.calories / dayNutrition.calories) * 100)}%
                                  </p>
                                </div>
                              </div>
                              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${Math.round((completedNutrition.calories / dayNutrition.calories) * 100)}%` }}
                                  transition={{ duration: 0.5 }}
                                  className="bg-gradient-to-r from-emerald-500 to-blue-500 h-2 rounded-full"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-4 bg-emerald-50 rounded-lg border-2 border-emerald-200 transition-all"
                              >
                                <p className="text-2xl font-bold text-emerald-600">
                                  {Math.round(completedNutrition.calories)}
                                </p>
                                <p className="text-xs text-gray-600 mt-1">of {Math.round(dayNutrition.calories)}</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">Calories</p>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-4 bg-blue-50 rounded-lg border-2 border-blue-200 transition-all"
                              >
                                <p className="text-2xl font-bold text-blue-600">
                                  {Math.round(completedNutrition.protein)}g
                                </p>
                                <p className="text-xs text-gray-600 mt-1">of {Math.round(dayNutrition.protein)}g</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">Protein</p>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-4 bg-orange-50 rounded-lg border-2 border-orange-200 transition-all"
                              >
                                <p className="text-2xl font-bold text-orange-600">
                                  {Math.round(completedNutrition.carbs)}g
                                </p>
                                <p className="text-xs text-gray-600 mt-1">of {Math.round(dayNutrition.carbs)}g</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">Carbs</p>
                              </motion.div>
                              <motion.div
                                whileHover={{ scale: 1.05 }}
                                className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-200 transition-all"
                              >
                                <p className="text-2xl font-bold text-purple-600">
                                  {Math.round(completedNutrition.fat)}g
                                </p>
                                <p className="text-xs text-gray-600 mt-1">of {Math.round(dayNutrition.fat)}g</p>
                                <p className="text-sm font-medium text-gray-700 mt-1">Fat</p>
                              </motion.div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <span>Progress</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="font-semibold">{activePlan.progress.adherenceRate}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${activePlan.progress.adherenceRate}%` }}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Days Completed</p>
                          <p className="font-semibold">{activePlan.progress.completedDays}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Days Remaining</p>
                          <p className="font-semibold">
                            {activePlan.duration - activePlan.progress.completedDays}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <Button className="w-full" variant="outline" onClick={handleViewFullPlan}>
                        <Calendar className="w-4 h-4 mr-2" />
                        View Full Plan
                      </Button>
                      <Button className="w-full" variant="outline" onClick={handleNotifications}>
                        <Bell className="w-4 h-4 mr-2" />
                        Notification Settings
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}