/*
  # Initial Schema for NutriGuide Application

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `email` (text)
      - `phone_number` (text, nullable)
      - Personal details (age, gender, weight, height, activity_level)
      - Health goals (primary_goal, target_weight, timeframe)
      - Dietary preferences (allergies, diet_type, cuisines)
      - Meal timings (breakfast_time, lunch_time, dinner_time)
      - Other preferences (budget_range, medical_conditions)
      - Timestamps (created_at, updated_at)

    - `diet_plans`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `name` (text)
      - `description` (text)
      - `duration` (integer)
      - Nutrition targets (daily_calories, protein_g, carbs_g, fat_g)
      - `meals_data` (jsonb)
      - Status and progress tracking
      - Timestamps (created_at, updated_at)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone_number text,
  age integer NOT NULL CHECK (age > 0 AND age < 150),
  gender text NOT NULL CHECK (gender IN ('male', 'female', 'other')),
  weight numeric NOT NULL CHECK (weight > 0),
  height numeric NOT NULL CHECK (weight > 0),
  activity_level text NOT NULL CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')),
  primary_goal text NOT NULL CHECK (primary_goal IN ('weight_loss', 'muscle_gain', 'maintenance', 'general_health')),
  target_weight numeric CHECK (target_weight > 0),
  timeframe text,
  allergies text[] DEFAULT '{}',
  diet_type text NOT NULL CHECK (diet_type IN ('omnivore', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo')),
  cuisines text[] DEFAULT '{}',
  breakfast_time text NOT NULL,
  lunch_time text NOT NULL,
  dinner_time text NOT NULL,
  budget_range text NOT NULL CHECK (budget_range IN ('low', 'medium', 'high')),
  medical_conditions text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create diet_plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  duration integer NOT NULL CHECK (duration > 0),
  daily_calories integer NOT NULL CHECK (daily_calories > 0),
  protein_g numeric NOT NULL CHECK (protein_g >= 0),
  carbs_g numeric NOT NULL CHECK (carbs_g >= 0),
  fat_g numeric NOT NULL CHECK (fat_g >= 0),
  meals_data jsonb NOT NULL DEFAULT '[]',
  is_active boolean DEFAULT false,
  completed_days integer DEFAULT 0 CHECK (completed_days >= 0),
  adherence_rate numeric DEFAULT 0 CHECK (adherence_rate >= 0 AND adherence_rate <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile"
  ON profiles
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for diet_plans table
CREATE POLICY "Users can view own diet plans"
  ON diet_plans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diet plans"
  ON diet_plans
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diet plans"
  ON diet_plans
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own diet plans"
  ON diet_plans
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_user_id_idx ON profiles(user_id);
CREATE INDEX IF NOT EXISTS diet_plans_user_id_idx ON diet_plans(user_id);
CREATE INDEX IF NOT EXISTS diet_plans_is_active_idx ON diet_plans(user_id, is_active);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diet_plans_updated_at
  BEFORE UPDATE ON diet_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();