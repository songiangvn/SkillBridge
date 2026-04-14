import { FlatList, ScrollView, Text, View } from "react-native";
import { useState } from "react";

import Header from "@/components/Header";
import UserCard, { ResourceCard } from "@/components/UserCard";
import { SkillBridgeUser } from "@/DB/userDB";
import { useBridgeService } from "@/services/bridgeService";
import { useCatalogService } from "@/services/catalogService";
import { useResourceService } from "@/services/resourceService";
import { useTutorService } from "@/services/tutorService";
import { EvilIcons } from "@expo/vector-icons";

export default function Discover() {
  const button = () => <EvilIcons name="question" size={24} color="black" />;
  const [status, setStatus] = useState("Choose a partner, tutor, or resource.");
  const { requestBridge, hasBridgeRequest } = useBridgeService();
  const { shortlistTutor, hasTutor } = useTutorService();
  const { saveResource, hasResource } = useResourceService();
  const { recommendations, sameGoal, tutors, resources } = useCatalogService();

  const saveUser = (
    user: SkillBridgeUser,
    action: "partner" | "tutor" = "partner"
  ) => {
    if (action === "tutor") {
      shortlistTutor(user);
      setStatus(`${user.name} added to your tutor shortlist.`);
      return;
    }

    requestBridge(user);
    setStatus(`Bridge request saved for ${user.name}.`);
  };

  const PartnerSection = ({
    title,
    subtitle,
    data,
    backgroundColor = "#fff",
  }: {
    title: string;
    subtitle: string;
    data: SkillBridgeUser[];
    backgroundColor?: string;
  }) => {
    return (
      <View style={{ gap: 8, backgroundColor, paddingVertical: 16 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
            {title}
          </Text>
          <Text style={{ color: "#555", lineHeight: 20 }}>{subtitle}</Text>
        </View>
        <FlatList
          horizontal
          data={data}
          renderItem={({ item }) => (
            <UserCard
              showLikeIcon={true}
              size="large"
              data={item}
              actionLabel="Request bridge"
              onAction={() => saveUser(item)}
              selected={hasBridgeRequest(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  const TutorSection = () => {
    return (
      <View style={{ gap: 8, paddingVertical: 16 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
            Tutor marketplace
          </Text>
          <Text style={{ color: "#555", lineHeight: 20 }}>
            Paid or skill-swap tutors you can book for focused help.
          </Text>
        </View>
        <FlatList
          horizontal
          data={tutors}
          renderItem={({ item }) => (
            <UserCard
              showLikeIcon={false}
              size="small"
              data={item}
              variant="tutor"
              actionLabel="Shortlist"
              onAction={() => saveUser(item, "tutor")}
              selected={hasTutor(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  const ResourceSection = () => {
    return (
      <View style={{ gap: 8, paddingVertical: 16, paddingBottom: 100 }}>
        <View style={{ gap: 3 }}>
          <Text style={{ fontSize: 20, fontWeight: "900", color: "#111" }}>
            Verified resources
          </Text>
          <Text style={{ color: "#555", lineHeight: 20 }}>
            Starter materials for common goals, synced from Appwrite when configured.
          </Text>
        </View>
        <FlatList
          horizontal
          data={resources}
          renderItem={({ item }) => (
            <ResourceCard
              data={item}
              actionLabel="Save resource"
              onAction={() => {
                saveResource(item);
                setStatus(`${item.title} saved to your library.`);
              }}
              selected={hasResource(item.id)}
            />
          )}
          keyExtractor={(item) => item.id}
          ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  return (
    <ScrollView style={{ paddingHorizontal: 12, backgroundColor: "#fff" }}>
      <Header headerTitle={"Discover"} button={button} />
      <View
        style={{
          backgroundColor: "#FFD600",
          borderRadius: 8,
          paddingHorizontal: 14,
          paddingVertical: 12,
          marginBottom: 8,
          gap: 4,
        }}
      >
        <Text style={{ fontWeight: "900", fontSize: 16 }}>
          SkillBridge MVP
        </Text>
        <Text style={{ color: "#333", lineHeight: 20 }}>
          Find a learning partner, book a tutor, or save a verified resource.
        </Text>
        <Text style={{ color: "#111", fontWeight: "800" }}>{status}</Text>
      </View>

      <PartnerSection
        title="Learning partners for you"
        subtitle="People whose strengths and goals complement your own."
        data={recommendations}
      />
      <PartnerSection
        title="Same learning goal"
        subtitle="Learners working toward similar outcomes this week."
        data={sameGoal}
        backgroundColor="#f7f7f7"
      />
      <TutorSection />
      <ResourceSection />
    </ScrollView>
  );
}
