import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Calendar, Clock, Utensils, Activity, Target, Download, Save, Eye, Heart, AlertCircle, TrendingUp, Award, ArrowRight, CheckCircle } from 'lucide-react';
import { DietPlan, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/profileService';
import { DietPlanService } from '../services/dietPlanService';
import { AIService } from '../services/aiService';
import { NotificationService } from '../services/notificationService';
import { smsService } from '../services/smsService';
import { emailService } from '../services/emailService';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

interface MacroData {
  name: string;
  value: number;
  color: string;
}



interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: MacroData;
    value: number;
  }>;
}

const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
} as const;

const pageTransition = {
  type: "spring" as const,
  stiffness: 100,
  damping: 20
};

export default function Results() {
  const [generatedPlan, setGeneratedPlan] = useState<DietPlan | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planDates, setPlanDates] = useState<{ startDate: string; endDate: string } | null>(null);
  const [showReview, setShowReview] = useState(true);

  const [downloading, setDownloading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const [generating, setGenerating] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Load user profile
      const { data: profileData, error: profileError } = await ProfileService.getProfile();

      if (profileError || !profileData) {
        toast.error('Please complete your profile first');
        navigate('/profile');
        return;
      }

      const profile = ProfileService.profileRowToUserProfile(profileData);
      setUserProfile(profile);

      // Calculate plan dates based on duration - ensure fresh calculation each time
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + profile.planDuration);

      setPlanDates({
        startDate: startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        }),
        endDate: endDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      });
    } catch (error) {
      toast.error('Failed to load profile. Please try again.');
      console.error('Profile loading error:', error);
    } finally {
      setLoading(false);
    }
  };

  const generatePlan = async () => {
    if (!userProfile) return;

    setGenerating(true);
    try {
      // Generate diet plan using AI
      const plan = await AIService.generateDietPlan(userProfile);
      setGeneratedPlan(plan);
      setShowReview(false);

      // Send notifications
      if (userProfile.phoneNumber) {
        await smsService.sendPlanGenerated(userProfile.phoneNumber, plan.name);
      }

      if (userProfile.email) {
        await emailService.sendPlanGeneratedEmail(userProfile.email, userProfile.name, plan.name);
      }

      toast.success(`Your ${userProfile.planDuration}-day ${userProfile.dietaryRestrictions.dietType} diet plan has been generated successfully!`);
    } catch (error) {
      toast.error('Failed to generate diet plan. Please try again.');
      console.error('Plan generation error:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleSavePlan = async () => {
    if (!generatedPlan) return;

    setSaving(true);
    try {
      const { error } = await DietPlanService.createDietPlan(generatedPlan);

      if (error) {
        throw new Error(error.message);
      }

      toast.success('Diet plan saved to your profile!');

      // Setup browser notifications automatically
      if (userProfile) {
        const settings = NotificationService.getNotificationSettings();

        // Request permission if not already granted
        if (NotificationService.isSupported() && NotificationService.getPermissionStatus() === 'default') {
          const granted = await NotificationService.requestPermission();
          if (granted) {
            toast.success('Meal reminders enabled! You\'ll receive notifications at your meal times.');
          }
        }

        // Schedule meal reminders if enabled
        if (settings.browserNotifications && settings.mealReminders) {
          NotificationService.scheduleMealReminders(userProfile);
        }
      }

      // Schedule SMS reminders if enabled
      if (userProfile?.phoneNumber) {
        smsService.scheduleReminders(userProfile.phoneNumber, userProfile.preferences.mealTimings);
      }

      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    } catch (error) {
      toast.error('Failed to save diet plan.');
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleViewDashboard = () => {
    navigate('/dashboard');
  };

  const handleDownloadPDF = async () => {
    if (!generatedPlan || !userProfile) return;

    setDownloading(true);
    try {
      // Save to localStorage
      localStorage.setItem('savedDietPlan', JSON.stringify(generatedPlan));
      toast.success('Plan saved to local storage!');

      // Create PDF with table format
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let yPos = margin;

      // Title
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text(generatedPlan.name, pageWidth / 2, yPos, { align: 'center' });
      yPos += 8;

      // Subtitle
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${userProfile.planDuration} Day Diet Plan | ${generatedPlan.dailyCalories} cal/day`, pageWidth / 2, yPos, { align: 'center' });
      yPos += 10;

      // Table headers and data
      const tableHeaders = [
        ['Day', 'Date', 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Total Cal']
      ];

      const tableData = generatedPlan.meals.map(day => [
        `Day ${day.day}`,
        day.date,
        `${day.meals.breakfast.name}\n(${day.meals.breakfast.nutrition.calories} cal)`,
        `${day.meals.lunch.name}\n(${day.meals.lunch.nutrition.calories} cal)`,
        `${day.meals.dinner.name}\n(${day.meals.dinner.nutrition.calories} cal)`,
        day.meals.snacks.map(s => `${s.name} (${s.nutrition.calories} cal)`).join('\n'),
        `${day.totalCalories}`
      ]);

      // Use autoTable plugin for better table formatting
      autoTable(pdf, {
        head: tableHeaders,
        body: tableData,
        startY: yPos,
        theme: 'grid',
        styles: {
          fontSize: 7,
          cellPadding: 2,
          overflow: 'linebreak',
          halign: 'left',
          valign: 'top'
        },
        headStyles: {
          fillColor: [16, 185, 129], // emerald-600
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { cellWidth: 15, halign: 'center' },
          1: { cellWidth: 25 },
          2: { cellWidth: 50 },
          3: { cellWidth: 50 },
          4: { cellWidth: 50 },
          5: { cellWidth: 45 },
          6: { cellWidth: 20, halign: 'center' }
        },
        margin: { left: margin, right: margin },
        didDrawPage: (data: any) => {
          // Footer with page numbers
          const pageCount = pdf.internal.pages.length - 1;
          pdf.setFontSize(8);
          pdf.setFont('helvetica', 'normal');
          pdf.text(
            `Page ${data.pageNumber} of ${pageCount}`,
            pageWidth / 2,
            pageHeight - 5,
            { align: 'center' }
          );
        }
      });

      pdf.save(`${generatedPlan.name.replace(/\s+/g, '-').toLowerCase()}-diet-plan.pdf`);
      toast.success('PDF downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download PDF.');
      console.error('PDF download error:', error);
    } finally {
      setDownloading(false);
    }
  };



  const getDietTypeInfo = () => {
    if (!userProfile) return { label: 'Unknown', icon: '🍽️', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };

    switch (userProfile.dietaryRestrictions.dietType) {
      case 'omnivore':
        return { label: 'Omnivore', icon: '🥩', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-800' };
      case 'vegetarian':
        return { label: 'Vegetarian', icon: '🥗', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'vegan':
        return { label: 'Vegan', icon: '🌱', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-800' };
      case 'pescatarian':
        return { label: 'Pescatarian', icon: '🐟', color: 'blue', bgColor: 'bg-blue-100', textColor: 'text-blue-800' };
      case 'keto':
        return { label: 'Keto', icon: '🥑', color: 'yellow', bgColor: 'bg-yellow-100', textColor: 'text-yellow-800' };
      case 'paleo':
        return { label: 'Paleo', icon: '🦴', color: 'amber', bgColor: 'bg-amber-100', textColor: 'text-amber-800' };
      default:
        return { label: 'Unknown', icon: '🍽️', color: 'gray', bgColor: 'bg-gray-100', textColor: 'text-gray-800' };
    }
  };

  const getGoalTypeInfo = () => {
    if (!userProfile) return { label: 'Unknown', color: 'gray' };

    switch (userProfile.healthGoals.primary) {
      case 'weight_loss':
        return { label: 'Weight Loss', color: 'red' };
      case 'muscle_gain':
        return { label: 'Muscle Gain', color: 'blue' };
      case 'maintenance':
        return { label: 'Weight Maintenance', color: 'green' };
      case 'general_health':
        return { label: 'General Health', color: 'purple' };
      default:
        return { label: 'Unknown', color: 'gray' };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Loading Your Profile</h2>
          <p className="text-gray-600">Getting your information ready...</p>
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
              <h2 className="text-xl font-semibold text-red-600 mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-4">Unable to load your profile.</p>
              <Button onClick={() => navigate('/profile')}>
                Complete Profile
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show review step before generating the plan
  if (showReview) {
    const dietTypeInfo = getDietTypeInfo();
    const goalTypeInfo = getGoalTypeInfo();

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Review Your Profile
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Please review your profile information before generating your personalized diet plan.
              </p>
            </div>

            {/* Profile Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-emerald-600" />
                  Your Profile Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Personal Details</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Age: {userProfile.personalDetails.age} years</li>
                      <li>Gender: {userProfile.personalDetails.gender}</li>
                      <li>Weight: {userProfile.personalDetails.weight} kg</li>
                      <li>Height: {userProfile.personalDetails.height} cm</li>
                      <li>Activity Level: {userProfile.personalDetails.activityLevel.replace('_', ' ')}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Dietary Preferences</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Diet Type: {dietTypeInfo.label}</li>
                      <li>Allergies: {userProfile.dietaryRestrictions.allergies.length > 0 ? userProfile.dietaryRestrictions.allergies.join(', ') : 'None'}</li>
                      <li>Preferred Cuisines: {userProfile.preferences.cuisines.slice(0, 3).join(', ')}{userProfile.preferences.cuisines.length > 3 ? '...' : ''}</li>
                      <li>Budget Range: {userProfile.preferences.budgetRange}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Health Information</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>Primary Goal: {goalTypeInfo.label}</li>
                      <li>Target Weight: {userProfile.healthGoals.targetWeight ? `${userProfile.healthGoals.targetWeight} kg` : 'Not specified'}</li>
                      <li>Medical Conditions: {userProfile.medicalConditions.includes('None') ? 'None' : userProfile.medicalConditions.join(', ')}</li>
                      <li>Sport Activities: {userProfile.sportActivities.slice(0, 3).join(', ')}{userProfile.sportActivities.length > 3 ? '...' : ''}</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Plan Summary */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-emerald-600" />
                  Plan Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-medium text-gray-700">Duration:</p>
                      <p className="text-gray-900">{userProfile.planDuration} days</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Diet Type:</p>
                      <p className="text-gray-900 capitalize">{dietTypeInfo.label}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Start Date:</p>
                      <p className="text-gray-900">{planDates?.startDate}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">End Date:</p>
                      <p className="text-gray-900">{planDates?.endDate}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="text-center">
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
                <div className="flex items-center justify-center mb-4">
                  <CheckCircle className="w-12 h-12 text-emerald-600 mr-3" />
                  <h3 className="text-2xl font-bold text-gray-900">
                    Ready to Generate Your Plan?
                  </h3>
                </div>
                <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                  Your personalized {dietTypeInfo.label} diet plan will be created based on your profile information.
                  This may take a few moments as we analyze your preferences and generate optimal meal recommendations.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" onClick={generatePlan} isLoading={generating}>
                    {generating ? 'Generating...' : 'Generate Diet Plan'}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                  <Button variant="outline" size="lg" onClick={() => navigate('/profile')}>
                    Edit Profile
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    );
  }

  if (generating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Generating Your Diet Plan</h2>
          <p className="text-gray-600">Creating personalized nutrition recommendations...</p>
          <div className="mt-4 space-y-2 text-sm text-gray-500">
            <p>✓ Analyzing your profile</p>
            <p>✓ Calculating nutritional needs</p>
            <p>✓ Selecting optimal meals based on your diet preferences</p>
            <p>✓ Customizing for your medical conditions</p>
            <p>✓ Creating your {userProfile?.planDuration || 30}-day plan</p>
          </div>
        </div>
      </div>
    );
  }

  if (!generatedPlan) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent>
            <div className="text-center">
              <h2 className="text-xl font-semibold text-red-600 mb-2">Generation Failed</h2>
              <p className="text-gray-600 mb-4">Unable to generate your diet plan.</p>
              <Button onClick={() => navigate('/profile')}>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const macroData = [
    { name: 'Protein', value: generatedPlan.macros.protein * 4, color: '#10B981' },
    { name: 'Carbs', value: generatedPlan.macros.carbs * 4, color: '#3B82F6' },
    { name: 'Fat', value: generatedPlan.macros.fat * 9, color: '#F97316' },
  ];

  const weeklyCalories = generatedPlan.meals.slice(0, 7).map((day) => ({
    day: `Day ${day.day}`,
    calories: day.totalCalories,
  }));

  const CustomTooltip: React.FC<CustomTooltipProps> = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-white p-2 border border-gray-200 rounded-lg shadow">
          <p className="text-sm">
            <span style={{ color: data.payload.color }}>●</span>
            {` ${data.payload.name}: ${Math.round(data.value)} cal`}
          </p>
        </div>
      );
    }
    return null;
  };

  const dietTypeInfo = getDietTypeInfo();
  const goalTypeInfo = getGoalTypeInfo();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          ref={contentRef}
          initial={pageVariants.initial}
          animate={pageVariants.animate}
          exit={pageVariants.exit}
          transition={pageTransition}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Your Personalized Diet Plan
            </h1>
            <h2 className="text-xl text-emerald-600 font-semibold mb-2">
              {generatedPlan.name}
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {generatedPlan.description}
            </p>

            {/* Diet Type Badge */}
            <div className="flex justify-center mt-4">
              <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${dietTypeInfo.bgColor} ${dietTypeInfo.textColor}`}>
                <span className="mr-2">{dietTypeInfo.icon}</span>
                {dietTypeInfo.label} Diet
              </div>
            </div>

            {/* Plan Dates */}
            {planDates && (
              <div className="mt-4 text-sm text-gray-600">
                <p>Plan Duration: {userProfile?.planDuration || 30} days</p>
                <p>{planDates.startDate} to {planDates.endDate}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <Button onClick={handleSavePlan} isLoading={saving}>
                <Save className="w-4 h-4 mr-2" />
                Save Plan
              </Button>
              <Button variant="outline" onClick={handleViewDashboard}>
                <Eye className="w-4 h-4 mr-2" />
                View Dashboard
              </Button>
              <Button variant="outline" onClick={handleDownloadPDF} isLoading={downloading}>
                <Download className="w-4 h-4 mr-2" />
                {downloading ? 'Downloading...' : 'Download PDF'}
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Daily Calories</p>
                    <p className="text-2xl font-bold text-emerald-600">{generatedPlan.dailyCalories}</p>
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
                    <p className="text-2xl font-bold text-blue-600">{generatedPlan.macros.protein}g</p>
                  </div>
                  <Utensils className="w-8 h-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Duration</p>
                    <p className="text-2xl font-bold text-orange-600">{userProfile?.planDuration || 30} days</p>
                  </div>
                  <Calendar className="w-8 h-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Diet Type</p>
                    <p className="text-lg font-bold text-purple-600">{dietTypeInfo.icon}</p>
                  </div>
                  <Heart className="w-8 h-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Goal</p>
                    <p className="text-lg font-bold text-indigo-600">{goalTypeInfo.label}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-indigo-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Profile Summary */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2 text-emerald-600" />
                Your Profile Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Personal Details</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Age: {userProfile?.personalDetails.age} years</li>
                    <li>Gender: {userProfile?.personalDetails.gender}</li>
                    <li>Weight: {userProfile?.personalDetails.weight} kg</li>
                    <li>Height: {userProfile?.personalDetails.height} cm</li>
                    <li>Activity Level: {userProfile?.personalDetails.activityLevel.replace('_', ' ')}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Dietary Preferences</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Diet Type: {dietTypeInfo.label}</li>
                    <li>Allergies: {userProfile?.dietaryRestrictions.allergies.length > 0 ? userProfile.dietaryRestrictions.allergies.join(', ') : 'None'}</li>
                    <li>Preferred Cuisines: {userProfile?.preferences.cuisines.slice(0, 3).join(', ')}{userProfile?.preferences.cuisines.length > 3 ? '...' : ''}</li>
                    <li>Budget Range: {userProfile?.preferences.budgetRange}</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Health Information</h4>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>Primary Goal: {goalTypeInfo.label}</li>
                    <li>Target Weight: {userProfile?.healthGoals.targetWeight ? `${userProfile.healthGoals.targetWeight} kg` : 'Not specified'}</li>
                    <li>Medical Conditions: {userProfile?.medicalConditions.includes('None') ? 'None' : userProfile.medicalConditions.join(', ')}</li>
                    <li>Sport Activities: {userProfile?.sportActivities.slice(0, 3).join(', ')}{userProfile?.sportActivities.length > 3 ? '...' : ''}</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
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
                        label={(props: any) => {
                          const totalValue = macroData.reduce((acc, curr) => acc + curr.value, 0);
                          const currentValue = macroData.find(d => d.name === props.name)?.value || 0;
                          return `${props.name} ${((currentValue / totalValue) * 100).toFixed(0)}%`;
                        }}
                      >
                        {macroData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Calorie Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyCalories}>
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="calories" fill="#10B981" radius={4} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Complete Food Plan - All Days */}
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Complete {userProfile?.planDuration || 30}-Day Food Plan</h2>
              <div className="text-sm text-gray-600">
                Showing all {generatedPlan.meals.length} days
              </div>
            </div>

            {generatedPlan.meals.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Calendar className="w-5 h-5 text-emerald-600" />
                      <span>Day {day.day}</span>
                      <span className="text-sm text-gray-500">({day.totalCalories} calories)</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Breakfast */}
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center">
                          <Utensils className="w-4 h-4 mr-2 text-yellow-600" />
                          Breakfast
                        </h4>
                        <div className="bg-yellow-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{day.meals.breakfast.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{day.meals.breakfast.description}</p>
                          <div className="text-xs text-gray-500">
                            <span>{day.meals.breakfast.nutrition.calories} cal</span>
                            <span className="mx-2">•</span>
                            <span>{day.meals.breakfast.nutrition.protein}g protein</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {day.meals.breakfast.prepTime + day.meals.breakfast.cookTime} min total
                          </div>
                        </div>
                      </div>

                      {/* Lunch */}
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center">
                          <Utensils className="w-4 h-4 mr-2 text-orange-600" />
                          Lunch
                        </h4>
                        <div className="bg-orange-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{day.meals.lunch.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{day.meals.lunch.description}</p>
                          <div className="text-xs text-gray-500">
                            <span>{day.meals.lunch.nutrition.calories} cal</span>
                            <span className="mx-2">•</span>
                            <span>{day.meals.lunch.nutrition.protein}g protein</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {day.meals.lunch.prepTime + day.meals.lunch.cookTime} min total
                          </div>
                        </div>
                      </div>

                      {/* Dinner */}
                      <div>
                        <h4 className="font-semibold text-lg mb-3 flex items-center">
                          <Utensils className="w-4 h-4 mr-2 text-purple-600" />
                          Dinner
                        </h4>
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h5 className="font-medium text-gray-900 mb-2">{day.meals.dinner.name}</h5>
                          <p className="text-sm text-gray-600 mb-2">{day.meals.dinner.description}</p>
                          <div className="text-xs text-gray-500">
                            <span>{day.meals.dinner.nutrition.calories} cal</span>
                            <span className="mx-2">•</span>
                            <span>{day.meals.dinner.nutrition.protein}g protein</span>
                          </div>
                          <div className="mt-2 text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {day.meals.dinner.prepTime + day.meals.dinner.cookTime} min total
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Snacks */}
                    {day.meals.snacks.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-semibold text-lg mb-3 flex items-center">
                          <Utensils className="w-4 h-4 mr-2 text-green-600" />
                          Snacks
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {day.meals.snacks.map((snack, snackIndex) => (
                            <div key={snackIndex} className="bg-green-50 rounded-lg p-3">
                              <h6 className="font-medium text-gray-900">{snack.name}</h6>
                              <p className="text-sm text-gray-600">{snack.description}</p>
                              <div className="text-xs text-gray-500 mt-1">
                                {snack.nutrition.calories} cal • {snack.nutrition.protein}g protein
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Medical Considerations */}
          {userProfile && !userProfile.medicalConditions.includes('None') && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-amber-600" />
                  Medical Considerations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <p className="text-sm text-amber-800">
                    Your meal plan has been customized to accommodate your medical conditions:
                    <span className="font-medium"> {userProfile.medicalConditions.join(', ')}</span>
                  </p>
                  <p className="text-xs text-amber-700 mt-2">
                    Please consult with your healthcare provider before making significant dietary changes.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="text-center mt-12">
            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-8">
              <div className="flex items-center justify-center mb-4">
                <Award className="w-12 h-12 text-emerald-600 mr-3" />
                <h3 className="text-2xl font-bold text-gray-900">
                  Ready to Start Your {userProfile?.planDuration || 30}-Day Journey?
                </h3>
              </div>
              <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
                Your personalized {dietTypeInfo.label} diet plan is designed to help you achieve your {goalTypeInfo.label} goals.
                Save this plan to your profile and access your personalized dashboard
                to track progress, log meals, and stay motivated!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" onClick={handleSavePlan} isLoading={saving}>
                  <Save className="w-5 h-5 mr-2" />
                  Save & Start Plan
                </Button>
                <Button variant="outline" size="lg" onClick={() => navigate('/profile')}>
                  Create Another Plan
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}