import nock from 'nock'
import {MailchimpMailProvider, MailProviderTemplate} from '../../src'

let mailChimpMailProvider: MailchimpMailProvider

let listTemplates: nock.Scope
let listTemplatesInvalidKey: nock.Scope
let sendMail: nock.Scope
let sendTemplate: nock.Scope

describe('Mailchimp Mail Provider', () => {
  beforeAll(() => {
    listTemplates = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', {key: 'md-12345678'})
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-templates-list-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    listTemplatesInvalidKey = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', {key: 'invalid-key'})
      .replyWithFile(
        500,
        __dirname + '/__fixtures__/mailchimp-templates-list-error-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    sendMail = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/messages/send')
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    sendTemplate = nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/messages/send-template')
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )
  })

  test('should be able to be created', () => {
    mailChimpMailProvider = new MailchimpMailProvider({
      baseURL: 'https://mailchimp.com',
      apiKey: 'fakeAPIkey',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      id: 'mailchimp',
      name: 'Mailchimp'
    })

    expect(mailChimpMailProvider).toBeDefined()
  })

  test('sendMail should call mandrill send', async () => {
    await mailChimpMailProvider.sendMail({
      message: 'hello Test',
      subject: 'test subject',
      recipient: 'test@wepublish.ch',
      replyToAddress: 'dev@wepublish.ch',
      mailLogID: 'fakeMailLogID'
    })

    expect(sendMail.isDone()).toEqual(true)
  })

  test('sendMail with template should call mandrill sendTemplate', async () => {
    await mailChimpMailProvider.sendMail({
      subject: 'test subject',
      recipient: 'test@wepublish.ch',
      replyToAddress: 'dev@wepublish.ch',
      mailLogID: 'fakeMailLogID',
      template: 'test-mail',
      templateData: {message: 'hello Test'}
    })

    expect(sendTemplate.isDone()).toEqual(true)
  })

  test('loads templates', async () => {
    mailChimpMailProvider = new MailchimpMailProvider({
      baseURL: 'https://mailchimp.com',
      apiKey: 'md-12345678',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      id: 'mailchimp',
      name: 'Mailchimp'
    })

    const response = await mailChimpMailProvider.getTemplates()
    const templates = response as MailProviderTemplate[]
    expect(templates.length).toEqual(2)
    expect(templates.map(t => t.name).sort()).toEqual(
      ['Subscription Creation', 'Subscription Expiration'].sort()
    )
    expect(listTemplates.isDone()).toEqual(true)
  })

  test('returns error when using invalid key', async () => {
    mailChimpMailProvider = new MailchimpMailProvider({
      baseURL: 'https://mailchimp.com',
      apiKey: 'invalid-key',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      id: 'mailchimp',
      name: 'Mailchimp'
    })

    await expect(mailChimpMailProvider.getTemplates()).rejects.toThrow('Invalid API key')
    expect(listTemplatesInvalidKey.isDone()).toEqual(true)
  })
})
