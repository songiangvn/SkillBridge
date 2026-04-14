import { useCallback, useEffect } from "react";

import { LearningResource } from "@/DB/userDB";
import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  SavedLearningResource,
  STORAGE_KEYS,
  useStoredCollection,
} from "@/utils/storage";

export type { SavedLearningResource } from "@/utils/storage";

export const useResourceService = () => {
  const {
    items: savedResources,
    upsertItem: upsertResource,
    removeItem: removeResource,
    hasItem: hasResource,
    setItems: setSavedResources,
  } = useStoredCollection<SavedLearningResource>(
    STORAGE_KEYS.savedResources
  );

  const saveResource = useCallback(
    (resource: LearningResource) => {
      const savedResource = {
        ...resource,
        savedAt: new Date().toISOString(),
      };

      upsertResource(savedResource);
      appwriteAdapter.saveResource(resource).then((document) => {
        if (document?.$id) {
          upsertResource({
            ...savedResource,
            appwriteDocumentId: document.$id,
          });
        }
      });
    },
    [upsertResource]
  );

  const removeSavedResource = useCallback(
    (resourceId: string) => {
      const resource = savedResources.find((item) => item.id === resourceId);
      removeResource(resourceId);

      if (resource?.appwriteDocumentId) {
        appwriteAdapter.deleteSavedResource(resource.appwriteDocumentId);
      }
    },
    [removeResource, savedResources]
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listSavedResources().then((resources) => {
      if (isMounted && resources) {
        setSavedResources(resources);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setSavedResources]);

  return {
    savedResources,
    saveResource,
    removeResource: removeSavedResource,
    hasResource,
  };
};
