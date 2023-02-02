import {Injectable} from '@nestjs/common'
import {MailTemplate} from '@prisma/client'
import {MailProviderTemplate, PrismaService} from '@wepublish/api'
import {MailProviderService} from './mail-provider.service'

export interface MailTemplateSyncDiff {
  remoteNew: MailProviderTemplate[]
  remoteExisting: MailProviderTemplate[]
  localOutdated: MailTemplate[]
}

@Injectable()
export class MailTemplateSyncService {
  constructor(
    private prismaService: PrismaService,
    private mailProviderService: MailProviderService
  ) {}

  async synchronizeTemplates(): Promise<MailTemplateSyncDiff> {
    const localTemplates = await this.prismaService.mailTemplate.findMany()

    const mailProvider = await this.mailProviderService.getProvider()
    const remoteTemplates = (await mailProvider.getTemplates()) as MailProviderTemplate[]

    const diff: MailTemplateSyncDiff = {
      remoteNew: [],
      remoteExisting: [],
      localOutdated: []
    }

    // find new and updated remote templates
    for (const remoteTemplate of remoteTemplates) {
      const localMatch = localTemplates.find(
        localTemplate => localTemplate.externalMailTemplateId === remoteTemplate.uniqueIdentifier
      )
      if (localMatch) {
        diff.remoteExisting.push(remoteTemplate)
      } else {
        diff.remoteNew.push(remoteTemplate)
      }
    }

    // find outdated local templates
    for (const localTemplate of localTemplates) {
      const remoteMatch = remoteTemplates.find(
        remoteTemplate => remoteTemplate.uniqueIdentifier === localTemplate.externalMailTemplateId
      )
      if (!remoteMatch) {
        diff.localOutdated.push(localTemplate)
      }
    }

    return diff
  }
}
