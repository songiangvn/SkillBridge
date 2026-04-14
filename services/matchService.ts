import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { appwriteAdapter } from "@/services/appwriteAdapter";
import appwrite, {
  appwriteConfig,
  isAppwriteConfigured,
} from "@/constants/appwrite";
import {
  ChatMessage,
  ChatThread,
  SkillBridgeMatch,
  STORAGE_KEYS,
  removeById,
  useStoredCollection,
  upsertById,
} from "@/utils/storage";
import { Platform } from "react-native";

export type { ChatMessage, ChatThread, SkillBridgeMatch } from "@/utils/storage";

const demoUserId = "demo-user";

const mapRealtimeMessage = (payload: Record<string, unknown>): ChatMessage => ({
  id: String(payload.messageId || payload.$id || `message-${Date.now()}`),
  appwriteDocumentId: payload.$id ? String(payload.$id) : undefined,
  threadId: String(payload.threadId || ""),
  senderId: String(payload.senderId || ""),
  body: String(payload.body || ""),
  createdAt: String(payload.createdAt || payload.$createdAt || new Date().toISOString()),
});

export const useMatchService = () => {
  const {
    items: matches,
    setItems: setMatches,
  } = useStoredCollection<SkillBridgeMatch>(STORAGE_KEYS.matches);
  const {
    items: threads,
    setItems: setThreads,
  } = useStoredCollection<ChatThread>(STORAGE_KEYS.chatThreads);

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listMatches().then((serverMatches) => {
      if (isMounted && serverMatches) {
        setMatches(serverMatches);
      }
    });

    appwriteAdapter.listThreads().then((serverThreads) => {
      if (isMounted && serverThreads) {
        setThreads(serverThreads);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setMatches, setThreads]);

  const getThread = useCallback(
    (threadId: string) => threads.find((thread) => thread.id === threadId),
    [threads]
  );

  return {
    matches,
    threads,
    getThread,
    setThreads,
  };
};

export const useThreadMessages = (thread?: ChatThread | null) => {
  const {
    items: allMessages,
    setItems: setAllMessages,
  } = useStoredCollection<ChatMessage>(STORAGE_KEYS.chatMessages);
  const { setThreads } = useMatchService();
  const [currentUserId, setCurrentUserId] = useState(demoUserId);
  const [isPeerTyping, setIsPeerTyping] = useState(false);
  const pendingAutoRepliesRef = useRef(0);

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.getCurrentUserId().then((userId) => {
      if (isMounted && userId) {
        setCurrentUserId(userId);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!thread) {
      return;
    }

    let isMounted = true;

    appwriteAdapter.listMessages(thread.id).then((messages) => {
      if (!isMounted || !messages) {
        return;
      }

      setAllMessages((previousMessages) => [
        ...previousMessages.filter((message) => message.threadId !== thread.id),
        ...messages,
      ]);
    });

    return () => {
      isMounted = false;
    };
  }, [setAllMessages, thread]);

  useEffect(() => {
    pendingAutoRepliesRef.current = 0;
    setIsPeerTyping(false);
  }, [thread?.id]);

  useEffect(() => {
    if (!thread || !isAppwriteConfigured || Platform.OS !== "web") {
      return;
    }

    const unsubscribe = appwrite.client.subscribe<Record<string, unknown>>(
      `databases.${appwriteConfig.databaseId}.collections.${appwriteConfig.collections.messages}.documents`,
      (event) => {
        const message = mapRealtimeMessage(event.payload);

        if (message.threadId !== thread.id) {
          return;
        }

        const wasDeleted = event.events.some((eventName) =>
          eventName.includes(".delete")
        );

        setAllMessages((previousMessages) => {
          if (wasDeleted) {
            return removeById(previousMessages, message.id);
          }

          return upsertById(previousMessages, message);
        });
      }
    );

    return unsubscribe;
  }, [setAllMessages, thread]);

  const messages = useMemo(
    () =>
      allMessages
        .filter((message) => message.threadId === thread?.id)
        .sort(
          (first, second) =>
            new Date(first.createdAt).getTime() -
            new Date(second.createdAt).getTime()
        ),
    [allMessages, thread?.id]
  );

  const sendMessage = useCallback(
    (body: string) => {
      const trimmedBody = body.trim();

      if (!thread || !trimmedBody) {
        return false;
      }

      const createdAt = new Date().toISOString();
      const pendingMessage: ChatMessage = {
        id: `local-${createdAt}`,
        threadId: thread.id,
        senderId: currentUserId,
        body: trimmedBody,
        createdAt,
      };
      const nextThread: ChatThread = {
        ...thread,
        lastMessage: trimmedBody,
        lastMessageAt: createdAt,
      };

      setAllMessages((previousMessages) =>
        upsertById(previousMessages, pendingMessage)
      );
      setThreads((previousThreads) => upsertById(previousThreads, nextThread));

      appwriteAdapter.sendMessage(thread, trimmedBody).then((serverMessage) => {
        if (serverMessage) {
          setAllMessages((previousMessages) =>
            upsertById(
              previousMessages.filter(
                (message) => message.id !== pendingMessage.id
              ),
              serverMessage
            )
          );
        }

        pendingAutoRepliesRef.current += 1;
        setIsPeerTyping(true);

        appwriteAdapter.sendAutoReply(thread, trimmedBody).then((autoReply) => {
          if (!autoReply) {
            return;
          }

          setAllMessages((previousMessages) =>
            upsertById(previousMessages, autoReply)
          );
          setThreads((previousThreads) =>
            upsertById(previousThreads, {
              ...thread,
              lastMessage: autoReply.body,
              lastMessageAt: autoReply.createdAt,
            })
          );
        }).finally(() => {
          pendingAutoRepliesRef.current = Math.max(
            0,
            pendingAutoRepliesRef.current - 1
          );

          if (pendingAutoRepliesRef.current === 0) {
            setIsPeerTyping(false);
          }
        });
      });

      return true;
    },
    [currentUserId, setAllMessages, setThreads, thread]
  );

  return {
    currentUserId,
    messages,
    sendMessage,
    isPeerTyping,
  };
};
