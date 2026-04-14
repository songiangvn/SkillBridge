#!/usr/bin/env node

import crypto from "node:crypto";
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
const demoPassword = process.env.APPWRITE_DEMO_PASSWORD || "SkillBridge123!";

const collections = {
  profiles: process.env.EXPO_PUBLIC_APPWRITE_PROFILES_COLLECTION_ID || "profiles",
  bridgeRequests:
    process.env.EXPO_PUBLIC_APPWRITE_BRIDGE_REQUESTS_COLLECTION_ID ||
    "bridgeRequests",
  tutorShortlist:
    process.env.EXPO_PUBLIC_APPWRITE_TUTOR_SHORTLIST_COLLECTION_ID ||
    "tutorShortlist",
  questions:
    process.env.EXPO_PUBLIC_APPWRITE_QUESTIONS_COLLECTION_ID || "questions",
  answers:
    process.env.EXPO_PUBLIC_APPWRITE_ANSWERS_COLLECTION_ID || "answers",
  matches:
    process.env.EXPO_PUBLIC_APPWRITE_MATCHES_COLLECTION_ID || "matches",
  threads:
    process.env.EXPO_PUBLIC_APPWRITE_THREADS_COLLECTION_ID || "threads",
  messages:
    process.env.EXPO_PUBLIC_APPWRITE_MESSAGES_COLLECTION_ID || "messages",
};

const request = async (
  method,
  pathname,
  { body, query, allowNotFound = false, allowConflict = false } = {}
) => {
  const url = new URL(`${endpoint}${pathname}`);
  if (query) {
    Object.entries(query).forEach(([key, values]) => {
      for (const value of values) {
        const nextValue =
          typeof value === "string" ? value : JSON.stringify(value);
        url.searchParams.append(key, nextValue);
      }
    });
  }

  const response = await fetch(url.toString(), {
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

  if (response.status === 404 && allowNotFound) {
    return null;
  }

  if (response.status === 409 && allowConflict) {
    return { conflict: true };
  }

  const message = data?.message || text || response.statusText;
  throw new Error(`${method} ${pathname} failed (${response.status}): ${message}`);
};

const hashId = (prefix, value) =>
  `${prefix}_${crypto.createHash("sha1").update(value).digest("hex").slice(0, 20)}`;

const equalQuery = (attribute, values) => ({
  method: "equal",
  attribute,
  values: Array.isArray(values) ? values : [values],
});

const limitQuery = (value) => ({
  method: "limit",
  values: [value],
});

const listDocuments = async (collectionId, queries = []) => {
  const response = await request(
    "GET",
    `/databases/${databaseId}/collections/${collectionId}/documents`,
    {
      query: { "queries[]": queries },
    }
  );

  return response.documents || [];
};

const upsertDocumentByQueries = async (
  collectionId,
  queries,
  data,
  permissions
) => {
  const documents = await listDocuments(collectionId, [...queries, limitQuery(1)]);
  const existingDocument = documents[0];

  if (existingDocument) {
    await request(
      "PATCH",
      `/databases/${databaseId}/collections/${collectionId}/documents/${existingDocument.$id}`,
      {
        body: {
          data,
          permissions,
        },
      }
    );
    return existingDocument.$id;
  }

  const documentId = hashId(collectionId.slice(0, 8), JSON.stringify(queries));
  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/documents`,
    {
      body: {
        documentId,
        data,
        permissions,
      },
      allowConflict: true,
    }
  );
  return documentId;
};

const upsertDocumentById = async (collectionId, documentId, data, permissions) => {
  const existingDocument = await request(
    "GET",
    `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
    { allowNotFound: true }
  );

  if (existingDocument) {
    await request(
      "PATCH",
      `/databases/${databaseId}/collections/${collectionId}/documents/${documentId}`,
      {
        body: {
          data,
          permissions,
        },
      }
    );
    return;
  }

  await request(
    "POST",
    `/databases/${databaseId}/collections/${collectionId}/documents`,
    {
      body: {
        documentId,
        data,
        permissions,
      },
    }
  );
};

const findUserByEmail = async (email) => {
  const response = await request("GET", "/users", {
    query: {
      search: [email],
      limit: ["100"],
    },
  });

  return (response.users || []).find(
    (user) => String(user.email || "").toLowerCase() === email.toLowerCase()
  );
};

const ensureUser = async ({ userId, name, email }) => {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  await request("POST", "/users", {
    body: {
      userId,
      name,
      email,
      password: demoPassword,
      emailVerification: true,
    },
  });

  const createdUser = await findUserByEmail(email);
  if (!createdUser) {
    throw new Error(`Failed to create user ${email}`);
  }

  return createdUser;
};

const userRole = (userId) => `user:${userId}`;
const ownerPermissions = (userId) => [
  `read("${userRole(userId)}")`,
  `update("${userRole(userId)}")`,
  `delete("${userRole(userId)}")`,
];
const bridgeRequestPermissions = (userId, targetUserId) => [
  `read("${userRole(userId)}")`,
  `read("${userRole(targetUserId)}")`,
  `update("${userRole(userId)}")`,
  `delete("${userRole(userId)}")`,
];
const sharedPermissions = (userIds) =>
  userIds.flatMap((userId) => ownerPermissions(userId));
const messagePermissions = (participantIds, senderId) => [
  ...participantIds.map((userId) => `read("${userRole(userId)}")`),
  `update("${userRole(senderId)}")`,
  `delete("${userRole(senderId)}")`,
];
const publicOwnerPermissions = (userId) => [
  'read("any")',
  `update("${userRole(userId)}")`,
  `delete("${userRole(userId)}")`,
];

const buildBridgePayload = (profile, userId, targetUserId, savedAt) => ({
  userId,
  targetUserId,
  name: profile.name,
  role: profile.role,
  avatarUrl: profile.avatarUrl,
  headline: profile.headline,
  canTeach: profile.canTeach,
  wantsToLearn: profile.wantsToLearn,
  availability: profile.availability,
  goal: profile.goal,
  mode: profile.mode,
  hourlyRate: profile.hourlyRate || "",
  rating: profile.rating || 0,
  savedAt,
});

const pairKey = (firstUserId, secondUserId) =>
  [firstUserId, secondUserId].sort().join("__");

const demoUsers = [
  {
    key: "owner",
    userId: "demo_owner",
    name: "Demo Founder",
    email: "demo.owner@skillbridge.app",
    profile: {
      name: "Demo Founder",
      role: "Both",
      avatarUrl:
        "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?q=80&w=1200&auto=format&fit=crop",
      headline: "Building a startup and learning advanced English communication",
      canTeach: ["React Native", "MVP planning"],
      wantsToLearn: ["Public speaking", "Data storytelling"],
      availability: "Tue Thu 8-10pm",
      goal: "Ship a polished startup demo with real user feedback loops.",
      mode: "Online",
      rating: 5,
      level: "Intermediate",
      location: "Ho Chi Minh City",
      credentials: "Built 2 startup MVPs",
      hourlyRate: "",
    },
  },
  {
    key: "englishCoach",
    userId: "demo_english_coach",
    name: "Lina Nguyen",
    email: "demo.english@skillbridge.app",
    profile: {
      name: "Lina Nguyen",
      role: "Tutor",
      avatarUrl:
        "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?q=80&w=1200&auto=format&fit=crop",
      headline: "IELTS coach helping founders pitch clearly in English",
      canTeach: ["IELTS speaking", "Pitch storytelling"],
      wantsToLearn: ["Mobile analytics"],
      availability: "Mon Wed evenings",
      goal: "Coach startup teams and exchange analytics mentoring.",
      mode: "Online",
      rating: 4.9,
      level: "Advanced",
      location: "Hanoi",
      credentials: "IELTS 8.5, 6 years teaching",
      hourlyRate: "$20/hr",
    },
  },
  {
    key: "mathMentor",
    userId: "demo_math_mentor",
    name: "Noah Tran",
    email: "demo.math@skillbridge.app",
    profile: {
      name: "Noah Tran",
      role: "Tutor",
      avatarUrl:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=1200&auto=format&fit=crop",
      headline: "Math tutor for high-school and university foundations",
      canTeach: ["Algebra", "Calculus"],
      wantsToLearn: ["Design systems"],
      availability: "Weekend mornings",
      goal: "Teach exam prep while learning modern design workflow.",
      mode: "Hybrid",
      rating: 4.8,
      level: "Advanced",
      location: "Da Nang",
      credentials: "BSc Mathematics, 5 years tutoring",
      hourlyRate: "$18/hr",
    },
  },
  {
    key: "studyBuddy",
    userId: "demo_study_buddy",
    name: "Ari Park",
    email: "demo.study@skillbridge.app",
    profile: {
      name: "Ari Park",
      role: "Both",
      avatarUrl:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=1200&auto=format&fit=crop",
      headline: "Product designer practicing coding through pair sessions",
      canTeach: ["Wireframing", "UX writing"],
      wantsToLearn: ["TypeScript", "React Native"],
      availability: "Tue Thu mornings",
      goal: "Run two focused pair-learning sessions every week.",
      mode: "Online",
      rating: 4.7,
      level: "Intermediate",
      location: "Seoul",
      credentials: "Senior Product Designer",
      hourlyRate: "",
    },
  },
  {
    key: "pythonTutor",
    userId: "demo_python_tutor",
    name: "Kai Le",
    email: "demo.python@skillbridge.app",
    profile: {
      name: "Kai Le",
      role: "Tutor",
      avatarUrl:
        "https://images.unsplash.com/photo-1521119989659-a83eee488004?q=80&w=1200&auto=format&fit=crop",
      headline: "Data tutor helping beginners build practical Python projects",
      canTeach: ["Python basics", "Data analysis"],
      wantsToLearn: ["Public speaking"],
      availability: "Fri evenings",
      goal: "Guide one project weekly and practice communication skills.",
      mode: "Online",
      rating: 4.9,
      level: "Advanced",
      location: "Ho Chi Minh City",
      credentials: "Data analyst, 4 years mentoring",
      hourlyRate: "$22/hr",
    },
  },
  {
    key: "designBuddy",
    userId: "demo_design_buddy",
    name: "Mia Hoang",
    email: "demo.design@skillbridge.app",
    profile: {
      name: "Mia Hoang",
      role: "Both",
      avatarUrl:
        "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1200&auto=format&fit=crop",
      headline: "Design teammate who swaps visual feedback for coding support",
      canTeach: ["Visual design", "Figma systems"],
      wantsToLearn: ["React performance"],
      availability: "Mon Thu afternoons",
      goal: "Find an accountability partner for weekly feature reviews.",
      mode: "Online",
      rating: 4.8,
      level: "Intermediate",
      location: "Ho Chi Minh City",
      credentials: "UX/UI lead",
      hourlyRate: "",
    },
  },
];

const setupDemo = async () => {
  console.log(`Using Appwrite endpoint ${endpoint}`);
  console.log(`Using project ${projectId}`);

  const userMap = new Map();
  for (const demoUser of demoUsers) {
    const account = await ensureUser(demoUser);
    userMap.set(demoUser.key, account.$id);

    await upsertDocumentById(
      collections.profiles,
      account.$id,
      {
        userId: account.$id,
        ...demoUser.profile,
      },
      publicOwnerPermissions(account.$id)
    );
  }

  const ownerId = userMap.get("owner");
  if (!ownerId) {
    throw new Error("Owner account setup failed.");
  }

  const now = Date.now();
  const pendingIncoming = ["englishCoach", "mathMentor", "designBuddy"];
  for (const key of pendingIncoming) {
    const sourceId = userMap.get(key);
    const sourceProfile = demoUsers.find((user) => user.key === key)?.profile;
    if (!sourceId || !sourceProfile) {
      continue;
    }
    const savedAt = new Date(now - 1000 * 60 * (pendingIncoming.indexOf(key) + 1)).toISOString();
    await upsertDocumentByQueries(
      collections.bridgeRequests,
      [
        equalQuery("userId", sourceId),
        equalQuery("targetUserId", ownerId),
      ],
      buildBridgePayload(sourceProfile, sourceId, ownerId, savedAt),
      bridgeRequestPermissions(sourceId, ownerId)
    );
  }

  const activePairs = ["studyBuddy", "pythonTutor"];
  for (const key of activePairs) {
    const targetId = userMap.get(key);
    const ownerProfile = demoUsers.find((user) => user.key === "owner")?.profile;
    const targetProfile = demoUsers.find((user) => user.key === key)?.profile;
    if (!targetId || !ownerProfile || !targetProfile) {
      continue;
    }

    const savedAt = new Date(now - 1000 * 60 * (activePairs.indexOf(key) + 10)).toISOString();

    await upsertDocumentByQueries(
      collections.bridgeRequests,
      [
        equalQuery("userId", ownerId),
        equalQuery("targetUserId", targetId),
      ],
      buildBridgePayload(ownerProfile, ownerId, targetId, savedAt),
      bridgeRequestPermissions(ownerId, targetId)
    );

    await upsertDocumentByQueries(
      collections.bridgeRequests,
      [
        equalQuery("userId", targetId),
        equalQuery("targetUserId", ownerId),
      ],
      buildBridgePayload(targetProfile, targetId, ownerId, savedAt),
      bridgeRequestPermissions(targetId, ownerId)
    );

    const participants = [ownerId, targetId].sort();
    const [userAId, userBId] = participants;
    const userAProfile = userAId === ownerId ? ownerProfile : targetProfile;
    const userBProfile = userBId === ownerId ? ownerProfile : targetProfile;
    const thisPairKey = pairKey(ownerId, targetId);
    const threadId = hashId("thread", thisPairKey);
    const matchId = hashId("match", thisPairKey);
    const createdAt = new Date(now - 1000 * 60 * (activePairs.indexOf(key) + 20)).toISOString();
    const sharedDocPermissions = sharedPermissions(participants);

    await upsertDocumentByQueries(
      collections.matches,
      [equalQuery("pairKey", thisPairKey)],
      {
        pairKey: thisPairKey,
        threadId,
        participantIds: participants,
        userAId,
        userAName: userAProfile.name,
        userAAvatarUrl: userAProfile.avatarUrl,
        userAHeadline: userAProfile.headline,
        userBId,
        userBName: userBProfile.name,
        userBAvatarUrl: userBProfile.avatarUrl,
        userBHeadline: userBProfile.headline,
        createdAt,
      },
      sharedDocPermissions
    );

    await upsertDocumentByQueries(
      collections.threads,
      [equalQuery("threadId", threadId)],
      {
        threadId,
        matchId,
        participantIds: participants,
        userAId,
        userAName: userAProfile.name,
        userAAvatarUrl: userAProfile.avatarUrl,
        userAHeadline: userAProfile.headline,
        userBId,
        userBName: userBProfile.name,
        userBAvatarUrl: userBProfile.avatarUrl,
        userBHeadline: userBProfile.headline,
        lastMessage: "Great, see you in the next study block.",
        lastMessageAt: new Date(now - 1000 * 60).toISOString(),
        createdAt,
      },
      sharedDocPermissions
    );

    const seedMessages = [
      { senderId: targetId, body: "I reviewed your exercise set and left comments." },
      { senderId: ownerId, body: "Awesome, I will apply those and send revision tonight." },
      { senderId: targetId, body: "Perfect. We can also do a short live walkthrough." },
      { senderId: ownerId, body: "Great, see you in the next study block." },
    ];

    for (const [index, message] of seedMessages.entries()) {
      const messageId = hashId("msg", `${thisPairKey}_${index}`);
      const createdAtMessage = new Date(now - 1000 * 60 * (5 - index)).toISOString();
      await upsertDocumentByQueries(
        collections.messages,
        [equalQuery("messageId", messageId)],
        {
          messageId,
          threadId,
          matchId,
          senderId: message.senderId,
          body: message.body,
          createdAt: createdAtMessage,
        },
        messagePermissions(participants, message.senderId)
      );
    }
  }

  const tutorTargets = [
    { key: "englishCoach", status: "requested", message: "Need a 45-minute mock pitch session." },
    { key: "mathMentor", status: "shortlisted", message: "" },
  ];
  for (const tutorTarget of tutorTargets) {
    const targetId = userMap.get(tutorTarget.key);
    const targetProfile = demoUsers.find((user) => user.key === tutorTarget.key)?.profile;
    if (!targetId || !targetProfile) {
      continue;
    }

    await upsertDocumentByQueries(
      collections.tutorShortlist,
      [
        equalQuery("userId", ownerId),
        equalQuery("targetUserId", targetId),
      ],
      {
        ...buildBridgePayload(
          targetProfile,
          ownerId,
          targetId,
          new Date(now - 1000 * 60 * 3).toISOString()
        ),
        bookingStatus: tutorTarget.status,
        requestedAt:
          tutorTarget.status === "requested"
            ? new Date(now - 1000 * 60 * 30).toISOString()
            : null,
        bookingMessage: tutorTarget.message,
      },
      ownerPermissions(ownerId)
    );
  }

  const questionId = "demo_q_pitch";
  const answerId = "demo_a_pitch";
  await upsertDocumentById(
    collections.questions,
    questionId,
    {
      userId: ownerId,
      title: "How can I structure a 60-second startup pitch in English?",
      tag: "Language exchange",
      body: "I need a clear structure to present problem, solution, and traction.",
      replies: 1,
      createdAt: new Date(now - 1000 * 60 * 90).toISOString(),
    },
    publicOwnerPermissions(ownerId)
  );

  const englishCoachId = userMap.get("englishCoach");
  if (englishCoachId) {
    await upsertDocumentByQueries(
      collections.answers,
      [equalQuery("answerId", answerId)],
      {
        answerId,
        questionId,
        userId: englishCoachId,
        body: "Try Problem -> Why now -> Solution -> Traction -> Ask. Keep one sentence each.",
        createdAt: new Date(now - 1000 * 60 * 80).toISOString(),
      },
      publicOwnerPermissions(englishCoachId)
    );
  }

  console.log("");
  console.log("Demo accounts ready for video:");
  for (const user of demoUsers) {
    console.log(`- ${user.email}  (password: ${demoPassword})`);
  }
  console.log("");
  console.log("Recommended main demo account:");
  console.log("- demo.owner@skillbridge.app");
  console.log("");
  console.log("Pre-liked for instant swipe-to-match demo:");
  console.log("- Lina Nguyen");
  console.log("- Noah Tran");
  console.log("- Mia Hoang");
  console.log("");
  console.log("Pre-existing chats:");
  console.log("- Ari Park");
  console.log("- Kai Le");
};

setupDemo().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
