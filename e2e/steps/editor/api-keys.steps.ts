import { expect } from '@playwright/test';
import { target } from '../../support/env';
import { poll } from '../../support/inbox';
import { subscribePlanOf } from '../../support/targets';
import { Given, ScenarioContext, Then, When } from '../fixtures';

/** What the editor «Kim» may do: create, see and revoke their keys, handle invoices. */
const KIM_PERMISSIONS = [
  'CAN_CREATE_API_TOKEN',
  'CAN_GET_API_TOKENS',
  'CAN_REVOKE_API_TOKEN',
  'CAN_CREATE_INVOICE',
  'CAN_GET_INVOICE',
];
const MARK_AS_PAID = 'CAN_CREATE_INVOICE';
const KEY_SCOPES = [MARK_AS_PAID, 'CAN_GET_INVOICE'];

/** The creator check's 401 (`ApiTokenService.resolveToken`). */
const CREATOR_GONE = /no longer exists or is inactive/;

Given(
  'an editor {string} who may create API keys and mark invoices as paid',
  async ({ data }, alias: string) => {
    await data.createStaff(alias, KIM_PERMISSIONS);
  }
);

Given(
  '{string} created an API key {string} that may mark invoices as paid',
  async ({ data }, creatorAlias: string, keyAlias: string) => {
    await data.createApiKey(keyAlias, data.get('reader', creatorAlias), KEY_SCOPES);
  }
);

Given(
  "a reader {string} with an open invoice for the tenant's subscribe plan",
  async ({ data, ctx }, alias: string) => {
    const reader = await data.createUser(alias);
    const subscription = await data.createSubscription({
      reader,
      memberPlanSlug: subscribePlanOf(target.app),
    });
    const invoice = await data.openInvoice(subscription.id);

    ctx.openInvoices.set(alias, { invoiceId: invoice.id, subscriptionId: subscription.id });
  }
);

When(
  'the API key {string} marks the open invoice of {string} as paid',
  async ({ data, ctx }, keyAlias: string, readerAlias: string) => {
    const api = await data.withApiKey(data.get('apiKey', keyAlias));

    await api.gql(
      `mutation Paid($id: String!) { markInvoiceAsPaid(id: $id, sendMail: false) { id } }`,
      { id: openInvoiceOf(ctx, readerAlias) }
    );
  }
);

Then(
  'the invoice of {string} was marked as paid by {string} with the API key {string}',
  async ({ data, ctx }, readerAlias: string, creatorAlias: string, keyAlias: string) => {
    const paid = await data.invoicePaidBy(openInvoiceOf(ctx, readerAlias));

    expect(paid.paidAt, 'the invoice is paid').toBeTruthy();
    expect(paid.manuallySetAsPaidByUserId, 'paid by the key‘s creator').toBe(
      data.get('reader', creatorAlias).id
    );
    expect(paid.manuallySetAsPaidByApiTokenId, 'paid with the key').toBe(
      data.get('apiKey', keyAlias).id
    );
  }
);

Then(
  'the audit log names the API key {string} and {string} for {string}',
  async ({ data }, keyAlias: string, creatorAlias: string, mutation: string) => {
    const key = data.get('apiKey', keyAlias);
    const creator = data.get('reader', creatorAlias);
    // The interceptor writes the entry after answering.
    const [entry] = await poll(
      async () => {
        const entries = await data.auditLogOf(key, mutation);

        return entries.length ? entries : undefined;
      },
      { timeout: 10_000, interval: 1_000, message: `no audit log entry of ${key.name} for ${mutation}` }
    );

    expect(entry).toMatchObject({
      tokenName: key.name,
      userId: creator.id,
      userEmail: creator.email,
      success: true,
    });
  }
);

When('{string} may no longer mark invoices as paid', async ({ data }, alias: string) => {
  await data.setStaffPermissions(
    data.get('reader', alias),
    KIM_PERMISSIONS.filter(permission => permission !== MARK_AS_PAID)
  );
});

Then(
  'the API key {string} is limited, missing {string}',
  async ({ data }, keyAlias: string, permission: string) => {
    expect(await data.apiKeyCreatorState(data.get('apiKey', keyAlias))).toEqual({
      state: 'Limited',
      blockedReason: null,
      missingScopes: [permission],
    });
  }
);

Then(
  'the API key {string} is refused when marking the open invoice of {string} as paid',
  async ({ data, ctx }, keyAlias: string, readerAlias: string) => {
    const api = await data.withApiKey(data.get('apiKey', keyAlias));

    await expect(
      api.gql(`mutation Paid($id: String!) { markInvoiceAsPaid(id: $id, sendMail: false) { id } }`, {
        id: openInvoiceOf(ctx, readerAlias),
      })
    ).rejects.toThrow(/Forbidden resource/);
    expect((await data.invoicePaidBy(openInvoiceOf(ctx, readerAlias))).paidAt).toBeNull();
  }
);

Then(
  'the API key {string} may still read the open invoice of {string}',
  async ({ data, ctx }, keyAlias: string, readerAlias: string) => {
    const api = await data.withApiKey(data.get('apiKey', keyAlias));
    const { invoice } = await api.gql<{ invoice: { id: string } }>(
      `query Invoice($id: String!) { invoice(id: $id) { id } }`,
      { id: openInvoiceOf(ctx, readerAlias) }
    );

    expect(invoice.id).toBe(openInvoiceOf(ctx, readerAlias));
  }
);

When('{string} is deactivated', async ({ data }, alias: string) => {
  await data.setUserActive(data.get('reader', alias), false);
});

When('{string} is deleted', async ({ data }, alias: string) => {
  await data.deleteUserNow(data.get('reader', alias));
});

Then(
  /^every call with the API key "([^"]*)" is refused because "(?:[^"]*)" (?:is inactive|no longer exists)$/,
  async ({ data, ctx }, keyAlias: string) => {
    const api = await data.withApiKey(data.get('apiKey', keyAlias));
    const [readerAlias] = [...ctx.openInvoices.keys()];

    // Even what the key may still do is refused: nobody answers for it.
    await expect(
      api.gql(`query Invoice($id: String!) { invoice(id: $id) { id } }`, {
        id: openInvoiceOf(ctx, readerAlias),
      })
    ).rejects.toThrow(CREATOR_GONE);
  }
);

function openInvoiceOf(ctx: ScenarioContext, alias: string) {
  const open = ctx.openInvoices.get(alias);

  if (!open) {
    throw new Error(`"${alias}" has no open invoice. Add a Given step that creates it.`);
  }

  return open.invoiceId;
}
