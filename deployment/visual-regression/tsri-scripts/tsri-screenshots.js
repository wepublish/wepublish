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

async function takeLandingPageScreenshots(context, baseUrl) {
  const playwrightPage = await context.newPage();
  const screenshots = [];
  try {
    await visitPage(playwrightPage, baseUrl);
    try {
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
  } finally {
    await playwrightPage.close();
  }
  return screenshots;
}

async function test(artifactsPath, baselineCommitHash, currentCommitHash, baselinePort, currentPort) {
  const artifactsPathInContainer = "/app/artifacts";
  const captures = await captureAllDevices(
    async (context, baseUrl) => {
      return await takeLandingPageScreenshots(context, baseUrl);
    },
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

test(process.env.ARTIFACTS_PATH, process.env.BASELINE_COMMIT, process.env.CURRENT_COMMIT, process.env.BASELINE_PORT, process.env.CURRENT_PORT);
