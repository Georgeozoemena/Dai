import type { Profile } from "../../types/profile";

export interface ProfileRepository {
  getProfileByUserId(userId: string): Promise<Profile | null>;

  createProfile(profile: Profile): Promise<void>;

  updateProfile(profile: Profile): Promise<void>;

  deleteProfile(userId: string): Promise<void>;
  
  // Legacy method - deprecated but kept for migration
  getProfile(): Promise<Profile | null>;
}