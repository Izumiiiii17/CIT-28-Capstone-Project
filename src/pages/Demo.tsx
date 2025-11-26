import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ArrowRight, Zap, Target, Utensils } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';

export default function Demo() {
  const [currentDemo, setCurrentDemo] = useState<'input' | 'results'>('input');

  const sampleInput = {
    age: 28,
    gender: 'Male',
    height: '175 cm',
    weight: '75 kg',
    activity: 'Moderately Active',
    sport: 'Runner',
    goal: 'Maintain Weight',
    diet: 'Non-Vegetarian',
    allergies: 'None',
  };

  const sampleResults = {
    calories: 2150,
    protein: 134,
    carbs: 242,
    fat: 71,
    meals: [
      {
        name: 'Breakfast',
        time: '7:30 AM',
        food: 'Oatmeal with banana and almonds',
        calories: 420,
      },
      {
        name: 'Lunch',
        time: '12:30 PM',
        food: 'Grilled chicken with quinoa salad',
        calories: 650,
      },
      {
        name: 'Dinner',
        time: '7:00 PM',
        food: 'Baked salmon with sweet potato',
        calories: 580,
      },
      {
        name: 'Snacks',
        time: 'Throughout day',
        food: 'Greek yogurt, mixed nuts',
        calories: 500,
      },
    ],
  };

  const macroData = [
    { name: 'Protein', value: sampleResults.protein * 4, color: '#10B981' },
    { name: 'Carbs', value: sampleResults.carbs * 4, color: '#3B82F6' },
    { name: 'Fat', value: sampleResults.fat * 9, color: '#F97316' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Interactive Demo
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Explore how NutriGuide transforms your personal information into a comprehensive 
              nutrition and fitness plan powered by AI.
            </p>
          </div>

          {/* Demo Navigation */}
          <div className="flex justify-center mb-8">
            <div className="bg-white rounded-lg p-1 shadow-md">
              <button
                onClick={() => setCurrentDemo('input')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  currentDemo === 'input'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Sample Input
              </button>
              <button
                onClick={() => setCurrentDemo('results')}
                className={`px-6 py-2 rounded-md font-medium transition-colors ${
                  currentDemo === 'results'
                    ? 'bg-emerald-600 text-white'
                    : 'text-gray-600 hover:text-emerald-600'
                }`}
              >
                Generated Results
              </button>
            </div>
          </div>

          {/* Demo Content */}
          {currentDemo === 'input' ? (
            <motion.div
              key="input"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Input Form Demo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Play className="w-5 h-5 text-emerald-600" />
                      <span>Sample User Profile</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(sampleInput).map(([key, value]) => (
                        <div key={key} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                          </span>
                          <span className="text-gray-900">{value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6">
                      <Button
                        onClick={() => setCurrentDemo('results')}
                        className="w-full"
                      >
                        Generate AI Plan
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Process Explanation */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Zap className="w-5 h-5 text-blue-600" />
                      <span>AI Processing</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-emerald-600 font-bold text-sm">1</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">TDEE Calculation</h4>
                          <p className="text-sm text-gray-600">
                            Using the Mifflin-St Jeor equation to calculate your Total Daily Energy Expenditure
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-600 font-bold text-sm">2</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">AI Meal Planning</h4>
                          <p className="text-sm text-gray-600">
                            Gemini AI generates personalized meals based on your preferences and goals
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-orange-600 font-bold text-sm">3</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Exercise Matching</h4>
                          <p className="text-sm text-gray-600">
                            Sport-specific workouts tailored to your athlete type and training schedule
                          </p>
                        </div>
                      </div>

                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-bold text-sm">4</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">Optimization</h4>
                          <p className="text-sm text-gray-600">
                            Budget-friendly, locally-available ingredients with nutritional balance
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="results"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {/* Results Demo */}
              <div className="space-y-8">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <Card>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Daily Calories</p>
                          <p className="text-2xl font-bold text-emerald-600">{sampleResults.calories}</p>
                        </div>
                        <Target className="w-8 h-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Protein</p>
                          <p className="text-2xl font-bold text-blue-600">{sampleResults.protein}g</p>
                        </div>
                        <Utensils className="w-8 h-8 text-blue-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Carbs</p>
                          <p className="text-2xl font-bold text-orange-600">{sampleResults.carbs}g</p>
                        </div>
                        <Target className="w-8 h-8 text-orange-600" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Fat</p>
                          <p className="text-2xl font-bold text-purple-600">{sampleResults.fat}g</p>
                        </div>
                        <Target className="w-8 h-8 text-purple-600" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Charts and Meals */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Macro Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Macronutrient Breakdown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={macroData}
                              cx="50%"
                              cy="50%"
                              outerRadius={80}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                              {macroData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Sample Meals */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Sample Day Meals</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {sampleResults.meals.map((meal, index) => (
                          <div key={index} className="bg-gray-50 rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-900">{meal.name}</h4>
                              <span className="text-sm text-gray-600">{meal.time}</span>
                            </div>
                            <p className="text-sm text-gray-700 mb-1">{meal.food}</p>
                            <p className="text-xs text-emerald-600 font-medium">{meal.calories} calories</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* CTA */}
                <div className="text-center bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    Ready for Your Personalized Plan?
                  </h3>
                  <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                    This is just a sample of what NutriGuide can do. Create your account to get a 
                    fully personalized nutrition and fitness plan tailored to your unique goals.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" onClick={() => window.location.href = '/auth?mode=signup'}>
                      Create My Plan
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                    <Button variant="outline" size="lg" onClick={() => setCurrentDemo('input')}>
                      View Sample Input
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}