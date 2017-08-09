const winston = require('winston');
const logger = createLogger();


module.exports = async (ctx, next) => {
  const requestId = +new Date();
  const channel = 'request-response-logger';
  const logRequests = ctx.config ? ctx.config.logRequests : true;
  const logResponses = ctx.config ? ctx.config.logResponses : true;

  if (logRequests) {
    logger.info(`Request: ${ctx.request.method} ${ctx.request.url}`, {
      id: requestId,
      channel,
      method: ctx.request.method,
      url: ctx.request.href,
      headers: ctx.request.headers,
      ip: ctx.request.ip,
    });
  }

  await next();

  if (logResponses) {
    logger.info(`Response: ${ctx.request.method} ${ctx.request.url}`, {
      requestId,
      channel,
      status: ctx.response.status,
      headers: ctx.response.headers,
      body: ctx.response.body,
    });
  }
};

//////////////////////////////////////////////////////////////////////

function createLogger() {
  const consoleTransport = new (winston.transports.Console)({
    timestamp,
    formatter
  });

  const logger = new (winston.Logger)({
    transports: [ consoleTransport ]
  });

  return logger;
};

function timestamp() {
  return Date.now();
};

function formatter(options) {
  const { timestamp, level: severity, message, meta } = options;
  const logTimestamp = timestamp();

  const seconds = Math.floor(logTimestamp / 1000);
  const milli = new Date(logTimestamp).getMilliseconds();
  const nanos = 0;

  const channel = 'not-defined';

  if (!message) {
    message = '';
  }

  let log = {
    message,
    severity,
    channel,
    timestamp: { seconds, milli, nanos },
  };

  if (isPojo(meta)) {
    Object.assign(log, meta);
  }

  log = JSON.stringify(log);
  log = sanitizeLog(log);

  return log;
};

function isPojo(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};

function sanitizeLog(log) {
  // TODO: sanitize policy
  return log;
};
