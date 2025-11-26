import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  Award, 
  ArrowLeft,
  Download,
  Share,
  BarChart3,
  PieChart,
  Activity
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell 
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { DietPlanService } from '../services/dietPlanService';
import Button from '../components/ui/Button';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

interface ProgressData {
  activePlan: any;
  weeklyProgress: Array<{
    day: string;
    adherence: number;
    calories: number;
    weight: number;
  }>;
  macroDistribution: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  achievements: Array<{
    title: string;
    description: string;
    earned: boolean;
    date?: string;
    progress?: number;
  }>;
  stats: {
    totalDays: number;
    completedDays: number;
    adherenceRate: number;
    avgCalories: number;
    weightChange: number;
    streakDays: number;
  };
}

export default function Progress() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    loadProgressData();
  }, [user, timeRange]);

  const loadProgressData = async () => {
    setLoading(true);
    try {
      const { data: plansData } = await DietPlanService.getUserDietPlans();
      if (plansData && plansData.length > 0) {
        const plans = plansData.map(DietPlanService.dietPlanRowToDietPlan);
        generateProgressData(plans);
      }
    } catch (error) {
      console.error('Error loading progress data:', error);
      toast.error('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const generateProgressData = (plans: any[]) => {
    const activePlan = plans.find(plan => plan.isActive) || plans[0];
    
    // Generate progress data based on time range
    const daysToShow = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;
    const weeklyProgress = Array.from({ length: daysToShow }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (daysToShow - index - 1));
      return {
        day: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
        adherence: Math.floor(75 + Math.random() * 25), // Random between 75-100
        calories: Math.floor(2000 + Math.random() * 300), // Random between 2000-2300
        weight: 75.2 - (index * 0.1), // Simulate gradual weight loss
      };
    });

    const macroDistribution = [
      { name: 'Protein', value: 25, color: '#10B981' },
      { name: 'Carbs', value: 45, color: '#3B82F6' },
      { name: 'Fat', value: 30, color: '#F97316' },
    ];

    const achievements = [
      { title: '7-Day Streak', description: 'Completed 7 days in a row', earned: true, date: '2024-01-15' },
      { title: 'Macro Master', description: 'Hit macro targets 5 days straight', earned: true, date: '2024-01-12' },
      { title: 'Consistency King', description: 'Logged meals for 30 days', earned: false, progress: 23 },
      { title: 'Goal Crusher', description: 'Reached weight loss goal', earned: false, progress: 65 },
    ];

    setProgressData({
      activePlan,
      weeklyProgress,
      macroDistribution,
      achievements,
      stats: {
        totalDays: activePlan?.progress.totalDays || 30,
        completedDays: activePlan?.progress.completedDays || 15,
        adherenceRate: activePlan?.progress.adherenceRate || 87,
        avgCalories: 2140,
        weightChange: -0.8,
        streakDays: 7,
      }
    });
  };

  const exportProgress = () => {
    if (!progressData) return;
    
    const exportData = {
      user: user?.email,
      exportDate: new Date().toISOString(),
      timeRange,
      ...progressData,
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nutriguide-progress-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Progress data exported successfully!');
  };

  const shareProgress = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My NutriGuide Progress',
          text: `I've completed ${progressData?.stats.completedDays} days with ${progressData?.stats.adherenceRate}% adherence rate!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback: copy to clipboard
      const shareText = `I've completed ${progressData?.stats.completedDays} days with ${progressData?.stats.adherenceRate}% adherence rate on NutriGuide!`;
      navigator.clipboard.writeText(shareText);
      toast.success('Progress copied to clipboard!');
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: "spring" as const,
    stiffness: 100,
    damping: 20,
    duration: 0.5
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Progress</h2>
          <p className="text-gray-600">Analyzing your nutrition journey...</p>
        </div>
      </div>
    );
  }

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
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Progress Tracking</h1>
              <p className="text-gray-600">Monitor your nutrition journey and achievements</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 3 Months</option>
            </select>
            <Button variant="outline" size="sm" onClick={exportProgress}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={shareProgress}>
              <Share className="w-4 h-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {progressData && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Adherence Rate</p>
                        <p className="text-2xl font-bold text-emerald-600">{progressData.stats.adherenceRate}%</p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Days Completed</p>
                        <p className="text-2xl font-bold text-blue-600">
                          {progressData.stats.completedDays}/{progressData.stats.totalDays}
                        </p>
                      </div>
                      <Calendar className="w-8 h-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Weight Change</p>
                        <p className="text-2xl font-bold text-orange-600">{progressData.stats.weightChange} kg</p>
                      </div>
                      <Target className="w-8 h-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Current Streak</p>
                        <p className="text-2xl font-bold text-purple-600">{progressData.stats.streakDays} days</p>
                      </div>
                      <Award className="w-8 h-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              {/* Weekly Progress Chart */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5 text-emerald-600" />
                      <span>Weekly Adherence</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={progressData.weeklyProgress}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="day" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="adherence" fill="#10B981" radius={4} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Macro Distribution */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="w-5 h-5 text-emerald-600" />
                      <span>Macro Distribution</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Tooltip />
                          <Pie
                            data={progressData.macroDistribution}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ payload, percent }: any) => {
                              if (!payload) return null;
                              return `${payload.name} ${(percent * 100).toFixed(0)}%`;
                            }}
                          >
                            {progressData.macroDistribution.map((entry, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* Weight Progress */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="mb-8"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="w-5 h-5 text-emerald-600" />
                    <span>Weight Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={progressData.weeklyProgress}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="weight" 
                          stroke="#10B981" 
                          strokeWidth={3}
                          dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Achievements */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="w-5 h-5 text-emerald-600" />
                    <span>Achievements</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {progressData.achievements.map((achievement: any, index: number) => (
                      <motion.div
                        key={achievement.title}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.9 + index * 0.1 }}
                        className={`p-4 rounded-lg border-2 ${
                          achievement.earned
                            ? 'border-emerald-200 bg-emerald-50'
                            : 'border-gray-200 bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className={`font-semibold ${
                              achievement.earned ? 'text-emerald-800' : 'text-gray-700'
                            }`}>
                              {achievement.title}
                            </h3>
                            <p className={`text-sm ${
                              achievement.earned ? 'text-emerald-600' : 'text-gray-600'
                            }`}>
                              {achievement.description}
                            </p>
                            {achievement.earned && achievement.date && (
                              <p className="text-xs text-emerald-500 mt-1">
                                Earned on {new Date(achievement.date).toLocaleDateString()}
                              </p>
                            )}
                            {!achievement.earned && achievement.progress && (
                              <div className="mt-2">
                                <div className="flex justify-between text-xs text-gray-600 mb-1">
                                  <span>Progress</span>
                                  <span>{achievement.progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                                    style={{ width: `${achievement.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className={`ml-4 ${
                            achievement.earned ? 'text-emerald-600' : 'text-gray-400'
                          }`}>
                            <Award className="w-6 h-6" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </motion.div>
  );
}