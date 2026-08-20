import type { Profile } from "../../types/profile";
import type { ProfileRepository } from "../repositories/profileRepository";
import { getDatabase } from "./database";

export const profileRepository: ProfileRepository = {
  async getProfile() {
    const db = await getDatabase();

    const profiles = await db.getAll("profiles");

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

  async deleteProfile() {
    const db = await getDatabase();

    const profiles = await db.getAll("profiles");

    for (const profile of profiles) {
      await db.delete("profiles", profile.id as string);
    }
  },
};