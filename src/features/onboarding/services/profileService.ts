import type { Profile } from "../../../types/profile";
import { profileRepository } from "../../../database/profile";
import { requireCurrentUserId } from "../../auth/services/currentUserService";

export async function getProfile(): Promise<Profile | null> {
  const userId = await requireCurrentUserId();
  return profileRepository.getProfileByUserId(userId);
}

export async function createProfile(profile: Profile) {
  await profileRepository.createProfile(profile);

  return profile;
}

export async function updateProfile(profile: Profile) {
  await profileRepository.updateProfile(profile);

  return profile;
}

export async function deleteProfile() {
  const userId = await requireCurrentUserId();
  await profileRepository.deleteProfile(userId);
}
