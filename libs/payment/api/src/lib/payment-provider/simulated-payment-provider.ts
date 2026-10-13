import { PaymentState } from '@prisma/client';
import {
  BasePaymentProvider,
  CheckIntentProps,
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

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

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

  async webhookForPaymentIntent({
    req,
  }: WebhookForPaymentIntentProps): Promise<WebhookResponse> {
    if (req.method === 'GET') {
      return this.checkoutPage(req.query as Record<string, string>);
    }

    const { paymentID, action, successURL, failureURL } = (req.body ??
      {}) as Record<string, string>;

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

    const hidden = (name: string, value: string) =>
      `<input type="hidden" name="${name}" value="${escapeHtml(value)}">`;

    const button = (outcome: Outcome, label: string) =>
      `<button type="submit" name="action" value="${outcome}">${label}</button>`;

    return {
      status: 200,
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Simulated payment</title>
<style>
  body { font-family: system-ui, sans-serif; max-width: 28rem; margin: 3rem auto; padding: 0 1rem; color: #1a1a1a; }
  .amount { font-size: 2rem; font-weight: 600; margin: 0.5rem 0 1.5rem; }
  .note { color: #6b6b6b; font-size: 0.9rem; }
  form { display: flex; gap: 0.5rem; flex-wrap: wrap; }
  button { font: inherit; padding: 0.6rem 1rem; border-radius: 0.4rem; border: 1px solid #bbb; background: #fff; cursor: pointer; }
  button[value="paid"] { background: #1a7f37; border-color: #1a7f37; color: #fff; }
</style>
</head>
<body>
<h1>Simulated payment</h1>
<p class="amount">${escapeHtml(amount)}</p>
<p class="note">No money moves. Pick the outcome the payment should have.</p>
<form method="post">
  ${hidden('paymentID', paymentID)}
  ${hidden('successURL', successURL)}
  ${hidden('failureURL', failureURL)}
  ${button('paid', 'Pay')}
  ${button('declined', 'Decline')}
  ${button('canceled', 'Cancel')}
</form>
</body>
</html>`,
    };
  }
}
