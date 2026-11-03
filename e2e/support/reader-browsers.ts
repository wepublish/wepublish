import {
  Browser,
  BrowserContext,
  BrowserContextOptions,
  Page,
} from '@playwright/test';

export type ReaderBrowser = { context: BrowserContext; page: Page };

/**
 * One browser per reader, so several readers can act in one scenario, each
 * with their own session. The first reader gets the test's own `page`, so
 * single-reader journeys run exactly as before; every further reader gets a
 * new context with the same options, closed after the scenario.
 */
export class ReaderBrowsers {
  private readonly browsers = new Map<string, ReaderBrowser>();
  private readonly opened: BrowserContext[] = [];

  constructor(
    private readonly browser: Browser,
    private readonly first: ReaderBrowser,
    private readonly options: BrowserContextOptions
  ) {}

  async of(alias: string): Promise<ReaderBrowser> {
    const existing = this.browsers.get(alias);

    if (existing) {
      return existing;
    }

    let reader = this.first;

    if (this.browsers.size > 0) {
      const context = await this.browser.newContext(this.options);
      this.opened.push(context);
      reader = { context, page: await context.newPage() };
    }

    this.browsers.set(alias, reader);

    return reader;
  }

  async page(alias: string) {
    return (await this.of(alias)).page;
  }

  async close() {
    await Promise.all(this.opened.map(context => context.close()));
  }
}
