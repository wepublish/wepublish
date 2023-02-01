import {Injectable} from '@nestjs/common'
import {PrismaService} from '../prisma.service'
import {MailProviderTemplate} from './mailProvider'
import {MailProviderService} from './mailProvider.service'

@Injectable()
export class MailTemplateSyncService {
  constructor(
    private prismaService: PrismaService,
    private mailProviderService: MailProviderService
  ) {}

  async synchronizeTemplates(): Promise<void> {
    const localTemplates = await this.prismaService.mailTemplate.findMany()

    const mailProvider = await this.mailProviderService.getProvider()
    const remoteTemplates = (await mailProvider.getTemplates()) as MailProviderTemplate[]

    // find new and updated remote templates
    for (const remoteTemplate of remoteTemplates) {
      const localMatch = localTemplates.find(
        localTemplate => localTemplate.externalMailTemplateId === remoteTemplate.uniqueIdentifier
      )
      if (localMatch) {
        // template exists locally, update properties
        this.prismaService.mailTemplate.update({
          where: {externalMailTemplateId: localMatch.externalMailTemplateId},
          data: {
            name: remoteTemplate.name,
            remoteMissing: false
          }
        })
      } else {
        // template is new
        this.prismaService.mailTemplate.create({
          data: {
            name: remoteTemplate.name,
            externalMailTemplateId: remoteTemplate.uniqueIdentifier
          }
        })
      }
    }

    // find outdated local templates
    for (const localTemplate of localTemplates) {
      const remoteMatch = remoteTemplates.find(
        remoteTemplate => remoteTemplate.uniqueIdentifier === localTemplate.externalMailTemplateId
      )
      if (!remoteMatch) {
        this.prismaService.mailTemplate.update({
          where: {externalMailTemplateId: localTemplate.externalMailTemplateId},
          data: {
            remoteMissing: true
          }
        })
      }
    }
  }
}
