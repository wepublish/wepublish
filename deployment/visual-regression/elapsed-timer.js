const CLEAR_LINE = '\r\x1b[2K';

function formatElapsed(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

// Keeps a live "time elapsed" line pinned below all other output. Every write to
// stdout/stderr (console.log, piped container output, ...) first clears the line,
// then redraws it, so it never ends up mixed into the log.
function startElapsedTimer(label = 'time elapsed') {
  const start = Date.now();
  const statusText = () => `${label}: ${formatElapsed(Date.now() - start)}`;

  if (!process.stdout.isTTY) {
    let stopped = false;
    return {
      stop: () => {
        if (stopped) return;
        stopped = true;
        console.log(`${label}: ${formatElapsed(Date.now() - start)}`);
      },
    };
  }

  const originalStdoutWrite = process.stdout.write.bind(process.stdout);
  const originalStderrWrite = process.stderr.write.bind(process.stderr);
  // only draw the status when the cursor sits at the start of a line, otherwise
  // it would get appended to a partially written line
  let atLineStart = true;
  let statusDrawn = false;

  const clearStatus = () => {
    if (statusDrawn) originalStdoutWrite(CLEAR_LINE);
    statusDrawn = false;
  };

  const drawStatus = () => {
    if (!atLineStart) return;
    originalStdoutWrite(`${CLEAR_LINE}${statusText()}`);
    statusDrawn = true;
  };

  const wrap = originalWrite => (chunk, ...rest) => {
    clearStatus();
    const result = originalWrite(chunk, ...rest);
    atLineStart = String(chunk).endsWith('\n');
    drawStatus();
    return result;
  };

  process.stdout.write = wrap(originalStdoutWrite);
  process.stderr.write = wrap(originalStderrWrite);

  const interval = setInterval(drawStatus, 1000);
  // never keep the process alive just for the timer
  interval.unref();
  drawStatus();

  let stopped = false;
  return {
    // idempotent: callers may stop the timer on an early exit and again when the run settles
    stop() {
      if (stopped) return;
      stopped = true;
      clearInterval(interval);
      process.stdout.write = originalStdoutWrite;
      process.stderr.write = originalStderrWrite;
      clearStatus();
      originalStdoutWrite(`${atLineStart ? '' : '\n'}${label}: ${formatElapsed(Date.now() - start)}\n`);
    },
  };
}

module.exports = { startElapsedTimer };
