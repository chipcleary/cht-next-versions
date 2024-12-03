import log from 'loglevel';

let loggerInstance = null;

function createLogger() {
  if (loggerInstance) {
    return loggerInstance;
  }

  loggerInstance = log;
  loggerInstance.setLevel('info');
  return loggerInstance;
}

export const logger = createLogger();
