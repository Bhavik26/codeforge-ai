import { StateGraph, Annotation } from '@langchain/langgraph';
import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { logger } from '../config/logger';
import { Difficulty } from '@prisma/client';

export const InterviewStateAnnotation = Annotation.Root({
  interviewId: Annotation<string>(),
  topic: Annotation<string>(),
  difficulty: Annotation<Difficulty>(),
  questionsAsked: Annotation<string[]>({
    reducer: (left, right) => left.concat(right),
    default: () => [],
  }),
  currentQuestionId: Annotation<string>(),
  currentQuestionText: Annotation<string>(),
  expectedApproach: Annotation<string>(),
  userAnswer: Annotation<string>(),
  language: Annotation<string>(),
  timeSpent: Annotation<number>(),
  isCompleted: Annotation<boolean>(),
  questionCount: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 0,
  }),
  maxQuestions: Annotation<number>({
    reducer: (_, right) => right,
    default: () => 3,
  }),
});

export type InterviewState = typeof InterviewStateAnnotation.State;

// Node 1: Generate technical interview question
const generateQuestionNode = async (state: InterviewState): Promise<Partial<InterviewState>> => {
  logger.info(`InterviewGraph: Generating question for interview ${state.interviewId}`);
  try {
    const generatedQuestion = await openaiService.generateInterviewQuestion({
      topic: state.topic,
      difficulty: state.difficulty,
      previousQuestions: state.questionsAsked,
    });

    const questionRecord = await prisma.interviewQuestion.create({
      data: {
        topic: state.topic,
        difficulty: state.difficulty,
        question: generatedQuestion.question,
        expectedApproach: generatedQuestion.expectedApproach,
        timeLimit: generatedQuestion.timeLimit,
        tags: [state.topic],
      },
    });

    return {
      currentQuestionId: questionRecord.id,
      currentQuestionText: questionRecord.question,
      expectedApproach: questionRecord.expectedApproach,
      questionsAsked: [questionRecord.question],
      questionCount: state.questionCount + 1,
    };
  } catch (error) {
    logger.error('Error in generateQuestionNode', error);
    throw error;
  }
};

// Node 2: Evaluate user's answer
const evaluateAnswerNode = async (state: InterviewState): Promise<Partial<InterviewState>> => {
  logger.info(`InterviewGraph: Evaluating answer for interview ${state.interviewId}, question ${state.currentQuestionId}`);
  try {
    if (!state.currentQuestionText || !state.expectedApproach || !state.userAnswer) {
      throw new Error('Missing answer or question details for evaluation');
    }

    const evaluation = await openaiService.evaluateInterviewAnswer({
      question: state.currentQuestionText,
      expectedApproach: state.expectedApproach,
      userAnswer: state.userAnswer,
      language: state.language || 'javascript',
    });

    await prisma.interviewAnswer.create({
      data: {
        interviewSessionId: state.interviewId,
        questionId: state.currentQuestionId,
        userAnswer: state.userAnswer,
        isCorrect: evaluation.isCorrect,
        score: evaluation.score,
        feedback: evaluation.feedback,
        timeSpent: state.timeSpent || 0,
        codeQuality: evaluation.codeQuality,
        algorithmicThinking: evaluation.algorithmicThinking,
        communication: evaluation.communication,
        areasForImprovement: evaluation.areasForImprovement,
      },
    });

    return {};
  } catch (error) {
    logger.error('Error in evaluateAnswerNode', error);
    throw error;
  }
};

// Node 3: Finalize and complete mock interview
const completeInterviewNode = async (state: InterviewState): Promise<Partial<InterviewState>> => {
  logger.info(`InterviewGraph: Completing interview ${state.interviewId}`);
  try {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: state.interviewId },
      include: { answers: true },
    });

    if (!interview || interview.answers.length === 0) {
      throw new Error('Interview or answers not found during completion');
    }

    const totalScore = interview.answers.reduce((sum, a) => sum + a.score, 0);
    const averageScore = Math.round(totalScore / interview.answers.length);

    const incorrectAnswers = interview.answers.filter((a) => !a.isCorrect);
    const areasForImprovement = new Set<string>();

    incorrectAnswers.forEach((answer) => {
      answer.areasForImprovement.forEach((area) => {
        areasForImprovement.add(area);
      });
    });

    await prisma.mockInterview.update({
      where: { id: state.interviewId },
      data: {
        status: 'COMPLETED',
        score: averageScore,
        completedAt: new Date(),
        feedback: `Overall score: ${averageScore}/100. Correct answers: ${interview.answers.filter((a) => a.isCorrect).length}/${interview.answers.length}`,
        areasOfImprovement: Array.from(areasForImprovement),
      },
    });

    return {
      isCompleted: true,
    };
  } catch (error) {
    logger.error('Error in completeInterviewNode', error);
    throw error;
  }
};

// Build the LangGraph Workflow
const workflow = new StateGraph(InterviewStateAnnotation)
  .addNode('generateQuestion', generateQuestionNode)
  .addNode('evaluateAnswer', evaluateAnswerNode)
  .addNode('completeInterview', completeInterviewNode);

workflow.addConditionalEdges(
  '__start__',
  (state: InterviewState) => {
    if (state.userAnswer) {
      return 'evaluateAnswer';
    }
    return 'generateQuestion';
  },
  {
    evaluateAnswer: 'evaluateAnswer',
    generateQuestion: 'generateQuestion',
  }
);

workflow.addEdge('generateQuestion', '__end__');

workflow.addConditionalEdges(
  'evaluateAnswer',
  (state: InterviewState) => {
    if (state.questionCount >= state.maxQuestions) {
      return 'completeInterview';
    }
    return 'generateQuestion';
  },
  {
    completeInterview: 'completeInterview',
    generateQuestion: 'generateQuestion',
  }
);

workflow.addEdge('completeInterview', '__end__');

export const interviewGraph = workflow.compile();
