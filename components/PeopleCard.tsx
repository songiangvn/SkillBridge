import { SkillBridgeUser } from "@/DB/userDB";
import { useBridgeService } from "@/services/bridgeService";
import { useCatalogService } from "@/services/catalogService";
import { ProfileDraft, STORAGE_KEYS, readStored } from "@/utils/storage";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { AntDesign, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { ImageBackground } from "react-native";
import Swiper from "react-native-deck-swiper";

const parseProfileSkills = (rawValue: string) =>
  rawValue
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const overlapRatio = (source: string[], target: string[]) => {
  if (target.length === 0) {
    return 0;
  }

  const sourceSet = new Set(source.map((item) => item.toLowerCase()));
  const matches = target.filter((item) => sourceSet.has(item.toLowerCase())).length;

  return matches / target.length;
};

const clampScore = (score: number) => Math.min(5, Math.max(3.1, score));

const PeopleCard = () => {
  const { width, height } = useWindowDimensions();
  const tabBarHeight = useBottomTabBarHeight();
  const deckWidth = Math.min(width - 32, 390);
  const deckHeight = Math.min(
    Math.max(height - tabBarHeight - 270, 420),
    560
  );
  const actionBottomSpacing = Math.max(16, tabBarHeight + 8);
  const swiperRef = useRef<Swiper<SkillBridgeUser>>(null);
  const matchToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );
  const [currentIndex, setCurrentIndex] = useState(0);
  const [deckCycle, setDeckCycle] = useState(0);
  const [selectedUser, setSelectedUser] = useState<SkillBridgeUser | null>(null);
  const [matchNotice, setMatchNotice] = useState<string | null>(null);
  const { requestBridge, skipProfile } = useBridgeService();
  const { partners } = useCatalogService();
  const [lastAction, setLastAction] = useState(
    "Swipe right for a match or left to pass."
  );
  const profileDraft = readStored<ProfileDraft | null>(STORAGE_KEYS.profile, null);
  const myCanTeach = useMemo(
    () =>
      profileDraft?.canTeach
        ? parseProfileSkills(profileDraft.canTeach)
        : ["react native", "english speaking", "frontend"],
    [profileDraft?.canTeach]
  );
  const myWantsToLearn = useMemo(
    () =>
      profileDraft?.wantsToLearn
        ? parseProfileSkills(profileDraft.wantsToLearn)
        : ["product design", "ai", "public speaking"],
    [profileDraft?.wantsToLearn]
  );
  const rotatedPartners = useMemo(() => {
    if (partners.length === 0) {
      return partners;
    }

    const startIndex = deckCycle % partners.length;
    return [...partners.slice(startIndex), ...partners.slice(0, startIndex)];
  }, [deckCycle, partners]);
  const activeUser = useMemo(
    () =>
      rotatedPartners[Math.min(currentIndex, Math.max(rotatedPartners.length - 1, 0))],
    [currentIndex, rotatedPartners]
  );

  const saveUserAction = (
    cardIndex: number,
    action: "bridged" | "skipped"
  ) => {
    const user = rotatedPartners[cardIndex];

    if (!user) {
      return;
    }

    setCurrentIndex(
      Math.min(cardIndex + 1, Math.max(rotatedPartners.length - 1, 0))
    );

    if (action === "bridged") {
      requestBridge(user).then((result) => {
        if (result.matched) {
          setLastAction(`Matched with ${user.name}. Open Chat to message.`);
          setMatchNotice(`It's a match with ${user.name}`);
          if (matchToastTimeoutRef.current) {
            clearTimeout(matchToastTimeoutRef.current);
          }
          matchToastTimeoutRef.current = setTimeout(() => {
            setMatchNotice(null);
          }, 2600);
          return;
        }

        setLastAction(`Waiting for a mutual match with ${user.name}.`);
      }).catch(() => {
        setLastAction(`Waiting for a mutual match with ${user.name}.`);
      });
      return;
    }

    skipProfile(user);
    setLastAction(`${user.name} skipped.`);
  };

  useEffect(
    () => () => {
      if (matchToastTimeoutRef.current) {
        clearTimeout(matchToastTimeoutRef.current);
      }
    },
    []
  );

  useEffect(() => {
    if (rotatedPartners.length === 0) {
      setCurrentIndex(0);
      return;
    }

    setCurrentIndex((previous) =>
      Math.min(previous, Math.max(rotatedPartners.length - 1, 0))
    );
  }, [rotatedPartners.length]);

  const computeMatchScore = (user: SkillBridgeUser) => {
    const teachScore = overlapRatio(user.canTeach, myWantsToLearn);
    const learnScore = overlapRatio(user.wantsToLearn, myCanTeach);
    const roleBonus = user.role === "Both" ? 0.2 : 0.1;
    const modeBonus = user.mode === "Online" ? 0.2 : 0.1;
    const compatibility = clampScore(3.2 + teachScore * 0.95 + learnScore * 0.95 + roleBonus + modeBonus);

    if (typeof user.rating === "number") {
      return clampScore((compatibility + user.rating) / 2);
    }

    return compatibility;
  };

  const openActiveUserDetails = () => {
    if (activeUser) {
      setSelectedUser(activeUser);
    }
  };

  const renderCard = (card: SkillBridgeUser | undefined) => {
    if (!card) {
      return (
        <View style={[styles.card, styles.emptyCard, { width: deckWidth, height: deckHeight }]}>
          <Text style={styles.emptyTitle}>No more matches</Text>
          <Text style={styles.emptyText}>Check Discover or update your learning profile.</Text>
        </View>
      );
    }

    return (
      <View style={[styles.card, { width: deckWidth, height: deckHeight }]}>
        <ImageBackground
          source={{ uri: card.avatarUrl }}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <View style={styles.rolePill}>
            <Text style={styles.roleText}>{card.role}</Text>
          </View>

          <Pressable style={styles.infoButton} onPress={() => setSelectedUser(card)}>
            <Ionicons name="information-circle-outline" size={24} color="#fff" />
          </Pressable>

          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.48)", "rgba(0,0,0,0.86)"]}
            locations={[0.34, 0.62, 1]}
            style={styles.gradient}
          />

          <View style={styles.infoSection}>
            <View style={styles.titleRow}>
              <Text style={styles.name}>{card.name}</Text>
              <View style={styles.scorePill}>
                <Ionicons name="star" size={14} color="#FFD600" />
                <Text style={styles.scoreText}>{computeMatchScore(card).toFixed(1)}</Text>
              </View>
            </View>
            <Text style={styles.headline} numberOfLines={2}>
              {card.headline}
            </Text>

            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={15} color="#fff" />
                <Text style={styles.metaText}>{card.availability}</Text>
              </View>
              <View style={styles.metaItem}>
                <MaterialCommunityIcons
                  name="map-marker-radius-outline"
                  size={15}
                  color="#fff"
                />
                <Text style={styles.metaText}>{card.mode}</Text>
              </View>
            </View>

            <View style={styles.skillRow}>
              <View style={styles.skillBlock}>
                <Text style={styles.label}>Can teach</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {card.canTeach.join(" / ")}
                </Text>
              </View>
              <View style={styles.skillBlock}>
                <Text style={styles.label}>Wants</Text>
                <Text style={styles.value} numberOfLines={1}>
                  {card.wantsToLearn.join(" / ")}
                </Text>
              </View>
            </View>
          </View>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.statusCard, { width: deckWidth }]}>
        <Text style={styles.statusTitle}>
          {Math.max(rotatedPartners.length - currentIndex, 0)} profiles left
        </Text>
        <Text style={styles.statusText}>{lastAction}</Text>
      </View>

      {matchNotice && (
        <View style={[styles.matchToast, { width: deckWidth }]}>
          <AntDesign name="check-circle" size={20} color="#34a853" />
          <Text style={styles.matchToastText}>{matchNotice}</Text>
        </View>
      )}

      <View style={[styles.deckFrame, { width: deckWidth, height: deckHeight }]}>
        <Swiper
          key={`deck-${deckCycle}-${rotatedPartners.length}`}
          ref={swiperRef}
          cards={rotatedPartners}
          keyExtractor={(card) => card.id}
          renderCard={renderCard}
          infinite={false}
          backgroundColor="transparent"
          cardHorizontalMargin={0}
          cardVerticalMargin={0}
          cardStyle={{ width: deckWidth, height: deckHeight, top: 0, left: 0 }}
          containerStyle={styles.swiperContainer}
          stackSize={3}
          stackSeparation={14}
          stackScale={5}
          animateOverlayLabelsOpacity
          animateCardOpacity
          onSwipedLeft={(cardIndex) => saveUserAction(cardIndex, "skipped")}
          onSwipedRight={(cardIndex) => saveUserAction(cardIndex, "bridged")}
          onSwipedAll={() => {
            setDeckCycle((previous) => previous + 1);
            setCurrentIndex(0);
            setLastAction("Suggestions refreshed. Previously skipped profiles can reappear.");
          }}
          overlayLabels={{
            left: {
              title: (
                <View style={[styles.overlayBadge, styles.passBadge]}>
                  <AntDesign name="close" size={42} color="#f44336" />
                  <Text style={[styles.overlayText, styles.passText]}>SKIP</Text>
                </View>
              ),
              style: {
                wrapper: {
                  justifyContent: "center",
                  alignItems: "center",
                },
              },
            },
            right: {
              title: (
                <View style={[styles.overlayBadge, styles.bridgeBadge]}>
                  <AntDesign name="check" size={44} color="#34a853" />
                  <Text style={[styles.overlayText, styles.bridgeOverlayText]}>
                    BRIDGE
                  </Text>
                </View>
              ),
              style: {
                wrapper: {
                  justifyContent: "center",
                  alignItems: "center",
                },
              },
            },
          }}
          disableTopSwipe
          disableBottomSwipe
        />
      </View>

      <View style={[styles.floatingActions, { paddingBottom: actionBottomSpacing }]}>
        <Pressable
          style={[styles.circleButton, styles.passButton]}
          onPress={() => swiperRef.current?.swipeLeft()}
        >
          <AntDesign name="close" size={30} color="#f44336" />
        </Pressable>
        <Pressable style={[styles.circleButton, styles.detailsButton]} onPress={openActiveUserDetails}>
          <Ionicons name="information-circle-outline" size={28} color="#2196f3" />
        </Pressable>
        <Pressable
          style={[styles.circleButton, styles.likeButton]}
          onPress={() => swiperRef.current?.swipeRight()}
        >
          <AntDesign name="heart" size={30} color="#34a853" />
        </Pressable>
      </View>

      <Modal
        animationType="fade"
        transparent
        visible={Boolean(selectedUser)}
        onRequestClose={() => setSelectedUser(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{selectedUser?.name}</Text>
            <Text style={styles.modalSubtitle}>{selectedUser?.headline}</Text>
            <View style={styles.modalDivider} />
            <Text style={styles.modalLabel}>Goal</Text>
            <Text style={styles.modalBody}>{selectedUser?.goal}</Text>
            <Text style={styles.modalLabel}>Can teach</Text>
            <Text style={styles.modalBody}>{selectedUser?.canTeach.join(", ")}</Text>
            <Text style={styles.modalLabel}>Wants to learn</Text>
            <Text style={styles.modalBody}>{selectedUser?.wantsToLearn.join(", ")}</Text>
            <Pressable style={styles.modalCloseButton} onPress={() => setSelectedUser(null)}>
              <Text style={styles.modalCloseText}>Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default PeopleCard;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statusCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    gap: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  statusTitle: {
    color: "#111",
    fontWeight: "900",
  },
  statusText: {
    color: "#666",
    lineHeight: 18,
  },
  matchToast: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  matchToastText: {
    color: "#fff",
    fontWeight: "800",
    flex: 1,
  },
  deckFrame: {
    alignItems: "center",
    justifyContent: "center",
  },
  swiperContainer: {
    width: "100%",
    height: "100%",
  },
  card: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 8,
  },
  emptyCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#fff",
  },
  emptyTitle: {
    color: "#111",
    fontSize: 24,
    fontWeight: "900",
  },
  emptyText: {
    color: "#666",
    marginTop: 8,
    textAlign: "center",
  },
  image: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  imageStyle: {
    borderRadius: 20,
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
  },
  rolePill: {
    position: "absolute",
    top: 18,
    left: 18,
    zIndex: 2,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleText: {
    color: "#111",
    fontWeight: "900",
  },
  infoButton: {
    position: "absolute",
    top: 18,
    right: 18,
    zIndex: 2,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  infoSection: {
    padding: 20,
    gap: 10,
    zIndex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  name: {
    color: "white",
    fontSize: 28,
    fontWeight: "900",
    flex: 1,
  },
  scorePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    backgroundColor: "rgba(0,0,0,0.48)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  scoreText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 12,
  },
  headline: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 15,
    lineHeight: 21,
  },
  skillRow: {
    flexDirection: "row",
    gap: 10,
  },
  skillBlock: {
    flex: 1,
    gap: 3,
  },
  label: {
    color: "rgba(255,255,255,0.66)",
    fontSize: 11,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  value: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "800",
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderColor: "rgba(255,255,255,0.25)",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "800",
  },
  floatingActions: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 22,
    paddingBottom: 10,
  },
  circleButton: {
    backgroundColor: "#fff",
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  passButton: {
    width: 64,
    height: 64,
    shadowColor: "#f44336",
  },
  detailsButton: {
    width: 52,
    height: 52,
    shadowColor: "#2196f3",
  },
  likeButton: {
    width: 64,
    height: 64,
    shadowColor: "#34a853",
  },
  overlayBadge: {
    alignItems: "center",
    justifyContent: "center",
    width: 128,
    height: 128,
    borderRadius: 64,
    backgroundColor: "rgba(255,255,255,0.94)",
    borderWidth: 3,
  },
  passBadge: {
    borderColor: "#f44336",
  },
  bridgeBadge: {
    borderColor: "#34a853",
  },
  overlayText: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: "900",
  },
  passText: {
    color: "#f44336",
  },
  bridgeOverlayText: {
    color: "#34a853",
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 390,
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    gap: 8,
  },
  modalTitle: {
    color: "#111",
    fontSize: 24,
    fontWeight: "900",
  },
  modalSubtitle: {
    color: "#666",
    lineHeight: 20,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#eee",
    marginVertical: 6,
  },
  modalLabel: {
    color: "#8a6a00",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
    marginTop: 6,
  },
  modalBody: {
    color: "#111",
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: "#111",
    borderRadius: 8,
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 10,
  },
  modalCloseText: {
    color: "#fff",
    fontWeight: "900",
  },
});
