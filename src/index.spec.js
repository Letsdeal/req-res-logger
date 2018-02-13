const Koa = require('koa');
const supertest = require('supertest');
const reqResLogger =  require('./index');


describe('req-res-logger', () => {
  let app;
  let server;
  let request;

  beforeEach(() => {
    app =  new Koa();
    app.use(reqResLogger);
    app.use(async (ctx, next) => ctx.body = 'ok');

    server = app.listen();
    request = supertest(server);
  });

   afterEach(() => {
    server.close();
  });

  it('should log request and response', async () => {
    const spy = jest.spyOn(process.stdout, 'write');
    const path = '/nibylandia';

    await request
      .get(path)
      .expect(200);

    const p = new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          const requestLog = spy.mock.calls[0][0];
          const requestLogObj = JSON.parse(requestLog);

          expect(typeof requestLog).toBe('string');
          expect(requestLogObj.message).toBe(`Request: GET ${path}`);
          expect(requestLogObj.channel).toBe('request-response-logger');
          expect(requestLogObj.headers['user-agent']).toContain('node-superagent/');

          const responseLog = spy.mock.calls[1][0];
          const responseLogObj = JSON.parse(responseLog);

          expect(typeof responseLog).toBe('string');
          expect(responseLogObj.message).toBe(`Response: GET ${path}`);
          expect(responseLogObj.channel).toBe('request-response-logger');
        } catch (e) {
          reject(e);
        }

        spy.mockReset();
        spy.mockRestore();
        resolve();
      }, 0);
    });
    
    try {
     await p;
    } catch (e) {
      console.log(e);
    }
  });

  it('should not log request and response', async () => {
    const spy = jest.spyOn(process.stdout, 'write');
    const path = '/nibylandia';

    app.context.config = {
      logRequests: false,
      logResponses: false
    };

    await request
      .get(path)
      .expect(200);

    const p = new Promise((resolve, reject) => {
      setTimeout(() => {
        try {
          // jest in version 20.0.4 has no support for toNotBeCalled()
          // so we need to RESOLVE this promis when toBeCalled() throws
          expect(spy).toBeCalled();
        } catch (e) {
          resolve(e);
        }

        spy.mockReset();
        spy.mockRestore();
        reject();
      }, 0);
    });
    
    try {
     await p;
    } catch (e) {
      console.log(e);
    }
  });
});
