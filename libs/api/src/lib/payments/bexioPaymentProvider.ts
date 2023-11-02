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
  invoiceTitleNewMembership: string
  invoiceTitleRenewalMembership: string
  invoiceMailSubjectNewMembership: string
  invoiceMailBodyNewMembership: string
  invoiceMailSubjectRenewalMembership: string
  invoiceMailBodyRenewalMembership: string
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
  private invoiceTitleNewMembership: string
  private invoiceTitleRenewalMembership: string
  private invoiceMailSubjectNewMembership: string
  private invoiceMailBodyNewMembership: string
  private invoiceMailSubjectRenewalMembership: string
  private invoiceMailBodyRenewalMembership: string
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
    this.invoiceTitleNewMembership = props.invoiceTitleNewMembership
    this.invoiceTitleRenewalMembership = props.invoiceTitleRenewalMembership
    this.invoiceMailSubjectNewMembership = props.invoiceMailSubjectNewMembership
    this.invoiceMailBodyNewMembership = props.invoiceMailBodyNewMembership
    this.invoiceMailSubjectRenewalMembership = props.invoiceMailSubjectRenewalMembership
    this.invoiceMailBodyRenewalMembership = props.invoiceMailBodyRenewalMembership
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
    if (props.invoice.subscriptionID) {
      const subscription = await this.prisma.subscription.findUnique({
        where: {id: props.invoice.subscriptionID}
      })
      if (!subscription?.paidUntil) {
        return await this.bexioCreate(props.invoice.id, false)
      }
    }
    return {
      intentID: '',
      intentSecret: '',
      intentData: '',
      state: PaymentState.requiresUserAction
    }
  }

  /**
   * Create remote invoice in case of renewal
   * @param props
   */

  async createRemoteInvoice(props: CreateRemoteInvoiceProps) {
    await this.bexioCreate(props.invoice.id, true)
  }

  async checkIntentStatus({intentID}: CheckIntentProps): Promise<IntentState> {
    return {
      state: PaymentState.requiresUserAction,
      paymentID: 'None',
      paymentData: ''
    }
  }

  async bexioCreate(invoiceId: string, isRenewal: boolean) {
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

      if (!invoice || !invoice.subscription || !invoice.subscription.user) {
        throw new Error(
          `Bexio payment adapter not found the invoice, subscription or user! ${JSON.stringify(
            invoice
          )}`
        )
      }

      const bexio = new Bexio(this.apiKey)
      const contact = await this.searchForContact(bexio, invoice.subscription.user)
      const updatedContact = await this.createOrUpdateContact(
        bexio,
        contact,
        invoice.subscription.user
      )
      await this.createInvoice(bexio, updatedContact, invoice, isRenewal)
      return {
        intentID: '',
        intentSecret: '',
        intentData: '',
        state: PaymentState.created
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  async searchForContact(bexio: Bexio, user: User) {
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
    user: User & {address: UserAddress | null}
  ) {
    const upsertContact: ContactsStatic.ContactOverwrite = {
      nr: '',
      name_1: user?.address?.company ? user?.address.company : user.name, // lastname or company name
      name_2: user?.address?.company ? '' : user.firstName ?? undefined, // Firstname or none
      mail: user.email,
      user_id: this.userId,
      contact_type_id: user?.address?.company ? 1 : 2, // 1: Company 2: Person
      country_id: this.countryId,
      owner_id: this.userId,
      contact_group_ids: [],
      postcode: user?.address?.zipCode ?? undefined,
      city: user?.address?.city ?? undefined,
      address: user?.address?.streetAddress ?? undefined
    }
    if (!contact) {
      return await bexio.contacts.create(upsertContact)
    } else {
      upsertContact.nr = contact.nr
      return await bexio.contacts.edit(contact.id, upsertContact)
    }
  }

  async createInvoice(
    bexio: Bexio,
    contact: ContactsStatic.ContactFull,
    invoice: Invoice & {subscription: (Subscription & {memberPlan: MemberPlan; user: User}) | null},
    isRenewal: boolean
  ) {
    if (!invoice || !invoice.subscription || !invoice.subscription.user) {
      throw new Error(
        `Bexio payment adapter not found the invoice, subscription or user! ${JSON.stringify(
          invoice
        )}`
      )
    }
    const stringReplaceMap = new MappedReplacer()
    this.addToStringReplaceMap(stringReplaceMap, 'subscription', invoice.subscription)
    this.addToStringReplaceMap(stringReplaceMap, 'user', invoice.user)
    this.addToStringReplaceMap(stringReplaceMap, 'memberPlan', invoice.subscription.memberPlan)
    const bexioInvoice: InvoicesStatic.InvoiceCreate = {
      title: isRenewal ? this.invoiceTitleRenewalMembership : this.invoiceTitleNewMembership,
      contact_id: contact.id,
      user_id: this.userId,
      mwst_type: 0,
      mwst_is_net: false,
      template_slug: isRenewal
        ? this.invoiceTemplateRenewalMembership
        : this.invoiceTemplateNewMembership,
      positions: [
        {
          amount: '1',
          unit_id: this.unitId,
          account_id: this.accountId,
          tax_id: this.taxId,
          text: invoice.subscription.memberPlan.name,
          unit_price: `${
            (invoice.subscription.monthlyAmount *
              getMonthsFromPaymentPeriodicity(invoice.subscription.paymentPeriodicity)) /
            100
          }`,
          type: 'KbPositionCustom'
        }
      ]
    }
    const invoiceUpdated = await bexio.invoices.create(bexioInvoice)
    const sentInvoice = await bexio.invoices.sent(invoiceUpdated.id, {
      recipient_email: contact.mail,
      subject: stringReplaceMap.replace(
        isRenewal ? this.invoiceMailSubjectRenewalMembership : this.invoiceMailSubjectNewMembership
      ),
      message: stringReplaceMap.replace(
        isRenewal ? this.invoiceMailBodyRenewalMembership : this.invoiceMailBodyNewMembership
      ),
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
