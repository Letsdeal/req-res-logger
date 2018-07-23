const Koa = require('koa');
const supertest = require('supertest');
const reqResLogger =  require('./index');

const clui = {
  paint(msg) {
    console.log(`================ ${msg} ================`);
  }
};


describe('req-res-logger', () => {
  let app;
  let server;
  let request;

  beforeEach(() => {
    app =  new Koa();
    app.use(reqResLogger);

    app.use(async (ctx, next) => {
      if ('throw_error' in ctx.query) {
        ctx.throw('error');
        return;
      }

      await next();
    });

    app.use(async (ctx, next) => ctx.body = 'ok');

    server = app.listen();
    request = supertest(server);

    clui.paint('log session start');
  });

   afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();

    server.close();

    clui.paint('log session end');
  });

  it('should log request and response', async () => {
    const spy = jest.spyOn(process.stdout, 'write');
    const path = '/nibylandia';

    await request.get(path);

    await (async () => {
      const requestLog = spy.mock.calls[0][0];
      const requestLogObj = JSON.parse(requestLog);

      expect(typeof requestLog).toBe('string');
      expect(requestLogObj.message).toBe(`Request: GET ${path}`);
      expect(requestLogObj.channel).toBe('request-response-logger');
      expect(requestLogObj.context.request.headers['user-agent']).toContain('node-superagent/');

      const responseLog = spy.mock.calls[1][0];
      const responseLogObj = JSON.parse(responseLog);

      expect(typeof responseLog).toBe('string');
      expect(responseLogObj.message).toBe(`Response: GET ${path}`);
      expect(responseLogObj.channel).toBe('request-response-logger');
    })();
  });

  it('should not log request and response', async () => {
    const spy = jest.spyOn(process.stdout, 'write');
    const path = '/nibylandia';

    app.context.config = {
      logger: {
        logRequests: false,
        logResponses: false,
      }
    };

    await request.get(path);

    await (async () => {
      expect(spy).toHaveBeenCalledTimes(0);
    })();

  });

  it('should log only errors from given path', async () => {
    const spy = jest.spyOn(process.stdout, 'write');
    const path = '/healthz';

    app.context.config = {
      logger: {
        logRequests: true,
        logResponses: true,
        ignoredIfOkPaths: ['/healthz'],
      }
    };

    await request.get(path);

    await (async () => {
      expect(spy).toHaveBeenCalledTimes(0);
    })();
  });
});
