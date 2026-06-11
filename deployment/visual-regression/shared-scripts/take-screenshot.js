
const { devices, chromium, firefox, webkit } = require("playwright");

async function visitPage(playwrightPage, urlToVisit) {
  const pendingRequests = new Set();
  playwrightPage.on('request', req => pendingRequests.add(req.url()));
  playwrightPage.on('response', res => pendingRequests.delete(res.url()));
  playwrightPage.on('requestfailed', req => pendingRequests.delete(req.url()));
  try {
    await playwrightPage.goto(urlToVisit, { waitUntil: 'commit' });
    await playwrightPage.waitForLoadState('networkidle', { timeout: 2000 });
  } catch (e) {
    if (e.name !== 'TimeoutError') throw e;
    console.warn(`Timeout for: ${urlToVisit} — ${pendingRequests.size} pending requests`);
    pendingRequests.forEach(u => console.warn(`    - ${u}`));
  }
}

async function visitPagesAndTakeScreenshots(context, baseUrl, pagesToVisit) {
  return Promise.all(pagesToVisit.map(async ({ key, url }) => {
    const playwrightPage = await context.newPage();
    try {
      await visitPage(playwrightPage, `${baseUrl}/${url}`);
      try {
        const screenshotBuffer = await playwrightPage.screenshot({ fullPage: true });
        return { key, screenshotBuffer };
      } catch (e) {
        console.error(`Could not take a screenshot of ${urlToVisit}`);
        return { key, screenshotBuffer: null };
      }
    } finally {
      await playwrightPage.close();
    }
  }));
}

async function captureAllDevices(captureFn, host, baselinePort, currentPort, config = DEFAULT_CONFIG) {
  console.log("capturing screenshots...");
  const launchers = { chromium, firefox, webkit };
  const url = (port) => `http://${host}:${port}`;
  const baselineUrl = url(baselinePort);
  const currentUrl = url(currentPort);
  console.log(`running queries against baseline url: ${baselineUrl}`);
  console.log(`running queries against current url: ${currentUrl}`);
  // Cache the launch promise (not the resolved browser) so concurrent devices
  // sharing an engine await the same launch instead of racing to start two.
  const browserPromises = {};
  const getBrowser = (name) => (browserPromises[name] ??= launchers[name].launch());
  try {
    return await Promise.all(config.map(async ({ deviceName, deviceDescriptor, browserName }) => {
      const browser = await getBrowser(browserName);
      const baselineContext = await browser.newContext({ ...deviceDescriptor });
      const currentContext = await browser.newContext({ ...deviceDescriptor });
      try {
        const [baselineShots, currentShots] = await Promise.all([
          captureFn(baselineContext, baselineUrl),
          captureFn(currentContext, currentUrl),
        ]);
        return { deviceName, baselineShots, currentShots };
      } finally {
        await baselineContext.close();
        await currentContext.close();
      }
    }));
  } finally {
    await Promise.all(Object.values(browserPromises).map(async (p) => (await p).close()));
  }
}

// check device descriptors here: https://github.com/microsoft/playwright/blob/main/packages/playwright-core/src/server/deviceDescriptorsSource.json
const DEFAULT_CONFIG = [
  { deviceName: 'Desktop Chrome', deviceDescriptor: devices['Desktop Chrome'], browserName: 'chromium' },
  { deviceName: 'Desktop Firefox', deviceDescriptor: devices['Desktop Firefox'], browserName: 'firefox' },
  { deviceName: 'Desktop Safari', deviceDescriptor: devices['Desktop Safari'], browserName: 'webkit' },
  { deviceName: 'Pixel 10', deviceDescriptor: devices['Pixel 10'], browserName: 'chromium' },
  { deviceName: 'iPhone 16', deviceDescriptor: devices['iPhone 16'], browserName: 'webkit' },
];

module.exports = { visitPage, visitPagesAndTakeScreenshots, captureAllDevices };
