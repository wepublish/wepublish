"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AlgebraicCaptchaChallenge = void 0;
const crypto_1 = require("crypto");
const algebraic_captcha_1 = require("algebraic-captcha");
class AlgebraicCaptchaChallenge {
    constructor(challengeSecret, challengeValidTime, algebraicCaptchaOptions) {
        this.challengeSecret = challengeSecret;
        this.challengeValidTime = challengeValidTime * 1000;
        this.validHashes = {};
        this.counter = 0;
        this.captchaLib = new algebraic_captcha_1.AlgebraicCaptcha(algebraicCaptchaOptions);
    }
    composeHashSecret(answer, time, counter) {
        return `${this.challengeSecret};${time};${answer};${counter}`;
    }
    createHash(challengeSecret) {
        return (0, crypto_1.createHash)('sha256').update(challengeSecret).digest('base64');
    }
    cleanupOldHashes() {
        if (this.counter % 100 !== 0)
            return;
        const cleanDate = new Date().getTime() - this.challengeValidTime;
        for (const hash in this.validHashes) {
            if (this.validHashes[hash] < cleanDate)
                delete this.validHashes[hash];
        }
    }
    async generateChallenge() {
        const time = new Date().getTime();
        const { image, answer } = await this.captchaLib.generateCaptcha();
        const challengeSecret = this.composeHashSecret(answer, time, this.counter);
        const hash = this.createHash(challengeSecret);
        this.validHashes[hash] = time;
        return {
            challengeID: Buffer.from(`${time};${hash};${this.counter++}`, 'utf-8').toString('base64'),
            challenge: image,
            validUntil: new Date(time + this.challengeValidTime)
        };
    }
    async validateChallenge(props) {
        // Decode challengeID
        const decoded = Buffer.from(props.challengeID, 'base64').toString('utf-8');
        const secret = decoded.split(';');
        const time = parseInt(secret[0]);
        const hash = secret[1];
        const counter = secret[2];
        // Protect against replay attacks
        if (!this.validHashes[hash]) {
            return {
                result: 'reuse',
                message: 'Challenge has been reused!',
                valid: false
            };
        }
        delete this.validHashes[hash];
        // Protection against solve in advance attacks
        if (new Date().getTime() > time + this.challengeValidTime)
            return {
                result: 'expired',
                message: 'Challenge has expired!',
                valid: false
            };
        // Check if challenge has been solved correctly
        const challengeSecret = this.composeHashSecret(props.solution, time, counter);
        this.cleanupOldHashes();
        if (this.createHash(challengeSecret) === hash)
            return {
                result: 'valid',
                message: 'Challenge is valid.',
                valid: true
            };
        return {
            result: 'invalid',
            message: 'Challenge is not solved correctly!',
            valid: false
        };
    }
}
exports.AlgebraicCaptchaChallenge = AlgebraicCaptchaChallenge;
//# sourceMappingURL=algebraicCaptchaChallenge.js.map