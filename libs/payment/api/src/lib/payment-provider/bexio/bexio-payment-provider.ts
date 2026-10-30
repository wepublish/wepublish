import {
  Invoice,
  InvoiceItem,
  MailChannel,
  MemberPlan,
  PaymentProviderCustomer,
  PaymentState,
  Subscription,
  User,
} from '@prisma/client';
import { addErrorContext, describeError, logger } from '@wepublish/utils/api';
import Bexio, { ContactsStatic, InvoicesStatic } from 'bexio';
import { MappedReplacer } from 'mapped-replacer';
import {
  BasePaymentProvider,
  CancelRemoteSubscriptionProps,
  CheckIntentProps,
  CreatePaymentIntentProps,
  CreateRemoteInvoiceProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  RemoteInvoiceDocument,
  RemoteInvoiceResult,
  RenderRemoteInvoiceProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from '../payment-provider';
import {
  InvoiceDeliveryError,
  InvoiceNotFoundError,
  IssuingInvoiceError,
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
import fetch, { RequestInit } from 'node-fetch';
import { bexioContactFields, ContactUser } from './bexio-contact-mapping';
import { BexioCountries, BexioCountry } from './bexio-countries';

const BEXIO_BASE_URL = 'https://api.bexio.com/2.0';
const COUNTRIES_TTL_MS = 24 * 60 * 60 * 1000;

export type SyncContactUser = ContactUser & {
  paymentProviderCustomers: PaymentProviderCustomer[];
};

/** What the contact sync did for a reader. */
export type SyncContactOutcome = 'edited' | 'created' | 'missing';

const isNotFound = (error: unknown) =>
  (error as { code?: number } | null)?.code === 404;

export class BexioPaymentProvider extends BasePaymentProvider {
  // bexio's country list changes rarely; one load serves a whole night.
  private countryList?: { loadedAt: number; countries: BexioCountries };

  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async getBexioGateway() {
    const config = await this.getConfig();
    if (!config.apiKey) {
      throw new Error('Bexio missing api key');
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

    const { intent, deliveryError } = await this.bexioCreate(
      props.invoice.id,
      false,
      props.successURL
    );

    // A checkout has nobody to hand the invoice to but the email.
    if (deliveryError) {
      throw new InvoiceDeliveryError(deliveryError);
    }

    return intent;
  }

  /**
   * Creates the renewal invoice in Bexio and either has Bexio email it or, for
   * a reader who gets letters, issues it and hands back its pdf for printing.
   * The returned intent carries the Bexio invoice id so the payment can be
   * polled.
   */
  override async createRemoteInvoice(
    props: CreateRemoteInvoiceProps
  ): Promise<RemoteInvoiceResult> {
    return this.bexioCreate(props.invoice.id, true, '', props.channel);
  }

  /** The pdf of the Bexio invoice behind a payment, for printing it again. */
  override async renderRemoteInvoice({
    payment,
  }: RenderRemoteInvoiceProps): Promise<RemoteInvoiceDocument | undefined> {
    if (!payment.intentID || !/^\d+$/.test(payment.intentID)) {
      return undefined;
    }

    return this.fetchInvoicePdf(
      await this.getBexioGateway(),
      Number(payment.intentID)
    );
  }

  /**
   * Cancels the invoices on Bexio side when a subscription is being cancelled
   *
   * @param {CancelRemoteSubscriptionProps} props
   * @returns {Promise<void>}
   */
  override async cancelRemoteSubscription(
    props: CancelRemoteSubscriptionProps
  ): Promise<void> {
    const invoice = await this.prisma.invoice.findFirst({
      where: {
        subscriptionID: props.subscription.id,
        paidAt: null,
        canceledAt: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!invoice) {
      logger('bexioPaymentProvider').error(
        "Subscription invoice doesn't exist or is already paid/cancelled: %s",
        props.subscription.id
      );
      return;
    }

    const payments = await this.prisma.payment.findMany({
      where: {
        invoiceID: invoice.id,
        intentID: {
          not: null,
        },
        // Polling maps an unpaid or draft Bexio invoice to requiresUserAction,
        // which is where a renewal invoice sits by the time it is cancelled.
        state: {
          in: [
            PaymentState.created,
            PaymentState.submitted,
            PaymentState.processing,
            PaymentState.requiresUserAction,
          ],
        },
      },
    });

    const bexio = await this.getBexioGateway();

    await Promise.all(
      payments.map(async payment => {
        if (!payment.intentID || isNaN(+payment.intentID)) {
          logger('bexioPaymentProvider').error(
            'Payment (id: %s) intentID is not a number: %s',
            payment.id,
            payment.intentID
          );

          return;
        }

        try {
          await bexio.invoices.cancel(+payment.intentID);
        } catch (error) {
          logger('bexioPaymentProvider').error(
            'Error to cancel invoice for payment (id: %s): %s',
            payment.id,
            describeError(error)
          );
        }
      })
    );
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
      throw new Error('Bexio missing api key');
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
      signal: AbortSignal.timeout(30_000) as unknown as RequestInit['signal'],
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
   * @param {MailChannel} channel - Email the invoice (default) or render it for a letter
   *
   * @throws {InvoiceNotFoundError} If the invoice or related data cannot be found in the local database.
   * @throws {Error} For any other generic error.
   *
   * @returns {Promise<RemoteInvoiceResult>} The intent (intentID is the Bexio
   *   invoice id, state 'submitted'), the rendered pdf for a letter, and the
   *   delivery error if the invoice was created but not delivered.
   */
  async bexioCreate(
    invoiceId: string,
    isRenewal: boolean,
    successURL = '',
    channel: MailChannel = MailChannel.mail
  ): Promise<RemoteInvoiceResult> {
    let step = 'loading the invoice';

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
                  paymentProviderCustomers: true,
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

      step = 'loading its settings';
      const bexio = await this.getBexioGateway();
      step = 'searching the contact';
      const user = invoice.subscription.user;
      const storedContactId = user.paymentProviderCustomers.find(
        customer => customer.paymentProviderID === this.id
      )?.customerID;
      const contact =
        (await this.findStoredContact(bexio, storedContactId)) ??
        (await searchForContact(bexio, user));
      step = 'saving the contact';
      const updatedContact = await this.createOrUpdateContact(contact, user);
      // The invoice pushed the reader's data too; the nightly sync may skip them.
      await this.markSynced(user.id);
      step = 'creating the invoice';
      const {
        invoice: newInvoice,
        document,
        deliveryError,
      } = await this.createInvoice(updatedContact, invoice, isRenewal, channel);

      // The email can differ between we.publish and bexio, so the next
      // invoice finds this contact by its id. Only a convenience: the
      // invoice is out either way, so a missing id is skipped, not thrown.
      const contactId =
        updatedContact.id != null ? String(updatedContact.id) : undefined;

      if (contactId && contactId !== storedContactId) {
        await this.saveCustomer(user.id, contactId).catch(error =>
          logger('bexioPaymentProvider').warn(
            'Could not remember Bexio contact %s for user %s: %s',
            contactId,
            user.id,
            describeError(error)
          )
        );
      }

      return {
        intent: {
          intentID: newInvoice.id.toString(),
          intentSecret: successURL,
          intentData: JSON.stringify(newInvoice),
          state: PaymentState.submitted,
        },
        ...(document && { document }),
        ...(deliveryError && { deliveryError }),
      };
    } catch (e) {
      const error = addErrorContext(
        e,
        `Bexio failed while ${step} for invoice ${invoiceId}`
      );
      logger('bexioPaymentProvider').error(
        'Failed to create Bexio invoice for invoiceId %s (renewal: %s): %s',
        invoiceId,
        isRenewal,
        error.message
      );
      throw error;
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
  /** The contact an earlier invoice went to, unless it is gone. */
  private async findStoredContact(bexio: Bexio, contactId?: string) {
    if (!contactId || !/^\d+$/.test(contactId)) {
      return undefined;
    }

    try {
      return await bexio.contacts.show(Number(contactId));
    } catch (error) {
      logger('bexioPaymentProvider').warn(
        'Stored Bexio contact %s not found, searching by email: %s',
        contactId,
        describeError(error)
      );
      return undefined;
    }
  }

  async createOrUpdateContact(
    contact: ContactsStatic.ContactSmall,
    user: ContactUser
  ) {
    const bexio = await this.getBexioGateway();
    const fields = await this.contactFields(user);

    if (!contact) {
      return bexio.contacts.create(await this.newContact(fields));
    }

    return bexio.contacts.edit(contact.id, { nr: contact.nr, ...fields });
  }

  /**
   * Push the reader's data to their bexio contact: edit the stored one, else
   * the one found by email, else create one and remember it. A stored contact
   * bexio no longer knows is a data problem to look at, not a reason to
   * create a second one.
   */
  async syncContact(user: SyncContactUser): Promise<SyncContactOutcome> {
    const bexio = await this.getBexioGateway();
    const fields = await this.contactFields(user);
    const storedId = user.paymentProviderCustomers.find(
      customer => customer.paymentProviderID === this.id
    )?.customerID;

    if (storedId && /^\d+$/.test(storedId)) {
      try {
        await bexio.contacts.edit(Number(storedId), fields);
      } catch (error) {
        if (!isNotFound(error)) {
          throw error;
        }

        logger('bexioPaymentProvider').warn(
          'Bexio contact %s stored for user %s does not exist; not synced',
          storedId,
          user.id
        );

        return 'missing';
      }

      await this.markSynced(user.id);

      return 'edited';
    }

    const found = await searchForContact(bexio, user);
    const contact =
      found ?
        await bexio.contacts.edit(found.id, fields)
      : await bexio.contacts.create(await this.newContact(fields));

    await this.saveCustomer(user.id, String(contact.id));
    await this.markSynced(user.id);

    return found ? 'edited' : 'created';
  }

  /** bexio's countries by iso code, the configured one as fallback. */
  async countries(): Promise<BexioCountries> {
    const config = await this.getConfig();
    const fallback = this.assertProperty(
      'bexio_countryId',
      config.bexio_countryId
    );
    const cached = this.countryList;

    if (
      cached &&
      cached.countries.fallback === fallback &&
      Date.now() - cached.loadedAt < COUNTRIES_TTL_MS
    ) {
      return cached.countries;
    }

    const countries = await BexioCountries.load(
      () => this.fetchCountries(config.apiKey),
      fallback
    );
    this.countryList = { loadedAt: Date.now(), countries };

    return countries;
  }

  private async fetchCountries(apiKey: string | null): Promise<BexioCountry[]> {
    const response = await fetch(`${BEXIO_BASE_URL}/country?limit=500`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: AbortSignal.timeout(30_000) as unknown as RequestInit['signal'],
    });

    if (response.status !== 200) {
      throw new ResponseNOK(response.status);
    }

    return (await response.json()) as BexioCountry[];
  }

  private async contactFields(user: ContactUser) {
    return bexioContactFields(
      user,
      (await this.countries()).idFor(user.address?.country)
    );
  }

  /** The fields only a new contact needs; bexio fills the rest. */
  private async newContact(
    fields: Partial<ContactsStatic.ContactOverwrite>
  ): Promise<ContactsStatic.ContactCreate> {
    const config = await this.getConfig();
    const userId = this.assertProperty('bexio_userId', config.bexio_userId);

    return {
      nr: '',
      ...fields,
      user_id: userId,
      owner_id: userId,
      contact_group_ids: [],
    } as ContactsStatic.ContactCreate;
  }

  /** Bookkeeping for the nightly sync; must never fail a push that worked. */
  private async markSynced(userId: string) {
    try {
      await this.prisma.paymentProviderCustomer.updateMany({
        where: { userId, paymentProviderID: this.id },
        data: { syncedAt: new Date() },
      });
    } catch (error) {
      logger('bexioPaymentProvider').warn(
        'Could not record the contact sync of user %s: %s',
        userId,
        describeError(error)
      );
    }
  }

  /**
   * Creates an invoice in Bexio for the contact and delivers it: emailed by
   * Bexio with the pdf attached, or — for a reader who gets letters — issued
   * and rendered to a pdf that we.publish prints.
   *
   * Once Bexio has created the invoice, a delivery failure is returned with it
   * rather than thrown: the caller would try again and create a second one.
   *
   * @throws {InvoiceNotFoundError} If the provided invoice or related data is not valid.
   */
  async createInvoice(
    contact: ContactsStatic.ContactFull,
    invoice: Invoice & {
      items: InvoiceItem[];
      subscription:
        (Subscription & { memberPlan: MemberPlan; user: User }) | null;
    },
    isRenewal: boolean,
    channel: MailChannel = MailChannel.mail
  ): Promise<{
    invoice: InvoicesStatic.Invoice;
    document?: RemoteInvoiceDocument;
    deliveryError?: string;
  }> {
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
    const created = await bexio.invoices.create(bexioInvoice);
    const markAsOpen = this.assertProperty(
      'bexio_markInvoiceAsOpen',
      config.bexio_markInvoiceAsOpen
    );

    logger('bexioPaymentProvider').info(
      'Created Bexio invoice with ID: %s for paymentProvider %s',
      created.id,
      this.id
    );

    try {
      if (channel === MailChannel.letter) {
        return {
          invoice: created,
          document: await this.renderInvoiceForLetter(
            bexio,
            created.id,
            markAsOpen
          ),
        };
      }

      const sentInvoice = await bexio.invoices.send(created.id, {
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
        mark_as_open: markAsOpen,
        attach_pdf: true,
      });

      if (!sentInvoice.success) {
        throw new SendingInvoiceError(sentInvoice);
      }

      return { invoice: created };
    } catch (error) {
      const deliveryError = describeError(error);

      logger('bexioPaymentProvider').error(
        'Bexio invoice %s was created but not delivered by %s: %s',
        created.id,
        channel,
        deliveryError
      );

      return { invoice: created, deliveryError };
    }
  }

  /**
   * What emailing does without the email: issue the invoice, as `mark_as_open`
   * would, and fetch its pdf on Bexio's letterhead for we.publish to print.
   */
  private async renderInvoiceForLetter(
    bexio: Bexio,
    invoiceId: number,
    markAsOpen: boolean
  ): Promise<RemoteInvoiceDocument> {
    if (markAsOpen) {
      const issued = await bexio.invoices.issue(invoiceId);

      if (!issued.success) {
        throw new IssuingInvoiceError(issued);
      }
    }

    return this.fetchInvoicePdf(bexio, invoiceId);
  }

  /** The invoice on Bexio's letterhead, as it would be attached to the email. */
  private async fetchInvoicePdf(
    bexio: Bexio,
    invoiceId: number
  ): Promise<RemoteInvoiceDocument> {
    const pdf = await bexio.invoices.showPdf(invoiceId, 1);

    return { content: pdf.content, name: pdf.name, mime: pdf.mime };
  }
}
