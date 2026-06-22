import { config } from '../config/env';
import { logger } from '../config/logger';
import https from 'https';

export interface CodeReviewRequest {
  code: string;
  language: string;
  problemDescription: string;
}

export interface CodeReviewResponse {
  timeComplexity: string;
  timeComplexityExplanation: string;
  spaceComplexity: string;
  spaceComplexityExplanation: string;
  optimizations: Array<{
    suggestion: string;
    impact: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  bugs: Array<{
    type: string;
    description: string;
    line?: number;
    severity: 'critical' | 'high' | 'medium' | 'low';
  }>;
  readabilityScore: number;
  efficiencyScore: number;
  maintenabilityScore: number;
  overallScore: number;
  summary: string;
  keyTakeaways: string[];
}

export interface InterviewQuestionRequest {
  topic: string;
  difficulty: string;
  previousQuestions?: string[];
}

export interface InterviewQuestionResponse {
  question: string;
  expectedApproach: string;
  timeLimit: number;
}

export interface InterviewEvaluationRequest {
  question: string;
  expectedApproach: string;
  userAnswer: string;
  language: string;
}

export interface InterviewEvaluationResponse {
  isCorrect: boolean;
  score: number;
  feedback: string;
  codeQuality?: number;
  algorithmicThinking?: number;
  communication?: number;
  areasForImprovement: string[];
}

export class OpenAIService {
  private apiKey: string;
  private model: string;
  private embeddingModel: string;

  constructor() {
    this.apiKey = config.ai.openaiApiKey;
    this.model = config.ai.openaiModel;
    this.embeddingModel = config.ai.openaiEmbeddingModel;
  }

  async analyzeCodeForReview(request: CodeReviewRequest): Promise<CodeReviewResponse> {
    try {
      const prompt = this.buildCodeReviewPrompt(request);

      const response = await this.callOpenAI(prompt);

      const parsedResponse = JSON.parse(response);

      return {
        timeComplexity: parsedResponse.timeComplexity,
        timeComplexityExplanation: parsedResponse.timeComplexityExplanation,
        spaceComplexity: parsedResponse.spaceComplexity,
        spaceComplexityExplanation: parsedResponse.spaceComplexityExplanation,
        optimizations: parsedResponse.optimizations || [],
        bugs: parsedResponse.bugs || [],
        readabilityScore: parsedResponse.readabilityScore || 0,
        efficiencyScore: parsedResponse.efficiencyScore || 0,
        maintenabilityScore: parsedResponse.maintenabilityScore || 0,
        overallScore: parsedResponse.overallScore || 0,
        summary: parsedResponse.summary || '',
        keyTakeaways: parsedResponse.keyTakeaways || [],
      };
    } catch (error) {
      logger.error('Error analyzing code for review', error);
      throw error;
    }
  }

  async generateInterviewQuestion(request: InterviewQuestionRequest): Promise<InterviewQuestionResponse> {
    try {
      const prompt = this.buildInterviewQuestionPrompt(request);
      const response = await this.callOpenAI(prompt);
      const parsedResponse = JSON.parse(response);

      return {
        question: parsedResponse.question,
        expectedApproach: parsedResponse.expectedApproach,
        timeLimit: parsedResponse.timeLimit || 1800,
      };
    } catch (error) {
      logger.error('Error generating interview question', error);
      throw error;
    }
  }

  async evaluateInterviewAnswer(request: InterviewEvaluationRequest): Promise<InterviewEvaluationResponse> {
    try {
      const prompt = this.buildInterviewEvaluationPrompt(request);
      const response = await this.callOpenAI(prompt);
      const parsedResponse = JSON.parse(response);

      return {
        isCorrect: parsedResponse.isCorrect,
        score: parsedResponse.score,
        feedback: parsedResponse.feedback,
        codeQuality: parsedResponse.codeQuality,
        algorithmicThinking: parsedResponse.algorithmicThinking,
        communication: parsedResponse.communication,
        areasForImprovement: parsedResponse.areasForImprovement || [],
      };
    } catch (error) {
      logger.error('Error evaluating interview answer', error);
      throw error;
    }
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const body = JSON.stringify({
        input: text,
        model: this.embeddingModel,
      });

      const response = await this.makeRequest(
        '/embeddings',
        'POST',
        body
      );

      const data = JSON.parse(response);

      if (!data.data || !data.data[0] || !data.data[0].embedding) {
        throw new Error('Invalid embedding response');
      }

      return data.data[0].embedding;
    } catch (error) {
      logger.error('Error generating embedding', error);
      throw error;
    }
  }

  async generateWeakTopicAnalysis(solvedProblems: string[], failedProblems: string[]): Promise<string[]> {
    try {
      const prompt = `Analyze the following programming problems and identify weak areas for improvement:

Solved Problems: ${solvedProblems.join(', ')}
Failed/Attempted Problems: ${failedProblems.join(', ')}

Based on the patterns, identify 3-5 main weak areas/topics the user should focus on improving. 
Return as a JSON array of strings.`;

      const response = await this.callOpenAI(prompt);
      const parsed = JSON.parse(response);

      return Array.isArray(parsed) ? parsed : [response];
    } catch (error) {
      logger.error('Error analyzing weak topics', error);
      throw error;
    }
  }

  async generateLearningPathRecommendations(_userId: string, solvedProblems: string[], weakTopics: string[]): Promise<string[]> {
    try {
      const prompt = `Generate a learning path for improving weak programming topics.

User Profile:
- Solved Problems: ${solvedProblems.join(', ')}
- Weak Topics: ${weakTopics.join(', ')}

Provide 5-10 specific, actionable recommendations for improving these weak areas. Focus on:
1. Recommended topics to learn
2. Practice strategies
3. Resource types

Return as a JSON array of strings.`;

      const response = await this.callOpenAI(prompt);
      const parsed = JSON.parse(response);

      return Array.isArray(parsed) ? parsed : [response];
    } catch (error) {
      logger.error('Error generating learning path', error);
      throw error;
    }
  }

  async analyzeContestPerformance(
    problemsAnalyzed: Array<{ name: string; attempts: number; time: number; verdict: string }>
  ): Promise<{
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  }> {
    try {
      const prompt = `Analyze the following contest performance data:

${problemsAnalyzed
  .map(
    (p) =>
      `Problem: ${p.name}, Attempts: ${p.attempts}, Time: ${p.time}min, Verdict: ${p.verdict}`
  )
  .join('\n')}

Provide analysis in JSON format with:
- strengths (array of strings)
- weaknesses (array of strings)
- recommendations (array of actionable recommendations)`;

      const response = await this.callOpenAI(prompt);
      const parsed = JSON.parse(response);

      return {
        strengths: parsed.strengths || [],
        weaknesses: parsed.weaknesses || [],
        recommendations: parsed.recommendations || [],
      };
    } catch (error) {
      logger.error('Error analyzing contest performance', error);
      throw error;
    }
  }

  private buildCodeReviewPrompt(request: CodeReviewRequest): string {
    return `You are an expert code reviewer. Analyze the following ${request.language} code and provide detailed feedback.

Problem Description: ${request.problemDescription}

Code:
\`\`\`${request.language}
${request.code}
\`\`\`

Provide analysis in JSON format with these exact fields:
{
  "timeComplexity": "e.g., O(n log n)",
  "timeComplexityExplanation": "detailed explanation",
  "spaceComplexity": "e.g., O(n)",
  "spaceComplexityExplanation": "detailed explanation",
  "optimizations": [
    {
      "suggestion": "optimization idea",
      "impact": "expected impact",
      "priority": "high/medium/low"
    }
  ],
  "bugs": [
    {
      "type": "bug type",
      "description": "what the bug is",
      "line": line_number,
      "severity": "critical/high/medium/low"
    }
  ],
  "readabilityScore": 0-100,
  "efficiencyScore": 0-100,
  "maintenabilityScore": 0-100,
  "overallScore": 0-100,
  "summary": "brief summary",
  "keyTakeaways": ["key point 1", "key point 2"]
}`;
  }

  private buildInterviewQuestionPrompt(request: InterviewQuestionRequest): string {
    const previousQuestionsText =
      request.previousQuestions && request.previousQuestions.length > 0
        ? `\n\nPrevious questions asked (avoid repeating themes):\n${request.previousQuestions.join('\n')}`
        : '';

    return `Generate a ${request.difficulty} level technical interview question on the topic: ${request.topic}${previousQuestionsText}

Return in JSON format:
{
  "question": "the interview question",
  "expectedApproach": "outline of the expected solution approach",
  "timeLimit": 1800 (in seconds)
}

Make sure the question is specific, challenging but fair for the ${request.difficulty} level, and can be solved in the time limit.`;
  }

  private buildInterviewEvaluationPrompt(request: InterviewEvaluationRequest): string {
    return `Evaluate this interview answer to the following question:

Question: ${request.question}

Expected Approach: ${request.expectedApproach}

User's Answer (${request.language}):
\`\`\`${request.language}
${request.userAnswer}
\`\`\`

Evaluate and return JSON:
{
  "isCorrect": true/false,
  "score": 0-100,
  "feedback": "detailed feedback",
  "codeQuality": 0-100,
  "algorithmicThinking": 0-100,
  "communication": 0-100,
  "areasForImprovement": ["area 1", "area 2"]
}`;
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const body = JSON.stringify({
      model: this.model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert programming assistant and code reviewer. Provide detailed, actionable feedback.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    });

    const response = await this.makeRequest('/chat/completions', 'POST', body);
    const data = JSON.parse(response);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid OpenAI response');
    }

    return data.choices[0].message.content;
  }

  private makeRequest(endpoint: string, method: string, body: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.openai.com',
        path: `/v1${endpoint}`,
        method,
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body),
          Authorization: `Bearer ${this.apiKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
            resolve(data);
          } else {
            reject(new Error(`OpenAI API error: ${res.statusCode} - ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }
}

export const openaiService = new OpenAIService();
