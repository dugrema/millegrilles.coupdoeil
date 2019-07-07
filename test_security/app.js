const Express = require("express");
const BodyParser = require("body-parser");
const Cors = require("cors");
const FS = require("fs");
const Path = require('path');
const Spdy = require('spdy');

const userRepository = require('./userRepository');
const {
    generateRegistrationChallenge,
    parseRegisterRequest,
    generateLoginChallenge,
    parseLoginRequest,
    verifyAuthenticatorAssertion,
} = require('@webauthn/server');

const app = Express();
app.use(Cors());
app.use(BodyParser());
app.use(Express.static(Path.join(__dirname, 'static')));

app.post('/request-register', (req, res) => {
    const { id, email } = req.body;

    const challengeResponse = generateRegistrationChallenge({
        relyingParty: { name: 'ACME' },
        user: { id, name: email }
    });

    userRepository.create({
        id,
        email,
        challenge: challengeResponse.challenge,
    })

    res.send(challengeResponse);
});

app.post('/register', (req, res) => {
    const { key, challenge } = parseRegisterRequest(req.body);

    const user = userRepository.findByChallenge(challenge);

    if (!user) {
        return res.sendStatus(400);
    }

    userRepository.addKeyToUser(user, key);

    return res.send({ loggedIn: true });
});

app.post('/login', (req, res) => {
    const { email } = req.body;

    const user = userRepository.findByEmail(email);

    if (!user) {
        return res.sendStatus(400);
    }

    const assertionChallenge = generateLoginChallenge(user.key);

    userRepository.updateUserChallenge(user, assertionChallenge.challenge);

    res.send(assertionChallenge);
});

app.post('/login-challenge', (req, res) => {
    const { challenge, keyId } = parseLoginRequest(req.body);
    if (!challenge) {
        return res.sendStatus(400);
    }
    const user = userRepository.findByChallenge(challenge);

    if (!user || !user.key || user.key.credID !== keyId) {
        return res.sendStatus(400);
    }

    const loggedIn = verifyAuthenticatorAssertion(req.body, user.key);

    return res.send({ loggedIn });
});

const config = {
    hostIp: "dev2.maple.mdugre.info",
    cert: FS.readFileSync(Path.resolve(__dirname, '../dev/nginx/conf.d/dev2.maple.mdugre.info.cert.pem')),
    key: FS.readFileSync(Path.resolve(__dirname, '../dev/nginx/conf.d/dev2.maple.mdugre.info.key.pem'))
};

Spdy.createServer(config, app).listen(8080, () => {
    console.log('Server is listening at https://localhost:8000. Ctrl^C to stop it.');
});
