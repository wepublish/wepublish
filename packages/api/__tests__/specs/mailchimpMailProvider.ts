import {MailchimpMailProvider} from '../../src'

const mockSend = jest.fn()
jest.mock('mandrill-api', () => {
  return {
    Mandrill: jest.fn().mockImplementation(() => {
      return {
        messages: {
          send: mockSend
        }
      }
    })
  }
})

let mailChimpMailProvider: MailchimpMailProvider

describe('Mailchimp Mail Provider', () => {
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
      recipient: 'test@test.com',
      replyToAddress: 'dev@test.com',
      mailLogID: 'fakeMailLogID'
    })

    expect(mockSend).toHaveBeenCalledTimes(1)
    expect(mockSend).toHaveBeenCalledWith({
      message: {
        html: undefined,
        text: 'hello Test',
        subject: 'test subject',
        from_email: 'dev@wepublish.ch',
        to: [
          {
            email: 'test@test.com',
            type: 'to'
          }
        ],
        metadata: {
          mail_log_id: 'fakeMailLogID'
        }
      }
    })
  })
})
