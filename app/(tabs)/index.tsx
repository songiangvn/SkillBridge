import Header from "@/components/Header";
import {
  ChatThread,
  SkillBridgeMatch,
  useMatchService,
} from "@/services/matchService";
import { useI18n } from "@/utils/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import {
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const MATCH_EXPIRY_MS = 24 * 60 * 60 * 1000;

type MatchQueueItem = {
  match: SkillBridgeMatch;
  thread?: ChatThread;
  remainingHours: number;
  elapsedRatio: number;
  color: string;
};

const getQueueColor = (elapsedRatio: number) => {
  if (elapsedRatio <= 0.33) {
    return "#F4B400";
  }

  if (elapsedRatio <= 0.75) {
    return "#2EBD85";
  }

  return "#E53935";
};

const formatClock = (isoTime: string) =>
  new Date(isoTime).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

const Chat = () => {
  const { t } = useI18n();
  const router = useRouter();
  const button = () => <Ionicons name="search" size={24} color="#111" />;
  const { threads, matches } = useMatchService();
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const threadById = useMemo(
    () => new Map(threads.map((thread) => [thread.id, thread])),
    [threads]
  );

  const conversations = useMemo(
    () =>
      threads
        .filter((thread) => thread.lastMessage.trim().length > 0)
        .sort(
          (first, second) =>
            new Date(second.lastMessageAt).getTime() -
            new Date(first.lastMessageAt).getTime()
        ),
    [threads]
  );

  const matchQueue = useMemo(() => {
    const now = nowTick;
    const queueItems: MatchQueueItem[] = [];

    matches.forEach((match) => {
      const thread = threadById.get(match.threadId);
      const hasConversation = Boolean(thread?.lastMessage.trim());

      if (hasConversation) {
        return;
      }

      const createdAt = new Date(match.createdAt).getTime();
      const elapsedMs = Math.max(0, now - createdAt);
      const remainingMs = MATCH_EXPIRY_MS - elapsedMs;

      if (remainingMs <= 0) {
        return;
      }

      const elapsedRatio = Math.min(1, elapsedMs / MATCH_EXPIRY_MS);

      queueItems.push({
        match,
        thread,
        remainingHours: Math.max(1, Math.ceil(remainingMs / (60 * 60 * 1000))),
        elapsedRatio,
        color: getQueueColor(elapsedRatio),
      });
    });

    return queueItems.sort(
      (first, second) => first.remainingHours - second.remainingHours
    );
  }, [matches, nowTick, threadById]);

  const openThread = (thread: ChatThread) => {
    router.push({
      pathname: "/chatScreen",
      params: {
        threadId: thread.id,
        targetUserId: thread.targetUserId,
        targetName: thread.targetName,
        targetAvatarUrl: thread.targetAvatarUrl,
        targetHeadline: thread.targetHeadline,
        matchId: thread.matchId,
        participantIds: thread.participantIds.join(","),
      },
    });
  };

  const openQueueMatch = (item: MatchQueueItem) => {
    const participantIds =
      item.thread?.participantIds || item.match.participantIds || [];

    router.push({
      pathname: "/chatScreen",
      params: {
        threadId: item.match.threadId,
        targetUserId: item.match.targetUserId,
        targetName: item.match.targetName,
        targetAvatarUrl: item.match.targetAvatarUrl,
        targetHeadline: item.match.targetHeadline,
        matchId: item.thread?.matchId || item.match.id,
        participantIds: participantIds.join(","),
      },
    });
  };

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.content}>
        <Header headerTitle={t("chat_header")} button={button} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("match_queue")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("match_queue_hint")}
          </Text>

          {matchQueue.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t("no_queued")}</Text>
              <Text style={styles.emptyText}>
                {t("no_queued_hint")}
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.queueRow}
            >
              {matchQueue.map((item) => (
                <Pressable
                  key={item.match.id}
                  onPress={() => openQueueMatch(item)}
                  style={styles.queueCard}
                >
                  <View style={[styles.queueRing, { borderColor: item.color }]}>
                    <ImageBackground
                      source={{ uri: item.match.targetAvatarUrl }}
                      style={styles.queueAvatar}
                    />
                  </View>
                  <View style={[styles.timePill, { backgroundColor: item.color }]}>
                    <Text style={styles.timePillText}>{item.remainingHours}h</Text>
                  </View>
                  <Text style={styles.queueName} numberOfLines={1}>
                    {item.match.targetName}
                  </Text>
                  <Text style={styles.queueMeta}>{t("tap_to_start")}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t("conversations")}</Text>
          <Text style={styles.sectionSubtitle}>
            {t("conversations_hint")}
          </Text>

          {conversations.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{t("no_conversations")}</Text>
              <Text style={styles.emptyText}>
                {t("no_conversations_hint")}
              </Text>
            </View>
          ) : (
            <View style={styles.conversationList}>
              {conversations.map((thread) => (
                <Pressable
                  key={thread.id}
                  onPress={() => openThread(thread)}
                  style={styles.threadRow}
                >
                  <ImageBackground
                    source={{ uri: thread.targetAvatarUrl }}
                    style={styles.threadAvatar}
                  />
                  <View style={styles.threadBody}>
                    <View style={styles.threadHeader}>
                      <Text style={styles.threadName} numberOfLines={1}>
                        {thread.targetName}
                      </Text>
                      <Text style={styles.threadTime}>
                        {formatClock(thread.lastMessageAt)}
                      </Text>
                    </View>
                    <Text style={styles.threadPreview} numberOfLines={1}>
                      {thread.lastMessage}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
};

export default Chat;

const styles = StyleSheet.create({
  screen: {
    backgroundColor: "#fff",
  },
  content: {
    paddingHorizontal: 12,
    paddingBottom: 32,
    gap: 18,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    color: "#111",
    fontSize: 20,
    fontWeight: "900",
  },
  sectionSubtitle: {
    color: "#555",
    lineHeight: 20,
  },
  emptyCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  emptyTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
  },
  emptyText: {
    color: "#555",
    lineHeight: 20,
  },
  queueRow: {
    gap: 12,
    paddingVertical: 4,
    paddingRight: 6,
  },
  queueCard: {
    width: 88,
    alignItems: "center",
    gap: 4,
  },
  queueRing: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  queueAvatar: {
    width: 62,
    height: 62,
    borderRadius: 31,
    overflow: "hidden",
  },
  timePill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timePillText: {
    color: "#111",
    fontSize: 11,
    fontWeight: "900",
  },
  queueName: {
    color: "#111",
    fontSize: 13,
    fontWeight: "800",
    maxWidth: 84,
  },
  queueMeta: {
    color: "#555",
    fontSize: 11,
  },
  conversationList: {
    gap: 10,
  },
  threadRow: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  threadAvatar: {
    width: 58,
    height: 58,
    borderRadius: 8,
    overflow: "hidden",
  },
  threadBody: {
    flex: 1,
    gap: 4,
  },
  threadHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 8,
  },
  threadName: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
    flex: 1,
  },
  threadTime: {
    color: "#777",
    fontSize: 12,
    fontWeight: "700",
  },
  threadPreview: {
    color: "#555",
    lineHeight: 20,
  },
});
