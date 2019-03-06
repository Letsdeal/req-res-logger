const { createLogger, transports } = require('winston');

const defaultLogger = createLogger({
  transports: [new transports.Console()]
});

module.exports = async (ctx, next) => {
  const defaultConfig = {
    headersFilter: '',
    logRequests: true,
    logResponses: true,
    ignoredPaths: [],
    ignoredIfOkPaths: [],
    logger: defaultLogger
  };
  const config = { ...defaultConfig, ...ctx.config.logger };
  const headersFilter = config.headersFilter ? new RegExp(config.headersFilter) : null;
  const isIgnored = isIgnoredPath(ctx.request.path, config.ignoredPaths);
  const isSuccessfulIgnored = isIgnoredPath(ctx.request.path, config.ignoredIfOkPaths);
  let postponedLog = null;

  if (isIgnored) {
    await next();
    return;
  }

  const host = ctx.request.host.split(':')[0];

  if (config.logRequests) {
    const logLabel = `Request: ${ctx.request.method} ${ctx.request.url}`;
    const logBody = {
      request: {
        method: ctx.request.method,
        uri: {
          scheme: ctx.request.protocol,
          host,
          path: ctx.request.path,
          query: ctx.request.querystring,
        },
        headers: filterHeaders(ctx.request.header, headersFilter)
      },
      _ctx: ctx
    };

    if (isSuccessfulIgnored) {
      postponedLog = {logLabel, logBody};
    } else {
      config.logger.info(logLabel, logBody);
    }
  }

  await next();

  const ignoreResponse = isSuccessfulIgnored && isResponseOk(ctx.response.status);
  if (config.logResponses && !ignoreResponse) {
    if (postponedLog !== null) {
      config.logger.info(postponedLog.logLabel, postponedLog.logBody);
      postponedLog = null;
    }

    config.logger.info(`Response: ${ctx.request.method} ${ctx.request.url}`, {
      request: {
        method: ctx.request.method,
        uri: {
          scheme: ctx.request.protocol,
          host,
          path: ctx.request.path,
          query: ctx.request.querystring,
        }
      },
      response: {
        statusCode: ctx.response.status,
        reasonPhrase: ctx.response.message,
        headers: filterHeaders(ctx.response.header, headersFilter)
      },
      _ctx: ctx
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
