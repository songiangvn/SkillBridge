import { LearningResource, SkillBridgeUser } from "@/DB/userDB";
import appwrite, { appwriteConfig, isAppwriteConfigured } from "@/constants/appwrite";
import {
  ChatMessage,
  ChatThread,
  ProfileDraft,
  SavedLearningResource,
  SavedSkillBridgeUser,
  SkillBridgeMatch,
  StudyAnswer,
  StudyQuestion,
} from "@/utils/storage";
import { ID, Permission, Query, Role } from "appwrite";
import type { Models } from "appwrite";

type AppwriteDocument<T> = Models.Document & T;

const fallbackAvatar =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop";

const getCurrentUserId = async () => {
  if (!isAppwriteConfigured || !appwrite.account) {
    return null;
  }

  try {
    const user = await appwrite.account.get();
    return user.$id;
  } catch {
    return null;
  }
};

const getWritableUserId = async () => {
  const userId = await getCurrentUserId();

  if (isAppwriteConfigured && !userId) {
    return null;
  }

  return userId || "demo-user";
};

const listDocuments = async <T,>(collectionId: string, queries: string[] = []) => {
  if (!isAppwriteConfigured || !appwrite.databases) {
    return null;
  }

  try {
    const response = await appwrite.databases.listDocuments<AppwriteDocument<T>>({
      databaseId: appwriteConfig.databaseId,
      collectionId,
      queries,
    });

    return response.documents;
  } catch (error) {
    console.warn("Appwrite listDocuments failed", error);
    return null;
  }
};

const createDocument = async <T extends Record<string, unknown>>(
  collectionId: string,
  data: T,
  documentId = ID.unique(),
  permissions?: string[]
) => {
  if (!isAppwriteConfigured || !appwrite.databases) {
    return null;
  }

  try {
    return await appwrite.databases.createDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId,
      documentId,
      data,
      ...(permissions ? { permissions } : {}),
    });
  } catch (error) {
    console.warn("Appwrite createDocument failed", error);
    return null;
  }
};

const updateDocument = async <T extends Record<string, unknown>>(
  collectionId: string,
  documentId: string,
  data: Partial<T>,
  permissions?: string[]
) => {
  if (!isAppwriteConfigured || !appwrite.databases) {
    return null;
  }

  try {
    return await appwrite.databases.updateDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId,
      documentId,
      data,
      ...(permissions ? { permissions } : {}),
    });
  } catch (error) {
    console.warn("Appwrite updateDocument failed", error);
    return null;
  }
};

const deleteDocument = async (collectionId: string, documentId: string) => {
  if (!isAppwriteConfigured || !appwrite.databases) {
    return false;
  }

  try {
    await appwrite.databases.deleteDocument({
      databaseId: appwriteConfig.databaseId,
      collectionId,
      documentId,
    });
    return true;
  } catch (error) {
    console.warn("Appwrite deleteDocument failed", error);
    return false;
  }
};

const upsertDocumentByQueries = async <T extends Record<string, unknown>>(
  collectionId: string,
  data: T,
  queries: string[],
  permissions?: string[]
) => {
  const existingDocuments = await listDocuments<Record<string, unknown>>(
    collectionId,
    queries
  );
  const existingDocumentId = existingDocuments?.[0]?.$id;

  if (existingDocumentId) {
    return updateDocument(collectionId, existingDocumentId, data, permissions);
  }

  return createDocument(collectionId, data, ID.unique(), permissions);
};

const ownerPermissions = (userId: string) => [
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const bridgeRequestPermissions = (userId: string, _targetUserId: string) => [
  Permission.read(Role.users()),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const sharedUserPermissions = (_participantIds: string[]) => [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const sharedMessagePermissions = (
  _participantIds: string[],
  _senderId: string
) => [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const publicOwnerPermissions = (userId: string) => [
  Permission.read(Role.any()),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
];

const savedUserPayload = async (user: SkillBridgeUser) => {
  const userId = await getWritableUserId();

  if (!userId) {
    return null;
  }

  return {
    userId,
    targetUserId: user.id,
    name: user.name,
    role: user.role,
    avatarUrl: user.avatarUrl,
    headline: user.headline,
    canTeach: user.canTeach,
    wantsToLearn: user.wantsToLearn,
    availability: user.availability,
    goal: user.goal,
    mode: user.mode,
    hourlyRate: user.hourlyRate || "",
    savedAt: new Date().toISOString(),
    ...(typeof user.rating === "number" ? { rating: user.rating } : {}),
  };
};

const mapSavedUser = (document: AppwriteDocument<Record<string, unknown>>): SavedSkillBridgeUser => ({
  id: String(document.targetUserId || document.$id),
  appwriteDocumentId: document.$id,
  name: String(document.name || ""),
  role: (document.role as SavedSkillBridgeUser["role"]) || "Learner",
  avatarUrl: String(document.avatarUrl || ""),
  headline: String(document.headline || ""),
  canTeach: toStringArray(document.canTeach),
  wantsToLearn: toStringArray(document.wantsToLearn),
  availability: String(document.availability || ""),
  goal: String(document.goal || ""),
  mode: (document.mode as SavedSkillBridgeUser["mode"]) || "Online",
  rating: typeof document.rating === "number" ? document.rating : undefined,
  hourlyRate: document.hourlyRate ? String(document.hourlyRate) : undefined,
  savedAt: String(document.savedAt || document.$createdAt || new Date().toISOString()),
  bookingStatus:
    document.bookingStatus === "requested" ||
    document.bookingStatus === "confirmed" ||
    document.bookingStatus === "cancelled"
      ? document.bookingStatus
      : "shortlisted",
  requestedAt: document.requestedAt ? String(document.requestedAt) : undefined,
  bookingMessage: document.bookingMessage
    ? String(document.bookingMessage)
    : undefined,
});

const toStringArray = (value: unknown, fallback: string[] = []) => {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return fallback;
};

const toRole = (value: unknown): SkillBridgeUser["role"] => {
  if (value === "Learner" || value === "Tutor" || value === "Both") {
    return value;
  }

  return "Both";
};

const toMode = (value: unknown): SkillBridgeUser["mode"] => {
  if (value === "Online" || value === "In person" || value === "Hybrid") {
    return value;
  }

  return "Online";
};

const toProfileLevel = (value: unknown): ProfileDraft["level"] => {
  if (
    value === "Beginner" ||
    value === "Intermediate" ||
    value === "Advanced"
  ) {
    return value;
  }

  return "Beginner";
};

const mapProfile = (
  document: AppwriteDocument<Record<string, unknown>>
): SkillBridgeUser => {
  const canTeach = toStringArray(document.canTeach, ["Skill coaching"]);
  const wantsToLearn = toStringArray(document.wantsToLearn, ["Study partner"]);
  const name = String(document.name || "SkillBridge member");
  const role = toRole(document.role);

  return {
    id: String(document.userId || document.$id),
    name,
    role,
    avatarUrl: String(document.avatarUrl || fallbackAvatar),
    headline: String(
      document.headline ||
        `${role} teaching ${canTeach[0]} and learning ${wantsToLearn[0]}`
    ),
    canTeach,
    wantsToLearn,
    availability: String(document.availability || "Flexible schedule"),
    goal: String(
      document.goal || "Build a consistent learning routine with a good partner."
    ),
    mode: toMode(document.mode),
    rating:
      typeof document.rating === "number" ? document.rating : undefined,
    hourlyRate: document.hourlyRate ? String(document.hourlyRate) : undefined,
  };
};

const mapResource = (
  document: AppwriteDocument<Record<string, unknown>>
): LearningResource => ({
  id: String(document.resourceId || document.$id),
  title: String(document.title || "Untitled resource"),
  subject: String(document.subject || "General"),
  level: String(document.level || "Beginner"),
  verifiedBy: String(document.verifiedBy || "SkillBridge"),
  image: String(document.image || fallbackAvatar),
});

const createPairKey = (firstUserId: string, secondUserId: string) =>
  [firstUserId, secondUserId].sort().join("__");

const getProfileFields = (
  prefix: "userA" | "userB",
  document: AppwriteDocument<Record<string, unknown>>
) => ({
  id: String(document[`${prefix}Id`] || ""),
  name: String(document[`${prefix}Name`] || "SkillBridge member"),
  avatarUrl: String(document[`${prefix}AvatarUrl`] || fallbackAvatar),
  headline: String(document[`${prefix}Headline`] || "Ready to learn together"),
});

const getTargetFields = (
  document: AppwriteDocument<Record<string, unknown>>,
  currentUserId: string
) => {
  const userA = getProfileFields("userA", document);
  const userB = getProfileFields("userB", document);

  if (userA.id === currentUserId) {
    return userB;
  }

  return userA;
};

const mapMatch = (
  document: AppwriteDocument<Record<string, unknown>>,
  currentUserId: string
): SkillBridgeMatch => {
  const target = getTargetFields(document, currentUserId);

  return {
    id: String(document.$id),
    appwriteDocumentId: document.$id,
    threadId: String(document.threadId || ""),
    targetUserId: target.id,
    targetName: target.name,
    targetAvatarUrl: target.avatarUrl,
    targetHeadline: target.headline,
    participantIds: toStringArray(document.participantIds),
    createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
  };
};

const mapThread = (
  document: AppwriteDocument<Record<string, unknown>>,
  currentUserId: string
): ChatThread => {
  const target = getTargetFields(document, currentUserId);

  return {
    id: String(document.threadId || document.$id),
    appwriteDocumentId: document.$id,
    matchId: String(document.matchId || ""),
    targetUserId: target.id,
    targetName: target.name,
    targetAvatarUrl: target.avatarUrl,
    targetHeadline: target.headline,
    participantIds: toStringArray(document.participantIds),
    lastMessage: String(document.lastMessage || ""),
    lastMessageAt: String(document.lastMessageAt || document.$createdAt || new Date().toISOString()),
    createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
  };
};

const mapMessage = (
  document: AppwriteDocument<Record<string, unknown>>
): ChatMessage => ({
  id: String(document.messageId || document.$id),
  appwriteDocumentId: document.$id,
  threadId: String(document.threadId || ""),
  senderId: String(document.senderId || ""),
  body: String(document.body || ""),
  createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
});

const demoReplyTemplates = [
  "Hey! Great to match with you. I can do a focused 30-minute session this week.",
  "Hi! Nice to connect on SkillBridge. I am in for a quick learning exchange.",
  "Awesome, thanks for reaching out. Want to start with one small practice task?",
  "Great timing. I can help and I would love to learn from you too.",
];

const delay = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

const buildDemoReply = (body: string) => {
  const normalizedBody = body.toLowerCase();

  if (
    normalizedBody.includes("hello") ||
    normalizedBody.includes("hi") ||
    normalizedBody.includes("chao")
  ) {
    return "Hey! Glad to connect. Let's start learning together.";
  }

  if (
    normalizedBody.includes("time") ||
    normalizedBody.includes("schedule") ||
    normalizedBody.includes("session")
  ) {
    return "Perfect. I am free this week, we can lock a session time now.";
  }

  const templateIndex = body.length % demoReplyTemplates.length;
  return demoReplyTemplates[templateIndex];
};

const mapAnswer = (
  document: AppwriteDocument<Record<string, unknown>>
): StudyAnswer => ({
  id: String(document.answerId || document.$id),
  appwriteDocumentId: document.$id,
  questionId: String(document.questionId || ""),
  userId: String(document.userId || ""),
  body: String(document.body || ""),
  createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
});

const buildParticipantProfile = (
  userId: string,
  requestToThatUser: AppwriteDocument<Record<string, unknown>>
) => ({
  id: userId,
  name: String(requestToThatUser.name || "SkillBridge member"),
  avatarUrl: String(requestToThatUser.avatarUrl || fallbackAvatar),
  headline: String(requestToThatUser.headline || "Ready to learn together"),
});

const createMutualMatch = async (
  payload: NonNullable<Awaited<ReturnType<typeof savedUserPayload>>>
) => {
  const reverseRequests = await listDocuments<Record<string, unknown>>(
    appwriteConfig.collections.bridgeRequests,
    [
      Query.equal("userId", payload.targetUserId),
      Query.equal("targetUserId", payload.userId),
      Query.limit(1),
    ]
  );
  const reverseRequest = reverseRequests?.[0];

  if (!reverseRequest) {
    return null;
  }

  const currentUserProfile = buildParticipantProfile(payload.userId, reverseRequest);
  const targetUserProfile = {
    id: payload.targetUserId,
    name: payload.name,
    avatarUrl: payload.avatarUrl,
    headline: payload.headline,
  };
  const participants = [currentUserProfile, targetUserProfile].sort((first, second) =>
    first.id.localeCompare(second.id)
  );
  const [userA, userB] = participants;
  const participantIds = participants.map((participant) => participant.id);
  const pairKey = createPairKey(payload.userId, payload.targetUserId);
  const existingMatches = await listDocuments<Record<string, unknown>>(
    appwriteConfig.collections.matches,
    [Query.equal("pairKey", pairKey), Query.limit(1)]
  );
  const existingMatch = existingMatches?.[0];

  if (existingMatch) {
    const existingThreads = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.threads,
      [Query.equal("matchId", existingMatch.$id), Query.limit(1)]
    );

    return {
      match: mapMatch(existingMatch, payload.userId),
      thread: existingThreads?.[0]
        ? mapThread(existingThreads[0], payload.userId)
        : null,
    };
  }

  const createdAt = new Date().toISOString();
  const matchId = ID.unique();
  const threadId = ID.unique();
  const matchPermissions = sharedUserPermissions(participantIds);
  const matchData = {
    pairKey,
    threadId,
    participantIds,
    userAId: userA.id,
    userAName: userA.name,
    userAAvatarUrl: userA.avatarUrl,
    userAHeadline: userA.headline,
    userBId: userB.id,
    userBName: userB.name,
    userBAvatarUrl: userB.avatarUrl,
    userBHeadline: userB.headline,
    createdAt,
  };
  const threadData = {
    threadId,
    matchId,
    participantIds,
    userAId: userA.id,
    userAName: userA.name,
    userAAvatarUrl: userA.avatarUrl,
    userAHeadline: userA.headline,
    userBId: userB.id,
    userBName: userB.name,
    userBAvatarUrl: userB.avatarUrl,
    userBHeadline: userB.headline,
    lastMessage: "",
    lastMessageAt: createdAt,
    createdAt,
  };

  const matchDocument = await createDocument(
    appwriteConfig.collections.matches,
    matchData,
    matchId,
    matchPermissions
  );
  const threadDocument = await createDocument(
    appwriteConfig.collections.threads,
    threadData,
    threadId,
    matchPermissions
  );

  if (!matchDocument || !threadDocument) {
    return null;
  }

  return {
    match: mapMatch(
      matchDocument as AppwriteDocument<Record<string, unknown>>,
      payload.userId
    ),
    thread: mapThread(
      threadDocument as AppwriteDocument<Record<string, unknown>>,
      payload.userId
    ),
  };
};

export const appwriteAdapter = {
  isEnabled: isAppwriteConfigured,

  async listProfiles() {
    const userId = await getCurrentUserId();
    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.profiles,
      [Query.limit(50)]
    );
    const incomingRequests = userId
      ? await listDocuments<Record<string, unknown>>(
          appwriteConfig.collections.bridgeRequests,
          [Query.equal("targetUserId", userId), Query.limit(100)]
        )
      : null;
    const incomingUserIds = new Set(
      (incomingRequests || []).map((document) => String(document.userId || ""))
    );
    const profiles =
      documents?.map(mapProfile).filter((profile) => profile.id !== userId) || [];

    if (profiles.length === 0) {
      return null;
    }

    profiles.sort((first, second) => {
      const firstIncoming = incomingUserIds.has(first.id) ? 1 : 0;
      const secondIncoming = incomingUserIds.has(second.id) ? 1 : 0;

      if (firstIncoming !== secondIncoming) {
        return secondIncoming - firstIncoming;
      }

      return first.name.localeCompare(second.name);
    });

    return profiles;
  },

  async listResourceCatalog() {
    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.resources,
      [Query.limit(50)]
    );

    return documents?.map(mapResource) || null;
  },

  async listBridgeRequests() {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.bridgeRequests,
      userId ? [Query.equal("userId", userId)] : []
    );

    return documents?.map(mapSavedUser) || null;
  },

  async requestBridge(user: SkillBridgeUser) {
    const payload = await savedUserPayload(user);
    if (!payload) {
      return null;
    }

    const request = await upsertDocumentByQueries(
      appwriteConfig.collections.bridgeRequests,
      payload,
      [
        Query.equal("userId", payload.userId),
        Query.equal("targetUserId", payload.targetUserId),
      ],
      bridgeRequestPermissions(payload.userId, payload.targetUserId)
    );
    const matchBundle = await createMutualMatch(payload);

    return {
      request,
      match: matchBundle?.match || null,
      thread: matchBundle?.thread || null,
    };
  },

  async deleteBridgeRequest(documentId: string) {
    return deleteDocument(appwriteConfig.collections.bridgeRequests, documentId);
  },

  async skipProfile(user: SkillBridgeUser) {
    const payload = await savedUserPayload(user);
    if (!payload) {
      return null;
    }

    return upsertDocumentByQueries(
      appwriteConfig.collections.skippedProfiles,
      payload,
      [
        Query.equal("userId", payload.userId),
        Query.equal("targetUserId", payload.targetUserId),
      ],
      ownerPermissions(payload.userId)
    );
  },

  async listTutorShortlist() {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.tutorShortlist,
      userId ? [Query.equal("userId", userId)] : []
    );

    return documents?.map(mapSavedUser) || null;
  },

  async shortlistTutor(user: SkillBridgeUser) {
    const payload = await savedUserPayload(user);
    if (!payload) {
      return null;
    }

    return upsertDocumentByQueries(
      appwriteConfig.collections.tutorShortlist,
      {
        ...payload,
        bookingStatus: "shortlisted",
        bookingMessage: "",
      },
      [
        Query.equal("userId", payload.userId),
        Query.equal("targetUserId", payload.targetUserId),
      ],
      ownerPermissions(payload.userId)
    );
  },

  async requestTutorSession(user: SkillBridgeUser, message = "") {
    const payload = await savedUserPayload(user);
    if (!payload) {
      return null;
    }

    const requestedAt = new Date().toISOString();

    return upsertDocumentByQueries(
      appwriteConfig.collections.tutorShortlist,
      {
        ...payload,
        bookingStatus: "requested",
        requestedAt,
        bookingMessage:
          message.trim() ||
          `I would like to book a focused session with ${user.name}.`,
      },
      [
        Query.equal("userId", payload.userId),
        Query.equal("targetUserId", payload.targetUserId),
      ],
      ownerPermissions(payload.userId)
    );
  },

  async deleteTutorShortlistItem(documentId: string) {
    return deleteDocument(appwriteConfig.collections.tutorShortlist, documentId);
  },

  async listSavedResources() {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.savedResources,
      userId ? [Query.equal("userId", userId)] : []
    );

    return (
      documents?.map((document) => ({
        ...mapResource(document),
        appwriteDocumentId: document.$id,
        savedAt: String(document.savedAt || document.$createdAt || new Date().toISOString()),
      })) || null
    );
  },

  async saveResource(resource: Omit<SavedLearningResource, "savedAt">) {
    const resolvedUserId = await getWritableUserId();
    if (!resolvedUserId) {
      return null;
    }

    return upsertDocumentByQueries(appwriteConfig.collections.savedResources, {
      userId: resolvedUserId,
      resourceId: resource.id,
      title: resource.title,
      subject: resource.subject,
      level: resource.level,
      verifiedBy: resource.verifiedBy,
      image: resource.image,
      savedAt: new Date().toISOString(),
    }, [
      Query.equal("userId", resolvedUserId),
      Query.equal("resourceId", resource.id),
    ], ownerPermissions(resolvedUserId));
  },

  async deleteSavedResource(documentId: string) {
    return deleteDocument(appwriteConfig.collections.savedResources, documentId);
  },

  async listQuestions() {
    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.questions,
      [Query.orderDesc("createdAt")]
    );
    const answers = documents
      ? await listDocuments<Record<string, unknown>>(
          appwriteConfig.collections.answers,
          [Query.limit(500)]
        )
      : null;
    const answerCounts = new Map<string, number>();

    answers?.forEach((answer) => {
      const questionId = String(answer.questionId || "");
      answerCounts.set(questionId, (answerCounts.get(questionId) || 0) + 1);
    });

    return (
      documents?.map((document) => ({
        id: document.$id,
        title: String(document.title || ""),
        tag: String(document.tag || "General"),
        body: document.body ? String(document.body) : undefined,
        replies:
          answerCounts.get(document.$id) ||
          (typeof document.replies === "number" ? document.replies : 0),
        createdAt: String(document.createdAt || document.$createdAt || new Date().toISOString()),
      })) || null
    );
  },

  async postQuestion(
    question: Omit<StudyQuestion, "createdAt" | "replies"> & { id?: string }
  ) {
    const userId = await getWritableUserId();
    if (!userId) {
      return null;
    }

    const createdAt = new Date().toISOString();

    return createDocument(
      appwriteConfig.collections.questions,
      {
        userId,
        title: question.title,
        tag: question.tag,
        body: question.body || "",
        replies: 0,
        createdAt,
      },
      question.id || ID.unique(),
      publicOwnerPermissions(userId)
    );
  },

  async deleteQuestion(documentId: string) {
    return deleteDocument(appwriteConfig.collections.questions, documentId);
  },

  async listAnswers(questionId: string) {
    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.answers,
      [
        Query.equal("questionId", questionId),
        Query.orderAsc("createdAt"),
        Query.limit(100),
      ]
    );

    return documents?.map(mapAnswer) || null;
  },

  async postAnswer(questionId: string, body: string) {
    const userId = await getWritableUserId();
    const trimmedBody = body.trim();

    if (!userId || !trimmedBody) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const answerId = ID.unique();
    const answer = await createDocument(
      appwriteConfig.collections.answers,
      {
        answerId,
        questionId,
        userId,
        body: trimmedBody,
        createdAt,
      },
      answerId,
      publicOwnerPermissions(userId)
    );

    return answer
      ? mapAnswer(answer as AppwriteDocument<Record<string, unknown>>)
      : null;
  },

  async deleteAnswer(documentId: string) {
    return deleteDocument(appwriteConfig.collections.answers, documentId);
  },

  async listMatches() {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.matches,
      userId
        ? [
            Query.or([
              Query.equal("userAId", userId),
              Query.equal("userBId", userId),
            ]),
            Query.orderDesc("createdAt"),
            Query.limit(50),
          ]
        : []
    );

    return documents?.map((document) => mapMatch(document, userId || "demo-user")) || null;
  },

  async listThreads() {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.threads,
      userId
        ? [
            Query.or([
              Query.equal("userAId", userId),
              Query.equal("userBId", userId),
            ]),
            Query.orderDesc("lastMessageAt"),
            Query.limit(50),
          ]
        : []
    );

    return documents?.map((document) => mapThread(document, userId || "demo-user")) || null;
  },

  async getThreadById(threadId: string) {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.threads,
      [Query.equal("threadId", threadId), Query.limit(1)]
    );
    const thread = documents?.[0];

    return thread ? mapThread(thread, userId || "demo-user") : null;
  },

  async listMessages(threadId: string) {
    const userId = await getCurrentUserId();
    if (isAppwriteConfigured && !userId) {
      return null;
    }

    const documents = await listDocuments<Record<string, unknown>>(
      appwriteConfig.collections.messages,
      [
        Query.equal("threadId", threadId),
        Query.orderAsc("createdAt"),
        Query.limit(100),
      ]
    );

    return documents?.map(mapMessage) || null;
  },

  async sendMessage(thread: ChatThread, body: string) {
    const userId = await getWritableUserId();
    const trimmedBody = body.trim();

    if (!userId || !trimmedBody) {
      return null;
    }

    const createdAt = new Date().toISOString();
    const messageId = ID.unique();
    const message = await createDocument(
      appwriteConfig.collections.messages,
      {
        messageId,
        threadId: thread.id,
        matchId: thread.matchId,
        senderId: userId,
        body: trimmedBody,
        createdAt,
      },
      messageId,
      sharedMessagePermissions(thread.participantIds, userId)
    );

    if (message && thread.appwriteDocumentId) {
      await updateDocument(
        appwriteConfig.collections.threads,
        thread.appwriteDocumentId,
        {
          lastMessage: trimmedBody,
          lastMessageAt: createdAt,
        }
      );
    }

    return message
      ? mapMessage(message as AppwriteDocument<Record<string, unknown>>)
      : null;
  },

  async sendAutoReply(thread: ChatThread, body: string) {
    const incomingMessage = body.trim();

    if (!incomingMessage) {
      return null;
    }

    const typingDelayMs = 900 + Math.floor(Math.random() * 900);
    await delay(typingDelayMs);

    const createdAt = new Date().toISOString();
    const replyBody = buildDemoReply(incomingMessage);

    if (!isAppwriteConfigured || !appwrite.databases) {
      return {
        id: `auto-${createdAt}`,
        threadId: thread.id,
        senderId: thread.targetUserId,
        body: replyBody,
        createdAt,
      } satisfies ChatMessage;
    }

    const messageId = ID.unique();
    const message = await createDocument(
      appwriteConfig.collections.messages,
      {
        messageId,
        threadId: thread.id,
        matchId: thread.matchId,
        senderId: thread.targetUserId,
        body: replyBody,
        createdAt,
      },
      messageId,
      sharedMessagePermissions(thread.participantIds, thread.targetUserId)
    );

    if (!message) {
      return {
        id: `auto-${createdAt}`,
        threadId: thread.id,
        senderId: thread.targetUserId,
        body: replyBody,
        createdAt,
      } satisfies ChatMessage;
    }

    if (thread.appwriteDocumentId) {
      await updateDocument(
        appwriteConfig.collections.threads,
        thread.appwriteDocumentId,
        {
          lastMessage: replyBody,
          lastMessageAt: createdAt,
        }
      );
    }

    return mapMessage(message as AppwriteDocument<Record<string, unknown>>);
  },

  async getProfile() {
    const userId = await getCurrentUserId();
    if (!userId || !isAppwriteConfigured || !appwrite.databases) {
      return null;
    }

    try {
      const document = await appwrite.databases.getDocument<AppwriteDocument<ProfileDraft & { userId: string }>>({
        databaseId: appwriteConfig.databaseId,
        collectionId: appwriteConfig.collections.profiles,
        documentId: userId,
      });

      return {
        name: String(document.name || ""),
        role: toRole(document.role),
        canTeach: toStringArray(document.canTeach).join(", "),
        wantsToLearn: toStringArray(document.wantsToLearn).join(", "),
        availability: String(document.availability || ""),
        goal: String(document.goal || ""),
        mode: toMode(document.mode),
        level: toProfileLevel(document.level),
        location: String(document.location || ""),
        credentials: String(document.credentials || ""),
        hourlyRate: String(document.hourlyRate || ""),
      } satisfies ProfileDraft;
    } catch {
      return null;
    }
  },

  async saveProfile(profile: ProfileDraft) {
    const userId = await getCurrentUserId();
    if (!userId) {
      return null;
    }

    const canTeach = toStringArray(profile.canTeach);
    const wantsToLearn = toStringArray(profile.wantsToLearn);
    const data = {
      ...profile,
      userId,
      name: profile.name.trim() || "SkillBridge member",
      availability: profile.availability.trim() || "Flexible schedule",
      goal:
        profile.goal.trim() ||
        "Exchange skills, book focused help, and stay accountable.",
      canTeach: canTeach.length > 0 ? canTeach : ["Skill coaching"],
      wantsToLearn:
        wantsToLearn.length > 0 ? wantsToLearn : ["Study partner"],
    };
    const existingProfile = await this.getProfile();

    if (existingProfile) {
      return updateDocument(appwriteConfig.collections.profiles, userId, data);
    }

    return createDocument(
      appwriteConfig.collections.profiles,
      data,
      userId,
      publicOwnerPermissions(userId)
    );
  },

  deleteDocument,
  getCurrentUserId,
};
