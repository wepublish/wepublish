import PaymentResponse from '~/sdk/wep/models/response/PaymentResponse'
import User from '~/sdk/wep/models/user/User'
import SessionResponse from '~/sdk/wep/models/response/SessionResponse'
import RegisterMemberResponse from '~/sdk/wep/models/response/RegisterMemberResponse'

export interface RegisterMemberAndReceivePaymentResponseProps {
  payment?: PaymentResponse
  user?: User
  session?: SessionResponse
}

export default class RegisterMemberAndReceivePaymentResponse extends RegisterMemberResponse {
  public payment?: PaymentResponse

  constructor({payment, user, session}: RegisterMemberAndReceivePaymentResponseProps) {
    super({user, session})
    this.payment = payment ? new PaymentResponse(payment) : undefined
  }
}
