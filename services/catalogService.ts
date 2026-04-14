import { useEffect, useMemo, useState } from "react";

import {
  LEARNING_RESOURCES,
  LearningResource,
  RECOMMENDATION_USER,
  SkillBridgeUser,
  SuggestedUsers,
  TUTOR_MARKETPLACE,
  matchwithgoalData,
} from "@/DB/userDB";
import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  SkillBridgeMatch,
  SavedSkillBridgeUser,
  STORAGE_KEYS,
  useStoredCollection,
} from "@/utils/storage";

const buildTutorList = (users: SkillBridgeUser[]) =>
  users.filter((user) => user.role === "Tutor" || user.role === "Both");

const mergePartnerSources = (
  remoteProfiles: SkillBridgeUser[],
  fallbackProfiles: SkillBridgeUser[]
) => {
  const mergedById = new Map<string, SkillBridgeUser>();

  fallbackProfiles.forEach((profile) => {
    mergedById.set(profile.id, profile);
  });
  remoteProfiles.forEach((profile) => {
    mergedById.set(profile.id, {
      ...(mergedById.get(profile.id) || {}),
      ...profile,
    });
  });

  return Array.from(mergedById.values());
};

export const useCatalogService = () => {
  const [allPartners, setAllPartners] = useState<SkillBridgeUser[]>(SuggestedUsers);
  const [resources, setResources] =
    useState<LearningResource[]>(LEARNING_RESOURCES);
  const { items: matches } = useStoredCollection<SkillBridgeMatch>(
    STORAGE_KEYS.matches
  );
  const { items: bridgeRequests } = useStoredCollection<SavedSkillBridgeUser>(
    STORAGE_KEYS.bridgedUsers
  );
  const { items: skippedProfiles } = useStoredCollection<SavedSkillBridgeUser>(
    STORAGE_KEYS.skippedUsers
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listProfiles().then((profiles) => {
      if (isMounted && profiles && profiles.length > 0) {
        setAllPartners(mergePartnerSources(profiles, SuggestedUsers));
      }
    });

    appwriteAdapter.listResourceCatalog().then((catalogResources) => {
      if (isMounted && catalogResources && catalogResources.length > 0) {
        const fallbackById = new Map(
          LEARNING_RESOURCES.map((r) => [r.id, r])
        );
        const merged = catalogResources.map((r) => ({
          ...r,
          url: r.url || fallbackById.get(r.id)?.url || "",
        }));
        setResources(merged);
      }
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const partners = useMemo(() => {
    const matchedUserIds = new Set(matches.map((match) => match.targetUserId));
    const pendingRequestUserIds = new Set(bridgeRequests.map((request) => request.id));
    const skippedById = new Map(
      skippedProfiles.map((profile) => [
        profile.id,
        new Date(profile.savedAt || "").getTime() || 0,
      ])
    );

    const candidates = allPartners.filter(
      (partner) =>
        !matchedUserIds.has(partner.id) &&
        !pendingRequestUserIds.has(partner.id)
    );

    return candidates.sort((first, second) => {
      const firstSkippedAt = skippedById.get(first.id);
      const secondSkippedAt = skippedById.get(second.id);

      if (firstSkippedAt && !secondSkippedAt) {
        return 1;
      }

      if (!firstSkippedAt && secondSkippedAt) {
        return -1;
      }

      if (firstSkippedAt && secondSkippedAt) {
        return firstSkippedAt - secondSkippedAt;
      }

      return first.name.localeCompare(second.name);
    });
  }, [allPartners, bridgeRequests, matches, skippedProfiles]);

  const recommendations = useMemo(
    () => (partners.length > 0 ? partners.slice(0, 6) : RECOMMENDATION_USER),
    [partners]
  );
  const sameGoal = useMemo(
    () => (partners.length > 2 ? partners.slice(0, 3) : matchwithgoalData),
    [partners]
  );
  const tutors = useMemo(() => {
    const tutorProfiles = buildTutorList(partners);
    return tutorProfiles.length > 0 ? tutorProfiles : TUTOR_MARKETPLACE;
  }, [partners]);

  return {
    partners,
    recommendations,
    sameGoal,
    tutors,
    resources,
  };
};
