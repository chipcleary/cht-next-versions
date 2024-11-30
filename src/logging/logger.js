import winston from 'winston';

let loggerInstance = null;

function createLogger() {
  if (loggerInstance) {
    return loggerInstance;
  }

  loggerInstance = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `[${timestamp}] [${level.toUpperCase()}] ${message} ${
          Object.keys(meta).length ? JSON.stringify(meta) : ''
        }`;
      })
    ),
    transports: [new winston.transports.Console()],
  });

  return loggerInstance;
}

export const logger = createLogger();
