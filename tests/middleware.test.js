const expect = require('chai').expect;
const express = require('express');
const r = require('request');
const getRawBody = require('raw-body');
const contentType = require('content-type');

const { SlackSigChecker } = require('../lib/index');
const validChecker = new SlackSigChecker('a1da431c6adc53bcfdea5d6352ed9878');
const invalidChecker = new SlackSigChecker('invalidsecret');

const validTimestamp = '1577809313';
const invalidTimestamp = '1577809200';
const validSignature =
  'v0=3bf4cabc132db27277c51b2e19d04e2f709431868143e50391127e54d48fea4d';
const invalidSignature =
  'v0=3bf4cabc132db27277c51b2e19d04e2f709431868143e50391127e54d48fea00';
const validBody =
  'token=RjdxZpjo204FabduagQzAhFO&team_id=TQQ011VJT&team_domain=test12-31-2019&channel_id=CQE6FL1AM&channel_name=group-project&user_id=UQQ011W1M&user_name=wyattcalandro&command=%2Ftest&text=Test&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTQQ011VJT%2F879842384065%2Fj5NHApWyoxkMUft3FCVGKftp&trigger_id=878611932339.840001063639.2f9a762a9fa499ed64f5047a0412416f';
const invalidBody = 'invalid';

async function makeRequest(options) {
  return new Promise(resolve => {
    r.post(options, function(err, res, body) {
      if (err) throw err;
      return resolve({ statusCode: res.statusCode, body: body });
    });
  });
}

before(done => {
  const app = express();
  const bodyParserRouter = express.Router();
  bodyParserRouter.use(
    require('body-parser').urlencoded({
      extended: false,
      verify: (req, res, buf) => (req.rawBody = buf),
    })
  );
  bodyParserRouter.use(validChecker.middleware());
  bodyParserRouter.post('/', (_, res) => res.end('Success!'));
  app.use('/bodyParser', bodyParserRouter);

  const rawRouter = express.Router();
  rawRouter.use(validChecker.middleware());
  rawRouter.post('/', (_, res) => res.end('Success!'));
  app.use('/raw', rawRouter);

  const invalidCheckerRouter = express.Router();
  invalidCheckerRouter.use(invalidChecker.middleware());
  invalidCheckerRouter.post('/', (_, res) => res.end('Success!'));
  app.use('/invalidChecker', invalidCheckerRouter);

  app.listen(45862, done);
});

describe('Middleware', () => {
  describe('Body Parser Router', () => {
    it('request goes through with valid signature', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.equal('Success!');
        done();
      });
    });

    it('request fails with invalid signature', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': invalidSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with invalid body', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: invalidBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with invalid timestamp', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': invalidTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with missing timestamp', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: validBody,
        headers: {
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal(
          "'x-slack-request-timestamp' header is missing."
        );
        done();
      });
    });

    it('request fails with missing signature', done => {
      const request = {
        uri: 'http://localhost:45862/bodyParser',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal("'x-slack-signature' header is missing.");
        done();
      });
    });
  });

  describe('Raw Body Router', () => {
    it('request goes through with valid signature', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(200);
        expect(result.body).to.equal('Success!');
        done();
      });
    });

    it('request fails with invalid signature', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': invalidSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with invalid body', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: invalidBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with invalid timestamp', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': invalidTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });

    it('request fails with missing timestamp', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: validBody,
        headers: {
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal(
          "'x-slack-request-timestamp' header is missing."
        );
        done();
      });
    });

    it('request fails with missing signature', done => {
      const request = {
        uri: 'http://localhost:45862/raw',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal("'x-slack-signature' header is missing.");
        done();
      });
    });
  });

  describe('Invalid Secret Checker', () => {
    it('request fails for invalid secret', done => {
      const request = {
        uri: 'http://localhost:45862/invalidChecker',
        body: validBody,
        headers: {
          'x-slack-request-timestamp': validTimestamp,
          'x-slack-signature': validSignature,
          'content-type': 'application/x-www-form-urlencoded',
        },
      };
      makeRequest(request).then(result => {
        expect(result.statusCode).to.equal(400);
        expect(result.body).to.equal('Slack signature mismatch.');
        done();
      });
    });
  });
});
