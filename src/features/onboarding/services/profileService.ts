import type { Profile } from "../../../types/profile";
import { profileRepository } from "../../../database/profile";
import { requireCurrentUserId } from "../../auth/services/currentUserService";

type CreateProfileInput = Omit<
  Profile,
  "userId" | "createdAt" | "updatedAt"
>;

export async function getProfile(): Promise<Profile | null> {
  const userId = await requireCurrentUserId();

  return profileRepository.getProfileByUserId(userId);
}

export async function createProfile(
  profile: CreateProfileInput,
) {
  const userId = await requireCurrentUserId();

  const now = new Date().toISOString();

  const newProfile: Profile = {
    ...profile,
    userId,
    createdAt: now,
    updatedAt: now,
  };

  await profileRepository.createProfile(newProfile);

  return newProfile;
}

export async function updateProfile(
  profile: Profile,
) {
  const userId = await requireCurrentUserId();

  // Security check: user can only update their own profile
  if (profile.userId !== userId) {
    throw new Error(
      "You are not allowed to update this profile",
    );
  }

  const updatedProfile: Profile = {
    ...profile,
    updatedAt: new Date().toISOString(),
  };

  await profileRepository.updateProfile(updatedProfile);

  return updatedProfile;
}

export async function deleteProfile() {
  const userId = await requireCurrentUserId();

  await profileRepository.deleteProfile(userId);
}
