import {Injectable} from '@nestjs/common'
import {PrismaClient} from '@prisma/client'
import {Consent, ConsentInput, ConsentFilter} from './consent.model'

@Injectable()
export class ConsentService {
  constructor(private prisma: PrismaClient) {}

  /*
  Queries
 */
  async consentList(filter?: ConsentFilter): Promise<Consent[]> {
    const data = await this.prisma.consent.findMany({
      where: {
        ...filter
      },
      orderBy: {
        createdAt: 'desc'
      }
    })
    return data
  }

  async consent(id: string): Promise<Consent> {
    const data = await this.prisma.consent.findUnique({
      where: {
        id
      }
    })

    if (!data) {
      throw Error(`Consent with id ${id} not found`)
    }

    return data
  }

  /*
  Mutations
 */
  async createConsent(consent: ConsentInput): Promise<Consent> {
    const created = await this.prisma.consent.create({data: consent})
    return created
  }

  async updateConsent({id, consent}: {id: string; consent: ConsentInput}): Promise<Consent> {
    const updated = await this.prisma.consent.update({
      where: {id},
      data: {
        ...consent
      }
    })
    return updated
  }

  async deleteConsent(id: string) {
    const deleted = this.prisma.consent.delete({
      where: {id}
    })
    return deleted
  }
}
