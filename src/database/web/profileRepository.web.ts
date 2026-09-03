import type { Profile } from "../../types/profile";
import type { ProfileRepository } from "../repositories/profileRepository";
import { getDatabase } from "./database";

export const profileRepository: ProfileRepository = {
  async getProfileByUserId(userId: string) {
    const db = await getDatabase();

    const profiles = await db.getAllFromIndex("profiles", "by-user-id", userId);

    return (profiles[0] as Profile | undefined) ?? null;
  },

  async createProfile(profile) {
    const db = await getDatabase();

    await db.put("profiles", profile);
  },

  async updateProfile(profile) {
    const db = await getDatabase();

    await db.put("profiles", profile);
  },

  async deleteProfile(userId: string) {
    const db = await getDatabase();

    const profile = await this.getProfileByUserId(userId);

    if (profile) {
      await db.delete("profiles", profile.id);
    }
  },

  // Legacy method - gets first profile (for migration compatibility)
  async getProfile() {
    const db = await getDatabase();

    const profiles = await db.getAll("profiles");

    return (profiles[0] as Profile | undefined) ?? null;
  },
};
