import {MailchimpMailProvider} from '../../src'

const mockSend = jest.fn().mockImplementationOnce(cb => cb())
const mockSendTemplate = jest.fn().mockImplementationOnce(cb => cb())
jest.mock('mandrill-api', () => {
  return {
    Mandrill: jest.fn().mockImplementation(() => {
      return {
        messages: {
          send: mockSend,
          sendTemplate: mockSendTemplate
        }
      }
    })
  }
})

jest.mock('../../src/lib/server', () => {
  const originalModule = jest.requireActual('../../src/lib/server')
  return {
    __esModule: true,
    ...originalModule,
    logger: jest.fn(() => ({error: jest.fn()}))
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
    expect(mockSend).toHaveBeenCalledWith(
      {
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
      },
      expect.any(Function),
      expect.any(Function)
    )
  })
})

test('sendMail with template should call mandrill sendTemplate', async () => {
  await mailChimpMailProvider.sendMail({
    subject: 'test subject',
    recipient: 'test@test.com',
    replyToAddress: 'dev@test.com',
    mailLogID: 'fakeMailLogID',
    template: 'test-mail',
    templateData: {message: 'hello Test'}
  })

  expect(mockSendTemplate).toHaveBeenCalledTimes(1)
  expect(mockSendTemplate).toHaveBeenCalledWith(
    {
      template_name: 'test-mail',
      template_content: [],
      message: {
        html: undefined,
        text: undefined,
        subject: 'test subject',
        from_email: 'dev@wepublish.ch',
        to: [
          {
            email: 'test@test.com',
            type: 'to'
          }
        ],
        merge_vars: [
          {
            rcpt: 'test@test.com',
            vars: [
              {
                name: 'message',
                content: 'hello Test'
              }
            ]
          }
        ],
        metadata: {
          mail_log_id: 'fakeMailLogID'
        }
      }
    },
    expect.any(Function),
    expect.any(Function)
  )
})
