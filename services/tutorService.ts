import { useCallback, useEffect } from "react";

import { SkillBridgeUser } from "@/DB/userDB";
import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  SavedSkillBridgeUser,
  STORAGE_KEYS,
  useStoredCollection,
} from "@/utils/storage";

export const useTutorService = () => {
  const {
    items: tutorShortlist,
    upsertItem: upsertTutor,
    removeItem: removeTutor,
    hasItem: hasTutor,
    setItems: setTutorShortlist,
  } = useStoredCollection<SavedSkillBridgeUser>(
    STORAGE_KEYS.bookedTutors
  );

  const shortlistTutor = useCallback(
    (user: SkillBridgeUser) => {
      const savedTutor = {
        ...user,
        savedAt: new Date().toISOString(),
      };

      upsertTutor(savedTutor);
      appwriteAdapter.shortlistTutor(user).then((document) => {
        if (document?.$id) {
          upsertTutor({
            ...savedTutor,
            appwriteDocumentId: document.$id,
          });
        }
      });
    },
    [upsertTutor]
  );

  const requestTutorSession = useCallback(
    (user: SkillBridgeUser, message?: string) => {
      const requestedTutor: SavedSkillBridgeUser = {
        ...user,
        savedAt: new Date().toISOString(),
        bookingStatus: "requested",
        requestedAt: new Date().toISOString(),
        bookingMessage:
          message ||
          `I would like to book a focused session with ${user.name}.`,
      };

      upsertTutor(requestedTutor);
      appwriteAdapter.requestTutorSession(user, message).then((document) => {
        if (document?.$id) {
          upsertTutor({
            ...requestedTutor,
            appwriteDocumentId: document.$id,
          });
        }
      });
    },
    [upsertTutor]
  );

  const removeTutorShortlistItem = useCallback(
    (targetUserId: string) => {
      const tutor = tutorShortlist.find((item) => item.id === targetUserId);
      removeTutor(targetUserId);

      if (tutor?.appwriteDocumentId) {
        appwriteAdapter.deleteTutorShortlistItem(tutor.appwriteDocumentId);
      }
    },
    [removeTutor, tutorShortlist]
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listTutorShortlist().then((items) => {
      if (isMounted && items) {
        setTutorShortlist(items);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setTutorShortlist]);

  return {
    tutorShortlist,
    shortlistTutor,
    requestTutorSession,
    removeTutor: removeTutorShortlistItem,
    hasTutor,
  };
};
