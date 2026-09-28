import type { Profile } from "../../types/profile";
import type { ProfileRepository } from "../repositories/profileRepository";
import { getDatabase } from "../client/database";

type ProfileRow = {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  avatar: string | null;
  created_at: string;
  updated_at: string;
};

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    avatar: row.avatar ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const profileRepository: ProfileRepository = {
  async getProfileByUserId(userId: string) {
    const db = getDatabase();

    const row = db.getFirstSync<ProfileRow>(
      "SELECT * FROM profiles WHERE user_id = ?",
      userId,
    );

    return row ? toProfile(row) : null;
  },

  async createProfile(profile) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO profiles
        (id, user_id, name, email, phone, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         name = excluded.name,
         email = excluded.email,
         phone = excluded.phone,
         avatar = excluded.avatar,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      profile.id,
      profile.userId,
      profile.name,
      profile.email ?? null,
      profile.phone ?? null,
      profile.avatar ?? null,
      profile.createdAt,
      profile.updatedAt,
    );
  },

  async updateProfile(profile) {
    const db = getDatabase();

    db.runSync(
      `INSERT INTO profiles
        (id, user_id, name, email, phone, avatar, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         user_id = excluded.user_id,
         name = excluded.name,
         email = excluded.email,
         phone = excluded.phone,
         avatar = excluded.avatar,
         created_at = excluded.created_at,
         updated_at = excluded.updated_at`,
      profile.id,
      profile.userId,
      profile.name,
      profile.email ?? null,
      profile.phone ?? null,
      profile.avatar ?? null,
      profile.createdAt,
      profile.updatedAt,
    );
  },

  async deleteProfile(userId: string) {
    const db = getDatabase();

    db.runSync("DELETE FROM profiles WHERE user_id = ?", userId);
  },

  // Legacy method - gets first profile (for migration compatibility)
  async getProfile() {
    const db = getDatabase();

    const row = db.getFirstSync<ProfileRow>(
      "SELECT * FROM profiles LIMIT 1",
    );

    return row ? toProfile(row) : null;
  },
};
