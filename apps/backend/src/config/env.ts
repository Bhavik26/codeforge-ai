import dotenv from 'dotenv';

dotenv.config();

const getEnvVar = (name: string, defaultValue?: string): string => {
  const value = process.env[name];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value !== undefined && value !== '' ? value : defaultValue || '';
};

const getNumberEnvVar = (name: string, defaultValue?: number): number => {
  const value = process.env[name];
  if (!value && defaultValue === undefined) {
    throw new Error(`Environment variable ${name} is not set`);
  }
  return value ? parseInt(value, 10) : defaultValue || 0;
};

export const config = {
  // Application
  env: getEnvVar('NODE_ENV', 'development'),
  isDevelopment: process.env.NODE_ENV !== 'production',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  server: {
    host: getEnvVar('SERVER_HOST', 'localhost'),
    port: getNumberEnvVar('SERVER_PORT', 3001),
  },

  // Database
  database: {
    url: getEnvVar('DATABASE_URL'),
    poolSize: getNumberEnvVar('DATABASE_POOL_SIZE', 20),
    poolTimeout: getNumberEnvVar('DATABASE_POOL_TIMEOUT', 30000),
  },

  // Redis
  redis: {
    host: getEnvVar('REDIS_HOST', 'localhost'),
    port: getNumberEnvVar('REDIS_PORT', 6379),
    password: process.env.REDIS_PASSWORD,
    db: getNumberEnvVar('REDIS_DB', 0),
  },

  // JWT
  jwt: {
    accessTokenSecret: getEnvVar('JWT_ACCESS_TOKEN_SECRET', 'codeforge-dev-access-secret-key-change-in-production'),
    refreshTokenSecret: getEnvVar('JWT_REFRESH_TOKEN_SECRET', 'codeforge-dev-refresh-secret-key-change-in-production'),
    accessTokenExpiry: getEnvVar('JWT_ACCESS_TOKEN_EXPIRY', '15m'),
    refreshTokenExpiry: getEnvVar('JWT_REFRESH_TOKEN_EXPIRY', '7d'),
  },

  // OAuth
  oauth: {
    googleClientId: getEnvVar('GOOGLE_CLIENT_ID', 'dummy-client-id-for-development'),
    googleClientSecret: getEnvVar('GOOGLE_CLIENT_SECRET', 'dummy-client-secret-for-development'),
    googleCallbackUrl: getEnvVar('GOOGLE_CALLBACK_URL', 'http://localhost:3001/api/v1/auth/google/callback'),
  },

  // CORS
  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:3000').split(','),
  },

  // Code Execution
  judge: {
    maxExecutionTime: getNumberEnvVar('JUDGE_MAX_EXECUTION_TIME', 5000), // ms
    maxMemoryUsage: getNumberEnvVar('JUDGE_MAX_MEMORY_USAGE', 256), // MB
    dockerNetwork: getEnvVar('DOCKER_NETWORK', 'bridge'),
  },

  // AI Services
  ai: {
    openaiApiKey: getEnvVar('OPENAI_API_KEY', 'sk-dummy-key-for-development'),
    openaiModel: getEnvVar('OPENAI_MODEL', 'gpt-4'),
    openaiEmbeddingModel: getEnvVar('OPENAI_EMBEDDING_MODEL', 'text-embedding-3-small'),
    enableAiReviews: getEnvVar('ENABLE_AI_REVIEWS', 'false') === 'true',
    enableAiInterview: getEnvVar('ENABLE_AI_INTERVIEW', 'false') === 'true',
    enableRecommendations: getEnvVar('ENABLE_RECOMMENDATIONS', 'false') === 'true',
  },

  // Email
  email: {
    sendgridApiKey: process.env.SENDGRID_API_KEY,
    fromEmail: getEnvVar('EMAIL_FROM', 'noreply@codeforgeai.com'),
  },

  // Storage
  storage: {
    s3Bucket: getEnvVar('S3_BUCKET', ''),
    s3Region: getEnvVar('S3_REGION', 'us-east-1'),
  },

  // Rate Limiting
  rateLimit: {
    windowMs: getNumberEnvVar('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
    maxRequests: getNumberEnvVar('RATE_LIMIT_MAX_REQUESTS', 100),
  },

  // Logging
  logging: {
    level: getEnvVar('LOG_LEVEL', 'info'),
    logFile: getEnvVar('LOG_FILE', 'logs/app.log'),
    maxFiles: getNumberEnvVar('LOG_MAX_FILES', 14),
  },

  // Monitoring
  monitoring: {
    datadogApiKey: process.env.DATADOG_API_KEY,
    enableDatadog: getEnvVar('ENABLE_DATADOG', 'false') === 'true',
  },
};
