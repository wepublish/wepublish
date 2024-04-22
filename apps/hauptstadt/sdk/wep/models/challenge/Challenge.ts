import moment, {Moment} from 'moment'
import {gql} from 'graphql-tag'

export interface ChallengeProps {
  challenge: string
  challengeID: string
  validUntil?: Moment
}

export default class Challenge {
  public challenge: string
  public challengeID: string
  public validUntil?: Moment

  constructor({challenge, challengeID, validUntil}: ChallengeProps) {
    this.challenge = challenge
    this.challengeID = challengeID
    this.validUntil = validUntil ? moment(validUntil) : undefined
  }

  public static challengeFragment = gql`
    fragment challenge on Challenge {
      challenge
      challengeID
      validUntil
    }
  `
}
