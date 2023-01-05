export type Challenge = {
  challengeID: string
  challenge: string
  validUntil: Date
}
export type ChallengeValidationProps = {
  challengeID: string
  solution: number
}

export type ChallengeValidationReturn = {
  result: string
  message: string
  valid: boolean
}

export interface ChallengeProvider {
  generateChallenge(): Promise<Challenge>
  validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn>
}
