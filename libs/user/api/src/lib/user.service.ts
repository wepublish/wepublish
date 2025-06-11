import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import bcrypt from 'bcrypt'
import {unselectPassword} from './unselect-password'
import {Validator} from '../../../../api/src/lib/validator'
import {EmailAlreadyInUseError} from '@wepublish/api'
import {CreateUserInput} from './user.input'
import {PaymentProviderCustomerInput} from './user.model'

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaClient) {}

  async getUserByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: {email: email.toLowerCase()},
      include: {
        properties: true
      }
    })
  }

  async updateUserPassword(userId: string, password: string) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {
        password: await this.hashPassword(password)
      },
      select: unselectPassword
    })
  }

  private async hashPassword(password: string) {
    const hashCostFactor = 12
    return await bcrypt.hash(password, hashCostFactor)
  }

  async createUser(input: CreateUserInput) {
    let {name, firstName, email, address, birthday, password, properties, active} = input
    const userExists = await this.prisma.user.findUnique({
      where: {
        email
      },
      select: unselectPassword
    })

    if (userExists) {
      throw new EmailAlreadyInUseError()
    }

    const hashedPassword = await this.hashPassword(password)
    input.email = input.email.toLowerCase()
    await Validator.createUser.parse(input)
    await Validator.createAddress.parse(address)

    return this.prisma.user.create({
      data: {
        name,
        firstName,
        email,
        birthday,
        emailVerifiedAt: null,
        active,
        roleIDs: [],
        password: hashedPassword,
        properties: {
          createMany: {
            data: properties ?? []
          }
        },
        address: {
          create: address ?? {}
        }
      },
      select: unselectPassword
    })
  }

  async updatePaymentProviderCustomers(
    userId: string,
    paymentProviderCustomers: PaymentProviderCustomerInput[]
  ) {
    return this.prisma.user.update({
      where: {id: userId},
      data: {
        paymentProviderCustomers: {
          deleteMany: {
            userId: userId
          },
          createMany: {
            data: paymentProviderCustomers
          }
        }
      },
      select: unselectPassword
    })
  }
}
