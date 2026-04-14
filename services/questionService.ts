import { useCallback, useEffect } from "react";

import { DEFAULT_QUESTIONS } from "@/DB/userDB";
import { appwriteAdapter } from "@/services/appwriteAdapter";
import {
  StudyAnswer,
  STORAGE_KEYS,
  StudyQuestion,
  useStoredCollection,
} from "@/utils/storage";

type QuestionInput = {
  title: string;
  tag?: string;
  body?: string;
};

export const useQuestionService = () => {
  const {
    items: questions,
    upsertItem: upsertQuestion,
    removeItem: removeQuestion,
    setItems: setQuestions,
  } = useStoredCollection<StudyQuestion>(
    STORAGE_KEYS.questions,
    DEFAULT_QUESTIONS
  );

  const postQuestion = useCallback(
    ({ title, tag = "General", body }: QuestionInput) => {
      const trimmedTitle = title.trim();
      const trimmedTag = tag.trim() || "General";
      const trimmedBody = body?.trim();

      if (!trimmedTitle) {
        return false;
      }

      const id = `q-${Date.now()}`;

      upsertQuestion({
        id,
        title: trimmedTitle,
        tag: trimmedTag,
        body: trimmedBody,
        replies: 0,
        createdAt: new Date().toISOString(),
      });
      appwriteAdapter.postQuestion({
        id,
        title: trimmedTitle,
        tag: trimmedTag,
        body: trimmedBody,
      });

      return true;
    },
    [upsertQuestion]
  );

  const deleteQuestion = useCallback(
    (questionId: string) => {
      removeQuestion(questionId);
      appwriteAdapter.deleteQuestion(questionId);
    },
    [removeQuestion]
  );

  useEffect(() => {
    let isMounted = true;

    appwriteAdapter.listQuestions().then((questions) => {
      if (isMounted && questions) {
        setQuestions(questions);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [setQuestions]);

  return {
    questions,
    postQuestion,
    removeQuestion: deleteQuestion,
  };
};

export const useAnswerService = (questionId?: string) => {
  const {
    items: allAnswers,
    upsertItem: upsertAnswer,
    removeItem: removeAnswer,
    setItems: setAllAnswers,
  } = useStoredCollection<StudyAnswer>(STORAGE_KEYS.answers);

  const answers = allAnswers
    .filter((answer) => answer.questionId === questionId)
    .sort(
      (first, second) =>
        new Date(first.createdAt).getTime() -
        new Date(second.createdAt).getTime()
    );

  const postAnswer = useCallback(
    (body: string) => {
      const trimmedBody = body.trim();

      if (!questionId || !trimmedBody) {
        return false;
      }

      const createdAt = new Date().toISOString();
      const localAnswer: StudyAnswer = {
        id: `answer-${Date.now()}`,
        questionId,
        userId: "demo-user",
        body: trimmedBody,
        createdAt,
      };

      upsertAnswer(localAnswer);
      appwriteAdapter.postAnswer(questionId, trimmedBody).then((answer) => {
        if (!answer) {
          return;
        }

        removeAnswer(localAnswer.id);
        upsertAnswer(answer);
      });

      return true;
    },
    [questionId, removeAnswer, upsertAnswer]
  );

  const deleteAnswer = useCallback(
    (answerId: string) => {
      const answer = allAnswers.find((item) => item.id === answerId);

      removeAnswer(answerId);

      if (answer?.appwriteDocumentId) {
        appwriteAdapter.deleteAnswer(answer.appwriteDocumentId);
      }
    },
    [allAnswers, removeAnswer]
  );

  useEffect(() => {
    if (!questionId) {
      return;
    }

    let isMounted = true;

    appwriteAdapter.listAnswers(questionId).then((answers) => {
      if (!isMounted || !answers) {
        return;
      }

      setAllAnswers((previousAnswers) => [
        ...previousAnswers.filter((answer) => answer.questionId !== questionId),
        ...answers,
      ]);
    });

    return () => {
      isMounted = false;
    };
  }, [questionId, setAllAnswers]);

  return {
    answers,
    postAnswer,
    deleteAnswer,
  };
};
