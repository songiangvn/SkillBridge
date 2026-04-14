// Appwrite client configuration for React Native/Expo
import { Account, Client, Databases } from 'appwrite';

export const appwriteConfig = {
  endpoint:
    process.env.EXPO_PUBLIC_APPWRITE_ENDPOINT || 'http://localhost/v1',
  projectId: process.env.EXPO_PUBLIC_APPWRITE_PROJECT_ID || '',
  databaseId: process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || 'skillbridge',
  collections: {
    profiles: process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || 'profiles',
    bridgeRequests:
      process.env.EXPO_PUBLIC_APPWRITE_BRIDGE_REQUESTS_COLLECTION_ID ||
      'bridgeRequests',
    skippedProfiles:
      process.env.EXPO_PUBLIC_APPWRITE_SKIPPED_PROFILES_COLLECTION_ID ||
      'skippedProfiles',
    tutorShortlist:
      process.env.EXPO_PUBLIC_APPWRITE_TUTOR_SHORTLIST_COLLECTION_ID ||
      'tutorShortlist',
    questions: process.env.EXPO_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID || 'questions',
    answers: process.env.EXPO_PUBLIC_APPWRITE_ANSWERS_COLLECTION_ID || 'answers',
    resources:
      process.env.EXPO_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID ||
      'resources',
    savedResources:
      process.env.EXPO_PUBLIC_APPWRITE_SAVED_RESOURCES_COLLECTION_ID ||
      'savedResources',
    matches: process.env.EXPO_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || 'matches',
    threads: process.env.EXPO_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || 'threads',
    messages:
      process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || 'messages',
  },
};

export const isAppwriteConfigured =
  Boolean(appwriteConfig.endpoint) && Boolean(appwriteConfig.projectId);

const appwrite = {
  client: new Client(),
  account: null as Account | null,
  databases: null as Databases | null,
};

appwrite.client
  .setEndpoint(appwriteConfig.endpoint) // e.g., 'https://cloud.appwrite.io/v1'
  .setProject(appwriteConfig.projectId);

appwrite.account = new Account(appwrite.client);
appwrite.databases = new Databases(appwrite.client);

export default appwrite;
