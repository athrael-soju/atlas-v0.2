import winston from 'winston';
import LokiTransport from 'winston-loki';

// Create a Winston logger and configure it to use the Loki transport
export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `${timestamp} [${level.toUpperCase()}]: ${message} ${JSON.stringify(
        meta
      )}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new LokiTransport({
      host: process.env.LOKI_URL || 'http://host.docker.internal:3100',
      labels: { job: process.env.LABEL_JOB || 'atlas-ii' },
      json: true,
      format: winston.format.json(),
      replaceTimestamp: true
    })
  ]
});
