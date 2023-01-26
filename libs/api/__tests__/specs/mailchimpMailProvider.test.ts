import nock from 'nock'
import {MailchimpMailProvider, MailProviderError, MailProviderTemplate} from '../../src'

let mailChimpMailProvider: MailchimpMailProvider

describe('Mailchimp Mail Provider', () => {
  beforeAll(() => {
    nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', {key: 'md-12345678'})
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-templates-list-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/templates/list', {key: 'blah blah'})
      .replyWithFile(
        500,
        __dirname + '/__fixtures__/mailchimp-templates-list-error-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    nock('https://mandrillapp.com')
      .persist()
      .post('/api/1.0/messages/send')
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailchimp-messages-send-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    nock('https://mandrillapp.com')
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
    const response = await mailChimpMailProvider.sendMail({
      message: 'hello Test',
      subject: 'test subject',
      recipient: 'test@test.com',
      replyToAddress: 'dev@test.com',
      mailLogID: 'fakeMailLogID'
    })

    expect(response).toEqual(undefined)
  })

  test('sendMail with template should call mandrill sendTemplate', async () => {
    const response = await mailChimpMailProvider.sendMail({
      subject: 'test subject',
      recipient: 'test@test.com',
      replyToAddress: 'dev@test.com',
      mailLogID: 'fakeMailLogID',
      template: 'test-mail',
      templateData: {message: 'hello Test'}
    })

    expect(response).toEqual(undefined)
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
  })

  test('returns error when using invalid key', async () => {
    mailChimpMailProvider = new MailchimpMailProvider({
      baseURL: 'https://mailchimp.com',
      apiKey: 'blah blah',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch',
      id: 'mailchimp',
      name: 'Mailchimp'
    })

    const response = await mailChimpMailProvider.getTemplates()
    expect(response).toBeInstanceOf(MailProviderError)
    const error = response as MailProviderError
    expect(error.message).toEqual('Invalid API key')
  })
})
