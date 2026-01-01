/**
 * Simple logging utility with log levels
 * Can be replaced with winston/pino in production
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const currentLevel = LOG_LEVELS[process.env.LOG_LEVEL] ?? LOG_LEVELS.info;

const formatMessage = (level, message) => {
  const timestamp = new Date().toISOString();
  const levelIcons = {
    error: '❌',
    warn: '⚠️',
    info: '✅',
    debug: '🔍'
  };
  return `${timestamp} [${levelIcons[level]} ${level.toUpperCase()}] ${message}`;
};

const logger = {
  error: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.error) {
      console.error(formatMessage('error', message), ...args);
    }
  },

  warn: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.warn) {
      console.warn(formatMessage('warn', message), ...args);
    }
  },

  info: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.info) {
      console.info(formatMessage('info', message), ...args);
    }
  },

  debug: (message, ...args) => {
    if (currentLevel >= LOG_LEVELS.debug) {
      console.debug(formatMessage('debug', message), ...args);
    }
  }
};

module.exports = logger;
