import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcrypt'
import {unselectPassword} from './unselect-password'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {email: email.toLowerCase()}
    })
  }

  async updateUserPassword(userId: string, password: string) {
    const hashCostFactor = 12
    return this.prisma.user.update({
      where: {id: userId},
      data: {
        password: await bcrypt.hash(password, hashCostFactor)
      },
      select: unselectPassword
    })
  }
}
