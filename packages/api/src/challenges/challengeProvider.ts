export type Challenge = {
  challengeID: string
  challenge: string
  validUntil: string
}
export type ChallengeValidationProps = {
  challengeID: string
  solve: number
}

export type ChallengeValidationReturn = {
  result: string
  msg: string
  valid: boolean
}

export interface ChallengeProvider {
  generateChallenge(): Promise<Challenge>
  validateChallenge(props: ChallengeValidationProps): Promise<ChallengeValidationReturn>
}
