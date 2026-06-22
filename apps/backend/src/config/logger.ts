import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { config } from './env';

// Create logs directory if it doesn't exist
const logsDir = path.dirname(config.logging.logFile);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const levelColors = {
  error: '\x1b[31m',   // red
  warn: '\x1b[33m',    // yellow
  info: '\x1b[36m',    // cyan
  debug: '\x1b[35m',   // magenta
  reset: '\x1b[0m',
};

const customFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const color = levelColors[level as keyof typeof levelColors] || '';
    const metaString = Object.keys(meta).length ? JSON.stringify(meta) : '';
    const stack = meta.stack ? `\n${meta.stack}` : '';
    return `${color}[${timestamp}] ${level.toUpperCase()}${levelColors.reset} ${message} ${metaString}${stack}`;
  })
);

export const logger = winston.createLogger({
  level: config.logging.level,
  format: customFormat,
  defaultMeta: { service: 'codeforge-ai' },
  transports: [
    new winston.transports.Console({
      format: customFormat,
    }),
    new winston.transports.File({
      filename: config.logging.logFile,
      maxsize: 10485760, // 10MB
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 10485760,
      maxFiles: config.logging.maxFiles,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
    }),
  ],
});

if (config.isDevelopment) {
  logger.debug('Logger initialized in development mode');
}

export default logger;
