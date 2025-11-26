import { supabase, Database } from '../lib/supabase';
import { DietPlan } from '../types';
import toast from 'react-hot-toast';

type DietPlanRow = Database['public']['Tables']['diet_plans']['Row'];
type DietPlanInsert = Database['public']['Tables']['diet_plans']['Insert'];
type DietPlanUpdate = Database['public']['Tables']['diet_plans']['Update'];

export class DietPlanService {
  static async createDietPlan(dietPlan: DietPlan): Promise<{ data: DietPlanRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // First, set all existing plans to inactive
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', user.id);

      const dietPlanInsert: DietPlanInsert = {
        user_id: user.id,
        name: dietPlan.name,
        description: dietPlan.description,
        duration: dietPlan.duration,
        daily_calories: dietPlan.dailyCalories,
        protein_g: dietPlan.macros.protein,
        carbs_g: dietPlan.macros.carbs,
        fat_g: dietPlan.macros.fat,
        meals_data: dietPlan.meals,
        is_active: true,
        completed_days: dietPlan.progress.completedDays,
        adherence_rate: dietPlan.progress.adherenceRate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('diet_plans')
        .insert(dietPlanInsert)
        .select()
        .single();

      if (error) {
        console.error('Diet plan creation error:', error);
        toast.error('Failed to save diet plan');
        return { data: null, error };
      }

      toast.success('Diet plan saved successfully!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error: { message: error.message } };
    }
  }

  static async getUserDietPlans(): Promise<{ data: DietPlanRow[] | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Diet plans fetch error:', error);
        return { data: null, error };
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      return { data: null, error: { message: error.message } };
    }
  }

  static async getActiveDietPlan(): Promise<{ data: DietPlanRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { data, error } = await supabase
        .from('diet_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Active diet plan fetch error:', error);
        return { data: null, error };
      }

      return { data: data || null, error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      return { data: null, error: { message: error.message } };
    }
  }

  static async updateDietPlan(planId: string, updates: Partial<DietPlan>): Promise<{ data: DietPlanRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const dietPlanUpdate: DietPlanUpdate = {
        updated_at: new Date().toISOString(),
      };

      if (updates.name) dietPlanUpdate.name = updates.name;
      if (updates.description) dietPlanUpdate.description = updates.description;
      if (updates.isActive !== undefined) dietPlanUpdate.is_active = updates.isActive;
      if (updates.progress?.completedDays !== undefined) dietPlanUpdate.completed_days = updates.progress.completedDays;
      if (updates.progress?.adherenceRate !== undefined) dietPlanUpdate.adherence_rate = updates.progress.adherenceRate;
      if (updates.meals) dietPlanUpdate.meals_data = updates.meals;

      const { data, error } = await supabase
        .from('diet_plans')
        .update(dietPlanUpdate)
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Diet plan update error:', error);
        toast.error('Failed to update diet plan');
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error: { message: error.message } };
    }
  }

  static async setActiveDietPlan(planId: string): Promise<{ data: DietPlanRow | null; error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      // First, set all plans to inactive
      await supabase
        .from('diet_plans')
        .update({ is_active: false })
        .eq('user_id', user.id);

      // Then set the selected plan to active
      const { data, error } = await supabase
        .from('diet_plans')
        .update({ is_active: true, updated_at: new Date().toISOString() })
        .eq('id', planId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Set active diet plan error:', error);
        toast.error('Failed to set active diet plan');
        return { data: null, error };
      }

      toast.success('Diet plan activated successfully!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      toast.error('An unexpected error occurred');
      return { data: null, error: { message: error.message } };
    }
  }

  static async deleteDietPlan(planId: string): Promise<{ error: any }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase
        .from('diet_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id)
        .eq('is_active', false); // Only allow deletion of inactive plans

      if (error) {
        console.error('Delete diet plan error:', error);
        toast.error('Failed to delete diet plan');
        return { error };
      }

      return { error: null };
    } catch (error: any) {
      console.error('Diet plan service error:', error);
      toast.error('An unexpected error occurred');
      return { error: { message: error.message } };
    }
  }

  static dietPlanRowToDietPlan(dietPlanRow: DietPlanRow): DietPlan {
    return {
      id: dietPlanRow.id,
      userId: dietPlanRow.user_id,
      name: dietPlanRow.name,
      description: dietPlanRow.description,
      duration: dietPlanRow.duration,
      dailyCalories: dietPlanRow.daily_calories,
      macros: {
        protein: dietPlanRow.protein_g,
        carbs: dietPlanRow.carbs_g,
        fat: dietPlanRow.fat_g,
      },
      meals: dietPlanRow.meals_data,
      createdAt: dietPlanRow.created_at,
      updatedAt: dietPlanRow.updated_at,
      isActive: dietPlanRow.is_active,
      progress: {
        completedDays: dietPlanRow.completed_days,
        totalDays: dietPlanRow.duration, // Will be set by userProfile.planDuration in the UI
        adherenceRate: dietPlanRow.adherence_rate,
      },
    };
  }
}