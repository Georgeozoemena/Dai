/**
 * Legacy login route - redirects to new auth system
 * @deprecated Use /auth instead
 */
import { Redirect } from "expo-router";

export default function LoginRoute() {
  return <Redirect href="/auth" />;
}
