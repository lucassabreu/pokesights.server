// origin : https://gist.github.com/rtgibbons/7354879

console.log('even gets to here?');

var winston = require('winston');
var _ = require('lodash');

// Set up logger
var customColors = {
  trace: 'white',
  debug: 'green',
  info: 'green',
  warn: 'yellow',
  crit: 'red',
  fatal: 'red'
};

var log_file_dir = process.env.LOG_FILE_DIR || "./logs";

var logger = new(winston.Logger)({
  colors: customColors,
  transports: [
    new(winston.transports.Console)({
        level: process.env.CONSOLE_LOG_LEVEL || 'silly',
        colorize: true,
        timestamp: true
    }),
    new (winston.transports.File)({
        level: process.env.FILE_LOG_LEVEL || 'silly',
        maxside : 100 * 1024 * 1024, // 100 MB
        filename: log_file_dir + '/execution.log' 
    })
  ]
});

winston.addColors(customColors);

// Extend logger object to properly log 'Error' types
var origLog = logger.log;

logger.log = function (level, msg) {
  var objType = Object.prototype.toString.call(msg);
  if (objType === '[object Error]') {
    origLog.call(logger, level, msg.toString());
  } else {
    origLog.call(logger, level, msg);
  }
};
/* LOGGER EXAMPLES
    app.logger.trace('testing');
    app.logger.debug('testing');
    app.logger.info('testing');
    app.logger.warn('testing');
    app.logger.crit('testing');
    app.logger.fatal('testing');
    */

module.exports = logger;