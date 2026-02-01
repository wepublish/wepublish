import {
  Invoice,
  InvoiceItem,
  MemberPlan,
  PaymentState,
  Subscription,
  User,
  UserAddress,
} from '@prisma/client';
import { logger } from '@wepublish/utils/api';
import Bexio, { ContactsStatic, InvoicesStatic } from 'bexio';
import { MappedReplacer } from 'mapped-replacer';
import {
  BasePaymentProvider,
  CheckIntentProps,
  CreatePaymentIntentProps,
  CreateRemoteInvoiceProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from '../payment-provider';
import {
  InvoiceNotFoundError,
  NoSubscriptionIdInInvoice,
  ResponseNOK,
  SendingInvoiceError,
  UnknownIntentState,
  WebhookNotImplementedError,
} from './bexio-errors';
import {
  addToStringReplaceMap,
  mapBexioStatusToPaymentStatus,
  searchForContact,
} from './bexio-utils';
import fetch from 'node-fetch';

export class BexioPaymentProvider extends BasePaymentProvider {
  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async getBexioGateway() {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Stripe missing api key');
    }
    return new Bexio(config.apiKey);
  }

  async webhookForPaymentIntent(
    props: WebhookForPaymentIntentProps
  ): Promise<WebhookResponse> {
    throw new WebhookNotImplementedError();
  }

  /**
   * Creates a payment intent based on the provided invoice details.
   * If the invoice has an associated subscription ID, it throws an error.
   * Otherwise, it proceeds to create a payment intent using Bexio's API.
   *
   * @param {CreatePaymentIntentProps} props - The properties required to create the payment intent.
   * @returns {Promise<Intent>} A promise that resolves to the created payment intent object.
   * @throws {NoSubscriptionIdInInvoice} Throws an error if the invoice contains a subscription ID.
   */
  async createIntent(props: CreatePaymentIntentProps): Promise<Intent> {
    if (!props.invoice.subscriptionID) {
      throw new NoSubscriptionIdInInvoice();
    }

    return await this.bexioCreate(props.invoice.id, false, props.successURL);
  }

  /**
   * This function calls the `bexioCreate` method to create an invoice in Bexio.
   * It is designed to handle the creation of remote invoices, specifically for renewals.
   *
   * @async
   * @function
   * @param {CreateRemoteInvoiceProps} props - The properties required to create the remote invoice.
   * @param {string} props.invoice.id - The ID of the invoice.
   *
   * @returns {Promise<void>} Resolves when the remote invoice is successfully created.
   */
  override async createRemoteInvoice(props: CreateRemoteInvoiceProps) {
    await this.bexioCreate(props.invoice.id, true);
  }

  /**
   * Checks the status of a payment intent in Bexio.
   * It makes a direct fetch request to the Bexio API because the Bexio library
   * does not return the status when querying for an invoice.
   *
   * @param {CheckIntentProps} CheckIntentProps - An object with the intentID to check the status.
   * @returns {Promise<IntentState>} A promise that resolves to the status of the intent.
   * @throws {ResponseNOK} Throws an error if the response status from Bexio is not 200.
   * @throws {UnknownIntentState} Throws an error if the intent status is not recognized.
   */
  async checkIntentStatus({
    intentID,
    paymentID,
  }: CheckIntentProps): Promise<IntentState> {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Stripe missing api key');
    }
    // currently the bexio library we use doesn't return the status (kb_item_status_id)
    // when querying for invoice, so we need to do it "manually" using fetch api
    const bexioBaseUrl = 'https://api.bexio.com/2.0';
    const headers = {
      Method: 'GET',
      Accept: 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    };

    const response = await fetch(`${bexioBaseUrl}/kb_invoice/${intentID}`, {
      headers,
    });

    if (response.status !== 200) {
      logger('bexioPaymentProvider').error(
        'Bexio response for intent %s is NOK with status %s',
        intentID,
        response.status
      );
      throw new ResponseNOK(response.status);
    }

    const bexioResponse = await response.json();

    const intentStatus = mapBexioStatusToPaymentStatus(
      bexioResponse.kb_item_status_id
    );

    if (!intentStatus) {
      logger('bexioPaymentProvider').error(
        'Bexio intent with ID: %s for paymentProvider %s returned with an unknown state %s',
        intentID,
        this.id,
        intentStatus
      );
      throw new UnknownIntentState();
    }

    return {
      state: intentStatus,
      paymentID,
      paymentData: JSON.stringify(bexioResponse),
      customerID:
        bexioResponse.contact_id ? bexioResponse.contact_id.toString() : '',
    };
  }

  /**
   * Creates an invoice in Bexio based on a provided invoice ID and optionally marks it as a renewal.
   *
   * This function performs several operations:
   * 1. Fetches the invoice details from the database using Prisma.
   * 2. Searches for the associated contact in Bexio or creates/updates the contact.
   * 3. Creates a new invoice in Bexio for the contact.
   *
   * @async
   * @function
   * @param {string} invoiceId - The ID of the invoice in the local database.
   * @param {boolean} isRenewal - Indicates whether the invoice is a renewal or a new invoice.
   * @param {string} successURL - The url the client gets redirected after successful invoice creation
   *
   * @throws {InvoiceNotFoundError} If the invoice or related data cannot be found in the local database.
   * @throws {Error} For any other generic error.
   *
   * @returns {Promise<Intent>} An object containing:
   *   - intentID: The ID of the newly created invoice in Bexio.
   *   - intentSecret: An empty string (as there's no secret provided in the function).
   *   - intentData: A JSON string representation of the new invoice from Bexio.
   *   - state: The state of the payment, set as 'submitted'.
   */
  async bexioCreate(
    invoiceId: string,
    isRenewal: boolean,
    successURL = ''
  ): Promise<Intent> {
    try {
      const invoice = await this.prisma.invoice.findUnique({
        where: {
          id: invoiceId,
        },
        include: {
          subscription: {
            include: {
              memberPlan: true,
              user: {
                include: {
                  address: true,
                },
              },
            },
          },
          items: true,
        },
      });

      if (!invoice || !invoice.subscription || !invoice.subscription.user) {
        throw new InvoiceNotFoundError(invoice);
      }

      const bexio = await this.getBexioGateway();
      const contact = await searchForContact(bexio, invoice.subscription.user);
      const updatedContact = await this.createOrUpdateContact(
        contact,
        invoice.subscription.user
      );
      const newInvoice = await this.createInvoice(
        updatedContact,
        invoice,
        isRenewal
      );

      return {
        intentID: newInvoice.id.toString(),
        intentSecret: successURL,
        intentData: JSON.stringify(newInvoice),
        state: PaymentState.submitted,
      };
    } catch (e) {
      logger('bexioPaymentProvider').error(
        'Failed to create Bexio invoice for invoiceId %s (renewal: %s): %s',
        invoiceId,
        isRenewal,
        e instanceof Error ? e.message : String(e)
      );
      throw e;
    }
  }

  /**
   * Creates a new contact in Bexio or updates an existing contact based on provided data.
   *
   * The function determines whether to create or update a contact based on the presence
   * of the `contact` parameter. If a contact is provided, it will be updated; otherwise,
   * a new contact will be created. The function utilizes user data, especially the user's
   * address, to populate or overwrite contact details in Bexio.
   *
   * @async
   * @function
   * @param {ContactsStatic.ContactSmall} contact - The existing contact details from Bexio.
   *        If this parameter is not provided, a new contact will be created.
   * @param {User & {address: UserAddress | null}} user - The user's details, including the associated address.
   *
   * @returns {Promise<ContactsStatic.ContactFull>} The created or updated contact object from Bexio.
   */
  async createOrUpdateContact(
    contact: ContactsStatic.ContactSmall,
    user: User & { address: UserAddress | null }
  ) {
    const config = await this.getConfig();
    const bexio = await this.getBexioGateway();
    const upsertContact: ContactsStatic.ContactOverwrite = {
      nr: '',
      name_1: user?.address?.company ? user?.address.company : user.name, // lastname or company name
      name_2: user?.address?.company ? '' : (user.firstName ?? undefined), // Firstname or none
      mail: user.email,
      user_id: this.assertProperty('bexio_userId', config.bexio_userId),
      contact_type_id: user?.address?.company ? 1 : 2, // 1: Company 2: Person
      country_id: this.assertProperty(
        'bexio_countryId',
        config.bexio_countryId
      ),
      owner_id: this.assertProperty('bexio_userId', config.bexio_userId),
      contact_group_ids: [],
      postcode: user?.address?.zipCode ?? undefined,
      city: user?.address?.city ?? undefined,
      street_name: user?.address?.streetAddress ?? undefined,
      house_number: user?.address?.streetAddressNumber ?? undefined,
    };
    if (!contact) {
      return await bexio.contacts.create(upsertContact);
    } else {
      upsertContact.nr = contact.nr;
      return await bexio.contacts.edit(contact.id, upsertContact);
    }
  }

  /**
   * Creates and sends an invoice in Bexio based on provided contact, invoice, and renewal status.
   *
   * This function performs several operations:
   * 1. Validates the provided invoice and associated data.
   * 2. Creates a string replace map based on the subscription, user, and memberPlan.
   * 3. Constructs a new Bexio invoice object and creates the invoice in Bexio.
   * 4. Sends the created Bexio invoice to the associated contact.
   *
   * @async
   * @function
   * @param {ContactsStatic.ContactFull} contact - The contact associated with the invoice in Bexio.
   * @param {Invoice & {subscription: (Subscription & {memberPlan: MemberPlan; user: User}) | null}} invoice -
   *        The invoice data and its associated subscription, member plan, and user details.
   * @param {boolean} isRenewal - Indicates whether the invoice is a renewal or a new invoice.
   *
   * @throws {InvoiceNotFoundError} If the provided invoice or related data is not valid.
   * @throws {SendingInvoiceError} If there's an issue sending the created invoice.
   *
   * @returns {Promise<InvoicesStatic.Invoice>} The created invoice object from Bexio.
   */
  async createInvoice(
    contact: ContactsStatic.ContactFull,
    invoice: Invoice & {
      items: InvoiceItem[];
      subscription:
        | (Subscription & { memberPlan: MemberPlan; user: User })
        | null;
    },
    isRenewal: boolean
  ) {
    if (!invoice || !invoice.subscription || !invoice.subscription.user) {
      throw new InvoiceNotFoundError(invoice);
    }
    const stringReplaceMap = new MappedReplacer();
    addToStringReplaceMap(
      stringReplaceMap,
      'subscription',
      invoice.subscription
    );
    addToStringReplaceMap(stringReplaceMap, 'user', invoice.subscription.user);
    addToStringReplaceMap(
      stringReplaceMap,
      'memberPlan',
      invoice.subscription.memberPlan
    );
    const config = await this.getConfig();

    const bexioInvoice: InvoicesStatic.InvoiceCreate = {
      title:
        isRenewal ?
          config.bexio_invoiceTitleRenewalMembership || ''
        : config.bexio_invoiceTitleNewMembership || '',
      contact_id: contact.id,
      user_id: this.assertProperty('bexio_userId', config.bexio_userId),
      mwst_type: 0,
      mwst_is_net: false,
      api_reference: invoice.id,
      template_slug:
        isRenewal ?
          config.bexio_invoiceTemplateRenewalMembership || ''
        : config.bexio_invoiceTemplateNewMembership || '',
      positions: [
        {
          amount: '1',
          unit_id: this.assertProperty('bexio_unitId', config.bexio_unitId),
          account_id: this.assertProperty(
            'bexio_accountId',
            config.bexio_accountId
          ),
          tax_id: this.assertProperty('bexio_taxId', config.bexio_taxId),
          text: invoice.subscription.memberPlan.name,
          unit_price: `${invoice.items.reduce((total, item) => total + item.amount * item.quantity, 0) / 100}`,
          type: 'KbPositionCustom',
        },
      ],
    };
    const bexio = await this.getBexioGateway();
    const invoiceUpdated = await bexio.invoices.create(bexioInvoice);
    const sentInvoice = await bexio.invoices.sent(invoiceUpdated.id, {
      recipient_email: contact.mail,
      subject: stringReplaceMap.replace(
        isRenewal ?
          config.bexio_invoiceMailSubjectRenewalMembership || ''
        : config.bexio_invoiceMailSubjectNewMembership || ''
      ),
      message: stringReplaceMap.replace(
        isRenewal ?
          config.bexio_invoiceMailBodyRenewalMembership || ''
        : config.bexio_invoiceMailBodyNewMembership || ''
      ),
      mark_as_open: this.assertProperty(
        'bexio_markInvoiceAsOpen',
        config.bexio_markInvoiceAsOpen
      ),
      attach_pdf: true,
    });

    logger('bexioPaymentProvider').info(
      'Created Bexio invoice with ID: %s for paymentProvider %s',
      invoiceUpdated.id,
      this.id
    );
    if (!sentInvoice.success) {
      throw new SendingInvoiceError(sentInvoice);
    }
    return invoiceUpdated;
  }
}
