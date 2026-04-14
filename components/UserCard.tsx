import { LearningResource, SkillBridgeUser } from "@/DB/userDB";
import { EvilIcons, FontAwesome } from "@expo/vector-icons";
import { ImageBackground, Pressable, Text, View } from "react-native";

interface UserCardProp {
  data: SkillBridgeUser;
  size: "small" | "large";
  showLikeIcon: boolean;
  variant?: "partner" | "tutor";
  actionLabel?: string;
  onAction?: () => void;
  selected?: boolean;
}
const UserCard = ({
  data,
  size = "small",
  showLikeIcon = false,
  variant = "partner",
  actionLabel,
  onAction,
  selected = false,
}: UserCardProp) => {
  const isLarge = size === "large";

  return (
    <View
      style={{
        padding: 16,
        gap: isLarge ? 10 : 5,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        elevation: 2,
        width: isLarge ? 272 : 212,
      }}
    >
      <ImageBackground
        source={{ uri: data?.avatarUrl }}
        style={{
          width: "100%",
          height: isLarge ? 240 : 150,
          borderRadius: 8,
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.58)",
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            {data.name}
          </Text>
          <Text style={{ color: "#FFD600", fontWeight: "700", fontSize: 12 }}>
            {variant === "tutor" && data.hourlyRate
              ? `${data.hourlyRate} | ${data.role}`
              : data.role}
          </Text>
        </View>
      </ImageBackground>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: "800", flex: 1 }}>
          {data.canTeach[0]}
          {" -> "}
          {data.wantsToLearn[0]}
        </Text>
        {showLikeIcon && (
          <EvilIcons
            name="heart"
            size={24}
            color={selected ? "#cc8b00" : "black"}
          />
        )}
      </View>
      <Text style={{ color: "#555", lineHeight: 18 }} numberOfLines={2}>
        {data.headline}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <FontAwesome name="calendar-o" size={12} color="#555" />
        <Text style={{ color: "#555", fontSize: 12 }}>{data.availability}</Text>
      </View>
      {actionLabel && (
        <Pressable
          onPress={onAction}
          style={{
            backgroundColor: selected ? "#f0f0f0" : "#111",
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: selected ? "#111" : "#fff",
              fontWeight: "900",
            }}
          >
            {selected ? "Saved" : actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export const ResourceCard = ({
  data,
  actionLabel,
  onAction,
  selected = false,
}: {
  data: LearningResource;
  actionLabel?: string;
  onAction?: () => void;
  selected?: boolean;
}) => {
  return (
    <View
      style={{
        width: 220,
        padding: 14,
        gap: 8,
        backgroundColor: "#ffffff",
        borderRadius: 8,
        elevation: 2,
      }}
    >
      <ImageBackground
        source={{ uri: data.image }}
        style={{
          height: 130,
          borderRadius: 8,
          overflow: "hidden",
          justifyContent: "flex-end",
        }}
      >
        <View
          style={{
            backgroundColor: "rgba(0,0,0,0.55)",
            paddingHorizontal: 10,
            paddingVertical: 8,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900" }}>
            {data.subject}
          </Text>
        </View>
      </ImageBackground>
      <Text style={{ fontSize: 16, fontWeight: "900" }}>{data.title}</Text>
      <Text style={{ color: "#555" }}>
        {data.level} | {data.verifiedBy}
      </Text>
      {actionLabel && (
        <Pressable
          onPress={onAction}
          style={{
            backgroundColor: selected ? "#f0f0f0" : "#111",
            borderRadius: 8,
            paddingVertical: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: selected ? "#111" : "#fff", fontWeight: "900" }}>
            {selected ? "Saved" : actionLabel}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

export default UserCard;
