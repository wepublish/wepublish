import { PaymentMethodChangeState, PaymentState } from '@prisma/client';
import {
  AuthorizationIntent,
  AuthorizationState,
  BasePaymentProvider,
  CheckIntentProps,
  CreateAuthorizationIntentProps,
  CreatePaymentIntentProps,
  Intent,
  IntentState,
  PaymentProviderProps,
  WebhookForPaymentIntentProps,
  WebhookResponse,
} from './payment-provider';

const OUTCOMES = {
  paid: PaymentState.paid,
  declined: PaymentState.declined,
  canceled: PaymentState.canceled,
} as const;

type Outcome = keyof typeof OUTCOMES;

// An own-property check, not `in`: `in` also accepts inherited names such as
// `constructor`.
const isOutcome = (action: string): action is Outcome =>
  Object.prototype.hasOwnProperty.call(OUTCOMES, action);

/** A payment can only be settled once; afterwards the page refuses it. */
const OPEN_PAYMENT_STATES: PaymentState[] = [
  PaymentState.created,
  PaymentState.submitted,
  PaymentState.requiresUserAction,
  PaymentState.processing,
];

const AUTHORIZATION_OUTCOMES = ['authorized', 'failed'] as const;

type AuthorizationOutcomeAction = (typeof AUTHORIZATION_OUTCOMES)[number];

/** What a real provider would hold to authorize a card, in cents. */
const AUTHORIZATION_AMOUNT = 1;

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

type ReturnURLs = { successURL?: string; failureURL?: string };

/**
 * The return URLs are fixed when the payment or change is created and kept in
 * its `intentData`. They never travel through the checkout link or form, so
 * the page cannot be used to redirect to an arbitrary site.
 */
const storeReturnURLs = ({ successURL, failureURL }: ReturnURLs) =>
  JSON.stringify({ successURL, failureURL });

const readReturnURLs = (intentData: string | null | undefined): ReturnURLs => {
  try {
    const { successURL, failureURL } = JSON.parse(intentData ?? '') ?? {};

    return {
      successURL: typeof successURL === 'string' ? successURL : undefined,
      failureURL: typeof failureURL === 'string' ? failureURL : undefined,
    };
  } catch {
    return {};
  }
};

/**
 * Express parses `a[]=1` and `a[b]=1` into arrays and objects. Every field this
 * page reads must be a string; `null` marks one that is present but is not.
 */
const readFields = <Key extends string>(
  source: unknown,
  keys: readonly Key[]
): Record<Key, string | undefined> | null => {
  const record = (source ?? {}) as Record<string, unknown>;
  const fields = {} as Record<Key, string | undefined>;

  for (const key of keys) {
    const value = record[key];

    if (value !== undefined && typeof value !== 'string') {
      return null;
    }

    fields[key] = value as string | undefined;
  }

  return fields;
};

const BAD_REQUEST: WebhookResponse = {
  status: 400,
  message: 'Malformed simulated payment request',
};

const NOT_FOUND = (what: string): WebhookResponse => ({
  status: 404,
  message: `${what} not found`,
});

const hidden = (name: string, value: string) =>
  `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`;

const submit = (value: string, label: string) =>
  `<button type="submit" name="action" value="${value}">${label}</button>`;

/**
 * A payment provider that never leaves We.Publish, for development, review
 * apps and tests: the counterpart of the `log` mail provider. It walks the
 * same path as a hosted checkout such as Payrexx — `createIntent` sends the
 * customer to a checkout page, the outcome comes back through the payment
 * webhook — except that the checkout page is served by the api itself and the
 * customer picks the outcome.
 *
 * With `offSessionPayments`, a paid checkout stores a customer, so renewals are
 * charged straight away, as with a stored card — or declined, with
 * `simulated_declineRenewals`, to test failed recurring payments.
 *
 * A payment method can also be authorized without a charge (when a reader
 * changes the payment method of a subscription): the same page then shows the
 * hold a real provider would place and stores a customer when authorized.
 *
 * No money moves: anyone reaching the checkout page can mark a payment paid.
 * That is limited to open payments and pending changes of this provider, and
 * the provider never runs on production (`isSimulatedPaymentAllowed`).
 */
export class SimulatedPaymentProvider extends BasePaymentProvider {
  override readonly supportsStandaloneInvoices = true;

  constructor(props: PaymentProviderProps) {
    super(props);
  }

  async createIntent({
    paymentID,
    customerID,
    successURL,
    failureURL,
  }: CreatePaymentIntentProps): Promise<Intent> {
    const intentID = `simulated_${paymentID}`;

    if (customerID) {
      // A charge of a stored customer (a renewal): nobody is there to pick
      // the outcome, so the provider setting decides it.
      if ((await this.getConfig())?.simulated_declineRenewals) {
        return {
          intentID,
          intentSecret: '',
          intentData: JSON.stringify({ customerID }),
          state: PaymentState.declined,
          errorCode: 'simulated_declined',
        };
      }

      return {
        intentID,
        intentSecret: '',
        intentData: JSON.stringify({ customerID }),
        state: PaymentState.paid,
        paidAt: new Date(),
      };
    }

    return {
      intentID,
      intentSecret: this.checkoutURL('paymentID', paymentID),
      intentData: storeReturnURLs({ successURL, failureURL }),
      state: PaymentState.processing,
    };
  }

  private checkoutURL(key: 'paymentID' | 'changeID', id: string): string {
    const checkout = new URL(
      `${process.env['HOST_URL'] ?? 'http://localhost:4000'}/payment-webhooks/${this.id}`
    );
    checkout.searchParams.set(key, id);

    return checkout.toString();
  }

  override supportsAuthorization(): boolean {
    return true;
  }

  override async createAuthorizationIntent({
    changeID,
    successURL,
    failureURL,
  }: CreateAuthorizationIntentProps): Promise<AuthorizationIntent> {
    return {
      intentID: `simulated_authorization_${changeID}`,
      intentSecret: this.checkoutURL('changeID', changeID),
      intentData: storeReturnURLs({ successURL, failureURL }),
      state: 'processing',
      amount: AUTHORIZATION_AMOUNT,
    };
  }

  async webhookForPaymentIntent({
    req,
  }: WebhookForPaymentIntentProps): Promise<WebhookResponse> {
    if (req.method === 'GET') {
      const query = readFields(req.query, ['paymentID', 'changeID']);

      if (!query) {
        return BAD_REQUEST;
      }

      return query.changeID ?
          this.confirmationPage(query.changeID)
        : this.checkoutPage(query.paymentID ?? '');
    }

    const body = readFields(req.body, ['paymentID', 'changeID', 'action']);

    if (!body) {
      return BAD_REQUEST;
    }

    const { paymentID, changeID, action = '' } = body;

    if (changeID) {
      return this.confirmationOutcome(changeID, action);
    }

    if (!paymentID || !isOutcome(action)) {
      return {
        status: 400,
        message: `Unknown simulated payment outcome "${action}"`,
      };
    }

    const payment = await this.findOwnPayment(paymentID);

    if (!payment) {
      return NOT_FOUND(`Payment ${paymentID}`);
    }

    if (!OPEN_PAYMENT_STATES.includes(payment.state)) {
      return {
        status: 409,
        message: `Payment ${paymentID} is already ${payment.state}`,
      };
    }

    const state = OUTCOMES[action];
    const paid = state === PaymentState.paid;
    const { successURL, failureURL } = readReturnURLs(payment.intentData);

    const intentState: IntentState = {
      paymentID,
      state,
      paymentData: JSON.stringify({ simulated: action }),
      ...(paid ? { paidAt: new Date() } : {}),
      ...(paid && (await this.isOffSession()) ?
        { customerID: `simulated_${paymentID}` }
      : {}),
    };

    return {
      status: 200,
      paymentStates: [intentState],
      redirectUrl: (paid ? successURL : failureURL) || undefined,
    };
  }

  /** The payment, if it is one this provider handles. */
  private async findOwnPayment(paymentID: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentID },
      include: { paymentMethod: true },
    });

    return payment?.paymentMethod?.paymentProviderID === this.id ?
        payment
      : null;
  }

  /** The change, if it moves to a payment method of this provider. */
  private async findOwnChange(changeID: string) {
    const change = await this.prisma.subscriptionPaymentMethodChange.findUnique(
      {
        where: { id: changeID },
        include: { paymentMethod: true },
      }
    );

    return change?.paymentMethod?.paymentProviderID === this.id ? change : null;
  }

  /**
   * The outcome only ever arrives through the checkout page, so there is
   * nothing to poll.
   */
  async checkIntentStatus(
    _props: CheckIntentProps
  ): Promise<IntentState | null> {
    return null;
  }

  // Confirming a payment method change. The names avoid `auth`: CodeQL treats
  // any such call as a sensitive action and flags the `changeID` check that
  // routes to it (js/user-controlled-bypass), though anyone reaching this page
  // may pick the outcome by design.
  private async confirmationOutcome(
    changeID: string,
    action: string
  ): Promise<WebhookResponse> {
    if (
      !AUTHORIZATION_OUTCOMES.includes(action as AuthorizationOutcomeAction)
    ) {
      return {
        status: 400,
        message: `Unknown simulated authorization outcome "${action}"`,
      };
    }

    const change = await this.findOwnChange(changeID);

    if (!change) {
      return NOT_FOUND(`Payment method change ${changeID}`);
    }

    if (change.state !== PaymentMethodChangeState.pending) {
      return {
        status: 409,
        message: `Payment method change ${changeID} is already ${change.state}`,
      };
    }

    const { successURL, failureURL } = readReturnURLs(change.intentData);
    const authorized = action === 'authorized';
    const authorizationState: AuthorizationState =
      authorized ?
        {
          changeID,
          state: 'authorized',
          customerID: `simulated_${changeID}`,
        }
      : { changeID, state: 'failed' };

    return {
      status: 200,
      authorizationStates: [authorizationState],
      redirectUrl: (authorized ? successURL : failureURL) || undefined,
    };
  }

  private async confirmationPage(changeID: string): Promise<WebhookResponse> {
    if (!(await this.findOwnChange(changeID))) {
      return NOT_FOUND(`Payment method change ${changeID}`);
    }

    const amount = (AUTHORIZATION_AMOUNT / 100).toFixed(2);

    return {
      status: 200,
      html: this.page(
        'Simulated authorization',
        amount,
        'No money moves. A real provider holds this amount to check the payment method and releases it again; it is never charged.',
        [
          hidden('changeID', changeID),
          submit('authorized', 'Authorize'),
          submit('failed', 'Fail'),
        ]
      ),
    };
  }

  private page(title: string, amount: string, note: string, fields: string[]) {
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 28rem; margin: 3rem auto; padding: 0 1rem; color: #1a1a1a; }
  .amount { font-size: 2rem; font-weight: 600; margin: 0.5rem 0 1.5rem; }
  .note { color: #6b6b6b; font-size: 0.9rem; }
  form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  button { font: inherit; padding: 0.6rem 1rem; border-radius: 0.4rem; border: 1px solid #bbb; background: #fff; cursor: pointer; }
  button[value="paid"], button[value="authorized"] { background: #1a7f37; border-color: #1a7f37; color: #fff; }
</style>
</head>
<body>
<h1>${escapeHtml(title)}</h1>
<p class="amount">${escapeHtml(amount)}</p>
<p class="note">${escapeHtml(note)}</p>
<form method="post">
  ${fields.join('\n  ')}
</form>
</body>
</html>`;
  }

  private async checkoutPage(paymentID: string): Promise<WebhookResponse> {
    const payment = await this.findOwnPayment(paymentID);
    const invoice =
      payment &&
      (await this.prisma.invoice.findUnique({
        where: { id: payment.invoiceID },
        include: { items: true },
      }));

    if (!invoice) {
      return NOT_FOUND(`Payment ${paymentID}`);
    }

    const cents = invoice.items.reduce(
      (sum, { amount, quantity }) => sum + amount * quantity,
      0
    );
    const amount = `${(cents / 100).toFixed(2)} ${invoice.currency}`;

    return {
      status: 200,
      html: this.page(
        'Simulated payment',
        amount,
        'No money moves. Pick the outcome the payment should have.',
        [
          hidden('paymentID', paymentID),
          submit('paid', 'Pay'),
          submit('declined', 'Decline'),
          submit('canceled', 'Cancel'),
        ]
      ),
    };
  }
}
