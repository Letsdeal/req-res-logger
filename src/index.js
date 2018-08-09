const logger = require('logger');

module.exports = async (ctx, next) => {
  const channel = 'request-response-logger';
  const defaultConfig = {logRequests: true, logResponses: true, ignoredPaths: [], ignoredIfOkPaths: []};
  const config = ctx.config && ctx.config.logger ? ctx.config.logger : defaultConfig;
  const isIgnored = isIgnoredPath(ctx.request.path, config.ignoredPaths);
  const isSuccessfulIgnored = isIgnoredPath(ctx.request.path, config.ignoredIfOkPaths);
  let postponedLog = null;

  if (isIgnored) {
    await next();
    return;
  }

  if (config.logRequests) {
    const host = ctx.request.host.split(':');
    const logLabel = `Request: ${ctx.request.method} ${ctx.request.url}`;
    const logBody = {
      channel,
      context: {
        request: {
          method: ctx.request.method,
          requestTarget: ctx.request.url,
          uri: {
            scheme: ctx.request.protocol,
            authority: null,
            userInfo: null,
            host: host[0],
            port: host.length === 2 ? host[1] : null,
            path: ctx.request.path,
            query: ctx.request.querystring,
            fragment: null
          },
          headers: ctx.request.header,
          body: null
        }
      }
    };

    if (isSuccessfulIgnored) {
      postponedLog = {logLabel, logBody};
    } else {
      logger.info(logLabel, logBody);
    }
  }

  await next();

  const ignoreResponse = isSuccessfulIgnored && isResponseOk(ctx.response.status);
  if (config.logResponses && !ignoreResponse) {
    if (postponedLog !== null) {
      logger.info(postponedLog.logLabel, postponedLog.logBody);
      postponedLog = null;
    }

    logger.info(`Response: ${ctx.request.method} ${ctx.request.url}`, {
      channel,
      context: {
        response: {
          statusCode: ctx.response.status,
          reasonPhrase: ctx.response.message,
          headers: ctx.response.header
        }
      }
    });
  }
};

function isIgnoredPath(path, paths) {
  if (undefined === paths) return false;
  for (let i = 0; i < paths.length; i++) {
    if (path.match(paths[i]) !== null) return true;
  }
  return false;
}

function isResponseOk(status) {
  return status >= 200 && status <= 299;
}
