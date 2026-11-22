import { isTestEnvironment } from '@wepublish/utils/api';

const domainOf = (address: string) =>
  address.slice(address.lastIndexOf('@') + 1).toLowerCase();

/**
 * Where Bexio emails an invoice. On a test instance with a test mailbox, an
 * invoice to an address on the mailbox's domain goes to the mailbox instead:
 * a Bexio company in its trial only sends to its own sender address. Never on
 * production.
 */
export function invoiceMailRecipient(
  recipient: string,
  testMailbox: string | null | undefined,
  env: Record<string, string | undefined> = process.env
): string {
  if (
    !testMailbox ||
    !isTestEnvironment(env) ||
    domainOf(recipient) !== domainOf(testMailbox)
  ) {
    return recipient;
  }

  return testMailbox;
}
