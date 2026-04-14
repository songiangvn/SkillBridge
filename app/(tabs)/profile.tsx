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

const Profile = () => {
  const headerbutton = () => (
    <AntDesign name="setting" size={24} color="black" />
  );
  const router = useRouter();
  const { profile, profileStrength, updateProfile } = useProfileService();
  const [isSigningOut, setIsSigningOut] = React.useState(false);

  const profileSteps = [
    { label: "Choose learner/tutor role", done: Boolean(profile.role.trim()) },
    { label: "Add skills you can teach", done: Boolean(profile.canTeach.trim()) },
    {
      label: "Add skills you want to learn",
      done: Boolean(profile.wantsToLearn.trim()),
    },
    {
      label: "Set weekly availability",
      done: Boolean(profile.availability.trim()),
    },
    { label: "Choose learning mode", done: Boolean(profile.mode.trim()) },
    { label: "Set current level", done: Boolean(profile.level.trim()) },
    { label: "Write a learning goal", done: Boolean(profile.goal.trim()) },
  ];
  const roleOptions: ProfileDraft["role"][] = ["Learner", "Tutor", "Both"];
  const modeOptions: ProfileDraft["mode"][] = ["Online", "In person", "Hybrid"];
  const levelOptions: ProfileDraft["level"][] = [
    "Beginner",
    "Intermediate",
    "Advanced",
  ];

  return (
    <ScrollView style={{ paddingHorizontal: 12, backgroundColor: "#fff" }}>
      <View style={{ gap: 16, paddingBottom: 32 }}>
        <Header headerTitle={"Profile"} button={headerbutton} />
        <View style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
          <Avatar
            size={82}
            image="https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1887&auto=format&fit=crop"
          />
          <View style={{ flex: 1, gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "900", color: "#111" }}>
              {profile.name || "SkillBridge Learner"}
            </Text>
            <Text style={{ color: "#555", lineHeight: 20 }}>
              {profile.goal || "Add a learning goal to improve matches."}
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
                Switch account
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
                {isSigningOut ? "Signing out..." : "Sign out"}
              </Button>
            </View>
          </View>
        </View>

        <View style={styles.heroCard}>
          <Text style={styles.heroTitle}>Learning profile strength</Text>
          <Text style={styles.heroScore}>{profileStrength}%</Text>
          <Text style={styles.heroText}>
            Complete your skills, availability, and goal to improve match
            quality.
          </Text>
        </View>

        <View style={styles.formCard}>
          <Text style={styles.sectionTitle}>Edit learning profile</Text>
          <TextInput
            style={styles.input}
            value={profile.name}
            onChangeText={(value) => updateProfile("name", value)}
            placeholder="Display name"
            placeholderTextColor="#777"
          />
          <Text style={styles.fieldLabel}>Role</Text>
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
                  {role}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={profile.canTeach}
            onChangeText={(value) => updateProfile("canTeach", value)}
            placeholder="Skills you can teach"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.wantsToLearn}
            onChangeText={(value) => updateProfile("wantsToLearn", value)}
            placeholder="Skills you want to learn"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.availability}
            onChangeText={(value) => updateProfile("availability", value)}
            placeholder="Weekly availability"
            placeholderTextColor="#777"
          />
          <Text style={styles.fieldLabel}>Learning mode</Text>
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
                  {mode}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Current level</Text>
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
                  {level}
                </Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            style={styles.input}
            value={profile.location}
            onChangeText={(value) => updateProfile("location", value)}
            placeholder="Location or timezone"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.credentials}
            onChangeText={(value) => updateProfile("credentials", value)}
            placeholder="Credentials, proof, or teaching experience"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={profile.hourlyRate}
            onChangeText={(value) => updateProfile("hourlyRate", value)}
            placeholder="Tutor hourly rate (optional)"
            placeholderTextColor="#777"
          />
          <TextInput
            style={[styles.input, styles.goalInput]}
            value={profile.goal}
            onChangeText={(value) => updateProfile("goal", value)}
            placeholder="Learning goal"
            placeholderTextColor="#777"
            multiline
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Role</Text>
            <Text style={styles.statValue}>{profile.role}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Can teach</Text>
            <Text style={styles.statValue}>
              {profile.canTeach || "Add a skill"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Learning</Text>
            <Text style={styles.statValue}>
              {profile.wantsToLearn || "Add a goal skill"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Availability</Text>
            <Text style={styles.statValue}>
              {profile.availability || "Not set yet"}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Mode / level</Text>
            <Text style={styles.statValue}>
              {profile.mode} | {profile.level}
            </Text>
          </View>
        </View>

        <View style={styles.table}>
          <Text style={styles.sectionTitle}>MVP checklist</Text>
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
});
