const { reportResults } = require("../shared-scripts/report-results.js");
const { compareAllDevices, compareBuffersWithHoneyDiff } = require("../shared-scripts/compare-screenshot.js");
const { captureAllDevices, visitPagesAndTakeScreenshots } = require("../shared-scripts/take-screenshot.js");

const PAGES_TO_VISIT = [
  {
    "key": "no-subscription",
    "url": "lesen"
  },
  {
    "key": "politik-page",
    "url": "a/tag/politik"
  },
  {
    "key": "stadtradt-newsletter",
    "url": "a/tag/stadtrat-brief"
  },
  {
    "key": "example-article",
    "url": "a/leergekuendigt-und-trotzdem-koennen-alle-bleiben"
  },
  {
    "key": "subscribe",
    "url": "mitmachen"
  },
  {
    "key": "about-us",
    "url": "ueberuns"
  },
  {
    "key": "general-newsletter",
    "url": "newsletter"
  },
  {
    "key": "team",
    "url": "team"
  }
];

async function test(artifactsPath, baselineCommitHash, currentCommitHash, baselinePort, currentPort) {
  const artifactsPathInContainer = "/app/artifacts";
  const captures = await captureAllDevices(
    (context, url) => visitPagesAndTakeScreenshots(context, url, PAGES_TO_VISIT),
    baselinePort,
    currentPort,
  );
  const deviceResults = await compareAllDevices(
    captures,
    (baseline, current, deviceName) =>
      compareBuffersWithHoneyDiff(baseline.key, deviceName, baseline.screenshotBuffer, current.screenshotBuffer, artifactsPathInContainer),
  );
  reportResults("hauptstadt", baselineCommitHash, currentCommitHash, deviceResults, artifactsPathInContainer, artifactsPath);
}

test(process.env.ARTIFACTS_PATH, process.env.BASELINE_COMMIT, process.env.CURRENT_COMMIT, process.env.BASELINE_PORT, process.env.CURRENT_PORT);
