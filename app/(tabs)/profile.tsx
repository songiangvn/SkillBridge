import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React from "react";
import Header from "@/components/Header";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import Avatar from "@/components/Avatar";
import Button from "@/components/Button";
import { useRouter } from "expo-router";
import { ProfileDraft, useProfileService } from "@/services/profileService";
import { signOut } from "@/services/authService";
import { useI18n } from "@/utils/i18n";

const Profile = () => {
  const headerbutton = () => (
    <AntDesign name="setting" size={24} color="black" />
  );
  const router = useRouter();
  const { profile, profileStrength, updateProfile } = useProfileService();
  const [isSigningOut, setIsSigningOut] = React.useState(false);
  const { t, lang, setLang } = useI18n();

  const profileSteps = [
    { label: t("step_role"), done: Boolean(profile.role.trim()) },
    { label: t("step_teach"), done: Boolean(profile.canTeach.trim()) },
    {
      label: t("step_learn"),
      done: Boolean(profile.wantsToLearn.trim()),
    },
    {
      label: t("step_availability"),
      done: Boolean(profile.availability.trim()),
    },
    { label: t("step_mode"), done: Boolean(profile.mode.trim()) },
    { label: t("step_level"), done: Boolean(profile.level.trim()) },
    { label: t("step_goal"), done: Boolean(profile.goal.trim()) },
  ];
  const roleOptions: ProfileDraft["role"][] = ["Learner", "Tutor", "Both"];
  const roleLabels: Record<string, string> = {
    Learner: t("role_learner"),
    Tutor: t("role_tutor"),
    Both: t("role_both"),
  };
  const modeOptions: ProfileDraft["mode"][] = ["Online", "In person", "Hybrid"];
  const modeLabels: Record<string, string> = {
    Online: t("mode_online"),
    "In person": t("mode_inperson"),
    Hybrid: t("mode_hybrid"),
  };
  const levelOptions: ProfileDraft["level"][] = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];
  const levelLabels: Record<string, string> = {
    Beginner: t("level_beginner"),
    Intermediate: t("level_intermediate"),
    Advanced: t("level_advanced"),
  };

  return (
    <ScrollView style={{ paddingHorizontal: 12, backgroundColor: "#fff" }}>
      <View style={{ gap: 16, paddingBottom: 32 }}>
        <Header headerTitle={t("profile_header")} button={headerbutton} />

        <View style={styles.langRow}>
          <Text style={styles.langLabel}>{t("language")}</Text>
          <View style={styles.langToggle}>
            <Pressable
              onPress={() => setLang("en")}
              style={[styles.langChip, lang === "en" && styles.langChipActive]}
            >
              <Text style={[styles.langText, lang === "en" && styles.langTextActive]}>EN</Text>
            </Pressable>
            <Pressable
              onPress={() => setLang("vi")}
              style={[styles.langChip, lang === "vi" && styles.langChipActive]}
            >
              <Text style={[styles.langText, lang === "vi" && styles.langTextActive]}>VI</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar
            size={82}
            image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
              {profile.name || t("profile_default_name")}
            </Text>
            <Text style={{ color: "#555", lineHeight: 20 }}>
              {profile.goal || t("profile_default_goal")}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Button
                style={{ backgroundColor: "#111", alignSelf: "flex-start" }}
                textStyle={{ color: "#fff" }}
                borderRadius={8}
                paddingHorizontal={12}
                paddingVertical={9}
                onPress={() => router.replace("/auth/signin")}
              >
                {t("switch_account")}
              </Button>
              <Button
                style={{ backgroundColor: "#e5e5e5", alignSelf: "flex-start" }}
                textStyle={{ color: "#111" }}
                borderRadius={8}
                paddingHorizontal={12}
                paddingVertical={9}
                disabled={isSigningOut}
                onPress={async () => {
                  setIsSigningOut(true);
                  await signOut();
                  setIsSigningOut(false);
                  router.replace("/auth/signin");
                }}
              >
                {isSigningOut ? t("signing_out") : t("sign_out")}
              </Button>
            </View>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>{t("profile_strength")}</Text>
          <Text style={styles.heroScore}>{profileStrength}%</Text>
          <Text style={styles.heroText}>
            {t("profile_strength_hint")}
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>{t("edit_profile")}</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(value) => updateProfile("name", value)}
            placeholder={t("placeholder_name")}
            placeholderTextColor="#777"
          />
          <Text style={styles.fieldLabel}>{t("field_role")}</Text>
          <View style={styles.choiceRow}>
            {roleOptions.map((role) => (
              <Pressable
                key={role}
                onPress={() => updateProfile("role", role)}
                style={[
                  styles.choiceChip,
                  profile.role === role && styles.choiceChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    profile.role === role && styles.choiceTextActive,
                  ]}
                >
                  {roleLabels[role] || role}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={profile.canTeach}
            onChangeText={(value) => updateProfile("canTeach", value)}
            placeholder={t("placeholder_teach")}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.wantsToLearn}
            onChangeText={(value) => updateProfile("wantsToLearn", value)}
            placeholder={t("placeholder_learn")}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.availability}
            onChangeText={(value) => updateProfile("availability", value)}
            placeholder={t("placeholder_availability")}
            placeholderTextColor="#777"
          />
          <Text style={styles.fieldLabel}>{t("field_mode")}</Text>
          <View style={styles.choiceRow}>
            {modeOptions.map((mode) => (
              <Pressable
                key={mode}
                onPress={() => updateProfile("mode", mode)}
                style={[
                  styles.choiceChip,
                  profile.mode === mode && styles.choiceChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    profile.mode === mode && styles.choiceTextActive,
                  ]}
                >
                  {modeLabels[mode] || mode}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>{t("field_level")}</Text>
          <View style={styles.choiceRow}>
            {levelOptions.map((level) => (
              <Pressable
                key={level}
                onPress={() => updateProfile("level", level)}
                style={[
                  styles.choiceChip,
                  profile.level === level && styles.choiceChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.choiceText,
                    profile.level === level && styles.choiceTextActive,
                  ]}
                >
                  {levelLabels[level] || level}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(value) => updateProfile("location", value)}
            placeholder={t("placeholder_location")}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.credentials}
            onChangeText={(value) => updateProfile("credentials", value)}
            placeholder={t("placeholder_credentials")}
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.hourlyRate}
            onChangeText={(value) => updateProfile("hourlyRate", value)}
            placeholder={t("placeholder_rate")}
            placeholderTextColor="#777"
          />
          <TextInput
            style={[styles.input, styles.goalInput]}
            value={profile.goal}
            onChangeText={(value) => updateProfile("goal", value)}
            placeholder={t("placeholder_goal")}
            placeholderTextColor="#777"
            multiline
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("field_role")}</Text>
            <Text style={styles.statValue}>{roleLabels[profile.role] || profile.role}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("stat_can_teach")}</Text>
            <Text style={styles.statValue}>
              {profile.canTeach || t("stat_add_skill")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("stat_learning")}</Text>
            <Text style={styles.statValue}>
              {profile.wantsToLearn || t("stat_add_goal_skill")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("stat_availability")}</Text>
            <Text style={styles.statValue}>
              {profile.availability || t("stat_not_set")}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>{t("stat_mode_level")}</Text>
            <Text style={styles.statValue}>
              {modeLabels[profile.mode] || profile.mode} | {levelLabels[profile.level] || profile.level}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <Text style={styles.sectionTitle}>{t("mvp_checklist")}</Text>
          {profileSteps.map((step) => {
            return (
              <View style={styles.tableItem} key={step.label}>
                <Text style={styles.stepLabel}>{step.label}</Text>
                <Ionicons
                  name={step.done ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={step.done ? "#111" : "#bdb9b9"}
                />
              </View>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
};

export default Profile;

const styles = StyleSheet.create({
  heroCard: {
    backgroundColor: "#FFD600",
    borderRadius: 8,
    padding: 18,
    gap: 6,
  },
  heroTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
  },
  heroScore: {
    color: "#111",
    fontSize: 42,
    fontWeight: "900",
  },
  heroText: {
    color: "#333",
    lineHeight: 20,
  },
  formCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#111",
  },
  fieldLabel: {
    color: "#333",
    fontSize: 13,
    fontWeight: "900",
    marginTop: 2,
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  choiceChip: {
    backgroundColor: "#fff",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  choiceChipActive: {
    backgroundColor: "#111",
    borderColor: "#111",
  },
  choiceText: {
    color: "#333",
    fontWeight: "800",
  },
  choiceTextActive: {
    color: "#fff",
  },
  goalInput: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  statsGrid: {
    gap: 10,
  },
  statCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    gap: 4,
  },
  statLabel: {
    color: "#666",
    fontWeight: "800",
    textTransform: "uppercase",
    fontSize: 12,
  },
  statValue: {
    color: "#111",
    fontSize: 16,
    fontWeight: "900",
  },
  sectionTitle: {
    color: "#111",
    fontSize: 18,
    fontWeight: "900",
  },
  tableItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#f7f7f7",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 8,
  },
  stepLabel: {
    color: "#111",
    fontSize: 15,
    fontWeight: "700",
    flex: 1,
  },
  table: {
    width: "100%",
    gap: 10,
  },
  langRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  langLabel: {
    color: "#111",
    fontSize: 15,
    fontWeight: "900",
  },
  langToggle: {
    flexDirection: "row",
    gap: 6,
  },
  langChip: {
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  langChipActive: {
    backgroundColor: "#111",
  },
  langText: {
    color: "#333",
    fontWeight: "800",
    fontSize: 13,
  },
  langTextActive: {
    color: "#fff",
  },
});
