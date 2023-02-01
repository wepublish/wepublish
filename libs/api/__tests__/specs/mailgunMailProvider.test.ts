import nock from 'nock'
import {MailgunMailProvider, MailProviderError, MailProviderTemplate} from '../../src'

let mockSubmit = jest.fn()
const mockAppend = jest.fn()

jest.mock('form-data', () => {
  return jest.fn().mockImplementation(() => {
    return {
      append: mockAppend,
      submit: mockSubmit
    }
  })
})

let mailgunMailProvider: MailgunMailProvider

let listTemplates: nock.Scope
let listTemplatesInvalidKey: nock.Scope

describe('Mailgun Mail Provider', () => {
  beforeAll(() => {
    listTemplates = nock('https://api.mailgun.net')
      .persist()
      .get('/v3/sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org/templates')
      .basicAuth({user: 'api', pass: 'mg-12345678'})
      .replyWithFile(
        200,
        __dirname + '/__fixtures__/mailgun-templates-list-success-response.json',
        {
          'Content-Type': 'application/json'
        }
      )

    listTemplatesInvalidKey = nock('https://api.mailgun.net')
      .persist()
      .get('/v3/sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org/templates')
      .basicAuth({user: 'api', pass: 'invalid-key'})
      .replyWithFile(401, __dirname + '/__fixtures__/mailgun-templates-list-error-response.json', {
        'Content-Type': 'application/json'
      })
  })

  test('can be created', () => {
    mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'fakeAPIkey',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'https://mailgun.com',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch'
    })
    expect(mailgunMailProvider).toBeDefined()
  })

  test('can call send', async () => {
    const mailInfo = {
      replyToAddress: 'dev@wepublish.ch',
      recipient: 'test@recipient.adr',
      subject: 'Mocked Send',
      message: 'mocking send',
      mailLogID: 'mailLogID'
    }

    mockSubmit = jest
      .fn()
      .mockImplementationOnce((data, callback) => callback(null, {statusCode: 200}))
      .mockImplementationOnce((data, callback) => callback(null, {statusCode: 404}))

    await mailgunMailProvider.sendMail(mailInfo)

    expect(mockSubmit).toHaveBeenCalledTimes(1)

    expect(mockAppend).toHaveBeenCalledTimes(5)
    expect(mockAppend).toHaveBeenLastCalledWith('v:mail_log_id', 'mailLogID')

    await expect(mailgunMailProvider.sendMail(mailInfo)).rejects.toEqual({statusCode: 404})
  })

  test('loads templates', async () => {
    mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'mg-12345678',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch'
    })

    const response = await mailgunMailProvider.getTemplates()
    const templates = response as MailProviderTemplate[]
    expect(templates.length).toEqual(2)
    expect(templates.map(t => t.name).sort()).toEqual(
      ['subscription_creation', 'subscription_expiration'].sort()
    )
    expect(listTemplates.isDone()).toEqual(true)
  })

  test('returns error when using invalid key', async () => {
    mailgunMailProvider = new MailgunMailProvider({
      id: 'mailgun',
      name: 'Mailgun',
      apiKey: 'invalid-key',
      baseDomain: 'https://mailgun.com',
      mailDomain: 'sandbox8a2185cfb29c48d4941d51c261fc3e03.mailgun.org',
      webhookEndpointSecret: 'fakeSecret',
      fromAddress: 'dev@wepublish.ch'
    })

    const response = await mailgunMailProvider.getTemplates()
    expect(response).toBeInstanceOf(MailProviderError)
    const error = response as MailProviderError
    expect(error.message).toEqual('Invalid private key')
    expect(listTemplatesInvalidKey.isDone()).toEqual(true)
  })
})
