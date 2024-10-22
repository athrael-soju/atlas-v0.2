import winston from 'winston';
import LokiTransport from 'winston-loki';
import os from 'os';

let loggerInstance: winston.Logger; // Variable to hold the singleton instance

// Set max listeners limit to prevent warning (optional but good to include)
process.setMaxListeners(20);

// Function to initialize the logger only once
const createLogger = () => {
  if (loggerInstance) {
    return loggerInstance; // Return the existing instance
  }

  // Determine log level and format based on environment
  const logLevel = process.env.LOG_LEVEL || 'info';
  const isProduction = process.env.NODE_ENV === 'production';

  // Dynamic labels for Loki
  const labels = {
    job: process.env.LABEL_JOB || 'atlasv0.2',
    env: process.env.NODE_ENV || 'development',
    hostname: os.hostname()
  };

  // Format for development (human-readable) and production (JSON)
  const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message}`;
    })
  );

  const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    winston.format.json() // Structured logs for better parsing in production
  );

  // Create the logger
  loggerInstance = winston.createLogger({
    level: logLevel,
    format: isProduction ? prodFormat : devFormat,
    transports: [
      new winston.transports.Console(),
      new LokiTransport({
        host: process.env.LOKI_URL || 'http://host.docker.internal:3100',
        labels: labels,
        json: true,
        format: winston.format.json(),
        replaceTimestamp: true
      })
    ]
  });

  // Handle uncaught exceptions and unhandled rejections - apply globally ONCE
  if (
    !process
      .listeners('uncaughtException')
      .some((listener) => listener.name === 'handleExceptions')
  ) {
    process.on('uncaughtException', (err) => {
      loggerInstance.error(`Uncaught Exception: ${err.message}`, {
        stack: err.stack
      });
    });
  }

  if (
    !process
      .listeners('unhandledRejection')
      .some((listener) => listener.name === 'handleRejections')
  ) {
    process.on('unhandledRejection', (reason) => {
      loggerInstance.error(`Unhandled Rejection: ${reason}`);
    });
  }

  return loggerInstance; // Return the newly created instance
};

// Export the logger singleton
export const logger = createLogger();
