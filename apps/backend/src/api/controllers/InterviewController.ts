import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { interviewGraph } from '../../services/InterviewGraph';
import { interviewCoachService } from '../../services/InterviewCoachService';
import { ApiError } from '../middleware/error-handler.middleware';
import { Difficulty } from '@prisma/client';

export class InterviewController {
  async startInterview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { problemId, difficulty = 'MEDIUM', topic = 'Algorithms' } = req.body;

      if (!problemId || typeof problemId !== 'string') {
        throw new ApiError(400, 'Invalid problem ID', 'INVALID_ID');
      }

      const problem = await prisma.problem.findUnique({
        where: { id: problemId },
      });

      if (!problem) {
        throw new ApiError(404, 'Problem not found', 'NOT_FOUND');
      }

      const interview = await prisma.mockInterview.create({
        data: {
          userId: req.user.id,
          problemId,
          difficultyLevel: difficulty as Difficulty,
          status: 'ONGOING',
          startedAt: new Date(),
        },
      });

      // Invoke LangGraph to generate the first question
      const graphResult = await interviewGraph.invoke({
        interviewId: interview.id,
        topic,
        difficulty: difficulty as Difficulty,
        questionsAsked: [],
        questionCount: 0,
        maxQuestions: 3,
      });

      res.status(201).json({
        success: true,
        data: {
          interviewId: interview.id,
          questionId: graphResult.currentQuestionId,
          questionText: graphResult.currentQuestionText,
          timeLimit: 1800,
          questionCount: graphResult.questionCount,
          maxQuestions: graphResult.maxQuestions,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async submitAnswer(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;
      const { questionId, userAnswer, language = 'javascript', timeSpent = 120 } = req.body;

      if (!id || !questionId || !userAnswer) {
        throw new ApiError(400, 'Missing required fields', 'VALIDATION_ERROR');
      }

      const interview = await prisma.mockInterview.findUnique({
        where: { id },
        include: {
          answers: {
            include: { question: true },
          },
        },
      });

      if (!interview) {
        throw new ApiError(404, 'Interview session not found', 'NOT_FOUND');
      }

      if (interview.userId !== req.user.id) {
        throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
      }

      if (interview.status !== 'ONGOING') {
        throw new ApiError(400, 'Interview session is not ongoing', 'INVALID_STATUS');
      }

      const question = await prisma.interviewQuestion.findUnique({
        where: { id: questionId },
      });

      if (!question) {
        throw new ApiError(404, 'Question not found', 'NOT_FOUND');
      }

      const sessionAnswers = interview.answers;
      const questionsAsked = sessionAnswers.map((a) => a.question.question);
      const questionCount = sessionAnswers.length + 1;

      // Invoke LangGraph to evaluate and decide next step
      const graphResult = await interviewGraph.invoke({
        interviewId: id,
        topic: question.topic,
        difficulty: interview.difficultyLevel,
        questionsAsked: [...questionsAsked, question.question],
        currentQuestionId: questionId,
        currentQuestionText: question.question,
        expectedApproach: question.expectedApproach,
        userAnswer,
        language,
        timeSpent,
        questionCount,
        maxQuestions: 3,
      });

      if (graphResult.isCompleted) {
        const completedInterview = await prisma.mockInterview.findUnique({
          where: { id },
        });

        res.status(200).json({
          success: true,
          data: {
            isCompleted: true,
            score: completedInterview?.score,
            feedback: completedInterview?.feedback,
            areasOfImprovement: completedInterview?.areasOfImprovement,
          },
        });
      } else {
        res.status(200).json({
          success: true,
          data: {
            isCompleted: false,
            nextQuestionId: graphResult.currentQuestionId,
            nextQuestionText: graphResult.currentQuestionText,
            questionCount: graphResult.questionCount,
          },
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async completeInterview(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;

      const interview = await prisma.mockInterview.findUnique({
        where: { id },
      });

      if (!interview) {
        throw new ApiError(404, 'Interview not found', 'NOT_FOUND');
      }

      if (interview.userId !== req.user.id) {
        throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
      }

      await interviewCoachService.completeInterview(id);

      const completedInterview = await prisma.mockInterview.findUnique({
        where: { id },
      });

      res.status(200).json({
        success: true,
        data: completedInterview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getInterviewSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { id } = req.params;

      const interview = await interviewCoachService.getInterviewSession(id);

      if (interview.userId !== req.user.id) {
        throw new ApiError(403, 'Forbidden', 'FORBIDDEN');
      }

      res.status(200).json({
        success: true,
        data: interview,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyInterviews(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const { skip = '0', take = '20' } = req.query;

      const result = await interviewCoachService.getUserInterviews(
        req.user.id,
        parseInt(skip as string, 10),
        parseInt(take as string, 10)
      );

      res.status(200).json({
        success: true,
        data: result.interviews,
        pagination: {
          total: result.total,
          skip: parseInt(skip as string, 10),
          take: parseInt(take as string, 10),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getInterviewStats(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        throw new ApiError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const stats = await interviewCoachService.getInterviewStats(req.user.id);

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const interviewController = new InterviewController();
