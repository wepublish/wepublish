const { reportResults } = require("../shared-scripts/report-results.js");
const { compareAllDevices, compareBuffersWithHoneyDiff } = require("../shared-scripts/compare-screenshot.js");
const { captureAllDevices, visitPage } = require("../shared-scripts/take-screenshot.js");

async function takeScreenshotOfPanel(playwrightPage) {
  const kolumnen = playwrightPage.getByRole('tab', { name: 'Kolumnen', exact: true });
  await kolumnen.scrollIntoViewIfNeeded();
  await kolumnen.click();
  await playwrightPage
    .getByRole('tab', { name: 'Kolumnen', exact: true })
    .and(playwrightPage.locator('[aria-selected="true"]'))
    .waitFor();
  const panelId = await kolumnen.getAttribute('aria-controls');
  const panel = playwrightPage.locator(`[id="${panelId}"]`);
  await panel.scrollIntoViewIfNeeded();
  return await panel.screenshot();
}

async function takeScreenshotOfFirstArticle(playwrightPage, baseUrl) {
  const teaser = playwrightPage
    .locator('article article')
    .filter({ has: playwrightPage.locator('a[href]') })
    .first();
  const href = await teaser.locator('a[href]').first().getAttribute('href');
  const { pathname, search } = new URL(href, baseUrl);
  const articleUrl = new URL(`${pathname}${search}`, baseUrl).toString();
  await visitPage(playwrightPage, articleUrl);
  return await playwrightPage.screenshot({ fullPage: true });
}

async function activateFirstTabs(playwrightPage) {
  const tablists = await playwrightPage.getByRole('tablist').all();
  for (const tablist of tablists) {
    const firstTab = tablist.getByRole('tab').first();
    await firstTab.click();
    await firstTab.and(playwrightPage.locator('[aria-selected="true"]')).waitFor();
  }
  await playwrightPage.evaluate(() => window.scrollTo(0, 0));
}

async function takeLandingPageScreenshots(context, baseUrl) {
  const playwrightPage = await context.newPage();
  const screenshots = [];
  try {
    await visitPage(playwrightPage, baseUrl);
    try {
      await activateFirstTabs(playwrightPage);
      const initialScreenshot = await playwrightPage.screenshot({ fullPage: true });
      screenshots.push({ key: 'initial', screenshotBuffer: initialScreenshot });
    } catch (e) {
      screenshots.push({ key: 'initial', screenshotBuffer: null });
      console.error(`error has happened when taking initial screenshot: ${e}`);
    }
    try {
      const secondScreenshot = await takeScreenshotOfPanel(playwrightPage);
      screenshots.push({ key: 'kolumnen', screenshotBuffer: secondScreenshot });
    } catch (e) {
      screenshots.push({ key: 'kolumnen', screenshotBuffer: null });
      console.error(`error has happened when taking 'kolumnen' screenshot: ${e}`);
    }
    try {
      const articleScreenshot = await takeScreenshotOfFirstArticle(playwrightPage, baseUrl);
      screenshots.push({ key: 'article', screenshotBuffer: articleScreenshot });
    } catch (e) {
      screenshots.push({ key: 'article', screenshotBuffer: null });
      console.error(`error has happened when taking 'article' screenshot: ${e}`);
    }
  } finally {
    await playwrightPage.close();
  }
  return screenshots;
}

async function test(artifactsPath, baselineCommitHash, currentCommitHash, host, baselinePort, currentPort) {
  const artifactsPathInContainer = "/app/artifacts";
  const captures = await captureAllDevices(
    async (context, baseUrl) => {
      return await takeLandingPageScreenshots(context, baseUrl);
    },
    host,
    baselinePort,
    currentPort,
  );
  const deviceResults = await compareAllDevices(
    captures,
    (baseline, current, deviceName) =>
      compareBuffersWithHoneyDiff(baseline.key, deviceName, baseline.screenshotBuffer, current.screenshotBuffer, artifactsPathInContainer),
  );
  reportResults("tsri", baselineCommitHash, currentCommitHash, deviceResults, artifactsPathInContainer, artifactsPath);
}

test(process.env.ARTIFACTS_PATH, process.env.BASELINE_COMMIT, process.env.CURRENT_COMMIT, process.env.HOST, process.env.BASELINE_PORT, process.env.CURRENT_PORT);
