import { useCallback, useEffect, useRef, useState } from "react";

import { LearningResource, SkillBridgeUser } from "@/DB/userDB";

export type StudyQuestion = {
  id: string;
  title: string;
  tag: string;
  body?: string;
  replies: number;
  createdAt: string;
};

export type StudyAnswer = {
  id: string;
  questionId: string;
  userId: string;
  body: string;
  createdAt: string;
  appwriteDocumentId?: string;
};

export type ProfileDraft = {
  name: string;
  role: "Learner" | "Tutor" | "Both";
  canTeach: string;
  wantsToLearn: string;
  availability: string;
  goal: string;
  mode: "Online" | "In person" | "Hybrid";
  level: "Beginner" | "Intermediate" | "Advanced";
  location: string;
  credentials: string;
  hourlyRate: string;
};

export const STORAGE_KEYS = {
  bridgedUsers: "skillbridge:bridged-users",
  skippedUsers: "skillbridge:skipped-users",
  savedResources: "skillbridge:saved-resources",
  bookedTutors: "skillbridge:booked-tutors",
  questions: "skillbridge:questions",
  answers: "skillbridge:answers",
  profile: "skillbridge:profile",
  matches: "skillbridge:matches",
  chatThreads: "skillbridge:chat-threads",
  chatMessages: "skillbridge:chat-messages",
};

const storageEventName = "skillbridge-storage";
const memoryStore = new Map<string, string>();
const storageSubscribers = new Set<(key: string) => void>();

const defer = (callback: () => void) => {
  if (typeof queueMicrotask === "function") {
    queueMicrotask(callback);
    return;
  }

  setTimeout(callback, 0);
};

const canUseLocalStorage = () =>
  typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const canUseWindowEvents = () =>
  typeof window !== "undefined" &&
  typeof window.addEventListener === "function" &&
  typeof window.removeEventListener === "function" &&
  typeof window.dispatchEvent === "function";

const emitStorageUpdate = (key: string) => {
  defer(() => {
    storageSubscribers.forEach((subscriber) => {
      subscriber(key);
    });

    if (canUseWindowEvents() && typeof CustomEvent === "function") {
      window.dispatchEvent(new CustomEvent(storageEventName, { detail: { key } }));
    }
  });
};

const subscribeStorageUpdates = (subscriber: (key: string) => void) => {
  storageSubscribers.add(subscriber);

  return () => {
    storageSubscribers.delete(subscriber);
  };
};

export const readStored = <T,>(key: string, fallback: T): T => {
  try {
    const raw = canUseLocalStorage()
      ? window.localStorage.getItem(key)
      : memoryStore.get(key);

    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeStored = <T,>(key: string, value: T) => {
  const serialized = JSON.stringify(value);

  if (canUseLocalStorage()) {
    window.localStorage.setItem(key, serialized);
  } else {
    memoryStore.set(key, serialized);
  }

  emitStorageUpdate(key);
};

export const upsertById = <T extends { id: string }>(
  items: T[],
  nextItem: T
) => {
  const exists = items.some((item) => item.id === nextItem.id);

  if (exists) {
    return items.map((item) => (item.id === nextItem.id ? nextItem : item));
  }

  return [nextItem, ...items];
};

export const removeById = <T extends { id: string }>(
  items: T[],
  itemId: string
) => items.filter((item) => item.id !== itemId);

export const useStoredState = <T,>(key: string, fallback: T) => {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  const fallbackRef = useRef(fallback);

  useEffect(() => {
    fallbackRef.current = fallback;
  }, [fallback]);

  useEffect(() => {
    const syncValue = () => {
      setValue(readStored(key, fallbackRef.current));
    };

    const syncCustomValue = (event: Event) => {
      const customEvent = event as CustomEvent<{ key: string }>;
      if (!customEvent.detail || customEvent.detail.key === key) {
        syncValue();
      }
    };

    if (canUseWindowEvents()) {
      window.addEventListener("storage", syncValue);
      window.addEventListener(storageEventName, syncCustomValue);
    }
    const unsubscribe = subscribeStorageUpdates((changedKey) => {
      if (changedKey === key) {
        syncValue();
      }
    });

    syncValue();

    return () => {
      unsubscribe();
      if (canUseWindowEvents()) {
        window.removeEventListener("storage", syncValue);
        window.removeEventListener(storageEventName, syncCustomValue);
      }
    };
  }, [key]);

  const saveValue = useCallback(
    (nextValue: T | ((previousValue: T) => T)) => {
      setValue((previousValue) => {
        const resolvedValue =
          typeof nextValue === "function"
            ? (nextValue as (previousValue: T) => T)(previousValue)
            : nextValue;

        writeStored(key, resolvedValue);
        return resolvedValue;
      });
    },
    [key]
  );

  return [value, saveValue] as const;
};

export const useStoredCollection = <T extends { id: string }>(
  key: string,
  fallback: T[] = []
) => {
  const [items, setItems] = useStoredState<T[]>(key, fallback);

  const upsertItem = useCallback(
    (item: T) => {
      setItems((previousItems) => upsertById(previousItems, item));
    },
    [setItems]
  );

  const removeItem = useCallback(
    (itemId: string) => {
      setItems((previousItems) => removeById(previousItems, itemId));
    },
    [setItems]
  );

  const hasItem = useCallback(
    (itemId: string) => items.some((item) => item.id === itemId),
    [items]
  );

  return { items, upsertItem, removeItem, hasItem, setItems };
};

export type SavedSkillBridgeUser = SkillBridgeUser & {
  savedAt: string;
  appwriteDocumentId?: string;
  bookingStatus?: "shortlisted" | "requested" | "confirmed" | "cancelled";
  requestedAt?: string;
  bookingMessage?: string;
};
export type SavedLearningResource = LearningResource & {
  savedAt: string;
  appwriteDocumentId?: string;
};

export type SkillBridgeMatch = {
  id: string;
  threadId: string;
  targetUserId: string;
  targetName: string;
  targetAvatarUrl: string;
  targetHeadline: string;
  participantIds: string[];
  createdAt: string;
  appwriteDocumentId?: string;
};

export type ChatThread = {
  id: string;
  matchId: string;
  targetUserId: string;
  targetName: string;
  targetAvatarUrl: string;
  targetHeadline: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageAt: string;
  createdAt: string;
  appwriteDocumentId?: string;
};

export type ChatMessage = {
  id: string;
  threadId: string;
  senderId: string;
  body: string;
  createdAt: string;
  appwriteDocumentId?: string;
};
