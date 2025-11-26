import { supabase, Database } from '../lib/supabase';
import { UserProfile } from '../types';
import toast from 'react-hot-toast';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Define custom error types
export class ProfileError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'ProfileError';
  }
}

// Define cache for profile data
const profileCache = new Map<string, { data: ProfileRow; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class ProfileService {
  // Create a new profile
  static async createProfile(profileData: UserProfile): Promise<{ data: ProfileRow | null; error: any }> {
    try {
      // Validate profile data before creating
      const validationError = this.validateProfileData(profileData);
      if (validationError) {
        return { data: null, error: validationError };
      }

      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new ProfileError('No authenticated user found', 'NO_USER', 401);
      }

      const profileInsert: ProfileInsert = {
        user_id: user.id,
        name: profileData.name,
        email: profileData.email,
        phone_number: profileData.phoneNumber || null,
        age: profileData.personalDetails.age,
        gender: profileData.personalDetails.gender,
        weight: profileData.personalDetails.weight,
        height: profileData.personalDetails.height,
        activity_level: profileData.personalDetails.activityLevel,
        primary_goal: profileData.healthGoals.primary,
        target_weight: profileData.healthGoals.targetWeight || null,
        timeframe: profileData.healthGoals.timeframe || null,
        allergies: profileData.dietaryRestrictions.allergies,
        diet_type: profileData.dietaryRestrictions.dietType,
        cuisines: profileData.preferences.cuisines,
        breakfast_time: profileData.preferences.mealTimings.breakfast,
        lunch_time: profileData.preferences.mealTimings.lunch,
        dinner_time: profileData.preferences.mealTimings.dinner,
        budget_range: profileData.preferences.budgetRange,
        medical_conditions: profileData.medicalConditions,
        sport_activities: profileData.sportActivities || [],
        plan_duration_days: profileData.planDuration || 30,
        plan_duration_type: profileData.planDurationType || 'days',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileInsert, { 
          onConflict: 'user_id',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (error) {
        console.error('Profile creation error:', error);
        throw new ProfileError(
          `Failed to save profile: ${error.message}`,
          'CREATE_FAILED',
          400
        );
      }

      // Update cache
      if (data) {
        profileCache.set(user.id, { data, timestamp: Date.now() });
      }

      toast.success('Profile saved successfully!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        toast.error(error.message);
        return { data: null, error };
      }
      
      toast.error('An unexpected error occurred');
      return { data: null, error: { message: error.message } };
    }
  }

  // Get a profile by user ID
  static async getProfile(userId?: string, useCache: boolean = true): Promise<{ data: ProfileRow | null; error: any }> {
    try {
      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new ProfileError('No authenticated user found', 'NO_USER', 401);
        }
        targetUserId = user.id;
      }

      // Check cache first
      if (useCache) {
        const cached = profileCache.get(targetUserId);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          return { data: cached.data, error: null };
        }
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Profile fetch error:', error);
        throw new ProfileError(
          `Failed to fetch profile: ${error.message}`,
          'FETCH_FAILED',
          400
        );
      }

      // Update cache
      if (data) {
        profileCache.set(targetUserId, { data, timestamp: Date.now() });
      }

      return { data: data || null, error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        return { data: null, error };
      }
      
      return { data: null, error: { message: error.message } };
    }
  }

  // Update a profile
  static async updateProfile(updates: Partial<UserProfile>, userId?: string): Promise<{ data: ProfileRow | null; error: any }> {
    try {
      // Validate updates
      const validationError = this.validateProfileData(updates);
      if (validationError) {
        return { data: null, error: validationError };
      }

      let targetUserId = userId;
      
      if (!targetUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new ProfileError('No authenticated user found', 'NO_USER', 401);
        }
        targetUserId = user.id;
      }

      const profileUpdate: ProfileUpdate = {
        updated_at: new Date().toISOString(),
      };

      // Map UserProfile fields to database fields
      if (updates.name) profileUpdate.name = updates.name;
      if (updates.phoneNumber !== undefined) profileUpdate.phone_number = updates.phoneNumber;
      if (updates.personalDetails?.age) profileUpdate.age = updates.personalDetails.age;
      if (updates.personalDetails?.gender) profileUpdate.gender = updates.personalDetails.gender;
      if (updates.personalDetails?.weight) profileUpdate.weight = updates.personalDetails.weight;
      if (updates.personalDetails?.height) profileUpdate.height = updates.personalDetails.height;
      if (updates.personalDetails?.activityLevel) profileUpdate.activity_level = updates.personalDetails.activityLevel;
      if (updates.healthGoals?.primary) profileUpdate.primary_goal = updates.healthGoals.primary;
      if (updates.healthGoals?.targetWeight !== undefined) profileUpdate.target_weight = updates.healthGoals.targetWeight;
      if (updates.healthGoals?.timeframe !== undefined) profileUpdate.timeframe = updates.healthGoals.timeframe;
      if (updates.dietaryRestrictions?.allergies) profileUpdate.allergies = updates.dietaryRestrictions.allergies;
      if (updates.dietaryRestrictions?.dietType) profileUpdate.diet_type = updates.dietaryRestrictions.dietType;
      if (updates.preferences?.cuisines) profileUpdate.cuisines = updates.preferences.cuisines;
      if (updates.preferences?.mealTimings?.breakfast) profileUpdate.breakfast_time = updates.preferences.mealTimings.breakfast;
      if (updates.preferences?.mealTimings?.lunch) profileUpdate.lunch_time = updates.preferences.mealTimings.lunch;
      if (updates.preferences?.mealTimings?.dinner) profileUpdate.dinner_time = updates.preferences.mealTimings.dinner;
      if (updates.preferences?.budgetRange) profileUpdate.budget_range = updates.preferences.budgetRange;
      if (updates.medicalConditions) profileUpdate.medical_conditions = updates.medicalConditions;
      if (updates.sportActivities) profileUpdate.sport_activities = updates.sportActivities;
      if (updates.planDuration) profileUpdate.plan_duration_days = updates.planDuration;
      if (updates.planDurationType) profileUpdate.plan_duration_type = updates.planDurationType;

      const { data, error } = await supabase
        .from('profiles')
        .update(profileUpdate)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) {
        console.error('Profile update error:', error);
        throw new ProfileError(
          `Failed to update profile: ${error.message}`,
          'UPDATE_FAILED',
          400
        );
      }

      // Update cache
      if (data) {
        profileCache.set(targetUserId, { data, timestamp: Date.now() });
      }

      toast.success('Profile updated successfully!');
      return { data, error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        toast.error(error.message);
        return { data: null, error };
      }
      
      toast.error('An unexpected error occurred');
      return { data: null, error: { message: error.message } };
    }
  }

  // Partial update of specific fields
  static async partialUpdateProfile(
    userId: string,
    fields: Partial<ProfileUpdate>
  ): Promise<{ data: ProfileRow | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...fields,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Profile partial update error:', error);
        throw new ProfileError(
          `Failed to update profile: ${error.message}`,
          'PARTIAL_UPDATE_FAILED',
          400
        );
      }

      // Update cache
      if (data) {
        profileCache.set(userId, { data, timestamp: Date.now() });
      }

      return { data, error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        return { data: null, error };
      }
      
      return { data: null, error: { message: error.message } };
    }
  }

  // Delete a profile
  static async deleteProfile(userId: string): Promise<{ success: boolean; error: any }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('Profile deletion error:', error);
        throw new ProfileError(
          `Failed to delete profile: ${error.message}`,
          'DELETE_FAILED',
          400
        );
      }

      // Remove from cache
      profileCache.delete(userId);

      toast.success('Profile deleted successfully!');
      return { success: true, error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        toast.error(error.message);
        return { success: false, error };
      }
      
      toast.error('An unexpected error occurred');
      return { success: false, error: { message: error.message } };
    }
  }

  // Get multiple profiles (for admin purposes)
  static async getProfiles(
    limit: number = 20,
    offset: number = 0,
    sortBy: string = 'created_at',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: ProfileRow[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Profiles fetch error:', error);
        throw new ProfileError(
          `Failed to fetch profiles: ${error.message}`,
          'FETCH_FAILED',
          400
        );
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        return { data: null, error };
      }
      
      return { data: null, error: { message: error.message } };
    }
  }

  // Search profiles by name or email
  static async searchProfiles(query: string): Promise<{ data: ProfileRow[] | null; error: any }> {
    try {
      if (!query || query.trim() === '') {
        return { data: [], error: null };
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(10);

      if (error) {
        console.error('Profile search error:', error);
        throw new ProfileError(
          `Failed to search profiles: ${error.message}`,
          'SEARCH_FAILED',
          400
        );
      }

      return { data: data || [], error: null };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        return { data: null, error };
      }
      
      return { data: null, error: { message: error.message } };
    }
  }

  // Get profile statistics
  static async getProfileStats(): Promise<{
    data: {
      totalProfiles: number;
      dietTypeDistribution: Record<string, number>;
      goalDistribution: Record<string, number>;
      avgAge: number;
      avgWeight: number;
    } | null;
    error: any;
  }> {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('diet_type, primary_goal, age, weight');

      if (error) {
        console.error('Profile stats error:', error);
        throw new ProfileError(
          `Failed to fetch profile statistics: ${error.message}`,
          'STATS_FAILED',
          400
        );
      }

      if (!profiles || profiles.length === 0) {
        return {
          data: {
            totalProfiles: 0,
            dietTypeDistribution: {},
            goalDistribution: {},
            avgAge: 0,
            avgWeight: 0,
          },
          error: null,
        };
      }

      // Calculate distributions
      const dietTypeDistribution: Record<string, number> = {};
      const goalDistribution: Record<string, number> = {};
      let totalAge = 0;
      let totalWeight = 0;

      profiles.forEach(profile => {
        // Diet type distribution
        const dietType = profile.diet_type || 'unknown';
        dietTypeDistribution[dietType] = (dietTypeDistribution[dietType] || 0) + 1;

        // Goal distribution
        const goal = profile.primary_goal || 'unknown';
        goalDistribution[goal] = (goalDistribution[goal] || 0) + 1;

        // Age and weight averages
        if (profile.age) totalAge += profile.age;
        if (profile.weight) totalWeight += profile.weight;
      });

      return {
        data: {
          totalProfiles: profiles.length,
          dietTypeDistribution,
          goalDistribution,
          avgAge: Math.round(totalAge / profiles.length),
          avgWeight: Math.round(totalWeight / profiles.length),
        },
        error: null,
      };
    } catch (error: any) {
      console.error('Profile service error:', error);
      
      if (error instanceof ProfileError) {
        return { data: null, error };
      }
      
      return { data: null, error: { message: error.message } };
    }
  }

  // Convert database row to UserProfile type
  static profileRowToUserProfile(profileRow: ProfileRow): UserProfile {
    return {
      id: profileRow.id,
      name: profileRow.name,
      email: profileRow.email,
      phoneNumber: profileRow.phone_number || '',
      personalDetails: {
        age: profileRow.age,
        gender: profileRow.gender as 'male' | 'female' | 'other',
        weight: profileRow.weight,
        height: profileRow.height,
        activityLevel: profileRow.activity_level as any,
      },
      healthGoals: {
        primary: profileRow.primary_goal as any,
        targetWeight: profileRow.target_weight || undefined,
        timeframe: profileRow.timeframe || undefined,
      },
      dietaryRestrictions: {
        allergies: profileRow.allergies,
        intolerances: [],
        dietType: profileRow.diet_type as any,
        restrictions: [],
      },
      preferences: {
        cuisines: profileRow.cuisines,
        mealTimings: {
          breakfast: profileRow.breakfast_time,
          lunch: profileRow.lunch_time,
          dinner: profileRow.dinner_time,
          snacks: ['10:00', '16:00'],
        },
        budgetRange: profileRow.budget_range as any,
      },
      medicalConditions: profileRow.medical_conditions,
      sportActivities: profileRow.sport_activities || [],
      planDuration: profileRow.plan_duration_days || 30,
      planDurationType: (profileRow.plan_duration_type as 'days' | 'weeks' | 'months') || 'days',
      createdAt: profileRow.created_at,
      updatedAt: profileRow.updated_at,
    };
  }

  // Validate profile data
  private static validateProfileData(data: Partial<UserProfile>): ProfileError | null {
    // Validate name
    if (data.name && data.name.trim().length < 2) {
      return new ProfileError(
        'Name must be at least 2 characters long',
        'INVALID_NAME',
        400
      );
    }

    // Validate email
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return new ProfileError(
        'Please provide a valid email address',
        'INVALID_EMAIL',
        400
      );
    }

    // Validate age
    if (data.personalDetails?.age && (data.personalDetails.age < 13 || data.personalDetails.age > 120)) {
      return new ProfileError(
        'Age must be between 13 and 120',
        'INVALID_AGE',
        400
      );
    }

    // Validate weight
    if (data.personalDetails?.weight && (data.personalDetails.weight < 30 || data.personalDetails.weight > 300)) {
      return new ProfileError(
        'Weight must be between 30 and 300 kg',
        'INVALID_WEIGHT',
        400
      );
    }

    // Validate height
    if (data.personalDetails?.height && (data.personalDetails.height < 100 || data.personalDetails.height > 250)) {
      return new ProfileError(
        'Height must be between 100 and 250 cm',
        'INVALID_HEIGHT',
        400
      );
    }

    // Validate plan duration
    if (data.planDuration && (data.planDuration < 7 || data.planDuration > 365)) {
      return new ProfileError(
        'Plan duration must be between 7 and 365 days',
        'INVALID_DURATION',
        400
      );
    }

    return null;
  }

  // Clear cache
  static clearCache(userId?: string): void {
    if (userId) {
      profileCache.delete(userId);
    } else {
      profileCache.clear();
    }
  }
}