# Slack Webhook Signature Checker
An NPM module for checking the integrity of Slack webhook signatures

# Getting started
```js
const SlackSigChecker = require("slack-sig-checker");
const checker = new SlackSigChecker("SLACK_SIGNING_SECRET");
```

# Using the module  
## Standalone Function   
Variables with example data:
```js
// Signature from Slack
const slackSig = 'v0=3bf4cabc132db27277c51b2e19d04e2f709431868143e50391127e54d48fea4d';
// Timestamp from 'x-slack-request-timestamp' header
const timestamp = '1577809313';
// Body of webhook from Slack (must be un-processed)
const body = 'token=RjdxZpjo204FabduagQzAhFO&team_id=TQQ011VJT&team_domain=test12-31-2019&channel_id=CQE6FL1AM&channel_name=group-project&user_id=UQQ011W1M&user_name=wyattcalandro&command=%2Ftest&text=Test&response_url=https%3A%2F%2Fhooks.slack.com%2Fcommands%2FTQQ011VJT%2F879842384065%2Fj5NHApWyoxkMUft3FCVGKftp&trigger_id=878611932339.840001063639.2f9a762a9fa499ed64f5047a0412416f';
```
Check using callback method:
```js
// Will print "Signature is valid!"
checker.checkSignature(slackSig, body, timestamp, (isValid, err) => {
  // Error will only be returned if the arguments were missing or if an error occurred while generating the signature.
  if (err) throw err;
  if (isValid) {
    console.log("Signature is valid!");
  } else {
    console.log("Signature isn't valid");
  }
});
```
Check using Promise method:
```js
// Will also print "Signature is valid!"
checker.checkSignature(slackSig, body, timestamp)
.then(isValid => {
  if (isValid) {
    console.log("Signature is valid!");
  } else {
    console.log("Signature isn't valid");
  }
})
.catch(err => {
  throw err;
});
```

## Express Middleware
```js
const express = require("express");
const app = express();

// Middleware will check signature and throw 400 and error message describing issue if signature isn't valid.
app.use(checker.middleware());

app.post("/webhook", (_, res) => res.send("Valid Slack Signature"));

app.listen(8080);
```

### Important Note!
If you use the "urlencoded" body parsing middleware from the [body-parser](https://npmjs.com/package/body-parser) module, or if you modify the body of the POST request in any way, you will need to ensure the original body is preserved in the "rawBody" parameter of the request. For the `body-parser` module, you can use the `verify` callback, like below:
```js
const express = require("express");
const app = express();
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({
  extended: false,
  verify: (req, _, buf) => req.rawBody = buf
}))
app.use(checker.middleware());

app.post("/webhook", (_, res) => res.send("Valid Slack Signature"));

app.listen(8080);
```
If you don't do this, the signature cannot be verified and a 500 error will be passed through express with the following message: `"Body parsing detected, and the rawBody parameter is empty. Unable to check validity of webhook signature."`