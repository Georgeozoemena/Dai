import type { Profile } from "../../../types/profile";
import { profileRepository } from "../../../database/profile";

export async function getProfile() {
  return profileRepository.getProfile();
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
  await profileRepository.deleteProfile();
}
