import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Card from '../components/ui/Card';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signUpSchema = signInSchema.extend({
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SignInData = z.infer<typeof signInSchema>;
type SignUpData = z.infer<typeof signUpSchema>;

export default function Auth() {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'signin';
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const { signIn, signUp, loading } = useAuth();
  const navigate = useNavigate();

  const signInForm = useForm<SignInData>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpData>({
    resolver: zodResolver(signUpSchema),
  });

  const handleSignIn = async (data: SignInData) => {
    const { error } = await signIn(data.email, data.password);
    
    if (!error) {
      navigate('/dashboard');
    }
  };

  const handleSignUp = async (data: SignUpData) => {
    const { error } = await signUp(data.email, data.password);
    
    if (!error) {
      navigate('/profile');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center space-x-2">
              <div className="w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">NG</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">NutriGuide</span>
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-6 mb-2">
              {mode === 'signin' ? 'Welcome Back' : 'Create Your Account'}
            </h1>
            <p className="text-gray-600">
              {mode === 'signin' 
                ? 'Sign in to continue your health journey'
                : 'Start your personalized nutrition and fitness journey'
              }
            </p>
          </div>

          <Card>
            {mode === 'signin' ? (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <Input
                  {...signInForm.register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  error={signInForm.formState.errors.email?.message}
                />

                <div className="relative">
                  <Input
                    {...signInForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Enter your password"
                    error={signInForm.formState.errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  size="lg"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            ) : (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <Input
                  {...signUpForm.register('email')}
                  type="email"
                  label="Email Address"
                  placeholder="Enter your email"
                  error={signUpForm.formState.errors.email?.message}
                />

                <div className="relative">
                  <Input
                    {...signUpForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    label="Password"
                    placeholder="Create a password"
                    error={signUpForm.formState.errors.password?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <div className="relative">
                  <Input
                    {...signUpForm.register('confirmPassword')}
                    type={showConfirmPassword ? 'text' : 'password'}
                    label="Confirm Password"
                    placeholder="Confirm your password"
                    error={signUpForm.formState.errors.confirmPassword?.message}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={loading}
                  size="lg"
                >
                  Create Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            )}

            <div className="mt-6 text-center">
              <p className="text-gray-600">
                {mode === 'signin' ? "Don't have an account?" : "Already have an account?"}
                <button
                  onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                  className="text-emerald-600 hover:text-emerald-700 font-medium ml-1"
                >
                  {mode === 'signin' ? 'Sign up' : 'Sign in'}
                </button>
              </p>
            </div>
          </Card>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              By continuing, you agree to our{' '}
              <Link to="/terms" className="text-emerald-600 hover:text-emerald-700">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-emerald-600 hover:text-emerald-700">
                Privacy Policy
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}