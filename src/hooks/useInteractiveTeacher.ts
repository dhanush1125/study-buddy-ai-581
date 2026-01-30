import { useState, useCallback } from "react";
import { QuestionFeedback } from "@/components/InteractiveQuestion";

export interface InteractiveQuestion {
  id: string;
  question: string;
  hint?: string;
  correctAnswer?: string;
  userAnswer?: string;
  feedback?: QuestionFeedback;
  isActive: boolean;
}

export const useInteractiveTeacher = () => {
  const [questions, setQuestions] = useState<Map<string, InteractiveQuestion>>(new Map());
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);

  // Extract questions from AI response content
  const parseQuestions = useCallback((content: string): InteractiveQuestion[] => {
    const questionRegex = /\[QUICK_CHECK:\s*([^\|]+)\|?([^\|]*)\|?([^\]]*)\]/g;
    const parsed: InteractiveQuestion[] = [];
    let match;

    while ((match = questionRegex.exec(content)) !== null) {
      const id = `q-${Date.now()}-${parsed.length}`;
      parsed.push({
        id,
        question: match[1].trim(),
        hint: match[2]?.trim() || undefined,
        correctAnswer: match[3]?.trim() || undefined,
        isActive: true,
      });
    }

    return parsed;
  }, []);

  // Add questions from parsed content
  const addQuestions = useCallback((newQuestions: InteractiveQuestion[]) => {
    setQuestions((prev) => {
      const updated = new Map(prev);
      newQuestions.forEach((q) => {
        updated.set(q.id, q);
      });
      return updated;
    });

    if (newQuestions.length > 0) {
      setActiveQuestionId(newQuestions[0].id);
    }
  }, []);

  // Evaluate user's answer
  const evaluateAnswer = useCallback((questionId: string, userAnswer: string): QuestionFeedback => {
    const question = questions.get(questionId);
    if (!question || !question.correctAnswer) {
      // If no correct answer stored, always be encouraging
      return "almost";
    }

    const correct = question.correctAnswer.toLowerCase().trim();
    const answer = userAnswer.toLowerCase().trim();

    // Exact match
    if (answer === correct) {
      return "correct";
    }

    // Contains the key terms (partial match)
    const correctWords = correct.split(/\s+/);
    const matchingWords = correctWords.filter((word) => 
      word.length > 3 && answer.includes(word)
    );

    if (matchingWords.length >= correctWords.length * 0.6) {
      return "almost";
    }

    return "try_again";
  }, [questions]);

  // Submit answer for a question
  const submitAnswer = useCallback((questionId: string, answer: string) => {
    const feedback = evaluateAnswer(questionId, answer);

    setQuestions((prev) => {
      const updated = new Map(prev);
      const question = updated.get(questionId);
      if (question) {
        updated.set(questionId, {
          ...question,
          userAnswer: answer,
          feedback,
          isActive: false,
        });
      }
      return updated;
    });

    setActiveQuestionId(null);

    return feedback;
  }, [evaluateAnswer]);

  // Clean content by removing question markers
  const cleanContent = useCallback((content: string): string => {
    return content.replace(/\[QUICK_CHECK:[^\]]+\]/g, "").trim();
  }, []);

  // Check if content has questions
  const hasQuestions = useCallback((content: string): boolean => {
    return /\[QUICK_CHECK:[^\]]+\]/.test(content);
  }, []);

  // Get all questions as array
  const getQuestions = useCallback((): InteractiveQuestion[] => {
    return Array.from(questions.values());
  }, [questions]);

  // Reset all questions
  const resetQuestions = useCallback(() => {
    setQuestions(new Map());
    setActiveQuestionId(null);
  }, []);

  return {
    questions,
    activeQuestionId,
    parseQuestions,
    addQuestions,
    submitAnswer,
    cleanContent,
    hasQuestions,
    getQuestions,
    resetQuestions,
  };
};
