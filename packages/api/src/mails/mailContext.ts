import {BaseMailProvider} from './mailProvider'
import {DBAdapter} from '../db/adapter'
import {MailLogState} from '../db/mailLog'
import {logger} from '../server'

export enum SendMailType {
  Test = 'testMail',
  NewMember = 'newMember',
  PasswordReset = 'passwordReset',
  InvoiceOffSessionDueAt = 'infoiceOffSessionDueAt',
  InvoiceOnSessionDueAt = 'invoiceOnSessionDueAt',
  InvoiceOnSessionDueAtPast = 'invoiceOnSessionDueAtPast',
  SubscriptionRenewed = 'subscriptionRenewed',
  LoginLink = 'loginLink'
}

export interface SendMailNewMember {
  readonly name: string
  readonly jwtToken: string
  readonly subscriptionStartDate: Date
}
export type SendMailNewMemberProps = SendMailNewMember & SendMailProps

export interface SendMailInvoiceOffSessionDueAt {
  readonly invoiceID: string
  readonly dueAt: Date
  readonly amount: number
  // readonly creditCard: string
}

export type SendMailInvoiceOffSessionDueAtProps = SendMailInvoiceOffSessionDueAt & SendMailProps

export interface SendMailInvoiceOnSessionDueAt {
  readonly invoiceID: string
  readonly dueAt: Date
  readonly amount: number
}
export type SendMailInvoiceOnSessionDueAtProps = SendMailInvoiceOnSessionDueAt & SendMailProps

export interface SendMailSubscriptionRenewed {
  readonly paidUntil: Date
  // readonly amount: number
}
export type SendMailSubscriptionRenewedProps = SendMailSubscriptionRenewed & SendMailProps

export interface SendMailLoginLink {
  readonly token: string
  // readonly validUntil: Date
}
export type SendMailLoginLinkProps = SendMailLoginLink & SendMailProps

interface SendMailProps {
  readonly type: SendMailType
  readonly recipient: string
  // readonly replyToAddress?: string
  // readonly data: Record<string, any>
}

export interface MailContext {
  mailProvider: BaseMailProvider | null
  dbAdapter: DBAdapter

  mailTemplates: MailTemplates

  sendMail(props: SendMailProps): Promise<void>
}

export interface MailContextProps {
  readonly mailProvider?: BaseMailProvider
  readonly dbAdapter: DBAdapter
  readonly mailTemplates?: MailTemplates
}

export interface MailTemplate {
  readonly subject: string
  readonly replyToAddress?: string
  readonly template?: string
  readonly message?: string
  readonly templateData?: Record<string, any>
}

export interface MailTemplates {
  forTest(): MailTemplate
  forNewMember(props: SendMailNewMember): MailTemplate
  forInvoiceOffSessionDueAt(props: SendMailInvoiceOffSessionDueAt): MailTemplate
  forInvoiceOnSessionDueAt(props: SendMailInvoiceOnSessionDueAt): MailTemplate
  forInvoiceOnSessionDueAtPast(props: SendMailInvoiceOffSessionDueAt): MailTemplate
  forSubscriptionRenewed(props: SendMailSubscriptionRenewed): MailTemplate
  forLoginLink(props: SendMailLoginLink): MailTemplate
}

const DEFAULT_MAIL_TEMPLATES: MailTemplates = {
  forLoginLink(props: SendMailLoginLink): MailTemplate {
    return {
      subject: 'Login Link for we.publish',
      message: `Hi \n this is your login link. ${process.env.WEBSITE_URL}/login?jwt=${props.token}`
    }
  },
  forTest(): MailTemplate {
    return {
      subject: 'We.Publish Test Mail',
      message: 'This is the default test mail from We.Publish'
    }
  },
  forNewMember(props: SendMailNewMember): MailTemplate {
    return {
      subject: `Hi ${props.name} welcome at We.Publish`,
      message: `Welcome at We.Publish. Your subscription started ${props.subscriptionStartDate.toDateString()}. You can login with here ${
        process.env.WEBSITE_URL
      }/login?jwt=${props.jwtToken}`
    }
  },
  forInvoiceOffSessionDueAt(props: SendMailInvoiceOffSessionDueAt): MailTemplate {
    return {
      subject: 'Invoice due',
      message: `TBD: ${props.invoiceID}`
    }
  },
  forInvoiceOnSessionDueAt(props: SendMailInvoiceOnSessionDueAt): MailTemplate {
    return {
      subject: 'Invoice due',
      message: `TBD: ${props.invoiceID}`
    }
  },
  forInvoiceOnSessionDueAtPast(props: SendMailInvoiceOnSessionDueAt): MailTemplate {
    return {
      subject: 'Invoice due',
      message: `TBD: ${props.invoiceID}`
    }
  },
  forSubscriptionRenewed(props: SendMailSubscriptionRenewed): MailTemplate {
    return {
      subject: 'Subscription renewed',
      message: `TBD: ${props.paidUntil.toDateString()}`
    }
  }
}

export class MailContext implements MailContext {
  mailProvider: BaseMailProvider | null
  dbAdapter: DBAdapter

  mailTemplates: MailTemplates

  constructor(props: MailContextProps) {
    this.mailProvider = props.mailProvider ?? null
    this.dbAdapter = props.dbAdapter

    this.mailTemplates = Object.assign(DEFAULT_MAIL_TEMPLATES, this.mailTemplates)
  }

  async sendMail<T extends SendMailProps>({type, recipient, ...data}: T): Promise<void> {
    try {
      let templateData: MailTemplate
      switch (type) {
        case SendMailType.LoginLink:
          templateData = this.mailTemplates.forLoginLink((data as any) as SendMailLoginLink)
          break
        case SendMailType.Test:
          templateData = this.mailTemplates.forTest()
          break
        case SendMailType.NewMember:
          templateData = this.mailTemplates.forNewMember((data as any) as SendMailNewMember)
          break
        case SendMailType.InvoiceOffSessionDueAt:
          templateData = this.mailTemplates.forInvoiceOffSessionDueAt(
            (data as any) as SendMailInvoiceOffSessionDueAt
          )
          break
        case SendMailType.InvoiceOnSessionDueAt:
          templateData = this.mailTemplates.forInvoiceOnSessionDueAt(
            (data as any) as SendMailInvoiceOnSessionDueAt
          )
          break
        case SendMailType.InvoiceOnSessionDueAtPast:
          templateData = this.mailTemplates.forInvoiceOnSessionDueAtPast(
            (data as any) as SendMailInvoiceOffSessionDueAt
          )
          break
        case SendMailType.SubscriptionRenewed:
          templateData = this.mailTemplates.forSubscriptionRenewed(
            (data as any) as SendMailSubscriptionRenewed
          )
          break
        default:
          templateData = {
            subject: 'Default Mail'
          }
      }

      const mailLog = await this.dbAdapter.mailLog.createMailLog({
        input: {
          state: MailLogState.Submitted,
          subject: templateData.subject,
          recipient: recipient,
          mailProviderID: this.mailProvider?.id ?? 'N/A'
        }
      })

      if (this.mailProvider) {
        await this.mailProvider.sendMail({
          mailLogID: mailLog.id,
          recipient: recipient,
          replyToAddress: templateData.replyToAddress ?? 'default@wepublish.ch', // TODO: get default reply to address
          subject: templateData.subject,
          message: templateData.message,
          template: templateData.template,
          templateData: templateData
        })
      }
    } catch (error) {
      logger('mailContext').error(error, 'Error during sendMail')
    }
  }
}
