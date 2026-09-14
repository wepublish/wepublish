const { reportResults } = require('../shared-scripts/report-results.js');
const {
  compareAllDevices,
  compareBuffersWithHoneyDiff,
} = require('../shared-scripts/compare-screenshot.js');
const {
  captureAllDevices,
  visitPagesAndTakeScreenshots,
} = require('../shared-scripts/take-screenshot.js');

const PAGES_TO_VISIT = [
  {
    key: 'home',
    url: '',
  },
  {
    key: 'recherchierfonds',
    url: 'recherchierfonds',
  },
  {
    key: 'sample-tag-articles-list-politik',
    url: 'a/tag/Politik',
  },
  {
    key: 'sample-tag-articles-list-gelesen-und-gedacht',
    url: 'a/tag/Gelesen%20&%20gedacht',
  },
  {
    key: 'sample-tag-articles-list-rueckspiegel',
    url: 'a/tag/R%C3%BCckspiegel',
  },
  {
    key: 'subscribe',
    url: 'mitmachen',
  },
  {
    key: 'sample-article',
    url: 'a/monatsgespraech-mit-dem-basler-botanik-professor-ansgar-kahmen',
  },
  {
    key: 'sample-article-reportage',
    url: 'a/ratgeber-pax-vorsorge-planen-statt-dem-zufall-ueberlassen'
  },
];

async function test(
  artifactsPath,
  baselineCommitHash,
  currentCommitHash,
  host,
  baselinePort,
  currentPort
) {
  const artifactsPathInContainer = '/app/artifacts';
  const captures = await captureAllDevices(
    (context, url) =>
      visitPagesAndTakeScreenshots(context, url, PAGES_TO_VISIT),
    host,
    baselinePort,
    currentPort
  );
  const deviceResults = await compareAllDevices(
    captures,
    (baseline, current, deviceName) =>
      compareBuffersWithHoneyDiff(
        baseline.key,
        deviceName,
        baseline.screenshotBuffer,
        current.screenshotBuffer,
        artifactsPathInContainer
      )
  );
  reportResults(
    'onlinereports',
    baselineCommitHash,
    currentCommitHash,
    deviceResults,
    artifactsPathInContainer,
    artifactsPath
  );
}

test(
  process.env.ARTIFACTS_PATH,
  process.env.BASELINE_COMMIT,
  process.env.CURRENT_COMMIT,
  process.env.HOST,
  process.env.BASELINE_PORT,
  process.env.CURRENT_PORT
);
