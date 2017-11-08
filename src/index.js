const logger = require('logger');

module.exports = async (ctx, next) => {
  const channel = 'request-response-logger';
  const logRequests = ctx.config ? ctx.config.logRequests : true;
  const logResponses = ctx.config ? ctx.config.logResponses : true;

  if (logRequests) {
    host = ctx.request.host.split(":");

    logger.info(`Request: ${ctx.request.method} ${ctx.request.url}`, {
      channel,
      context: {
        request: {
          method: ctx.request.method,
          requestTarget: ctx.request.url,
          protocolVersion: null,
          uri: {
            scheme: ctx.request.protocol,
            authority: null,
            userInfo: null,
            host: host[0],
            port: host.length == 2 ? host[1] : null,
            path: ctx.request.path,
            query: ctx.request.querystring,
            fragment: null
          },
          headers: ctx.request.header,
          body: null
        }
      }
    });
  }

  await next();

  if (logResponses) {
    logger.info(`Response: ${ctx.request.method} ${ctx.request.url}`, {
      channel,
      context: {
        response: {
          statusCode: ctx.response.status,
          reasonPhrase: ctx.response.message,
          protocolVersion: null,
          headers: ctx.response.header,
          body: ctx.response.body
        }
      }
    });
  }
};
