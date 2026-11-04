import { expect, Page } from '@playwright/test';
import { target } from '../support/env';
import { Article, TestData } from '../support/factories';
import { SimulatedCheckout } from '../support/simulated-payment';
import { subscribeWithSimulatedPayment } from '../support/subscribe-form';
import { subscribePlanOf } from '../support/targets';
import { Given, ScenarioContext, Then, When } from './fixtures';

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

/** The tenant's plan for journeys that buy one: see `subscribePlanOf`. */
const subscribePlan = () => subscribePlanOf(target.app);

async function createPaywalledArticle(
  data: TestData,
  alias: string,
  memberPlanSlug: string
) {
  await data.ensureSubscribePage();
  await data.createPaywalledArticle({
    alias,
    memberPlanSlugs: [memberPlanSlug],
  });
}

Given(
  'a paywalled article {string} for the plan {string}',
  async ({ data }, alias: string, memberPlanSlug: string) =>
    createPaywalledArticle(data, alias, memberPlanSlug)
);

Given(
  "a paywalled article {string} for the tenant's subscribe plan",
  async ({ data }, alias: string) =>
    createPaywalledArticle(data, alias, subscribePlan())
);

When(
  '{string} opens the article {string}',
  async ({ readers, data, ctx }, reader: string, alias: string) => {
    const page = await readers.page(reader);
    const article = data.get('article', alias);

    await page.goto(article.path);
    await expect(page.getByText(article.title).first()).toBeVisible();
    ctx.currentArticle = alias;
    ctx.currentReader = reader;
  }
);

Then('the paywall hides the rest of the article', async ({ readers, data, ctx }) => {
  const page = await readers.page(ctx.currentReader ?? '');
  const article = data.get('article', ctx.currentArticle ?? '');

  await expect(paywallOf(page, article)).toBeVisible();
  await expect(page.getByText(article.ending)).toBeHidden();
});

async function subscribeFromPaywall(
  { page, data, ctx }: { page: Page; data: TestData; ctx: ScenarioContext },
  memberPlanSlug: string
) {
  const article = data.get('article', ctx.currentArticle ?? '');
  const plan = await data.memberPlan(memberPlanSlug);

  await paywallOf(page, article).getByRole('link').first().click();
  await subscribeWithSimulatedPayment(page, plan);
}

When(
  '{string} subscribes to the plan {string} from the paywall',
  async ({ readers, data, ctx }, reader: string, memberPlanSlug: string) =>
    subscribeFromPaywall(
      { page: await readers.page(reader), data, ctx },
      memberPlanSlug
    )
);

When(
  "{string} subscribes to the tenant's subscribe plan from the paywall",
  async ({ readers, data, ctx }, reader: string) =>
    subscribeFromPaywall(
      { page: await readers.page(reader), data, ctx },
      subscribePlan()
    )
);

When(
  '{string} pays on the simulated checkout',
  async ({ readers }, reader: string) => {
    await new SimulatedCheckout(await readers.page(reader)).pay();
  }
);

Then(
  '{string} can read the article {string} in full',
  async ({ readers, data }, reader: string, alias: string) => {
    const page = await readers.page(reader);
    const article = data.get('article', alias);

    await expect(page.getByText(article.ending)).toBeVisible();

    if (article.paywall) {
      await expect(page.getByText(article.paywall.description)).toBeHidden();
    }
  }
);
