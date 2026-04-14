#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const projectRoot = path.resolve(new URL("..", import.meta.url).pathname);
const envPath = path.join(projectRoot, ".env");

const readEnvFile = () => {
  if (!fs.existsSync(envPath)) {
    throw new Error(`Missing ${envPath}`);
  }

  const envFile = fs.readFileSync(envPath, "utf8");

  for (const rawLine of envFile.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const rawValue = line.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^["']|["']$/g, "");

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
};

readEnvFile();

const requiredEnv = (key) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing ${key} in .env`);
  }
  return value;
};

const endpoint = requiredEnv("EXPO_PUBLIC_APPWRITE_ENDPOINT").replace(/\/$/, "");
const projectId = requiredEnv("EXPO_PUBLIC_APPWRITE_PROJECT_ID");
const databaseId = process.env.EXPO_PUBLIC_APPWRITE_DATABASE_ID || "skillbridge";
const apiKey = requiredEnv("APPWRITE_API_KEY");

const collections = {
  profiles: process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || "profiles",
  bridgeRequests:
    process.env.EXPO_PUBLIC_APPWRITE_BRIDGE_REQUESTS_COLLECTION_ID ||
    "bridgeRequests",
  skippedProfiles:
    process.env.EXPO_PUBLIC_APPWRITE_SKIPPED_PROFILES_COLLECTION_ID ||
    "skippedProfiles",
  tutorShortlist:
    process.env.EXPO_PUBLIC_APPWRITE_TUTOR_SHORTLIST_COLLECTION_ID ||
    "tutorShortlist",
  questions:
    process.env.EXPO_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID || "questions",
  answers:
    process.env.EXPO_PUBLIC_APPWRITE_ANSWERS_COLLECTION_ID || "answers",
  resources:
    process.env.EXPO_PUBLIC_APPWRITE_RESOURCES_COLLECTION_ID || "resources",
  savedResources:
    process.env.EXPO_PUBLIC_APPWRITE_SAVED_RESOURCES_COLLECTION_ID ||
    "savedResources",
  matches:
    process.env.EXPO_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || "matches",
  threads:
    process.env.EXPO_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || "threads",
  messages:
    process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "messages",
};

const permissions = {
  readAny: 'read("any")',
  createUsers: 'create("users")',
};

const publicCollectionPermissions = [
  permissions.readAny,
  permissions.createUsers,
];

const privateCollectionPermissions = [permissions.createUsers];

const publicSeedPermissions = [permissions.readAny];

const request = async (method, pathname, body, options = {}) => {
  const response = await fetch(`${endpoint}${pathname}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-Appwrite-Key": apiKey,
      "X-Appwrite-Project": projectId,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const data = text ? JSON.parse(text) : null;

  if (response.ok) {
    return data;
  }

  if (response.status === 404 && options.allowNotFound) {
    return null;
  }

  if (response.status === 409 && options.allowConflict) {
    return { conflict: true };
  }

  const message = data?.message || text || response.statusText;
  throw new Error(`${method} ${pathname} failed (${response.status}): ${message}`);
};

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const getCollection = (collectionId) =>
  request(
    "GET",
    `/databases/${databaseId}/collections/${collectionId}`,
    null,
    { allowNotFound: true }
  );

const ensureDatabase = async () => {
  const existingDatabase = await request(
    "GET",
    `/databases/${databaseId}`,
    null,
    { allowNotFound: true }
  );

  if (existingDatabase) {
    console.log(`ok database ${databaseId}`);
    return;
  }

  await request("POST", "/databases", {
    databaseId,
    name: "SkillBridge",
    enabled: true,
  });

  console.log(`created database ${databaseId}`);
};

const ensureCollection = async (
  collectionId,
  name,
  collectionPermissions
) => {
  const existingCollection = await getCollection(collectionId);

  if (existingCollection) {
    console.log(`ok collection ${collectionId}`);
    return;
  }

  await request("POST", `/databases/${databaseId}/collections`, {
    collectionId,
    name,
    permissions: collectionPermissions,
    documentSecurity: true,
    enabled: true,
  });

  console.log(`created collection ${collectionId}`);
};

const getAttribute = async (collectionId, key) => {
  const collection = await getCollection(collectionId);
  return collection?.attributes?.find((attribute) => attribute.key === key);
};

const waitForAttribute = async (collectionId, key) => {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const attribute = await getAttribute(collectionId, key);

    if (attribute?.status === "available") {
      return;
    }

    if (attribute?.status === "failed") {
      throw new Error(`Attribute ${collectionId}.${key} failed to create`);
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for attribute ${collectionId}.${key}`);
};

const ensureAttribute = async (collectionId, attribute) => {
  const existingAttribute = await getAttribute(collectionId, attribute.key);

  if (existingAttribute) {
    await waitForAttribute(collectionId, attribute.key);
    console.log(`ok attribute ${collectionId}.${attribute.key}`);
    return;
  }

  const { type, ...body } = attribute;
  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/attributes/${type}`,
    body,
    { allowConflict: true }
  );

  await waitForAttribute(collectionId, attribute.key);
  console.log(`created attribute ${collectionId}.${attribute.key}`);
};

const stringAttribute = (key, size, required = false, array = false) => ({
  type: "string",
  key,
  size,
  required,
  array,
});

const floatAttribute = (key, required = false) => ({
  type: "float",
  key,
  required,
  min: -999999,
  max: 999999,
  array: false,
});

const integerAttribute = (key, required = false) => ({
  type: "integer",
  key,
  required,
  min: 0,
  max: 999999,
  array: false,
});

const datetimeAttribute = (key, required = false) => ({
  type: "datetime",
  key,
  required,
  array: false,
});

const savedUserAttributes = [
  stringAttribute("userId", 128, true),
  stringAttribute("targetUserId", 128, true),
  stringAttribute("name", 128, true),
  stringAttribute("role", 32, true),
  stringAttribute("avatarUrl", 2048, true),
  stringAttribute("headline", 512, true),
  stringAttribute("canTeach", 128, true, true),
  stringAttribute("wantsToLearn", 128, true, true),
  stringAttribute("availability", 256, true),
  stringAttribute("goal", 1000, true),
  stringAttribute("mode", 32, true),
  stringAttribute("hourlyRate", 64),
  datetimeAttribute("savedAt", true),
  floatAttribute("rating"),
];

const tutorAttributes = [
  ...savedUserAttributes,
  stringAttribute("bookingStatus", 32),
  stringAttribute("bookingMessage", 1000),
  datetimeAttribute("requestedAt"),
];

const matchIdentityAttributes = [
  stringAttribute("participantIds", 128, true, true),
  stringAttribute("userAId", 128, true),
  stringAttribute("userAName", 128, true),
  stringAttribute("userAAvatarUrl", 2048, true),
  stringAttribute("userAHeadline", 512, true),
  stringAttribute("userBId", 128, true),
  stringAttribute("userBName", 128, true),
  stringAttribute("userBAvatarUrl", 2048, true),
  stringAttribute("userBHeadline", 512, true),
  datetimeAttribute("createdAt", true),
];

const collectionAttributes = {
  [collections.profiles]: [
    stringAttribute("userId", 128, true),
    stringAttribute("name", 128, true),
    stringAttribute("role", 32, true),
    stringAttribute("avatarUrl", 2048),
    stringAttribute("headline", 512),
    stringAttribute("canTeach", 128, true, true),
    stringAttribute("wantsToLearn", 128, true, true),
    stringAttribute("availability", 256, true),
    stringAttribute("goal", 1000, true),
    stringAttribute("mode", 32, true),
    floatAttribute("rating"),
    stringAttribute("hourlyRate", 64),
    stringAttribute("level", 32),
    stringAttribute("location", 128),
    stringAttribute("credentials", 512),
  ],
  [collections.bridgeRequests]: savedUserAttributes,
  [collections.skippedProfiles]: savedUserAttributes,
  [collections.tutorShortlist]: tutorAttributes,
  [collections.questions]: [
    stringAttribute("userId", 128, true),
    stringAttribute("title", 256, true),
    stringAttribute("tag", 128, true),
    stringAttribute("body", 4000),
    integerAttribute("replies", true),
    datetimeAttribute("createdAt", true),
  ],
  [collections.answers]: [
    stringAttribute("answerId", 128, true),
    stringAttribute("questionId", 128, true),
    stringAttribute("userId", 128, true),
    stringAttribute("body", 4000, true),
    datetimeAttribute("createdAt", true),
  ],
  [collections.resources]: [
    stringAttribute("resourceId", 128, true),
    stringAttribute("title", 256, true),
    stringAttribute("subject", 128, true),
    stringAttribute("level", 64, true),
    stringAttribute("verifiedBy", 128, true),
    stringAttribute("image", 2048, true),
  ],
  [collections.savedResources]: [
    stringAttribute("userId", 128, true),
    stringAttribute("resourceId", 128, true),
    stringAttribute("title", 256, true),
    stringAttribute("subject", 128, true),
    stringAttribute("level", 64, true),
    stringAttribute("verifiedBy", 128, true),
    stringAttribute("image", 2048, true),
    datetimeAttribute("savedAt", true),
  ],
  [collections.matches]: [
    stringAttribute("pairKey", 256, true),
    stringAttribute("threadId", 128, true),
    ...matchIdentityAttributes,
  ],
  [collections.threads]: [
    stringAttribute("threadId", 128, true),
    stringAttribute("matchId", 128, true),
    ...matchIdentityAttributes,
    stringAttribute("lastMessage", 4000),
    datetimeAttribute("lastMessageAt", true),
  ],
  [collections.messages]: [
    stringAttribute("messageId", 128, true),
    stringAttribute("threadId", 128, true),
    stringAttribute("matchId", 128, true),
    stringAttribute("senderId", 128, true),
    stringAttribute("body", 4000, true),
    datetimeAttribute("createdAt", true),
  ],
};

const getIndex = async (collectionId, key) => {
  const collection = await getCollection(collectionId);
  return collection?.indexes?.find((index) => index.key === key);
};

const waitForIndex = async (collectionId, key) => {
  for (let attempt = 0; attempt < 45; attempt += 1) {
    const index = await getIndex(collectionId, key);

    if (index?.status === "available") {
      return;
    }

    if (index?.status === "failed") {
      throw new Error(`Index ${collectionId}.${key} failed to create`);
    }

    await wait(1000);
  }

  throw new Error(`Timed out waiting for index ${collectionId}.${key}`);
};

const ensureIndex = async (collectionId, index) => {
  const existingIndex = await getIndex(collectionId, index.key);

  if (existingIndex) {
    await waitForIndex(collectionId, index.key);
    console.log(`ok index ${collectionId}.${index.key}`);
    return;
  }

  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/indexes`,
    index,
    { allowConflict: true }
  );

  await waitForIndex(collectionId, index.key);
  console.log(`created index ${collectionId}.${index.key}`);
};

const keyIndex = (key, attributes, orders) => ({
  key,
  type: "key",
  attributes,
  ...(orders ? { orders } : {}),
});

const uniqueIndex = (key, attributes) => ({
  key,
  type: "unique",
  attributes,
});

const collectionIndexes = {
  [collections.profiles]: [
    uniqueIndex("userId_unique", ["userId"]),
    keyIndex("role_key", ["role"]),
  ],
  [collections.bridgeRequests]: [
    keyIndex("bridge_userId_key", ["userId"]),
    keyIndex("bridge_targetUserId_key", ["targetUserId"]),
    uniqueIndex("bridge_user_target_unique", ["userId", "targetUserId"]),
  ],
  [collections.skippedProfiles]: [
    keyIndex("skipped_userId_key", ["userId"]),
    uniqueIndex("skipped_user_target_unique", ["userId", "targetUserId"]),
  ],
  [collections.tutorShortlist]: [
    keyIndex("tutor_userId_key", ["userId"]),
    uniqueIndex("tutor_user_target_unique", ["userId", "targetUserId"]),
  ],
  [collections.questions]: [
    keyIndex("questions_createdAt_key", ["createdAt"], ["DESC"]),
    keyIndex("questions_tag_key", ["tag"]),
  ],
  [collections.answers]: [
    uniqueIndex("answers_answerId_unique", ["answerId"]),
    keyIndex("answers_questionId_key", ["questionId"]),
    keyIndex("answers_question_createdAt_key", ["questionId", "createdAt"], [
      "ASC",
      "ASC",
    ]),
  ],
  [collections.resources]: [
    uniqueIndex("resourceId_unique", ["resourceId"]),
    keyIndex("subject_key", ["subject"]),
  ],
  [collections.savedResources]: [
    keyIndex("saved_resources_userId_key", ["userId"]),
    uniqueIndex("saved_resources_user_resource_unique", [
      "userId",
      "resourceId",
    ]),
  ],
  [collections.matches]: [
    uniqueIndex("matches_pairKey_unique", ["pairKey"]),
    keyIndex("matches_userAId_key", ["userAId"]),
    keyIndex("matches_userBId_key", ["userBId"]),
    keyIndex("matches_createdAt_key", ["createdAt"], ["DESC"]),
  ],
  [collections.threads]: [
    uniqueIndex("threads_threadId_unique", ["threadId"]),
    keyIndex("threads_matchId_key", ["matchId"]),
    keyIndex("threads_userAId_key", ["userAId"]),
    keyIndex("threads_userBId_key", ["userBId"]),
    keyIndex("threads_lastMessageAt_key", ["lastMessageAt"], ["DESC"]),
  ],
  [collections.messages]: [
    uniqueIndex("messages_messageId_unique", ["messageId"]),
    keyIndex("messages_threadId_key", ["threadId"]),
    keyIndex("messages_thread_createdAt_key", ["threadId", "createdAt"], [
      "ASC",
      "ASC",
    ]),
  ],
};

const seedProfiles = [
  {
    userId: "user-1",
    name: "Maya Tran",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
    headline: "Frontend mentor looking for spoken English practice",
    canTeach: ["React Native", "UI basics"],
    wantsToLearn: ["English speaking"],
    availability: "Tue and Thu evenings",
    goal: "Build a portfolio app and practice weekly conversation",
    mode: "Online",
    rating: 4.8,
  },
  {
    userId: "user-2",
    name: "Daniel Kim",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1887&auto=format&fit=crop",
    headline: "Math tutor helping students prep for exams",
    canTeach: ["Algebra", "Calculus"],
    wantsToLearn: ["Product design"],
    availability: "Weekends",
    goal: "Exchange structured math lessons for design feedback",
    mode: "Hybrid",
    rating: 4.9,
    hourlyRate: "$18/hr",
  },
  {
    userId: "user-3",
    name: "Ari Singh",
    role: "Learner",
    avatarUrl:
      "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=1887&auto=format&fit=crop",
    headline: "Beginner data learner with strong writing skills",
    canTeach: ["Essay writing", "Research notes"],
    wantsToLearn: ["Python", "Data analysis"],
    availability: "Mon, Wed, Fri mornings",
    goal: "Finish a beginner analytics project in 30 days",
    mode: "Online",
  },
  {
    userId: "user-4",
    name: "Lina Park",
    role: "Both",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1887&auto=format&fit=crop",
    headline: "Korean tutor trading language lessons for coding help",
    canTeach: ["Korean", "Study planning"],
    wantsToLearn: ["JavaScript"],
    availability: "Saturday afternoons",
    goal: "Pair for two sessions per week with clear homework",
    mode: "Online",
    rating: 4.7,
  },
  {
    userId: "user-5",
    name: "Noah Brooks",
    role: "Tutor",
    avatarUrl:
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1887&auto=format&fit=crop",
    headline: "Guitar teacher open to skill swaps",
    canTeach: ["Guitar", "Music theory"],
    wantsToLearn: ["Video editing"],
    availability: "Sunday evenings",
    goal: "Trade beginner guitar lessons for editing workflow help",
    mode: "In person",
    rating: 4.6,
    hourlyRate: "$15/hr",
  },
];

const seedResources = [
  {
    resourceId: "resource-1",
    title: "React Native MVP checklist",
    subject: "Mobile development",
    level: "Beginner",
    verifiedBy: "SkillBridge mentors",
    image:
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=2070&auto=format&fit=crop",
  },
  {
    resourceId: "resource-2",
    title: "30-day English speaking prompts",
    subject: "Language learning",
    level: "Beginner",
    verifiedBy: "Community tutors",
    image:
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=2073&auto=format&fit=crop",
  },
  {
    resourceId: "resource-3",
    title: "Algebra exam practice set",
    subject: "Mathematics",
    level: "Intermediate",
    verifiedBy: "Tutor review",
    image:
      "https://images.unsplash.com/photo-1596495578065-6e0763fa1178?q=80&w=2074&auto=format&fit=crop",
  },
];

const seedQuestions = [
  {
    userId: "seed",
    title: "How should I structure a 30-day React Native study plan?",
    tag: "Mobile development",
    replies: 8,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
  {
    userId: "seed",
    title: "Looking for an English speaking partner twice a week",
    tag: "Language exchange",
    replies: 5,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
  {
    userId: "seed",
    title: "Can someone review my algebra practice answers?",
    tag: "Mathematics",
    replies: 3,
    createdAt: "2026-04-06T00:00:00.000Z",
  },
];

const upsertDocument = async (collectionId, documentId, data, docPermissions) => {
  const existingDocument = await request(
    "GET",
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
    null,
    { allowNotFound: true }
  );

  if (existingDocument) {
    await request(
      "PATCH",
      `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
      {
        data,
        permissions: docPermissions,
      }
    );
    console.log(`updated seed ${collectionId}.${documentId}`);
    return;
  }

  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/documents`,
    {
      documentId,
      data,
      permissions: docPermissions,
    }
  );
  console.log(`created seed ${collectionId}.${documentId}`);
};

const setupSchema = async () => {
  console.log(`Using Appwrite endpoint ${endpoint}`);
  console.log(`Using project ${projectId}`);

  await ensureDatabase();

  await ensureCollection(
    collections.profiles,
    "Profiles",
    publicCollectionPermissions
  );
  await ensureCollection(
    collections.bridgeRequests,
    "Bridge Requests",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.skippedProfiles,
    "Skipped Profiles",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.tutorShortlist,
    "Tutor Shortlist",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.questions,
    "Questions",
    publicCollectionPermissions
  );
  await ensureCollection(
    collections.answers,
    "Answers",
    publicCollectionPermissions
  );
  await ensureCollection(
    collections.resources,
    "Resources",
    publicCollectionPermissions
  );
  await ensureCollection(
    collections.savedResources,
    "Saved Resources",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.matches,
    "Matches",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.threads,
    "Threads",
    privateCollectionPermissions
  );
  await ensureCollection(
    collections.messages,
    "Messages",
    privateCollectionPermissions
  );

  for (const [collectionId, attributes] of Object.entries(collectionAttributes)) {
    for (const attribute of attributes) {
      await ensureAttribute(collectionId, attribute);
    }
  }

  for (const [collectionId, indexes] of Object.entries(collectionIndexes)) {
    for (const index of indexes) {
      await ensureIndex(collectionId, index);
    }
  }

  for (const profile of seedProfiles) {
    await upsertDocument(
      collections.profiles,
      profile.userId,
      profile,
      publicSeedPermissions
    );
  }

  for (const resource of seedResources) {
    await upsertDocument(
      collections.resources,
      resource.resourceId,
      resource,
      publicSeedPermissions
    );
  }

  for (const [index, question] of seedQuestions.entries()) {
    await upsertDocument(
      collections.questions,
      `q-${index + 1}`,
      question,
      publicSeedPermissions
    );
  }

  console.log("Appwrite schema setup complete.");
};

setupSchema().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
