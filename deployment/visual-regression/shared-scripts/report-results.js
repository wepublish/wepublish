const path = require('path');
const fs = require("fs/promises");

async function reportResults(project, baselineCommitHash, currentCommitHash, deviceResults, artifactsPath, displayPath = null) {
  const reportPath = `${artifactsPath}/report.html`;
  const rel = p => path.relative(artifactsPath, p); // links relative to the report's own location
  const totalDiffs = deviceResults.reduce(
    (sum, d) => sum + d.results.filter(r => r.isDifferent).length, 0);
  const sections = deviceResults.map(({ deviceName, results }) => {
    const rows = results.map(r => {
      if (r.failed) {
        return `<li class="failed"><span class="icon">×</span> ${r.key} <span class="pct">screenshot failed (${r.failedSide})</span></li>`;
      }
      if (!r.isDifferent) {
        return `<li class="ok"><span class="icon">✓</span> ${r.key}</li>`;
      }
      return `<li class="diff">
      <span class="icon">!</span> ${r.key}
      <span class="pct">${(r.diffPercentage).toFixed(2)}%</span>
      <a href="${rel(r.diffPath)}">diff</a>
      <a href="${rel(r.baselinePath)}">baseline</a>
      <a href="${rel(r.currentPath)}">current</a>
    </li>`;
    }).join('\n');
    return `<h2>${deviceName}</h2>\n  <ul>${rows}</ul>`;
  }).join('\n');
  const generatedAt = new Date().toLocaleString('en', {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
    timeZone: 'Europe/Zurich',
    timeZoneName: 'short',
  });
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Visual Diff — ${project}</title>
  <style>
    body { font-family: sans-serif; max-width: 700px; margin: 2rem auto; color: #222; }
    h1 { font-size: 1.3rem; font-weight: 500; margin-bottom: 0.25rem; }
    h2 { font-size: 1rem; font-weight: 600; margin: 1.5rem 0 0.5rem; color: #444; }
    p.sub { color: #888; font-size: 0.85rem; margin: 0 0 1.5rem; }
    ul { list-style: none; padding: 0; margin: 0; }
    li { display: flex; align-items: center; gap: 0.6rem; padding: 0.5rem 0.75rem;
         border-bottom: 1px solid #eee; font-size: 0.95rem; }
    li:last-child { border-bottom: none; }
    .icon { font-weight: 700; width: 1rem; text-align: center; }
    li.ok .icon { color: #2a9d5c; }
    li.diff .icon { color: #d9534f; }
    li.failed .icon { color: #b8860b; }
    .pct { margin-left: auto; color: #d9534f; font-size: 0.85rem; }
    a { font-size: 0.8rem; color: #555; text-decoration: none; border: 1px solid #ccc;
        padding: 1px 6px; border-radius: 4px; }
    a:hover { background: #f5f5f5; }
  </style>
</head>
<body>
  <h1>Visual Regression — ${project}</h1>
  <p class="sub">
    Baseline: ${baselineCommitHash}<br>
    Current: ${currentCommitHash}<br>
    ${totalDiffs} difference${totalDiffs === 1 ? '' : 's'}<br>
    generated ${generatedAt}
  </p>
  ${sections}
</body>
</html>`;
  await fs.writeFile(reportPath, html);
  console.log(`report: ${displayPath} (${totalDiffs} difference${totalDiffs === 1 ? '' : 's'})`);
  return totalDiffs;
}

module.exports = { reportResults };
