const logger = require('logger');

module.exports = async (ctx, next) => {
  const channel = 'request-response-logger';
  const defaultConfig = {
    headersFilter: '',
    logRequests: true,
    logResponses: true,
    ignoredPaths: [],
    ignoredIfOkPaths: []
  };
  const config = ctx.config && ctx.config.logger ? ctx.config.logger : defaultConfig;
  const headersFilter = config.headersFilter ? new RegExp(config.headersFilter) : null;
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
      request: {
        method: ctx.request.method,
        requestTarget: ctx.request.url,
        uri: {
          scheme: ctx.request.protocol,
          host: host[0],
          port: host.length === 2 ? host[1] : null,
          path: ctx.request.path,
          query: ctx.request.querystring,
        },
        headers: filterHeaders(ctx.request.header, headersFilter)
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
      response: {
        statusCode: ctx.response.status,
        reasonPhrase: ctx.response.message,
        headers: filterHeaders(ctx.response.header, headersFilter)
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

function filterHeaders(headers, headersFilter) {
  if (!headersFilter) {
    return headers;
  }

  return Object.keys(headers)
    .filter(key => !key.match(headersFilter))
    .reduce((obj, key) => {
      obj[key] = raw[key];
      return obj;
    }, {});
}
