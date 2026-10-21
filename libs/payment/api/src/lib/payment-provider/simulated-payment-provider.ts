import { PaymentState } from '@prisma/client';
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
 */
export class SimulatedPaymentProvider extends BasePaymentProvider {
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

    const checkout = new URL(
      `${process.env['HOST_URL'] ?? 'http://localhost:4000'}/payment-webhooks/${this.id}`
    );
    checkout.searchParams.set('paymentID', paymentID);
    checkout.searchParams.set('successURL', successURL ?? '');
    checkout.searchParams.set('failureURL', failureURL ?? '');

    return {
      intentID,
      intentSecret: checkout.toString(),
      intentData: '',
      state: PaymentState.processing,
    };
  }

  override supportsAuthorization(): boolean {
    return true;
  }

  override async createAuthorizationIntent({
    changeID,
    successURL,
    failureURL,
  }: CreateAuthorizationIntentProps): Promise<AuthorizationIntent> {
    const checkout = new URL(
      `${process.env['HOST_URL'] ?? 'http://localhost:4000'}/payment-webhooks/${this.id}`
    );
    checkout.searchParams.set('changeID', changeID);
    checkout.searchParams.set('successURL', successURL ?? '');
    checkout.searchParams.set('failureURL', failureURL ?? '');

    return {
      intentID: `simulated_authorization_${changeID}`,
      intentSecret: checkout.toString(),
      state: 'processing',
      amount: AUTHORIZATION_AMOUNT,
    };
  }

  async webhookForPaymentIntent({
    req,
  }: WebhookForPaymentIntentProps): Promise<WebhookResponse> {
    if (req.method === 'GET') {
      const query = req.query as Record<string, string>;

      return query['changeID'] ?
          this.authorizationPage(query)
        : this.checkoutPage(query);
    }

    const { paymentID, changeID, action, successURL, failureURL } = (req.body ??
      {}) as Record<string, string>;

    if (changeID) {
      return this.authorizationOutcome(
        changeID,
        action,
        successURL,
        failureURL
      );
    }

    if (!paymentID || !(action in OUTCOMES)) {
      return {
        status: 400,
        message: `Unknown simulated payment outcome "${action}"`,
      };
    }

    const state = OUTCOMES[action as Outcome];
    const paid = state === PaymentState.paid;

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

  /**
   * The outcome only ever arrives through the checkout page, so there is
   * nothing to poll.
   */
  async checkIntentStatus(
    _props: CheckIntentProps
  ): Promise<IntentState | null> {
    return null;
  }

  private authorizationOutcome(
    changeID: string,
    action: string,
    successURL?: string,
    failureURL?: string
  ): WebhookResponse {
    if (
      !AUTHORIZATION_OUTCOMES.includes(action as AuthorizationOutcomeAction)
    ) {
      return {
        status: 400,
        message: `Unknown simulated authorization outcome "${action}"`,
      };
    }

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

  private authorizationPage(query: Record<string, string>): WebhookResponse {
    const { changeID = '', successURL = '', failureURL = '' } = query;
    const amount = (AUTHORIZATION_AMOUNT / 100).toFixed(2);

    return {
      status: 200,
      html: this.page(
        'Simulated authorization',
        amount,
        'No money moves. A real provider holds this amount to check the payment method and releases it again; it is never charged.',
        [
          hidden('changeID', changeID),
          hidden('successURL', successURL),
          hidden('failureURL', failureURL),
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

  private async checkoutPage(
    query: Record<string, string>
  ): Promise<WebhookResponse> {
    const { paymentID = '', successURL = '', failureURL = '' } = query;

    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentID },
    });
    const invoice =
      payment &&
      (await this.prisma.invoice.findUnique({
        where: { id: payment.invoiceID },
        include: { items: true },
      }));

    if (!invoice) {
      return { status: 404, message: `Payment ${paymentID} not found` };
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
          hidden('successURL', successURL),
          hidden('failureURL', failureURL),
          submit('paid', 'Pay'),
          submit('declined', 'Decline'),
          submit('canceled', 'Cancel'),
        ]
      ),
    };
  }
}
