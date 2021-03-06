const
  winston = require('winston'),
  settings = require('./settings'),
  dailyRotateFileTransport = require('winston-daily-rotate-file');

/**
 * configuration of root logger with two appenders.
 * see settings.js for loglevel and filename
 */
winston.loggers.options.transports = [
  new winston.transports.Console({
    level: settings.log.console.level,
    showLevel: false,
    timestamp: true
  }),
  new dailyRotateFileTransport({
    filename: settings.log.file.name,
    level: settings.log.file.level,
    json: false,
    timestamp: true
  })
];

/**
 * Returns a new Logger for your component
 *
 * @param {string} loggerName
 * @returns {object} the new Logger
 */
function getLogger(loggerName) {
  var newLogger = winston.loggers.add(loggerName);
  newLogger.filters.push((level, msg, meta) => {
    return {
      msg: `[${level}] ${loggerName}: ${msg}`,
      meta: meta
    };
  });

  return newLogger;
}

module.exports = {getLogger};
