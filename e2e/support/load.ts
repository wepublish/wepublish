/**
 * Helpers of the renewal load test (`@load`): many synthetic readers, one
 * nightly run, and the API's memory while it goes on. See e2e/README.md.
 */

// Type only: factories imports this file.
import type { Reader } from './factories';

export type LoadReaders = { mail: number; letter: number };

/** The load test's readers and its nightly run, shared between its steps. */
export type LoadRun = {
  mailReaders: Reader[];
  letterReaders: Reader[];
  /** Mail readers whose mails stay in the mailbox for a closer look. */
  sampleReaders: Reader[];
  /** What the recipients of the mail readers contain, for sweeping the mailbox. */
  mailPrefix: string;
  job?: { id: string };
  /** Mails to the mail readers counted (and swept) in the mailbox so far. */
  mailsCounted: number;
};

/** `E2E_LOAD_READERS`: `<mail>/<letter>` readers, e.g. `1200/300`; unset means off. */
export function parseLoadReaders(value: string | undefined): LoadReaders | undefined {
  if (!value?.trim()) {
    return undefined;
  }

  const match = /^\s*(\d+)\s*\/\s*(\d+)\s*$/.exec(value);
  const readers = match && { mail: Number(match[1]), letter: Number(match[2]) };

  if (!readers || readers.mail + readers.letter === 0) {
    throw new Error(
      `E2E_LOAD_READERS must be <mail>/<letter> readers, e.g. 1200/300, not "${value}".`
    );
  }

  return readers;
}

/**
 * Runs `run` for every item, at most `size` at once, and keeps the order.
 * After the first error no new call starts; it rejects once the running ones
 * are done.
 */
export async function inPool<T, R>(
  items: readonly T[],
  size: number,
  run: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  let failed: { error: unknown } | undefined;

  const worker = async () => {
    while (!failed && next < items.length) {
      const index = next++;

      try {
        results[index] = await run(items[index], index);
      } catch (error) {
        failed ??= { error };
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));

  if (failed) {
    throw failed.error;
  }

  return results;
}

/** One reading of `apiProcessStats`, or why the API did not answer. */
export type MemorySample =
  | {
      at: string;
      hostname: string;
      uptimeSeconds: number;
      rssBytes: number;
      heapUsedBytes: number;
      externalBytes: number;
    }
  | { at: string; error: string };

export type MemoryVerdict = {
  peakRssBytes: number;
  hostnames: string[];
  /** Empty when the API kept running and stayed below the limit. */
  problems: string[];
};

const mib = (bytes: number) => Math.round(bytes / 1024 / 1024);

/**
 * Whether the API process held up: no restart (a smaller uptime, or a pod
 * not seen before), no gap in answering, and rss below `maxRssBytes`.
 */
export function memoryVerdict(samples: MemorySample[], maxRssBytes: number): MemoryVerdict {
  const problems: string[] = [];
  const lastUptime = new Map<string, number>();
  const failures = samples.filter((s): s is Extract<MemorySample, { error: string }> => 'error' in s);
  const readings = samples.filter((s): s is Extract<MemorySample, { hostname: string }> => 'hostname' in s);
  let peak: (typeof readings)[number] | undefined;

  for (const reading of readings) {
    const before = lastUptime.get(reading.hostname);

    if (before === undefined && lastUptime.size > 0) {
      problems.push(
        `a new pod ${reading.hostname} answered (up ${Math.round(reading.uptimeSeconds)} s), so a pod restarted or was added`
      );
    } else if (before !== undefined && reading.uptimeSeconds < before) {
      problems.push(
        `${reading.hostname} restarted (uptime ${Math.round(before)} s, then ${Math.round(reading.uptimeSeconds)} s)`
      );
    }

    lastUptime.set(reading.hostname, reading.uptimeSeconds);

    if (!peak || reading.rssBytes > peak.rssBytes) {
      peak = reading;
    }
  }

  if (peak && peak.rssBytes > maxRssBytes) {
    problems.push(
      `rss peaked at ${mib(peak.rssBytes)} MiB, over the ${mib(maxRssBytes)} MiB allowed (${peak.hostname})`
    );
  }

  if (failures.length) {
    problems.push(`the API did not answer ${failures.length} times, first: ${failures[0].error}`);
  }

  return { peakRssBytes: peak?.rssBytes ?? 0, hostnames: [...lastUptime.keys()], problems };
}

/** The samples as a Markdown table, one row a minute, for the job summary. */
export function memoryTable(samples: MemorySample[]): string {
  const rows = ['| Time | Pod | Up | rss | heap | external |', '| --- | --- | --- | --- | --- | --- |'];
  let lastMinute = '';

  for (const s of samples) {
    const minute = s.at.slice(0, 16);

    if ('error' in s) {
      rows.push(`| ${s.at.slice(11, 19)} | — | — | no answer: ${s.error} | | |`);
      continue;
    }

    if (minute === lastMinute) {
      continue;
    }

    lastMinute = minute;
    rows.push(
      `| ${s.at.slice(11, 19)} | ${s.hostname} | ${Math.round(s.uptimeSeconds)} s | ${mib(s.rssBytes)} MiB | ${mib(s.heapUsedBytes)} MiB | ${mib(s.externalBytes)} MiB |`
    );
  }

  return rows.join('\n');
}
