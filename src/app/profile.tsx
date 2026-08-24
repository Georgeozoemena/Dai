import { router } from "expo-router";

import { ProfileScreen } from "../features/onboarding/screens/ProfileScreen";

export default function ProfileRoute() {
  return (
    <ProfileScreen
      onComplete={(profile) => {
        router.push({
          pathname: "/create-account",
          params: {
            profileId: profile.id,
          },
        });
      }}
    />
  );
}