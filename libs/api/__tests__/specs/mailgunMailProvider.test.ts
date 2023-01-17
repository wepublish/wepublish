import {MailgunMailProvider} from '../../src'

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

describe('Mailgun Mail Provider', () => {
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
})
