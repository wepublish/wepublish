import Bexio, {ContactsStatic, InvoicesStatic} from 'bexio'
import ContactSearchParameters = ContactsStatic.ContactSearchParameters
import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  CreateRemoteInvoiceProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps
} from './paymentProvider'
import {
  Invoice,
  MemberPlan,
  PaymentState,
  PrismaClient,
  Subscription,
  User,
  UserAddress
} from '@prisma/client'
import {getMonthsFromPaymentPeriodicity} from '../utility'
import {MappedReplacer} from 'mapped-replacer'

export interface BexioPaymentProviderProps extends PaymentProviderProps {
  apiKey: string
  userId: number
  countryId: number
  invoiceTemplateNewMembership: string
  invoiceTemplateRenewalMembership: string
  unitId: number
  taxId: number
  accountId: number
  invoiceMailSubject: string
  invoiceMailBody: string
  markInvoiceAsOpen: boolean
  prisma: PrismaClient
}

export class BexioPaymentProvider extends BasePaymentProvider {
  private apiKey: string
  private userId: number
  private countryId: number
  private invoiceTemplateNewMembership: string
  private invoiceTemplateRenewalMembership: string
  private unitId: number
  private taxId: number
  private accountId: number
  private invoiceMailSubject: string
  private invoiceMailBody: string
  private markInvoiceAsOpen: boolean
  private prisma: PrismaClient

  constructor(props: BexioPaymentProviderProps) {
    super(props)
    this.apiKey = props.apiKey
    this.userId = props.userId
    this.countryId = props.countryId
    this.invoiceTemplateNewMembership = props.invoiceTemplateNewMembership
    this.invoiceTemplateRenewalMembership = props.invoiceTemplateRenewalMembership
    this.unitId = props.unitId
    this.taxId = props.taxId
    this.accountId = props.accountId
    this.invoiceMailSubject = props.invoiceMailSubject
    this.invoiceMailBody = props.invoiceMailBody
    this.markInvoiceAsOpen = props.markInvoiceAsOpen
    this.prisma = props.prisma
  }

  async webhookForPaymentIntent(props: WebhookForPaymentIntentProps): Promise<IntentState[]> {
    throw Error('Webhook not implemented!')
  }

  /**
   * Create remote invoice only in case of first
   * @param props
   */

  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    const subscription = await this.prisma.subscription.findUnique({
      where: {id: props.invoice.subscriptionID}
    })
    if (!subscription.paidUntil) {
      return await this.bexioCreate(props.invoice.id, this.invoiceTemplateNewMembership)
    }
  }

  /**
   * Create remote invoice in case of renewal
   * @param props
   */

  async createRemoteInvoice(props: CreateRemoteInvoiceProps) {
    await this.bexioCreate(props.invoice.id, this.invoiceTemplateRenewalMembership)
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    return {
      state: PaymentState.requiresUserAction,
      paidAt: null,
      paymentID: 'None',
      paymentData: ''
    }
  }

  async bexioCreate(invoiceId: string, template: string) {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: {
          id: invoiceId
        },
        include: {
          user: {
            include: {
              address: true
            }
          },
          subscription: {
            include: {
              memberPlan: true
            }
          }
        }
      })
      const bexio = new Bexio(this.apiKey)
      const contact = await this.searchForContact(bexio, invoice.subscription.user)
      const updatedContact = await this.createOrUpdateContact(
        bexio,
        contact,
        invoice.subscription.user
      )
      await this.createInvoice(bexio, updatedContact, invoice, template)
      return {
        intentID: '',
        intentSecret: '',
        intentData: '',
        paidAt: null,
        state: PaymentState.created
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async searchForContact(bexio: Bexio, user: User & {address: UserAddress}) {
    const contacts = await bexio.contacts.search([
      {
        field: ContactSearchParameters.mail,
        value: `${user.email}`,
        criteria: '='
      }
    ])
    return contacts[0]
  }

  async createOrUpdateContact(
    bexio: Bexio,
    contact: ContactsStatic.ContactSmall,
    user: User & {address: UserAddress}
  ) {
    const uppserContact: ContactsStatic.ContactOverwrite = {
      nr: '',
      name_1: user?.address?.company ? user?.address.company : user.name, // lastname or company name
      name_2: user?.address?.company ? '' : user.firstName, // Firstname or none
      mail: user.email,
      user_id: this.userId,
      contact_type_id: user?.address?.company ? 1 : 2, // 1: Company 2: Person
      country_id: this.countryId,
      owner_id: this.userId,
      contact_group_ids: [],
      postcode: user?.address?.zipCode,
      address: user?.address?.streetAddress
    }
    if (!contact) {
      return await bexio.contacts.create(uppserContact)
    } else {
      uppserContact.nr = contact.nr
      return await bexio.contacts.edit(contact.id, uppserContact)
    }
  }

  async createInvoice(
    bexio: Bexio,
    contact: ContactsStatic.ContactFull,
    invoice: Invoice & {subscription: Subscription & {memberPlan: MemberPlan; user: User}},
    template: string
  ) {
    const stringReplaceMap = new MappedReplacer()
    this.addToStringReplaceMap(stringReplaceMap, 'subscription', invoice.subscription)
    this.addToStringReplaceMap(stringReplaceMap, 'user', invoice.user)
    this.addToStringReplaceMap(stringReplaceMap, 'memberPlan', invoice.subscription.memberPlan)
    const bexioInvoice: InvoicesStatic.InvoiceCreate = {
      contact_id: contact.id,
      user_id: this.userId,
      mwst_type: 0,
      mwst_is_net: false,
      template_slug: template,
      positions: [
        {
          amount: '1',
          unit_id: this.unitId,
          account_id: this.accountId,
          tax_id: this.taxId,
          text: invoice.subscription.memberPlan.name,
          unit_price: `${
            invoice.subscription.monthlyAmount *
            getMonthsFromPaymentPeriodicity(invoice.subscription.paymentPeriodicity)
          }`,
          type: 'KbPositionCustom'
        }
      ]
    }
    const invoiceUpdated = await bexio.invoices.create(bexioInvoice)
    const sentInvoice = await bexio.invoices.sent(invoiceUpdated.id, {
      recipient_email: contact.mail,
      subject: stringReplaceMap.replace(this.invoiceMailSubject),
      message: stringReplaceMap.replace(this.invoiceMailBody),
      mark_as_open: this.markInvoiceAsOpen,
      attach_pdf: true
    })
    if (!sentInvoice.success) {
      throw Error(`Send of invoice failed with message: ${sentInvoice}`)
    }
  }
  addToStringReplaceMap(
    stringReplaceMap: MappedReplacer,
    id: string,
    object: User | Subscription | MemberPlan
  ) {
    for (const [key, value] of Object.entries(object)) {
      stringReplaceMap.addRule(`:${id}.${key}:`, `${value}`)
    }
  }
}
