import { useCallback, useEffect, useMemo } from "react";

import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  ProfileDraft,
  STORAGE_KEYS,
  useStoredState,
  writeStored,
} from "@/utils/storage";

export type { ProfileDraft } from "@/utils/storage";

export const DEFAULT_PROFILE: ProfileDraft = {
  name: "SkillBridge Learner",
  role: "Both",
  canTeach: "React Native, UI basics",
  wantsToLearn: "English speaking, product design",
  availability: "Flexible schedule",
  goal: "Exchange skills, book focused help, and stay accountable.",
  mode: "Online",
  level: "Intermediate",
  location: "Remote",
  credentials: "",
  hourlyRate: "",
};

export const saveProfileDraft = async (profile: ProfileDraft) => {
  writeStored(STORAGE_KEYS.profile, profile);
  return appwriteAdapter.saveProfile(profile);
};

export const useProfileService = () => {
  const [storedProfile, setProfile] = useStoredState<ProfileDraft>(
    STORAGE_KEYS.profile,
    DEFAULT_PROFILE
  );
  const profile = useMemo(
    () => ({
      ...DEFAULT_PROFILE,
      ...storedProfile,
    }),
    [storedProfile]
  );

  const updateProfile = useCallback(
    (key: keyof ProfileDraft, value: string) => {
      setProfile((previousProfile) => {
        const nextProfile = {
          ...DEFAULT_PROFILE,
          ...previousProfile,
          [key]: value,
        };
        appwriteAdapter.saveProfile(nextProfile);
        return nextProfile;
      });
    },
    [setProfile]
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.getProfile().then((profileDocument) => {
      if (isMounted && profileDocument) {
        setProfile({
          ...DEFAULT_PROFILE,
          ...profileDocument,
        });
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setProfile]);

  const requiredFields: (keyof ProfileDraft)[] = [
    "name",
    "role",
    "canTeach",
    "wantsToLearn",
    "availability",
    "goal",
    "mode",
    "level",
  ];
  const completedFields = requiredFields.filter((field) =>
    String(profile[field] || "").trim()
  ).length;
  const profileStrength = Math.round(
    (completedFields / requiredFields.length) * 100
  );

  return {
    profile,
    profileStrength,
    updateProfile,
    setProfile,
  };
};
