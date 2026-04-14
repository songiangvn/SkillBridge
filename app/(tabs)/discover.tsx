import { FlatList, ScrollView, Text, View } from "react-native";
import { useState } from "react";

import Header from "@/components/Header";
import UserCard, { ResourceCard } from "@/components/UserCard";
import { SkillBridgeUser } from "@/DB/userDB";
import { useBridgeService } from "@/services/bridgeService";
import { useCatalogService } from "@/services/catalogService";
import { useResourceService } from "@/services/resourceService";
import { useTutorService } from "@/services/tutorService";
import { useI18n } from "@/utils/i18n";
import { EvilIcons } from "@expo/vector-icons";

export default function Discover() {
  const { t } = useI18n();
  const button = () => <EvilIcons name="question" size={24} color="black" />;
  const [status, setStatus] = useState("");
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
      setStatus(`${user.name} ${t("tutor_shortlisted")}`);
      return;
    }

    requestBridge(user);
    setStatus(`${t("bridge_request_saved")} ${user.name}.`);
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
              actionLabel={t("request_bridge")}
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
            {t("tutor_title")}
          </Text>
          <Text style={{ color: "#555", lineHeight: 20 }}>
            {t("tutor_subtitle")}
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
              actionLabel={t("shortlist")}
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
            {t("resource_title")}
          </Text>
          <Text style={{ color: "#555", lineHeight: 20 }}>
            {t("resource_subtitle")}
          </Text>
        </View>
        <FlatList
          horizontal
          data={resources}
          renderItem={({ item }) => (
            <ResourceCard
              data={item}
              actionLabel={t("save_resource")}
              onAction={() => {
                saveResource(item);
                setStatus(`${item.title} ${t("resource_saved")}`);
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
      <Header headerTitle={t("discover_header")} button={button} />
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
          {t("discover_mvp_title")}
        </Text>
        <Text style={{ color: "#333", lineHeight: 20 }}>
          {t("discover_mvp_body")}
        </Text>
        <Text style={{ color: "#111", fontWeight: "800" }}>{status || t("discover_status_default")}</Text>
      </View>

      <PartnerSection
        title={t("partners_title")}
        subtitle={t("partners_subtitle")}
        data={recommendations}
      />
      <PartnerSection
        title={t("same_goal_title")}
        subtitle={t("same_goal_subtitle")}
        data={sameGoal}
        backgroundColor="#f7f7f7"
      />
      <TutorSection />
      <ResourceSection />
    </ScrollView>
  );
}
