import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowRight, ArrowLeft, User, Target, Utensils, Activity, Phone, Heart, Calendar, CheckCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/profileService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().min(10, 'Please enter a valid phone number'),
  age: z.number().min(13).max(120),
  gender: z.enum(['male', 'female', 'other']),
  weight: z.number().min(30).max(300),
  height: z.number().min(100).max(250),
  activityLevel: z.enum(['sedentary', 'light', 'moderate', 'active', 'very_active']),
  primaryGoal: z.enum(['weight_loss', 'muscle_gain', 'maintenance', 'general_health']),
  targetWeight: z.number().optional(),
  planDuration: z.number().min(7, 'Plan duration must be at least 7 days').max(365, 'Plan duration cannot exceed 365 days'),
  planDurationType: z.literal('days'),
  sportActivities: z.array(z.string()),
  allergies: z.array(z.string()),
  intolerances: z.array(z.string()),
  dietType: z.enum(['omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo']),
  restrictions: z.array(z.string()),
  cuisines: z.array(z.string()),
  breakfastTime: z.string(),
  lunchTime: z.string(),
  dinnerTime: z.string(),
  budgetRange: z.enum(['low', 'medium', 'high']),
  medicalConditions: z.array(z.string()).min(1, 'Please select at least one medical condition'),
  otherMedicalCondition: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Expanded sports options array
const sportActivitiesList = [
  'Running', 'Cycling', 'Mountain Biking', 'Swimming', 'Walking', 'Dancing',
  'Weight Training', 'Bodyweight Exercises', 'CrossFit', 'Yoga', 'Pilates', 'Zumba',
  'Martial Arts', 'Karate', 'Judo', 'Taekwondo', 'Kickboxing', 'Boxing',
  'Rowing', 'Kayaking', 'Canoeing', 'Hiking', 'Rock Climbing', 'Bouldering',
  'Tennis', 'Table Tennis', 'Badminton', 'Squash', 'Paddleboarding',
  'Basketball', 'Football', 'Soccer', 'Rugby', 'Baseball', 'Softball',
  'Golf', 'Volleyball', 'Cricket', 'Lacrosse', 'Hockey', 'Ice Skating',
  'Roller Skating', 'Skiing', 'Snowboarding', 'Surfing', 'Windsurfing', 'Sailing',
  'Horse Riding', 'Archery', 'Fencing', 'Triathlon', 'Stretching', 'Other',
];

const activityOptions = [
  { value: 'sedentary', label: 'Sedentary (office job, no exercise)' },
  { value: 'light', label: 'Lightly Active (light exercise 1-3 days/week)' },
  { value: 'moderate', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
  { value: 'active', label: 'Very Active (hard exercise 6-7 days/week)' },
  { value: 'very_active', label: 'Extremely Active (very hard exercise, physical job)' },
];

const goalOptions = [
  { value: 'weight_loss', label: 'Weight Loss' },
  { value: 'muscle_gain', label: 'Muscle Gain' },
  { value: 'maintenance', label: 'Weight Maintenance' },
  { value: 'general_health', label: 'General Health' },
];

const dietOptions = [
  { value: 'omnivore', label: 'Omnivore (All foods including meat)' },
  { value: 'vegetarian', label: 'Vegetarian (No meat, includes dairy)' },
  { value: 'vegan', label: 'Vegan (No animal products)' },
  { value: 'pescatarian', label: 'Pescatarian (Fish but no meat)' },
  { value: 'keto', label: 'Keto (Low carb, high fat)' },
  { value: 'paleo', label: 'Paleo (Unprocessed foods)' },
];

const cuisineOptions = [
  'Italian', 'Chinese', 'Indian', 'Mexican', 'Japanese', 'Mediterranean',
  'American', 'Thai', 'French', 'Korean', 'Middle Eastern', 'Greek'
];

const commonAllergies = [
  'Nuts', 'Shellfish', 'Dairy', 'Eggs', 'Soy', 'Gluten', 'Fish', 'Sesame'
];

const commonConditions = [
  'None', 'Diabetes', 'Hypertension', 'Heart Disease', 'Thyroid Issues',
  'PCOS', 'Celiac Disease', 'IBS', 'Kidney Disease', 'Other'
];

const durationPresets = [
  { value: 7, label: '1 Week' },
  { value: 14, label: '2 Weeks' },
  { value: 30, label: '1 Month' },
  { value: 60, label: '2 Months' },
  { value: 90, label: '3 Months' },
];

export default function ProfileForm() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const totalSteps = 8; // Updated to include review step

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      age: 25,
      gender: 'male',
      weight: 70,
      height: 170,
      activityLevel: 'moderate',
      primaryGoal: 'maintenance',
      targetWeight: 70,
      planDuration: 30,
      planDurationType: 'days',
      sportActivities: [],
      allergies: [],
      intolerances: [],
      dietType: 'omnivore',
      restrictions: [],
      cuisines: [],
      breakfastTime: '08:00',
      lunchTime: '13:00',
      dinnerTime: '19:00',
      budgetRange: 'medium',
      medicalConditions: ['None'],
      otherMedicalCondition: '',
    },
  });

  // Calculate plan dates based on duration
  const calculatePlanDates = (duration?: number) => {
    const planDuration = duration || form.watch('planDuration') || 30;
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + planDuration);
    
    return {
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
      }),
      duration: planDuration
    };
  };

  // Reset all inputs for the current step whenever entered
  useEffect(() => {
    if (currentStep === 1) {
      form.resetField('name');
      form.resetField('email');
      form.resetField('phoneNumber');
      form.resetField('age');
      form.resetField('gender');
    } else if (currentStep === 2) {
      form.resetField('weight');
      form.resetField('height');
      form.resetField('activityLevel');
    } else if (currentStep === 3) {
      form.resetField('primaryGoal');
      form.resetField('targetWeight');
      form.resetField('planDuration');
    } else if (currentStep === 4) {
      form.resetField('medicalConditions');
      form.resetField('otherMedicalCondition');
    } else if (currentStep === 5) {
      form.resetField('dietType');
      form.resetField('allergies');
      form.resetField('cuisines');
    } else if (currentStep === 6) {
      form.resetField('breakfastTime');
      form.resetField('lunchTime');
      form.resetField('dinnerTime');
      form.resetField('budgetRange');
    } else if (currentStep === 7) {
      form.resetField('sportActivities');
    }
  }, [currentStep]);

  // Load profile if exist (you may want to skip step resets if profile exists)
  useEffect(() => {
    if (user) loadExistingProfile();
    // eslint-disable-next-line
  }, [user]);

  const loadExistingProfile = async () => {
    try {
      const { data: profileData } = await ProfileService.getProfile();
      if (profileData) {
        const profile = ProfileService.profileRowToUserProfile(profileData);
        form.reset({
          name: profile.name,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          age: profile.personalDetails.age,
          gender: profile.personalDetails.gender,
          weight: profile.personalDetails.weight,
          height: profile.personalDetails.height,
          activityLevel: profile.personalDetails.activityLevel,
          primaryGoal: profile.healthGoals.primary,
          targetWeight: profile.healthGoals.targetWeight,
          allergies: profile.dietaryRestrictions.allergies,
          intolerances: [],
          dietType: profile.dietaryRestrictions.dietType,
          sportActivities: [],
          planDuration: profile.planDuration || 30,
          planDurationType: 'days',
          restrictions: [],
          cuisines: profile.preferences.cuisines,
          breakfastTime: profile.preferences.mealTimings.breakfast,
          lunchTime: profile.preferences.mealTimings.lunch,
          dinnerTime: profile.preferences.mealTimings.dinner,
          budgetRange: profile.preferences.budgetRange,
          medicalConditions: profile.medicalConditions,
        });
      }
    } catch (error) {
      toast.error('Error loading profile');
    }
  };

  // Step completion validation
  const isStepComplete = (() => {
    const v = form.getValues();
    switch (currentStep) {
      case 1:
        return !!v.name && !!v.email && !!v.phoneNumber && !!v.age && !!v.gender;
      case 2:
        return !!v.weight && !!v.height && !!v.activityLevel;
      case 3:
        return !!v.primaryGoal && !!v.planDuration;
      case 4:
        return Array.isArray(v.medicalConditions) && v.medicalConditions.length > 0;
      case 5:
        return !!v.dietType && Array.isArray(v.cuisines) && v.cuisines.length > 0;
      case 6:
        return !!v.breakfastTime && !!v.lunchTime && !!v.dinnerTime && !!v.budgetRange;
      case 7:
        return Array.isArray(v.sportActivities) && v.sportActivities.length > 0;
      case 8:
        return true; // Review step is always complete
      default:
        return false;
    }
  })();

  const handleNext = () => {
    if (currentStep < totalSteps && isStepComplete) {
      setCurrentStep(currentStep + 1);
    } else if (!isStepComplete) {
      toast.error('Please complete this step before proceeding.');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (data: ProfileFormData) => {
    if (!user) {
      toast.error('Please sign in to continue');
      navigate('/auth');
      return;
    }
    setLoading(true);
    try {
      const userProfile: UserProfile = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: user.email || data.email,
        phoneNumber: data.phoneNumber,
        personalDetails: {
          age: data.age,
          gender: data.gender,
          weight: data.weight,
          height: data.height,
          activityLevel: data.activityLevel,
        },
        healthGoals: {
          primary: data.primaryGoal,
          targetWeight: data.targetWeight
        },
        dietaryRestrictions: {
          allergies: data.allergies,
          intolerances: data.intolerances,
          dietType: data.dietType,
          restrictions: data.restrictions,
        },
        preferences: {
          cuisines: data.cuisines,
          mealTimings: {
            breakfast: data.breakfastTime,
            lunch: data.lunchTime,
            dinner: data.dinnerTime,
            snacks: ['10:00', '16:00'],
          },
          budgetRange: data.budgetRange,
        },
        medicalConditions: data.medicalConditions,
        sportActivities: data.sportActivities,
        planDuration: data.planDuration, // This will now be dynamic based on user input
        planDurationType: data.planDurationType,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const { error } = await ProfileService.createProfile(userProfile);
      if (error) throw new Error(error.message);
      toast.success(`Profile saved successfully! Your ${data.planDuration}-day plan will be generated based on your ${data.dietType} diet preference.`);
      navigate('/results');
    } catch (error) {
      toast.error('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Step rendering
  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <User className="w-5 h-5 text-emerald-600" />
                <CardTitle>Personal Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input {...form.register('name')} label="Full Name" placeholder="Enter your full name" error={form.formState.errors.name?.message} />
                <Input {...form.register('email')} type="email" label="Email Address" placeholder="your@email.com" error={form.formState.errors.email?.message} />
                <Input {...form.register('phoneNumber')} type="tel" label="Phone Number" placeholder="+1 (555) 123-4567" error={form.formState.errors.phoneNumber?.message} />
                <Input {...form.register('age', { valueAsNumber: true })} type="number" label="Age" placeholder="Enter your age" error={form.formState.errors.age?.message} />
                <Select {...form.register('gender')} label="Gender" options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                ]} error={form.formState.errors.gender?.message} />
              </div>
            </CardContent>
          </Card>
        );
      case 2:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <CardTitle>Physical Details</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input {...form.register('weight', { valueAsNumber: true })} type="number" label="Weight (kg)" placeholder="Enter weight in kg" error={form.formState.errors.weight?.message} />
                <Input {...form.register('height', { valueAsNumber: true })} type="number" label="Height (cm)" placeholder="Enter height in cm" error={form.formState.errors.height?.message} />
                <Select {...form.register('activityLevel')} label="Activity Level" options={activityOptions} error={form.formState.errors.activityLevel?.message} />
              </div>
            </CardContent>
          </Card>
        );
      case 3:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-orange-600" />
                <CardTitle>Health Goals & Plan Duration</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Select {...form.register('primaryGoal')} label="Primary Goal" options={goalOptions} error={form.formState.errors.primaryGoal?.message} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input {...form.register('targetWeight', { valueAsNumber: true })} type="number" label="Target Weight (kg) - Optional" placeholder="Enter target weight" error={form.formState.errors.targetWeight?.message} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Diet Plan Duration (in days)</label>
                  <p className="text-sm text-gray-600 mb-3">Select a preset or enter a custom duration for your personalized diet plan.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {durationPresets.map((preset) => {
                      const currentDuration = form.watch('planDuration');
                      const isSelected = currentDuration === preset.value;
                      return (
                        <label key={preset.value}
                          className={`relative flex cursor-pointer rounded-lg border-2 bg-white p-4 shadow-sm focus:outline-none hover:border-emerald-400 transition-all ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300'}`}>
                          <input 
                            type="radio" 
                            value={preset.value} 
                            {...form.register('planDuration', { 
                              valueAsNumber: true,
                              min: { value: 7, message: 'Duration must be at least 7 days' },
                              max: { value: 365, message: 'Duration cannot exceed 365 days' }
                            })} 
                            className="sr-only" 
                          />
                          <span className="flex flex-1">
                            <span className="flex flex-col text-center w-full">
                              <span className={`block text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-900'}`}>{preset.label}</span>
                            </span>
                          </span>
                          {isSelected && (
                            <div className="absolute top-2 right-2">
                              <div className="w-4 h-4 bg-emerald-600 rounded-full flex items-center justify-center">
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            </div>
                          )}
                        </label>
                      );
                    })}
                  </div>
                  <div className="mt-4">
                    <Input 
                      {...form.register('planDuration', { 
                        valueAsNumber: true,
                        min: { value: 7, message: 'Duration must be at least 7 days' },
                        max: { value: 365, message: 'Duration cannot exceed 365 days' }
                      })} 
                      type="number" 
                      label="Or Enter Custom Duration (in days)" 
                      placeholder="e.g., 65" 
                      min="7" 
                      max="365" 
                      error={form.formState.errors.planDuration?.message} 
                    />
                  </div>
                  {/* Display calculated dates */}
                  {form.watch('planDuration') && (
                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <div>
                          <p className="text-sm font-medium text-blue-900">Your plan will run from:</p>
                          <p className="text-sm text-blue-800">
                            {calculatePlanDates().startDate} to {calculatePlanDates().endDate}
                          </p>
                          <p className="text-xs text-blue-600 mt-1">
                            Total duration: {calculatePlanDates().duration} days
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 4:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Heart className="w-5 h-5 text-red-600" />
                <CardTitle>Medical Information</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Medical Conditions (Required)</label>
                  <p className="text-sm text-gray-500 mb-3">Please select at least one option. Choose 'None' if you have no medical conditions.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {commonConditions.map((condition) => (
                      <label key={condition} className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          value={condition} 
                          {...form.register('medicalConditions', {
                            required: 'Please select at least one option'
                          })} 
                          className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" 
                        />
                        <span className="text-sm">{condition}</span>
                      </label>
                    ))}
                  </div>
                  {form.formState.errors.medicalConditions && (
                    <p className="text-sm text-red-500 mt-1">{form.formState.errors.medicalConditions.message}</p>
                  )}
                  {form.watch('medicalConditions')?.includes('Other') && (
                    <div className="mt-3">
                      <Input 
                        label="Other Medical Condition" 
                        placeholder="Please specify your condition"
                        {...form.register('otherMedicalCondition')}
                      />
                    </div>
                  )}
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Important Note</h4>
                  <p className="text-sm text-blue-800">
                    This information helps us create a more personalized diet plan.
                    Always consult with your healthcare provider before making significant
                    dietary changes, especially if you have medical conditions.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 5:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Utensils className="w-5 h-5 text-purple-600" />
                <CardTitle>Dietary Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Select {...form.register('dietType')} label="Diet Type" options={dietOptions} error={form.formState.errors.dietType?.message} />
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <h4 className="font-medium text-amber-900 mb-2">Diet Type Impact</h4>
                  <p className="text-sm text-amber-800">
                    Your diet selection will directly impact your meal plan. For example:
                  </p>
                  <ul className="text-sm text-amber-800 mt-2 list-disc list-inside">
                    <li>Omnivore plans will include a variety of foods including chicken, fish, and meat</li>
                    <li>Vegetarian plans will focus on plant-based foods with dairy and eggs</li>
                    <li>Vegan plans will be completely plant-based with no animal products</li>
                  </ul>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Food Allergies</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {commonAllergies.map((allergy) => (
                      <label key={allergy} className="flex items-center space-x-2">
                        <input type="checkbox" value={allergy} {...form.register('allergies')} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm">{allergy}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Cuisines</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {cuisineOptions.map((cuisine) => (
                      <label key={cuisine} className="flex items-center space-x-2">
                        <input type="checkbox" value={cuisine} {...form.register('cuisines')} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                        <span className="text-sm">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 6:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Phone className="w-5 h-5 text-green-600" />
                <CardTitle>Meal Timings & Preferences</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input {...form.register('breakfastTime')} type="time" label="Breakfast Time" error={form.formState.errors.breakfastTime?.message} />
                  <Input {...form.register('lunchTime')} type="time" label="Lunch Time" error={form.formState.errors.lunchTime?.message} />
                  <Input {...form.register('dinnerTime')} type="time" label="Dinner Time" error={form.formState.errors.dinnerTime?.message} />
                </div>
                <Select {...form.register('budgetRange')} label="Budget Range" options={[
                  { value: 'low', label: 'Low ($5-10 per day)' },
                  { value: 'medium', label: 'Medium ($10-20 per day)' },
                  { value: 'high', label: 'High ($20+ per day)' },
                ]} error={form.formState.errors.budgetRange?.message} />
              </div>
            </CardContent>
          </Card>
        );
      case 7:
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-blue-600" />
                <CardTitle>Sport Activities</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">Select Your Sport Activities (Choose all that apply)</label>
                  <p className="text-sm text-gray-600 mb-3">This helps us tailor your nutrition plan to support your fitness activities.</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {sportActivitiesList.map((activity) => {
                      const selectedActivities = form.watch('sportActivities') || [];
                      const isSelected = selectedActivities.includes(activity);
                      return (
                        <label key={activity}
                          className={`flex items-center space-x-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${isSelected ? 'border-emerald-600 bg-emerald-50' : 'border-gray-300 hover:border-emerald-400'}`}>
                          <input type="checkbox" value={activity} {...form.register('sportActivities')} className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
                          <span className={`text-sm font-medium ${isSelected ? 'text-emerald-900' : 'text-gray-700'}`}>{activity}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 8:
        // Review step
        const formData = form.getValues();
        const planDates = calculatePlanDates(formData.planDuration);
        
        return (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <CardTitle>Review Your Profile</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                  <h3 className="font-medium text-emerald-900 mb-2">Plan Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Duration:</p>
                      <p className="text-gray-900">{formData.planDuration} days</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Diet Type:</p>
                      <p className="text-gray-900 capitalize">{formData.dietType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Start Date:</p>
                      <p className="text-gray-900">{planDates.startDate}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">End Date:</p>
                      <p className="text-gray-900">{planDates.endDate}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Name:</p>
                      <p className="text-gray-900">{formData.name}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Email:</p>
                      <p className="text-gray-900">{formData.email}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Age:</p>
                      <p className="text-gray-900">{formData.age} years</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Gender:</p>
                      <p className="text-gray-900 capitalize">{formData.gender}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Physical Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Weight:</p>
                      <p className="text-gray-900">{formData.weight} kg</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Height:</p>
                      <p className="text-gray-900">{formData.height} cm</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Activity Level:</p>
                      <p className="text-gray-900 capitalize">{formData.activityLevel.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Primary Goal:</p>
                      <p className="text-gray-900 capitalize">{formData.primaryGoal.replace('_', ' ')}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Dietary Preferences</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Diet Type:</p>
                      <p className="text-gray-900 capitalize">{formData.dietType}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Budget Range:</p>
                      <p className="text-gray-900 capitalize">{formData.budgetRange}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Allergies:</p>
                      <p className="text-gray-900">
                        {formData.allergies.length > 0 ? formData.allergies.join(', ') : 'None'}
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Preferred Cuisines:</p>
                      <p className="text-gray-900">
                        {formData.cuisines.length > 0 ? formData.cuisines.join(', ') : 'None'}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Meal Timings</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-gray-700">Breakfast:</p>
                      <p className="text-gray-900">{formData.breakfastTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Lunch:</p>
                      <p className="text-gray-900">{formData.lunchTime}</p>
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Dinner:</p>
                      <p className="text-gray-900">{formData.dinnerTime}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Sport Activities</h3>
                  <p className="text-sm text-gray-900">
                    {formData.sportActivities.length > 0 ? formData.sportActivities.join(', ') : 'None'}
                  </p>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Medical Conditions</h3>
                  <p className="text-sm text-gray-900">
                    {formData.medicalConditions.includes('None') 
                      ? 'None' 
                      : formData.medicalConditions.join(', ')
                    }
                  </p>
                  {formData.otherMedicalCondition && (
                    <p className="text-sm text-gray-900 mt-1">
                      Other: {formData.otherMedicalCondition}
                    </p>
                  )}
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Ready to Start?</h3>
                  <p className="text-sm text-blue-800 mb-4">
                    Click "Generate Diet Plan" to create your personalized {formData.planDuration}-day meal plan based on your {formData.dietType} diet preference.
                  </p>
                  <p className="text-xs text-blue-700">
                    You can always modify your profile later if needed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-gray-900">Create Your Profile</h1>
              <span className="text-sm text-gray-600">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-emerald-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            {renderStep()}
            <div className="flex justify-between mt-8">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 1}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Previous
              </Button>
              {currentStep === totalSteps ? (
                <Button type="submit" isLoading={loading}>
                  Generate Diet Plan
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button type="button" onClick={handleNext} disabled={!isStepComplete}>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}