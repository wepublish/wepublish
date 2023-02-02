import {PrismaService} from '@wepublish/api'
import nock from 'nock'
import {MailProviderService} from './mail-provider.service'
import {MailTemplateSyncService} from './mail-template-sync.service'

describe('MailTemplateSyncService', () => {
  let prismaService: PrismaService
  let mailProviderService: MailProviderService
  let syncService: MailTemplateSyncService
  let templatesMock: nock.Scope

  beforeEach(() => {
    prismaService = new PrismaService()
    mailProviderService = new MailProviderService(prismaService)
    syncService = new MailTemplateSyncService(prismaService, mailProviderService)
    templatesMock = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', {key: 'md-12345678'})
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-templates-list-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )
  })

  describe('syncTemplates', () => {
    it('creates new templates', async () => {
      await prismaService.mailTemplate.create({
        data: {
          name: 'test-template',
          description: 'Test',
          externalMailTemplateId: 'slug-123'
        }
      })
      const localTemplatesBefore = await prismaService.mailTemplate.findMany()
      expect(localTemplatesBefore.length).toEqual(1)
      expect(templatesMock.isDone()).toEqual(false)

      await syncService.synchronizeTemplates()

      expect(templatesMock.isDone()).toEqual(true)
      const localTemplatesAfter = await prismaService.mailTemplate.findMany()
      expect(localTemplatesAfter.length).toEqual(3)
      const templateNames = localTemplatesAfter.map(t => t.externalMailTemplateId)
      expect(templateNames.sort()).toEqual(
        ['slug-123', 'subscription-creation', 'subscription-expiration'].sort()
      )
    })
  })
})
