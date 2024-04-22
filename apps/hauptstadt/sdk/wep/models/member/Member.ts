import User from '~/sdk/wep/models/user/User'
import Address from '~/sdk/wep/models/user/Address'

export interface MemberProps {
  id?: string
  name?: string
  firstName?: string
  preferredName?: string
  address?: Address
  email?: string
}

export default class Member extends User {
  public emailRepeat: string | undefined

  constructor({id, name, firstName, preferredName, address, email}: MemberProps) {
    super({id, name, firstName, preferredName, address, email})
    this.emailRepeat = undefined
  }

  public getThis(): Member {
    return this
  }
}
