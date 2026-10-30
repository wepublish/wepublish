import { InvoicesStatic } from 'bexio';

class InvoiceNotFoundError extends Error {
  constructor(invoice: any) {
    super(
      `Bexio payment adapter didn't find the invoice, subscription or user! ${JSON.stringify(
        invoice
      )}`
    );
  }
}

class SendingInvoiceError extends Error {
  constructor(sentInvoice: InvoicesStatic.InvoiceSentAnswer) {
    super(
      `Sending of the invoice failed with message: ${JSON.stringify(sentInvoice)}`
    );
  }
}

class IssuingInvoiceError extends Error {
  constructor(issuedInvoice: InvoicesStatic.InvoiceIssued) {
    super(
      `Issuing of the invoice failed with message: ${JSON.stringify(issuedInvoice)}`
    );
  }
}

/** The invoice exists in Bexio but could not be issued, rendered or sent. */
class InvoiceDeliveryError extends Error {
  constructor(message: string) {
    super(message);
  }
}

class UnknownIntentState extends Error {
  constructor(message = 'Unknown intent state') {
    super(message);
  }
}

class WebhookNotImplementedError extends Error {
  constructor(message = 'Webhook not implemented!') {
    super(message);
  }
}

class ResponseNOK extends Error {
  constructor(status: number) {
    super(`Bexio response is NOK with status: ${status}`);
  }
}

class NoSubscriptionIdInInvoice extends Error {
  constructor(
    message = 'No subscriptionID associated with the provided invoice'
  ) {
    super(message);
  }
}

class PaymentNotFound extends Error {
  constructor(message = 'While checking intent, payment not found!') {
    super(message);
  }
}

export {
  InvoiceNotFoundError,
  WebhookNotImplementedError,
  SendingInvoiceError,
  IssuingInvoiceError,
  InvoiceDeliveryError,
  UnknownIntentState,
  ResponseNOK,
  NoSubscriptionIdInInvoice,
  PaymentNotFound,
};
