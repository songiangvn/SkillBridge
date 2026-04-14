import { signIn } from "@/services/authService";
import { useI18n } from "@/utils/i18n";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SigninScreen = () => {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignin = async () => {
    setLoading(true);
    try {
      const result = await signIn({ email, password });
      Alert.alert(t("success"), result.message);
      setEmail("");
      setPassword("");
      router.replace("/profile");
    } catch (error: any) {
      Alert.alert(t("signin_error"), error.message || "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.shell}>
          <View style={styles.brandMark}>
            <Ionicons name="school" size={40} color="#111" />
          </View>
          <Text style={styles.title}>{t("continue_learning")}</Text>
          <Text style={styles.subtitle}>
            {t("signin_subtitle")}
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>{t("email")}</Text>
              <TextInput
                style={styles.input}
                placeholder={t("email_placeholder")}
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>{t("password")}</Text>
                <Text style={styles.linkSmall}>{t("forgot")}</Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder={t("password_placeholder")}
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSignin}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? t("signing_in") : t("login")}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace("/auth/signup")}
              style={styles.switchLink}
            >
              <Text style={styles.switchText}>
                {t("new_to_sb")} <Text style={styles.switchTextStrong}>{t("sign_up")}</Text>
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  shell: {
    width: "100%",
    maxWidth: 420,
    alignSelf: "center",
    gap: 14,
  },
  brandMark: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FFD600",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  title: {
    color: "#111",
    fontSize: 28,
    fontWeight: "900",
    textAlign: "center",
  },
  subtitle: {
    color: "#666",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 14,
  },
  form: {
    gap: 18,
  },
  fieldGroup: {
    gap: 8,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    color: "#333",
    fontSize: 14,
    fontWeight: "800",
  },
  linkSmall: {
    color: "#8a6a00",
    fontWeight: "800",
  },
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    color: "#111",
  },
  primaryButton: {
    height: 54,
    borderRadius: 8,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
  switchLink: {
    alignItems: "center",
    paddingTop: 4,
  },
  switchText: {
    color: "#666",
    fontSize: 15,
  },
  switchTextStrong: {
    color: "#8a6a00",
    fontWeight: "900",
  },
});

export default SigninScreen;
