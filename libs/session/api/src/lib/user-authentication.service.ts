import {Injectable} from '@nestjs/common'
import bcrypt from 'bcrypt'
import {UserService} from '@wepublish/user/api'

@Injectable()
export class UserAuthenticationService {
  constructor(private userService: UserService) {}

  async authenticateUserWithEmailAndPassword(email: string, password: string) {
    const user = await this.userService.getUserByEmail(email.toLowerCase())
    if (!user) {
      return null
    }

    const theSame = await bcrypt.compare(password, user.password)
    if (!theSame) {
      return null
    }

    return user
  }
}
