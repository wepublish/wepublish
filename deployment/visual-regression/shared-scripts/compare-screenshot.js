const { compare, quickCompare } = require('@vizzly-testing/honeydiff');
const fs = require('fs/promises');

async function compareBuffersWithHoneyDiff(key, deviceName, baselineBuffer, currentBuffer, artifactsPath) {
  console.log(`compare ${key}_${deviceName}`);
  let hasChanged = await quickCompare(baselineBuffer, currentBuffer);

  const slug = `${key}_${deviceName}`.replace(/[^a-z0-9_-]+/gi, '_');
  const diffPath = `${artifactsPath}/diff_${slug}.png`;
  const baselinePath = `${artifactsPath}/baseline_${slug}.png`;
  const currentPath = `${artifactsPath}/current_${slug}.png`;

  let diffPercentage = 0;
  if (hasChanged) {
    // Write diff PNGs and actual screenshots only on failure — avoids paying the
    // 4-8x more expensive PNG encoding cost on passing comparisons.
    // honeydiff has no single-pass API, so failures pay the comparison cost twice,
    // but this is still faster than encoding unconditionally.
    const [result] = await Promise.all([
      compare(baselineBuffer, currentBuffer, {
        threshold: 2,// recommended in the documentation see here: https://github.com/vizzly-testing/honeydiff#thresholds,
        diffPath, overwrite: true
      }),
      fs.writeFile(baselinePath, baselineBuffer),
      fs.writeFile(currentPath, currentBuffer),
    ]);
    diffPercentage = result.diffPercentage ?? 0;
    if (diffPercentage < 1) {
      hasChanged = false;
    }
  }

  return {
    key,
    deviceName,
    isDifferent: hasChanged,
    diffPercentage,
    diffPath,
    baselinePath,
    currentPath,
  };
}

async function compareAllDevices(captures, compareFn) {
  const deviceResults = [];
  for (const { deviceName, baselineShots, currentShots } of captures) {
    const results = [];
    for (let i = 0; i < baselineShots.length; i++) {
      const baseline = baselineShots[i];
      const current = currentShots[i];
      if (!baseline.screenshotBuffer || !current.screenshotBuffer) {
        results.push({
          key: baseline.key,
          deviceName,
          isDifferent: true,
          failed: true,
          failedSide: !baseline.screenshotBuffer && !current.screenshotBuffer
            ? 'both'
            : !baseline.screenshotBuffer ? 'baseline' : 'current',
          diffPercentage: 0,
          diffPath: null,
          baselinePath: null,
          currentPath: null,
        });
        continue;
      }
      results.push(await compareFn(baseline, current, deviceName));
    }
    deviceResults.push({ deviceName, results });
  }
  return deviceResults;
}

module.exports = { compareAllDevices, compareBuffersWithHoneyDiff };
