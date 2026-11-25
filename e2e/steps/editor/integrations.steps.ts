import { expect, Page } from '@playwright/test';
import { TestData } from '../../support/factories';
import { Given, Then, When } from '../fixtures';

// Editor copy (apps/editor/src/app/locales, en + de + fr).
const searchField =
  /^(Search integrations|Integrationen durchsuchen|Rechercher des intégrations)$/;
const addProvider =
  /^(Add integration|Integration hinzufügen|Ajouter une intégration|Choose type and ID yourself|Typ und ID selbst wählen|Choisir le type et l’ID toi-même)$/;
const typeField = /^(Type|Typ)$/;
const idField = /^(Identifier|Kennung|Identifiant)$/;
const addButton = /^(Add integration|Integration hinzufügen|Ajouter une intégration)$/;
const apiKeyField = /^(API Key|API-Schlüssel|Clé API)$/;
const webhookSecretField = /^(Webhook secret|Webhook-Secret|Secret du webhook)$/;
const saveButton = /^(Save|Speichern|Enregistrer)$/;
const ready = /^(Ready|Bereit|Prête)$/;
const webhookUrlField = /^(Webhook URL|Webhook-URL|URL du webhook)$/;

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Each provider has its own form, named after the provider (its id until renamed). */
const providerForm = (page: Page, data: TestData, alias: string) =>
  page.getByRole('form', { name: data.get('paymentProvider', alias).id });

Given(
  'a signed-in admin {string} in the editor',
  async ({ page, data }, alias: string) => {
    const admin = await data.createAdmin(alias);

    // The editor keeps its session in localStorage and checks it on load.
    await page.addInitScript(token => {
      window.localStorage.setItem('sessionToken', token);
    }, admin.sessionToken);
  }
);

When(
  '{string} looks for {string} among the integrations',
  async ({ page }, _alias: string, query: string) => {
    await page.goto('/integrations');
    await page.getByRole('searchbox', { name: searchField }).fill(query);
  }
);

Then('the integrations offer {string}', async ({ page }, title: string) => {
  await expect(page.getByRole('link', { name: title, exact: true })).toBeVisible();
});

When(
  '{string} adds a {string} payment provider {string}',
  async ({ page, data }, _alias: string, type: string, provider: string) => {
    const { id } = data.newPaymentProvider(provider);

    await page.goto('/integrations/payment');
    await page.getByRole('button', { name: addProvider }).first().click();

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('combobox', { name: typeField }).click();
    await page
      .getByRole('option', { name: new RegExp(`^${escapeRegExp(type)}`) })
      .click();
    await dialog.getByRole('textbox', { name: idField }).fill(id);
    await dialog.getByRole('button', { name: addButton }).click();

    await expect(dialog).toBeHidden();
    await expect(providerForm(page, data, provider)).toBeVisible();
  }
);

Then(
  'the setup guide of {string} shows its webhook address',
  async ({ page, data }, provider: string) => {
    const { id } = data.get('paymentProvider', provider);

    await expect(
      providerForm(page, data, provider).getByRole('textbox', {
        name: webhookUrlField,
      })
    ).toHaveValue(new RegExp(`/payment-webhooks/${escapeRegExp(id)}$`));
  }
);

When(
  '{string} saves an API key and a webhook secret for {string}',
  async ({ page, data }, _alias: string, provider: string) => {
    const form = providerForm(page, data, provider);

    await form.getByLabel(apiKeyField).fill('sk_test_e2e');
    await form.getByLabel(webhookSecretField).fill('whsec_e2e');
    await form.getByRole('button', { name: saveButton }).click();
  }
);

Then(
  '{string} is ready to take payments',
  async ({ page, data }, provider: string) => {
    await expect(
      providerForm(page, data, provider).getByText(ready)
    ).toBeVisible();
  }
);
