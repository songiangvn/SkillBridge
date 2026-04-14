import { useCallback, useEffect } from "react";

import { SkillBridgeUser, SuggestedUsers } from "@/DB/userDB";
import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  ChatMessage,
  ChatThread,
  SkillBridgeMatch,
  SavedSkillBridgeUser,
  STORAGE_KEYS,
  readStored,
  useStoredCollection,
  upsertById,
  writeStored,
} from "@/utils/storage";

export type { SavedSkillBridgeUser } from "@/utils/storage";

const toSavedUser = (user: SkillBridgeUser): SavedSkillBridgeUser => ({
  ...user,
  savedAt: new Date().toISOString(),
});

const createDemoMatchBundle = (user: SkillBridgeUser) => {
  const createdAt = new Date().toISOString();
  const matchId = `demo-match-${user.id}`;
  const threadId = `demo-thread-${user.id}`;
  const participantIds = ["demo-user", user.id];
  const match: SkillBridgeMatch = {
    id: matchId,
    threadId,
    targetUserId: user.id,
    targetName: user.name,
    targetAvatarUrl: user.avatarUrl,
    targetHeadline: user.headline,
    participantIds,
    createdAt,
  };
  const thread: ChatThread = {
    id: threadId,
    matchId,
    targetUserId: user.id,
    targetName: user.name,
    targetAvatarUrl: user.avatarUrl,
    targetHeadline: user.headline,
    participantIds,
    lastMessage: "",
    lastMessageAt: createdAt,
    createdAt,
  };

  return { match, thread };
};

const cacheMatchBundle = (match: SkillBridgeMatch, thread: ChatThread) => {
  writeStored(
    STORAGE_KEYS.matches,
    upsertById(readStored<SkillBridgeMatch[]>(STORAGE_KEYS.matches, []), match)
  );
  writeStored(
    STORAGE_KEYS.chatThreads,
    upsertById(readStored<ChatThread[]>(STORAGE_KEYS.chatThreads, []), thread)
  );
};

const buildStartingDemoState = (currentUserId: string) => {
  const now = Date.now();
  const queueUsers = SuggestedUsers.slice(0, 4);
  const activeChatUsers = SuggestedUsers.slice(4, 8);
  const matches: SkillBridgeMatch[] = [];
  const threads: ChatThread[] = [];
  const messages: ChatMessage[] = [];

  const createBundle = (
    user: SkillBridgeUser,
    createdAtMs: number,
    lastMessage: string
  ) => {
    const createdAt = new Date(createdAtMs).toISOString();
    const participantIds = [currentUserId, user.id];
    const matchId = `starting-match-${user.id}`;
    const threadId = `starting-thread-${user.id}`;

    const match: SkillBridgeMatch = {
      id: matchId,
      threadId,
      targetUserId: user.id,
      targetName: user.name,
      targetAvatarUrl: user.avatarUrl,
      targetHeadline: user.headline,
      participantIds,
      createdAt,
    };
    const thread: ChatThread = {
      id: threadId,
      matchId,
      targetUserId: user.id,
      targetName: user.name,
      targetAvatarUrl: user.avatarUrl,
      targetHeadline: user.headline,
      participantIds,
      lastMessage,
      lastMessageAt: createdAt,
      createdAt,
    };

    return { match, thread };
  };

  queueUsers.forEach((user, index) => {
    const createdAtMs = now - (index + 1) * 4 * 60 * 60 * 1000;
    const bundle = createBundle(user, createdAtMs, "");
    matches.push(bundle.match);
    threads.push(bundle.thread);
  });

  activeChatUsers.forEach((user, index) => {
    const createdAtMs = now - (index + 6) * 3 * 60 * 60 * 1000;
    const bundle = createBundle(
      user,
      createdAtMs,
      "Sounds good. Let's start with a 30-minute focused session."
    );
    matches.push(bundle.match);
    threads.push(bundle.thread);

    messages.push(
      {
        id: `starting-message-${user.id}-1`,
        threadId: bundle.thread.id,
        senderId: currentUserId,
        body: `Hi ${user.name}, I want to start this week. Does Tuesday work?`,
        createdAt: new Date(createdAtMs + 10 * 60 * 1000).toISOString(),
      },
      {
        id: `starting-message-${user.id}-2`,
        threadId: bundle.thread.id,
        senderId: user.id,
        body: "Sounds good. Let's start with a 30-minute focused session.",
        createdAt: new Date(createdAtMs + 18 * 60 * 1000).toISOString(),
      }
    );
  });

  return {
    matches,
    threads,
    messages,
  };
};

export const useBridgeService = () => {
  const {
    items: bridgeRequests,
    upsertItem: upsertBridgeRequest,
    removeItem: removeBridgeRequest,
    hasItem: hasBridgeRequest,
    setItems: setBridgeRequests,
  } = useStoredCollection<SavedSkillBridgeUser>(
    STORAGE_KEYS.bridgedUsers
  );
  const {
    items: skippedProfiles,
    upsertItem: upsertSkippedProfile,
  } = useStoredCollection<SavedSkillBridgeUser>(
    STORAGE_KEYS.skippedUsers
  );

  const requestBridge = useCallback(
    async (user: SkillBridgeUser) => {
      const savedUser = toSavedUser(user);

      upsertBridgeRequest(savedUser);
      const result = await appwriteAdapter.requestBridge(user);

      if (result?.request?.$id) {
        upsertBridgeRequest({
          ...savedUser,
          appwriteDocumentId: result.request.$id,
        });
      }

      if (result?.match && result.thread) {
        cacheMatchBundle(result.match, result.thread);
        return {
          matched: true,
          threadId: result.thread.id,
          targetName: user.name,
        };
      }

      if (!appwriteAdapter.isEnabled) {
        const demoMatch = createDemoMatchBundle(user);
        cacheMatchBundle(demoMatch.match, demoMatch.thread);
        return {
          matched: true,
          threadId: demoMatch.thread.id,
          targetName: user.name,
        };
      }

      return {
        matched: false,
        targetName: user.name,
      };
    },
    [upsertBridgeRequest]
  );

  const skipProfile = useCallback(
    (user: SkillBridgeUser) => {
      upsertSkippedProfile(toSavedUser(user));
      appwriteAdapter.skipProfile(user);
    },
    [upsertSkippedProfile]
  );

  const removeBridge = useCallback(
    (targetUserId: string) => {
      const request = bridgeRequests.find((item) => item.id === targetUserId);
      removeBridgeRequest(targetUserId);

      if (request?.appwriteDocumentId) {
        appwriteAdapter.deleteBridgeRequest(request.appwriteDocumentId);
      }
    },
    [bridgeRequests, removeBridgeRequest]
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listBridgeRequests().then((requests) => {
      if (isMounted && requests) {
        setBridgeRequests(requests);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setBridgeRequests]);

  const resetDemoState = useCallback(async () => {
    const currentUserId = (await appwriteAdapter.getCurrentUserId()) || "demo-user";
    const startingState = buildStartingDemoState(currentUserId);

    writeStored(STORAGE_KEYS.bridgedUsers, []);
    writeStored(STORAGE_KEYS.skippedUsers, []);
    writeStored(STORAGE_KEYS.matches, startingState.matches);
    writeStored(STORAGE_KEYS.chatThreads, startingState.threads);
    writeStored(STORAGE_KEYS.chatMessages, startingState.messages);
  }, []);

  return {
    bridgeRequests,
    skippedProfiles,
    requestBridge,
    skipProfile,
    removeBridgeRequest: removeBridge,
    hasBridgeRequest,
    resetDemoState,
  };
};
