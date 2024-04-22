export interface ChallengeAnswerProps {
  challengeID?: string
  challengeSolution?: string
}

export default class ChallengeAnswer {
  public challengeID?: string
  public challengeSolution?: string

  constructor({challengeID, challengeSolution}: ChallengeAnswerProps) {
    this.challengeID = challengeID
    this.challengeSolution = challengeSolution
  }
}
