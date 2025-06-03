import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {email: email.toLowerCase()}
    })
  }
}
