const expect = require('chai').expect;

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

describe('checkSignature', () => {
  describe('Promises', () => {
    it('returns true with no errors when everything matches', done => {
      validChecker
        .checkSignature(validSignature, validBody, validTimestamp)
        .then(isValid => {
          expect(isValid).to.be.true;
          done();
        })
        .catch(err => {
          done(err);
        });
    });
    it('returns false with no errors with invalid signature', done => {
      validChecker
        .checkSignature(invalidSignature, validBody, validTimestamp)
        .then(isValid => {
          expect(isValid).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('returns false with no errors with invalid body', done => {
      validChecker
        .checkSignature(validSignature, invalidBody, validTimestamp)
        .then(isValid => {
          expect(isValid).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('returns false with no errors with invalid timestamp', done => {
      validChecker
        .checkSignature(validSignature, validBody, invalidTimestamp)
        .then(isValid => {
          expect(isValid).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
    });

    it('returns false with no errors with invalid secret', done => {
      invalidChecker
        .checkSignature(validSignature, validBody, validTimestamp)
        .then(isValid => {
          expect(isValid).to.be.false;
          done();
        })
        .catch(err => {
          done(err);
        });
    });
  });

  describe('Callback', () => {
    it('returns true with no errors when everything matches', done => {
      validChecker.checkSignature(
        validSignature,
        validBody,
        validTimestamp,
        (isValid, err) => {
          expect(isValid).to.be.true;
          expect(err).to.be.null;
          done();
        }
      );
    });

    it('returns false with no errors with invalid signature', done => {
      validChecker.checkSignature(
        invalidSignature,
        validBody,
        validTimestamp,
        (isValid, err) => {
          expect(isValid).to.be.false;
          expect(err).to.be.null;
          done();
        }
      );
    });

    it('returns false with no errors with invalid body', done => {
      validChecker.checkSignature(
        validSignature,
        invalidBody,
        validTimestamp,
        (isValid, err) => {
          expect(isValid).to.be.false;
          expect(err).to.be.null;
          done();
        }
      );
    });

    it('returns false with no errors with invalid timestamp', done => {
      validChecker.checkSignature(
        validSignature,
        validBody,
        invalidTimestamp,
        (isValid, err) => {
          expect(isValid).to.be.false;
          expect(err).to.be.null;
          done();
        }
      );
    });

    it('returns false with no errors with invalid secret', done => {
      invalidChecker.checkSignature(
        validSignature,
        validBody,
        validTimestamp,
        (isValid, err) => {
          expect(isValid).to.be.false;
          expect(err).to.be.null;
          done();
        }
      );
    });
  });
});
