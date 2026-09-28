// Handles URLs delivered by the OS when another app shares
// content into Denari. The expo-sharing native module rewrites the
// incoming ACTION_SEND intent to <scheme>://expo-sharing so the
// router can pick it up; the shared files themselves are read from
// the module on the handler screen.
export async function redirectSystemPath({
  path,
}: {
  path: string;
  initial: boolean;
}) {
  try {
    if (new URL(path).hostname === "expo-sharing") {
      return "/handle-share";
    }

    return path;
  } catch {
    return "/";
  }
}
