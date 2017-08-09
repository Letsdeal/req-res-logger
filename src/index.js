const logger = require('logger');


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
