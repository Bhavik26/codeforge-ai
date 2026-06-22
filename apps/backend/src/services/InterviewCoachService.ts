import { prisma } from '../config/database';
import { openaiService } from './OpenAIService';
import { logger } from '../config/logger';
import { Difficulty } from '@prisma/client';

export class InterviewCoachService {
  async generateQuestion(
    topic: string,
    difficulty: Difficulty,
    interviewId: string
  ): Promise<{
    id: string;
    question: string;
    expectedApproach: string;
    timeLimit: number;
  }> {
    try {
      const previousQuestions = await prisma.interviewAnswer.findMany({
        where: {
          interviewSession: {
            id: interviewId,
          },
        },
        include: {
          question: {
            select: {
              question: true,
            },
          },
        },
        take: 5,
      });

      const previousQuestionTexts = previousQuestions.map((q) => q.question.question);

      const generatedQuestion = await openaiService.generateInterviewQuestion({
        topic,
        difficulty,
        previousQuestions: previousQuestionTexts,
      });

      const question = await prisma.interviewQuestion.create({
        data: {
          topic,
          difficulty,
          question: generatedQuestion.question,
          expectedApproach: generatedQuestion.expectedApproach,
          timeLimit: generatedQuestion.timeLimit,
          tags: [topic],
        },
      });

      logger.info(`Generated interview question for topic: ${topic}`);

      return {
        id: question.id,
        question: question.question,
        expectedApproach: question.expectedApproach,
        timeLimit: question.timeLimit,
      };
    } catch (error) {
      logger.error('Error generating interview question', error);
      throw error;
    }
  }

  async evaluateAnswer(
    interviewId: string,
    questionId: string,
    userAnswer: string,
    language: string,
    timeSpent: number
  ): Promise<void> {
    try {
      const question = await prisma.interviewQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new Error('Question not found');
      }

      const evaluation = await openaiService.evaluateInterviewAnswer({
        question: question.question,
        expectedApproach: question.expectedApproach,
        userAnswer,
        language,
      });

      await prisma.interviewAnswer.create({
        data: {
          interviewSessionId: interviewId,
          questionId,
          userAnswer,
          isCorrect: evaluation.isCorrect,
          score: evaluation.score,
          feedback: evaluation.feedback,
          timeSpent,
          codeQuality: evaluation.codeQuality,
          algorithmicThinking: evaluation.algorithmicThinking,
          communication: evaluation.communication,
          areasForImprovement: evaluation.areasForImprovement,
        },
      });

      logger.info(`Evaluated answer for interview ${interviewId}, question ${questionId}`);
    } catch (error) {
      logger.error('Error evaluating interview answer', error);
      throw error;
    }
  }

  async completeInterview(interviewId: string): Promise<void> {
    try {
      const interview = await prisma.mockInterview.findUnique({
        where: { id: interviewId },
        include: {
          answers: true,
        },
      });

      if (!interview) {
        throw new Error('Interview not found');
      }

      if (interview.answers.length === 0) {
        throw new Error('No answers to evaluate');
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
        where: { id: interviewId },
        data: {
          status: 'COMPLETED',
          score: averageScore,
          completedAt: new Date(),
          feedback: `Overall score: ${averageScore}/100. Correct answers: ${interview.answers.filter((a) => a.isCorrect).length}/${interview.answers.length}`,
          areasOfImprovement: Array.from(areasForImprovement),
        },
      });

      logger.info(`Interview ${interviewId} completed with score ${averageScore}`);
    } catch (error) {
      logger.error('Error completing interview', error);
      throw error;
    }
  }

  async getInterviewSession(interviewId: string) {
    const interview = await prisma.mockInterview.findUnique({
      where: { id: interviewId },
      include: {
        answers: {
          include: {
            question: true,
          },
        },
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!interview) {
      throw new Error('Interview not found');
    }

    return interview;
  }

  async getUserInterviews(userId: string, skip: number = 0, take: number = 20) {
    const [interviews, total] = await Promise.all([
      prisma.mockInterview.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          problem: {
            select: {
              id: true,
              title: true,
            },
          },
        },
      }),
      prisma.mockInterview.count({ where: { userId } }),
    ]);

    return { interviews, total };
  }

  async getInterviewStats(userId: string) {
    const completed = await prisma.mockInterview.findMany({
      where: {
        userId,
        status: 'COMPLETED',
      },
      select: {
        score: true,
      },
    });

    if (completed.length === 0) {
      return {
        totalInterviews: 0,
        completedInterviews: 0,
        averageScore: 0,
        bestScore: 0,
      };
    }

    const scores = completed.map((i) => i.score || 0);
    const totalScore = scores.reduce((sum, s) => sum + s, 0);

    return {
      totalInterviews: await prisma.mockInterview.count({ where: { userId } }),
      completedInterviews: completed.length,
      averageScore: Math.round(totalScore / completed.length),
      bestScore: Math.max(...scores),
    };
  }
}

export const interviewCoachService = new InterviewCoachService();
