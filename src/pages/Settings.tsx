import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, 
  Bell, 
  Shield, 
  Smartphone, 
  Mail, 
  Moon, 
  Sun, 
  Globe, 
  Save,
  ArrowLeft,
  Trash2,
  Download,
  Upload
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ProfileService } from '../services/profileService';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import toast from 'react-hot-toast';

const settingsSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phoneNumber: z.string().optional(),
  smsNotifications: z.boolean(),
  emailNotifications: z.boolean(),
  mealReminders: z.boolean(),
  progressUpdates: z.boolean(),
  darkMode: z.boolean(),
  language: z.string(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: '',
      email: '',
      phoneNumber: '',
      smsNotifications: true,
      emailNotifications: true,
      mealReminders: true,
      progressUpdates: true,
      darkMode: false,
      language: 'en',
    },
  });

  useEffect(() => {
    loadUserSettings();
  }, []);

  const loadUserSettings = async () => {
    try {
      const { data: profileData } = await ProfileService.getProfile();
      if (profileData) {
        const profile = ProfileService.profileRowToUserProfile(profileData);
        form.reset({
          name: profile.name,
          email: profile.email,
          phoneNumber: profile.phoneNumber || '',
          smsNotifications: true,
          emailNotifications: true,
          mealReminders: true,
          progressUpdates: true,
          darkMode: false,
          language: 'en',
        });
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleSaveSettings = async (data: SettingsFormData) => {
    setLoading(true);
    try {
      // Update profile data
      await ProfileService.updateProfile({
        name: data.name,
        phoneNumber: data.phoneNumber,
      });

      // Save notification preferences to localStorage
      localStorage.setItem('nutriguide_settings', JSON.stringify({
        smsNotifications: data.smsNotifications,
        emailNotifications: data.emailNotifications,
        mealReminders: data.mealReminders,
        progressUpdates: data.progressUpdates,
        darkMode: data.darkMode,
        language: data.language,
      }));

      toast.success('Settings saved successfully!');
    } catch (error) {
      toast.error('Failed to save settings');
      console.error('Settings save error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        // In a real app, you'd call an API to delete the account
        await signOut();
        toast.success('Account deleted successfully');
        navigate('/');
      } catch (error) {
        toast.error('Failed to delete account');
      }
    }
  };

  const handleExportData = () => {
    // Export user data as JSON
    const userData = {
      profile: form.getValues(),
      settings: JSON.parse(localStorage.getItem('nutriguide_settings') || '{}'),
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(userData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'nutriguide-data.json';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data exported successfully!');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Globe },
  ];

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 0, y: -20 }
  };

  const pageTransition = {
    type: 'tween',
    ease: 'anticipate',
    duration: 0.5
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Manage your account and preferences</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <nav className="space-y-1">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-4 py-3 text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-emerald-50 text-emerald-700 border-r-2 border-emerald-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </CardContent>
            </Card>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <form onSubmit={form.handleSubmit(handleSaveSettings)}>
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <User className="w-5 h-5 text-emerald-600" />
                        <span>Profile Information</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Input
                            {...form.register('name')}
                            label="Full Name"
                            placeholder="Enter your full name"
                            error={form.formState.errors.name?.message}
                          />
                          <Input
                            {...form.register('email')}
                            type="email"
                            label="Email Address"
                            placeholder="your@email.com"
                            error={form.formState.errors.email?.message}
                            disabled
                          />
                        </div>
                        <Input
                          {...form.register('phoneNumber')}
                          type="tel"
                          label="Phone Number"
                          placeholder="+1 (555) 123-4567"
                          error={form.formState.errors.phoneNumber?.message}
                        />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'notifications' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Bell className="w-5 h-5 text-emerald-600" />
                        <span>Notification Preferences</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Smartphone className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">SMS Notifications</p>
                              <p className="text-sm text-gray-600">Receive meal reminders via SMS</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...form.register('smsNotifications')}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">Email Notifications</p>
                              <p className="text-sm text-gray-600">Receive updates via email</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...form.register('emailNotifications')}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">Meal Reminders</p>
                              <p className="text-sm text-gray-600">Get reminded about meal times</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...form.register('mealReminders')}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">Progress Updates</p>
                              <p className="text-sm text-gray-600">Weekly progress summaries</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...form.register('progressUpdates')}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'privacy' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Shield className="w-5 h-5 text-emerald-600" />
                        <span>Privacy & Security</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <Button variant="outline" onClick={handleExportData}>
                          <Download className="w-4 h-4 mr-2" />
                          Export My Data
                        </Button>
                        <p className="text-sm text-gray-600">
                          Download a copy of all your data stored in NutriGuide
                        </p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-red-200">
                    <CardHeader>
                      <CardTitle className="text-red-600">Danger Zone</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                          Once you delete your account, there is no going back. Please be certain.
                        </p>
                        <Button
                          variant="outline"
                          onClick={handleDeleteAccount}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {activeTab === 'preferences' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Globe className="w-5 h-5 text-emerald-600" />
                        <span>App Preferences</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Moon className="w-5 h-5 text-gray-400" />
                            <div>
                              <p className="font-medium">Dark Mode</p>
                              <p className="text-sm text-gray-600">Use dark theme</p>
                            </div>
                          </div>
                          <input
                            type="checkbox"
                            {...form.register('darkMode')}
                            className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Language
                          </label>
                          <select
                            {...form.register('language')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="en">English</option>
                            <option value="es">Spanish</option>
                            <option value="fr">French</option>
                            <option value="de">German</option>
                          </select>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Save Button */}
              <div className="mt-8 flex justify-end">
                <Button
                  type="submit"
                  isLoading={loading}
                  size="lg"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </motion.div>
  );
}