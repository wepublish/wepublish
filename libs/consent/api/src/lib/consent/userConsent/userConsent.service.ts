import {Injectable} from '@nestjs/common'
import {ConsentValue, PrismaClient} from '@prisma/client'
import {UserConsent, UserConsentInput, UpdateUserConsentInput} from './userConsent.model'

// todo extract
// export type AtLeast<T, K extends keyof T> = Partial<T> & Pick<T, K>
export type RequireAtLeastOne<T> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<keyof T, K>>>
}[keyof T]

@Injectable()
export class UserConsentService {
  constructor(private prisma: PrismaClient) {}

  /*
  Queries
 */
  async userConsentList(): Promise<UserConsent[]> {
    const data = await this.prisma.userConsent.findMany({
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        user: true,
        consent: true
      }
    })
    return data
  }

  /*
  Mutations
 */
  async createUserConsent(userConsent: UserConsentInput): Promise<UserConsent> {
    const created = await this.prisma.userConsent.create({
      data: userConsent,
      include: {user: true, consent: true}
    })

    return created
  }

  async updateUserConsent({
    id,
    userConsent
  }: {
    id: string
    userConsent: UpdateUserConsentInput
  }): Promise<UserConsent> {
    const updated = await this.prisma.userConsent.update({
      where: {id},
      data: {
        value: userConsent.value
      },
      include: {user: true, consent: true}
    })
    return updated
  }

  async deleteUserConsent(id: string): Promise<UserConsent> {
    const deleted = await this.prisma.userConsent.delete({
      where: {id},
      include: {user: true, consent: true}
    })
    return deleted
  }
}
