export declare type Challenge = {
    challengeID: string;
    challenge: string;
    validUntil: Date;
};
export declare type ChallengeValidationProps = {
    challengeID: string;
    solution: number;
};
export declare type ChallengeValidationReturn = {
    result: string;
    message: string;
    valid: boolean;
};
export interface ChallengeProvider {
    generateChallenge(): Promise<Challenge>;
    validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn>;
}
//# sourceMappingURL=challengeProvider.d.ts.map