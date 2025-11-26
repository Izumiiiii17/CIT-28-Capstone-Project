import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database types
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string;
          phone_number: string | null;
          age: number;
          gender: string;
          weight: number;
          height: number;
          activity_level: string;
          primary_goal: string;
          target_weight: number | null;
          timeframe: string | null;
          allergies: string[];
          diet_type: string;
          cuisines: string[];
          breakfast_time: string;
          lunch_time: string;
          dinner_time: string;
          budget_range: string;
          medical_conditions: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email: string;
          phone_number?: string | null;
          age: number;
          gender: string;
          weight: number;
          height: number;
          activity_level: string;
          primary_goal: string;
          target_weight?: number | null;
          timeframe?: string | null;
          allergies?: string[];
          diet_type: string;
          cuisines?: string[];
          breakfast_time: string;
          lunch_time: string;
          dinner_time: string;
          budget_range: string;
          medical_conditions?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          phone_number?: string | null;
          age?: number;
          gender?: string;
          weight?: number;
          height?: number;
          activity_level?: string;
          primary_goal?: string;
          target_weight?: number | null;
          timeframe?: string | null;
          allergies?: string[];
          diet_type?: string;
          cuisines?: string[];
          breakfast_time?: string;
          lunch_time?: string;
          dinner_time?: string;
          budget_range?: string;
          medical_conditions?: string[];
          updated_at?: string;
        };
      };
      diet_plans: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          duration: number;
          daily_calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          meals_data: any;
          is_active: boolean;
          completed_days: number;
          adherence_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description: string;
          duration: number;
          daily_calories: number;
          protein_g: number;
          carbs_g: number;
          fat_g: number;
          meals_data: any;
          is_active?: boolean;
          completed_days?: number;
          adherence_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string;
          is_active?: boolean;
          completed_days?: number;
          adherence_rate?: number;
          meals_data?: any;
          updated_at?: string;
        };
      };
    };
  };
}