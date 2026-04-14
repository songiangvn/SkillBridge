import { appwriteAdapter } from "@/services/appwriteAdapter";
import { useMatchService, useThreadMessages } from "@/services/matchService";
import { useI18n } from "@/utils/i18n";
import { ChatThread, upsertById } from "@/utils/storage";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ChatScreen = () => {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    threadId?: string | string[];
    targetUserId?: string | string[];
    targetName?: string | string[];
    targetAvatarUrl?: string | string[];
    targetHeadline?: string | string[];
    matchId?: string | string[];
    participantIds?: string | string[];
  }>();
  const threadId = Array.isArray(params.threadId)
    ? params.threadId[0]
    : params.threadId;
  const targetUserId = Array.isArray(params.targetUserId)
    ? params.targetUserId[0]
    : params.targetUserId;
  const targetName = Array.isArray(params.targetName)
    ? params.targetName[0]
    : params.targetName;
  const targetAvatarUrl = Array.isArray(params.targetAvatarUrl)
    ? params.targetAvatarUrl[0]
    : params.targetAvatarUrl;
  const targetHeadline = Array.isArray(params.targetHeadline)
    ? params.targetHeadline[0]
    : params.targetHeadline;
  const matchId = Array.isArray(params.matchId)
    ? params.matchId[0]
    : params.matchId;
  const participantIdsParam = Array.isArray(params.participantIds)
    ? params.participantIds[0]
    : params.participantIds;
  const { getThread, setThreads } = useMatchService();
  const thread = useMemo(
    () => (threadId ? getThread(threadId) : undefined),
    [getThread, threadId]
  );
  const [resolvedThread, setResolvedThread] = useState<ChatThread | undefined>();
  const [isThreadLoading, setIsThreadLoading] = useState(Boolean(threadId));
  const [draft, setDraft] = useState("");
  const [typingFrame, setTypingFrame] = useState(0);

  useEffect(() => {
    let isMounted = true;

    if (!threadId) {
      setIsThreadLoading(false);
      return () => {
        isMounted = false;
      };
    }

    if (thread) {
      setResolvedThread(thread);
      setIsThreadLoading(false);
      return () => {
        isMounted = false;
      };
    }

    setIsThreadLoading(true);
    appwriteAdapter.getThreadById(threadId).then((remoteThread) => {
      if (!isMounted) {
        return;
      }

      if (remoteThread) {
        setResolvedThread(remoteThread);
        setThreads((previousThreads) => upsertById(previousThreads, remoteThread));
      }

      setIsThreadLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [setThreads, thread, threadId]);

  const fallbackThread = useMemo<ChatThread | undefined>(() => {
    if (!threadId) {
      return undefined;
    }

    const participantIds = participantIdsParam
      ? participantIdsParam
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : [];

    return {
      id: threadId,
      matchId: matchId || `match-${threadId}`,
      targetUserId: targetUserId || "demo-match",
      targetName: targetName || "SkillBridge match",
      targetAvatarUrl:
        targetAvatarUrl ||
        "https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop",
      targetHeadline: targetHeadline || "Ready to learn together",
      participantIds: participantIds.length > 0 ? participantIds : ["demo-user"],
      lastMessage: "",
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
  }, [
    matchId,
    participantIdsParam,
    targetAvatarUrl,
    targetHeadline,
    targetName,
    targetUserId,
    threadId,
  ]);

  const activeThread = resolvedThread || thread || fallbackThread;
  const { currentUserId, messages, sendMessage, isPeerTyping } =
    useThreadMessages(activeThread);

  useEffect(() => {
    if (!isPeerTyping) {
      setTypingFrame(0);
      return;
    }

    const interval = setInterval(() => {
      setTypingFrame((previous) => (previous + 1) % 4);
    }, 260);

    return () => clearInterval(interval);
  }, [isPeerTyping]);

  const navigateToChatTab = () => {
    router.replace("/");
  };

  const submitMessage = () => {
    const wasSent = sendMessage(draft);

    if (wasSent) {
      setDraft("");
    }
  };

  if (isThreadLoading) {
    return (
      <View style={styles.emptyContainer}>
        <Pressable onPress={navigateToChatTab} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111" />
          <Text style={styles.backText}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("opening_chat")}</Text>
        <Text style={styles.body}>
          {t("opening_chat_hint")}
        </Text>
      </View>
    );
  }

  if (!activeThread) {
    return (
      <View style={styles.emptyContainer}>
        <Pressable onPress={navigateToChatTab} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#111" />
          <Text style={styles.backText}>{t("back")}</Text>
        </Pressable>
        <Text style={styles.title}>{t("no_thread")}</Text>
        <Text style={styles.body}>
          {t("no_thread_hint")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 8 : 0}
    >
      <View style={styles.header}>
        <Pressable onPress={navigateToChatTab} style={styles.iconButton}>
          <Ionicons name="chevron-back" size={24} color="#111" />
        </Pressable>
        <ImageBackground source={{ uri: activeThread.targetAvatarUrl }} style={styles.avatar} />
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{activeThread.targetName}</Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {activeThread.targetHeadline || t("learning_match")}
          </Text>
        </View>
      </View>

      <ScrollView
        style={styles.messages}
        contentContainerStyle={styles.messageList}
      >
        {messages.length === 0 && (
          <View style={styles.starterCard}>
            <Text style={styles.starterTitle}>{t("what_a_bridge")}</Text>
            <Text style={styles.starterText}>
              {t("starter_hint")}
            </Text>
          </View>
        )}

        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;

          return (
            <View
              key={message.id}
              style={[
                styles.messageBubble,
                isMine ? styles.myBubble : styles.theirBubble,
              ]}
            >
              <Text style={[styles.messageText, isMine && styles.myText]}>
                {message.body}
              </Text>
              <Text style={[styles.messageTime, isMine && styles.myTime]}>
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          );
        })}
        {isPeerTyping && (
          <View style={[styles.messageBubble, styles.theirBubble, styles.typingBubble]}>
            <Text style={styles.messageText}>
              {activeThread.targetName} {t("is_typing")}{".".repeat(typingFrame)}
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={[styles.composer, { paddingBottom: 10 + insets.bottom }]}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder={t("send_placeholder")}
          placeholderTextColor="#777"
          multiline
        />
        <Pressable onPress={submitMessage} style={styles.sendButton}>
          <Ionicons name="send" size={20} color="#111" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ChatScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    gap: 12,
  },
  backButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  backText: {
    color: "#111",
    fontWeight: "900",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#f7f7f7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 8,
    overflow: "hidden",
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    color: "#111",
    fontSize: 22,
    fontWeight: "900",
  },
  subtitle: {
    color: "#666",
    marginTop: 2,
  },
  body: {
    color: "#555",
    fontSize: 16,
    lineHeight: 24,
  },
  messages: {
    flex: 1,
    backgroundColor: "#fff",
  },
  messageList: {
    gap: 10,
    padding: 14,
  },
  starterCard: {
    backgroundColor: "#FFF5B8",
    borderRadius: 8,
    padding: 14,
    gap: 6,
    marginBottom: 8,
  },
  starterTitle: {
    color: "#111",
    fontSize: 20,
    fontWeight: "900",
  },
  starterText: {
    color: "#333",
    lineHeight: 20,
  },
  messageBubble: {
    maxWidth: "84%",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 5,
  },
  myBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#111",
  },
  theirBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f1f1",
  },
  typingBubble: {
    opacity: 0.92,
  },
  messageText: {
    color: "#111",
    fontSize: 16,
    lineHeight: 22,
  },
  myText: {
    color: "#fff",
  },
  messageTime: {
    color: "#777",
    fontSize: 11,
    alignSelf: "flex-end",
  },
  myTime: {
    color: "#d7d7d7",
  },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    backgroundColor: "#fff",
  },
  input: {
    flex: 1,
    minHeight: 46,
    maxHeight: 110,
    borderRadius: 8,
    backgroundColor: "#f7f7f7",
    color: "#111",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 8,
    backgroundColor: "#FFD600",
    alignItems: "center",
    justifyContent: "center",
  },
});
