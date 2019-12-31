/*
    slack-sig-check
    By Wyatt Calandro <wyatt@wcalandro.com>
    Module adapted from this post: https://medium.com/@rajat_sriv/verifying-requests-from-slack-using-node-js-69a8b771b704
*/

// Import necessary crytography and parsing modules
import { createHmac, timingSafeEqual } from 'crypto';

// Import express types for middleware
import { Request, Response, NextFunction } from 'express';

// Import modules needed to parse the raw request body
import * as rawBodyParser from 'raw-body';
import * as contentType from 'content-type';

// Needed so Typescript doesn't throw errors about the rawBody property not existing
interface CustomRequest extends Request {
  rawBody: any; // tslint:disable-line:no-any
}

// Parse raw body
async function parseRawBody(req: CustomRequest): Promise<string> {
  return new Promise((resolve, reject) => {
    rawBodyParser(
      req,
      {
        length: req.headers['content-length'],
        limit: '1mb',
        encoding: contentType.parse(req).parameters.charset,
      },
      (err, str) => {
        if (err) return reject(err);
        req.body = str;
        resolve(str);
      }
    );
  });
}

export class SlackSigChecker {
  private secret: string;
  constructor(secret: string) {
    // Check for empty string passed to constructor
    if (!secret) {
      throw new Error('Slack signing secret cannot be empty!');
    }

    this.secret = secret;
  }

  private compareSignatures(
    signature: string,
    body: string,
    timestamp: string
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Check for arguments
      if (!signature) {
        reject(new Error('Signature argument must not be empty!'));
        return;
      }
      if (!body) {
        reject(new Error('Body argument must not be empty!'));
        return;
      }
      if (!timestamp) {
        reject(new Error('Timestamp argument must not be empty!'));
        return;
      }

      // String to be signed
      const signingString = `v0:${timestamp}:${body}`;

      // Generate our own signature.
      const ourSignature =
        'v0=' +
        createHmac('sha256', this.secret)
          .update(signingString, 'utf8')
          .digest('hex');

      // Compare our signature with the one provided and return the result.
      const ourSignatureBuffer = Buffer.from(ourSignature, 'utf8');
      const slackSignatureBuffer = Buffer.from(signature, 'utf8');
      if (
        ourSignatureBuffer.length === slackSignatureBuffer.length &&
        timingSafeEqual(ourSignatureBuffer, slackSignatureBuffer)
      ) {
        resolve(true);
      } else {
        resolve(false);
      }
    });
  }

  checkSignature(
    signature: string,
    body: string,
    timestamp: string,
    callback?: (isValid: boolean | null, err: Error | null) => void
  ): Promise<boolean> | undefined {
    if (callback) {
      // If the user is passing a callback, we handle the Promise ourselves and call their callback.
      this.compareSignatures(signature, body, timestamp)
        .then((isValid: boolean) => {
          callback(isValid, null);
        })
        .catch((err: Error) => {
          callback(null, err);
        });
      return undefined;
    } else {
      // If the user is using this as a Promise, just return the Promise returned by compareSignatures.
      return this.compareSignatures(signature, body, timestamp);
    }
  }

  middleware(): (
    req: CustomRequest,
    res: Response,
    next: NextFunction
  ) => void {
    return (req: CustomRequest, res: Response, next) => {
      // Check for x-slack-signature header.
      const signatureHeader = req.headers['x-slack-signature'];
      let signature: string;
      if (typeof signatureHeader === 'string') {
        signature = signatureHeader;
      } else if (
        signatureHeader instanceof Array &&
        signatureHeader.length >= 1
      ) {
        // If multiple signatures were provided, choose the first one.
        signature = signatureHeader[0];
      } else {
        // Signature wasn't provided, return a bad request error.
        res.status(400).send("'x-slack-signature' header is missing.");
        return;
      }

      // Check for x-slack-request-timestamp header.
      const timestampHeader = req.headers['x-slack-request-timestamp'];
      let timestamp: string;
      if (typeof timestampHeader === 'string') {
        timestamp = timestampHeader;
      } else if (
        timestampHeader instanceof Array &&
        timestampHeader.length >= 1
      ) {
        // If multiple timestamps were provided, choose the first one.
        timestamp = timestampHeader[0];
      } else {
        // Timestamp wasn't provided, return a bad request error.
        res.status(400).send("'x-slack-request-timestamp' header is missing.");
        return;
      }

      let bodyPromise: Promise<string>;

      // Check for already-parsed body
      if (req.body !== undefined && req.rawBody === undefined) {
        next(
          new Error(
            'Body parsing detected, and the rawBody parameter is empty. Unable to check validity of webhook signature.'
          )
        );
        return;
      } else if (req.body !== undefined && req.rawBody !== undefined) {
        bodyPromise = Promise.resolve(req.rawBody);
      } else {
        bodyPromise = parseRawBody(req);
      }

      bodyPromise
        .then(body => {
          if (body === undefined) {
            res.status(400).send('Body is missing!');
          }

          this.compareSignatures(signature, body, timestamp)
            .then(isValid => {
              if (isValid) {
                next();
              } else {
                res.status(400).send('Slack signature mismatch.');
                return;
              }
            })
            .catch(err => {
              next(err);
            });
        })
        .catch(err => next(err));
    };
  }
}
