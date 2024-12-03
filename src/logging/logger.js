// logger.js
import log from 'loglevel';

const LOG_LEVELS = {
  TRACE: 'trace',
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error',
  SILENT: 'silent',
  VERBOSE: 'verbose',
};

class Logger {
  static instance;

  constructor() {
    this.logger = log.getLogger('app-logger');
    this.setInitialLevel();
    this.setupCustomMethods();
  }

  static getInstance() {
    if (typeof window === 'undefined') {
      return new Logger(); // New instance for SSR
    }

    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setInitialLevel() {
    const level =
      typeof window !== 'undefined' ? process.env.NEXT_PUBLIC_LOG_LEVEL || 'info' : 'silent';
    this.logger.setLevel(level);
  }

  setupCustomMethods() {
    // Add verbose as alias for debug
    this.verbose = this.logger.debug.bind(this.logger);
  }

  setLevel(level) {
    this.logger.setLevel(level);
  }

  info(message, ...args) {
    this.logger.info(this.formatMessage(message), ...args);
  }

  debug(message, ...args) {
    this.logger.debug(this.formatMessage(message), ...args);
  }

  warn(message, ...args) {
    this.logger.warn(this.formatMessage(message), ...args);
  }

  error(message, ...args) {
    this.logger.error(this.formatMessage(message), ...args);
  }

  verbose(message, ...args) {
    // Implementation added in setupCustomMethods
  }

  formatMessage(message) {
    return `[${new Date().toISOString()}] ${message}`;
  }
}

export const logger = Logger.getInstance();
