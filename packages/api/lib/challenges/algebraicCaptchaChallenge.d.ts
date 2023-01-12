import { Challenge, ChallengeProvider, ChallengeValidationProps, ChallengeValidationReturn } from './challengeProvider';
import { IParams } from 'algebraic-captcha/build/i-params';
export declare class AlgebraicCaptchaChallenge implements ChallengeProvider {
    private validHashes;
    private counter;
    readonly challengeSecret: string;
    readonly challengeValidTime: number;
    private captchaLib;
    constructor(challengeSecret: string, challengeValidTime: number, algebraicCaptchaOptions: IParams);
    composeHashSecret(answer: number, time: number, counter: number): string;
    createHash(challengeSecret: string): string;
    cleanupOldHashes(): void;
    generateChallenge(): Promise<Challenge>;
    validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn>;
}
//# sourceMappingURL=algebraicCaptchaChallenge.d.ts.map