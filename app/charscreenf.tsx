import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { useQuestionService } from "@/services/questionService";

const StudyRoomScreen = () => {
  const [question, setQuestion] = useState("");
  const [status, setStatus] = useState("Draft a question for the global feed.");
  const { postQuestion } = useQuestionService();

  const handlePostQuestion = () => {
    const wasPosted = postQuestion({
      title: question,
      tag: "Study room",
    });

    if (!wasPosted) {
      setStatus("Write a question first.");
      return;
    }

    setQuestion("");
    setStatus("Question posted to Q&A.");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Global Study Room</Text>
      <Text style={styles.message}>
        Ask about a homework problem, study plan, or skill swap. New questions
        sync to the Q&A feed when you are signed in.
      </Text>
      <View style={styles.promptBox}>
        <Text style={styles.promptLabel}>Draft a question</Text>
        <TextInput
          style={styles.input}
          value={question}
          onChangeText={setQuestion}
          placeholder="Ask about a homework problem, study plan, or skill swap..."
          placeholderTextColor="#777"
          multiline
        />
        <Pressable onPress={handlePostQuestion} style={styles.primaryButton}>
          <Text style={styles.primaryButtonText}>Post to Q&A</Text>
        </Pressable>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
};

export default StudyRoomScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    gap: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: "#111",
  },
  message: {
    color: "#555",
    fontSize: 16,
    lineHeight: 24,
  },
  promptBox: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    gap: 10,
  },
  promptLabel: {
    color: "#111",
    fontWeight: "900",
  },
  input: {
    minHeight: 120,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    color: "#111",
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: "#111",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryButtonText: {
    color: "#fff",
    fontWeight: "900",
  },
  statusText: {
    color: "#555",
    lineHeight: 20,
  },
});
