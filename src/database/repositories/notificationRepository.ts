import { Platform } from "react-native";

// Platform-specific imports
let notificationRepository: any;

if (Platform.OS === "web") {
  notificationRepository = require("../web/notificationRepository.web").notificationRepository;
} else {
  notificationRepository = require("../native/notificationRepository.native").notificationRepository;
}

export { notificationRepository };
