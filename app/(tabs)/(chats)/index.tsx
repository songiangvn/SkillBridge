import Header from "@/components/Header";
import {
  useAnswerService,
  useQuestionService,
} from "@/services/questionService";
import { StudyQuestion } from "@/utils/storage";
import { AntDesign, MaterialCommunityIcons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const QuestionCard = ({
  question,
  onRemove,
}: {
  question: StudyQuestion;
  onRemove: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const [answerDraft, setAnswerDraft] = useState("");
  const { answers, postAnswer, deleteAnswer } = useAnswerService(
    expanded ? question.id : undefined
  );

  const submitAnswer = () => {
    const wasPosted = postAnswer(answerDraft);

    if (wasPosted) {
      setAnswerDraft("");
    }
  };

  return (
    <Pressable
      onPress={() => setExpanded((value) => !value)}
      style={styles.questionCard}
    >
      <Text style={styles.questionTag}>{question.tag}</Text>
      <Text style={styles.questionTitle}>{question.title}</Text>
      {question.body && expanded && (
        <Text style={styles.questionBody}>{question.body}</Text>
      )}
      <View style={styles.questionFooter}>
        <Text style={styles.questionMeta}>
          {expanded ? answers.length : question.replies} repl
          {(expanded ? answers.length : question.replies) === 1 ? "y" : "ies"}
        </Text>
        <Pressable onPress={onRemove}>
          <Text style={styles.removeText}>Remove</Text>
        </Pressable>
      </View>

      {expanded && (
        <View style={styles.answerSection}>
          {answers.map((answer) => (
            <View key={answer.id} style={styles.answerCard}>
              <Text style={styles.answerText}>{answer.body}</Text>
              <View style={styles.questionFooter}>
                <Text style={styles.questionMeta}>
                  {new Date(answer.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Pressable onPress={() => deleteAnswer(answer.id)}>
                  <Text style={styles.removeText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <TextInput
            style={styles.input}
            value={answerDraft}
            onChangeText={setAnswerDraft}
            placeholder="Write a helpful answer..."
            placeholderTextColor="#777"
            multiline
          />
          <Pressable onPress={submitAnswer} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Post answer</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
};

const Chats = () => {
  const button = () => <AntDesign name="search" size={24} color="black" />;
  const [title, setTitle] = useState("");
  const [tag, setTag] = useState("General");
  const { questions, postQuestion, removeQuestion } = useQuestionService();

  const addQuestion = () => {
    const wasPosted = postQuestion({
      title,
      tag,
    });
    if (!wasPosted) {
      return;
    }

    setTitle("");
    setTag("General");
  };

  return (
    <ScrollView style={{ paddingHorizontal: 12, backgroundColor: "#fff" }}>
      <View style={{ gap: 14, paddingBottom: 32 }}>
        <Header headerTitle={"Q&A"} button={button} />

        <View style={styles.askBox}>
          <Text style={styles.logo}>Ask a question</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What do you need help with?"
            placeholderTextColor="#777"
          />
          <TextInput
            style={styles.input}
            value={tag}
            onChangeText={setTag}
            placeholder="Subject tag"
            placeholderTextColor="#777"
          />
          <Pressable onPress={addQuestion} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Post question</Text>
          </Pressable>
        </View>

        <View style={styles.headerSection}>
          <Text style={styles.logo}>Recent questions</Text>
          <MaterialCommunityIcons name="sort-variant" size={24} color="black" />
        </View>

        {questions.map((question) => (
          <QuestionCard
            key={question.id}
            question={question}
            onRemove={() => removeQuestion(question.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
};

export default Chats;

const styles = StyleSheet.create({
  askBox: {
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
  secondaryButton: {
    backgroundColor: "#FFD600",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#111",
    fontWeight: "900",
  },
  headerSection: {
    justifyContent: "space-between",
    flexDirection: "row",
    paddingVertical: 8,
    marginBottom: 2,
  },
  logo: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111",
  },
  questionCard: {
    backgroundColor: "#f7f7f7",
    borderRadius: 8,
    padding: 14,
    gap: 6,
  },
  questionTag: {
    color: "#8a6a00",
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  questionTitle: {
    color: "#111",
    fontSize: 16,
    fontWeight: "800",
    lineHeight: 22,
  },
  questionBody: {
    color: "#555",
    lineHeight: 20,
  },
  questionFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  questionMeta: {
    color: "#555",
  },
  removeText: {
    color: "#111",
    fontWeight: "900",
  },
  answerSection: {
    gap: 10,
    marginTop: 8,
  },
  answerCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  answerText: {
    color: "#111",
    lineHeight: 20,
  },
});
