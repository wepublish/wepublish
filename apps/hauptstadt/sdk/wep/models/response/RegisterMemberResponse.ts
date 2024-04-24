import User from '~/sdk/wep/models/user/User'
import SessionResponse from '~/sdk/wep/models/response/SessionResponse'

export interface RegisterMemberResponseProps {
  user?: User
  session?: SessionResponse
}

export default class RegisterMemberResponse {
  public user?: User
  public session?: SessionResponse

  constructor({user, session}: RegisterMemberResponseProps) {
    this.user = user ? new User(user) : undefined
    this.session = session ? new SessionResponse(session) : undefined
  }
}
