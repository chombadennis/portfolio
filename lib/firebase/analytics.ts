
import { FirebaseApp } from "firebase/app";
import { app } from "./config";
import { getAnalytics, logEvent, Analytics } from "firebase/analytics";

let analytics: Analytics;

if (typeof window !== 'undefined') {
  analytics = getAnalytics(app as FirebaseApp);
}

export const logPageView = (url: string) => {
  if (analytics) {
    logEvent(analytics, 'page_view', { page_path: url });
  }
};

export const logChatInteraction = (message: string) => {
  if (analytics) {
    logEvent(analytics, 'chat_interaction', { message });
  }
};
