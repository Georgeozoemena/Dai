import type { Profile } from "../../types/profile";

export interface ProfileRepository {
  getProfile(): Promise<Profile | null>;

  createProfile(profile: Profile): Promise<void>;

  updateProfile(profile: Profile): Promise<void>;

  deleteProfile(): Promise<void>;
}