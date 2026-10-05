import { Platform } from "react-native";

// iOS 26+ gets real native tabs (liquid glass); everyone else uses the classic
// JS tab bar. "unstable" is only the import path — it is production-ready.
export const usesNativeTabs =
  Platform.OS === "ios" && parseInt(String(Platform.Version), 10) >= 26;
