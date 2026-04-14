import { signUp } from "@/services/authService";
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

const SignupScreen = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async () => {
    setLoading(true);
    try {
      const result = await signUp({ name, email, password });
      Alert.alert("Success", result.message);
      setEmail("");
      setPassword("");
      setName("");
      router.replace("/profile");
    } catch (error: any) {
      Alert.alert("Signup Error", error.message || "Unknown error");
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
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Build a learning profile for skill swaps, tutors, and Q&A.
          </Text>

          <View style={styles.form}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#aaa"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#aaa"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <Pressable
              style={[styles.primaryButton, loading && styles.disabledButton]}
              onPress={handleSignup}
              disabled={loading}
            >
              <Text style={styles.primaryButtonText}>
                {loading ? "Creating account..." : "Sign Up"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.replace("/auth/signin")}
              style={styles.switchLink}
            >
              <Text style={styles.switchText}>
                Already learning here? <Text style={styles.switchTextStrong}>Login</Text>
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
  label: {
    color: "#333",
    fontSize: 14,
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

export default SignupScreen;
