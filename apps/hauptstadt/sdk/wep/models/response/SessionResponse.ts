import moment, {Moment} from 'moment'

export interface SessionResponseProps {
  token?: string
  createdAt?: Moment
  expiresAt?: Moment
}

export default class SessionResponse {
  public token?: string
  public createdAt?: Moment
  public expiresAt?: Moment

  constructor({token, createdAt, expiresAt}: SessionResponseProps) {
    this.token = token
    this.createdAt = createdAt ? moment(createdAt) : undefined
    this.expiresAt = expiresAt ? moment(expiresAt) : undefined
  }
}
