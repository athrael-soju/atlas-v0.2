import winston from 'winston';
import LokiTransport from 'winston-loki';
import os from 'os';

let loggerInstance: winston.Logger; // Variable to hold the singleton instance

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
    job: process.env.LABEL_JOB || 'atlasv1',
    env: process.env.NODE_ENV || 'development',
    hostname: os.hostname()
  };

  // Add custom metadata (service name, environment, requestId)
  const addCustomMetadata = winston.format((info) => {
    info.customMetadata = {
      service: 'winston-service',
      environment: process.env.NODE_ENV || 'development',
      requestId: info.requestId || 'N/A' // This could be dynamically set per request in real use
    };
    return info;
  });

  // Format for development (human-readable) and production (JSON)
  const devFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp(),
    addCustomMetadata(),
    winston.format.printf(
      ({ timestamp, level, message, customMetadata, ...meta }) => {
        return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(
          customMetadata
        )} ${JSON.stringify(meta)}`;
      }
    )
  );

  const prodFormat = winston.format.combine(
    winston.format.timestamp(),
    addCustomMetadata(),
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

  // Handle uncaught exceptions and unhandled rejections
  loggerInstance.exceptions.handle(
    new winston.transports.File({ filename: 'exceptions.log' })
  );

  loggerInstance.rejections.handle(
    new winston.transports.File({ filename: 'rejections.log' })
  );

  // Optional: If you want to log unhandled exceptions to Loki, you can do:
  loggerInstance.exceptions.handle(
    new winston.transports.Console(), // Console transport for visibility
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://host.docker.internal:3100',
      labels: labels,
      json: true,
      replaceTimestamp: true
    })
  );

  loggerInstance.rejections.handle(
    new winston.transports.Console(), // Console transport for visibility
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://host.docker.internal:3100',
      labels: labels,
      json: true,
      replaceTimestamp: true
    })
  );

  return loggerInstance; // Return the newly created instance
};

// Export the logger singleton
export const logger = createLogger();
