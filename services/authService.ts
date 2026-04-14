import appwrite, { isAppwriteConfigured } from "@/constants/appwrite";
import { ID } from "appwrite";

import {
  DEFAULT_PROFILE,
  saveProfileDraft,
} from "@/services/profileService";
import { STORAGE_KEYS, writeStored } from "@/utils/storage";

type SignupInput = {
  name: string;
  email: string;
  password: string;
};

type SigninInput = {
  email: string;
  password: string;
};

const getErrorCode = (error: unknown) =>
  typeof error === "object" && error !== null && "code" in error
    ? Number((error as { code?: number }).code)
    : 0;

const getErrorType = (error: unknown) =>
  typeof error === "object" && error !== null && "type" in error
    ? String((error as { type?: string }).type)
    : "";

const getActiveAccount = async () => {
  if (!isAppwriteConfigured || !appwrite.account) {
    return null;
  }

  try {
    return await appwrite.account.get();
  } catch {
    return null;
  }
};

const clearActiveSession = async () => {
  if (!isAppwriteConfigured || !appwrite.account) {
    return;
  }

  try {
    await appwrite.account.deleteSession({ sessionId: "current" });
  } catch {
    // No active app session to clear.
  }
};

const clearSessionCache = () => {
  writeStored(STORAGE_KEYS.bridgedUsers, []);
  writeStored(STORAGE_KEYS.skippedUsers, []);
  writeStored(STORAGE_KEYS.savedResources, []);
  writeStored(STORAGE_KEYS.bookedTutors, []);
  writeStored(STORAGE_KEYS.matches, []);
  writeStored(STORAGE_KEYS.chatThreads, []);
  writeStored(STORAGE_KEYS.chatMessages, []);
  writeStored(STORAGE_KEYS.profile, DEFAULT_PROFILE);
};

export const signIn = async ({ email, password }: SigninInput) => {
  const normalizedEmail = email.trim().toLowerCase();

  if (!normalizedEmail || !password) {
    throw new Error("Enter both email and password.");
  }

  if (isAppwriteConfigured) {
    const activeAccount = await getActiveAccount();

    if (activeAccount?.email?.toLowerCase() === normalizedEmail) {
      return {
        mode: "appwrite" as const,
        message: "You are already signed in.",
      };
    }

    if (activeAccount) {
      await clearActiveSession();
      clearSessionCache();
    }

    await appwrite.account?.createEmailPasswordSession({
      email: normalizedEmail,
      password,
    });
    return {
      mode: "appwrite" as const,
      message: "Signed in successfully!",
    };
  }

  return {
    mode: "demo" as const,
    message: "Demo mode enabled. Appwrite is not configured yet.",
  };
};

export const signUp = async ({ name, email, password }: SignupInput) => {
  const trimmedName = name.trim();
  const normalizedEmail = email.trim().toLowerCase();

  if (!trimmedName) {
    throw new Error("Enter your name.");
  }

  if (!normalizedEmail) {
    throw new Error("Enter your email.");
  }

  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters.");
  }

  if (isAppwriteConfigured) {
    const activeAccount = await getActiveAccount();

    if (activeAccount?.email?.toLowerCase() === normalizedEmail) {
      return {
        mode: "appwrite" as const,
        message: "You are already signed in.",
      };
    }

    if (activeAccount) {
      await clearActiveSession();
      clearSessionCache();
    }

    try {
      await appwrite.account?.create({
        userId: ID.unique(),
        email: normalizedEmail,
        password,
        name: trimmedName,
      });
    } catch (error) {
      if (
        getErrorCode(error) === 409 ||
        getErrorType(error).includes("user_already_exists")
      ) {
        throw new Error("This email already has an account. Use Login instead.");
      }

      throw error;
    }

    await appwrite.account?.createEmailPasswordSession({
      email: normalizedEmail,
      password,
    });
  }

  await saveProfileDraft({
    ...DEFAULT_PROFILE,
    name: trimmedName || DEFAULT_PROFILE.name,
    goal: "I want to build a learning routine with the right partner.",
  });

  return {
    mode: isAppwriteConfigured ? ("appwrite" as const) : ("demo" as const),
    message: isAppwriteConfigured
      ? "Account created and signed in!"
      : "Demo profile created locally. Appwrite is not configured yet.",
  };
};

export const signOut = async () => {
  await clearActiveSession();
  clearSessionCache();

  return {
    message: "Signed out.",
  };
};
