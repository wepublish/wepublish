import { expect, Page } from '@playwright/test';
import { Article } from '../support/factories';
import { waitForOperation } from '../support/graphql-traffic';
import { Given, Then, When } from './fixtures';

const escapeRegExp = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * The paywall has no landmark, so it is found by the unique description the
 * factory gave it: the innermost element holding that text and a link.
 */
const paywallOf = (page: Page, article: Article) => {
  if (!article.paywall) {
    throw new Error(`Article "${article.title}" has no paywall.`);
  }

  return page
    .locator('div')
    .filter({ has: page.getByText(article.paywall.description) })
    .filter({ has: page.getByRole('link') })
    .last();
};

const paywallKinds = ['ordinary', 'enforced'];

Given(
  'an article {string} behind an {word} paywall for the plan {string}',
  async ({ data }, alias: string, kind: string, memberPlanSlug: string) => {
    if (!paywallKinds.includes(kind)) {
      throw new Error(
        `Unknown paywall "${kind}", expected one of ${paywallKinds.join(', ')}.`
      );
    }

    await data.ensureSubscribePage();
    await data.createPaywalledArticle({
      alias,
      memberPlanSlugs: [memberPlanSlug],
      enforced: kind === 'enforced',
    });
  }
);

/**
 * Opened means the site told the API about the visit (`viewArticle`): only
 * then is the read on the reader's meter and the access decided.
 */
When(
  '{string} opens the article {string}',
  async ({ page, data, ctx }, _reader: string, alias: string) => {
    const article = data.get('article', alias);
    const viewed = waitForOperation(page, 'ViewArticle');

    await page.goto(article.path);
    await expect(page.getByText(article.title).first()).toBeVisible();
    await viewed;
    ctx.currentArticle = alias;
  }
);

Then('the paywall hides the rest of the article', async ({ page, data, ctx }) => {
  const article = data.get('article', ctx.currentArticle ?? '');

  await expect(paywallOf(page, article)).toBeVisible();
  await expect(page.getByText(article.ending)).toBeHidden();
});

When(
  '{string} subscribes to the plan {string} from the paywall',
  async ({ page, data, ctx }, _reader: string, memberPlanSlug: string) => {
    const article = data.get('article', ctx.currentArticle ?? '');
    const plan = await data.memberPlan(memberPlanSlug);
    const simulated = plan.paymentMethods.find(
      ({ slug }) => slug === 'simulated'
    );

    if (!simulated) {
      throw new Error(
        `Plan "${memberPlanSlug}" does not offer the simulated payment method.`
      );
    }

    await paywallOf(page, article).getByRole('link').first().click();

    // The radio's name also holds price and description, so pick it by the
    // plan name inside its label (rendered twice, both select the plan).
    await page.getByText(plan.name, { exact: true }).first().click();
    // The payment radios are `visibility: hidden` (PaymentRadio), so they are
    // missing from the a11y tree; click the label that wraps them instead.
    const paymentMethod = page.getByRole('radio', {
      name: new RegExp(escapeRegExp(simulated.name)),
      includeHidden: true,
    });
    await page.locator('label', { has: paymentMethod }).click();
    await expect(paymentMethod).toBeChecked();

    await page
      .locator('form')
      .filter({ has: paymentMethod })
      .locator('button[type="submit"]')
      .click();
  }
);

When(
  '{string} pays on the simulated checkout',
  async ({ checkout }, _reader: string) => {
    await checkout.pay();
  }
);

Then(
  '{string} can read the article {string} in full',
  async ({ page, data }, _reader: string, alias: string) => {
    const article = data.get('article', alias);

    await expect(page.getByText(article.ending)).toBeVisible();

    if (article.paywall) {
      await expect(page.getByText(article.paywall.description)).toBeHidden();
    }
  }
);
