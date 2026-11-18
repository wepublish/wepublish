import { expect } from '@playwright/test';
import { writeFile } from 'fs/promises';
import { dirname, join } from 'path';
import { env } from '../support/env';
import { BULK_POOL, Reader } from '../support/factories';
import { ImapInbox } from '../support/imap-inbox';
import { poll } from '../support/inbox';
import {
  inPool,
  LoadRun,
  memoryTable,
  memoryVerdict,
  MemorySample,
  retryTransient,
} from '../support/load';
import { MailLog, newestLogSince } from '../support/mail-logs';
import { Given, ScenarioContext, Then, When } from './fixtures';

const DAY_MS = 24 * 60 * 60 * 1000;
const SAMPLE_EVERY_MS = 10_000;
const SWEEP_EVERY_MS = 60_000;
/** The 40/10 trial on review01 took about 4.6 s a reader (bexio, then mail or letter): 1500 take close to two hours. */
const RUN_TIMEOUT_MS = 3 * 60 * 60 * 1000;
const SAMPLE_MAILS = 3;

/** States in which the reader did not get the invoice; `deferred` still lacks bexio's pdf. */
const NOT_DELIVERED = ['rejected', 'bounced', 'undeliverable', 'canceled', 'deferred'];

Given(
  'the load readers with a {string} subscription paying with {string}, due for their renewal invoice',
  async ({ data, ctx, $testInfo }, memberPlanSlug: string, paymentMethodSlug: string) => {
    const counts = env.loadReaders;

    if (!counts || !env.pingen) {
      throw new Error('Tag the scenario with @load and @letter.');
    }

    await data.ensureLetterProviderStaging(env.pingen);

    const flow = await data.flowQuery(memberPlanSlug, paymentMethodSlug);
    const interval = await data.invoiceCreationInterval(flow);
    // All on the same day, as the yearly subscriptions ending on 31 December:
    // the night the invoice-creation event reaches them, which is today.
    const paidUntil = new Date(Date.now() + Math.abs(interval.daysAwayFromEnding ?? 0) * DAY_MS);
    paidUntil.setUTCHours(12, 0, 0, 0);

    // Letter readers on the flow get the renewal invoice as a letter.
    await data.withInvoiceCreationAsLetter(flow);

    const runId = data.newRunId();
    const channels = [
      ...Array.from({ length: counts.mail }, () => 'mail' as const),
      ...Array.from({ length: counts.letter }, () => 'letter' as const),
    ];
    const created = Date.now();
    // Registered before the first reader exists: a failure halfway must not
    // leave readers with due subscriptions for the next nightly run.
    const existing: Reader[] = [];
    data.deleteAfterwards(existing, { keep: env.keepLoadData });

    // The review ingress now and then drops one of many requests in a row;
    // retryTransient tries again without doing a write twice.
    const readers = await inPool(channels, BULK_POOL, async (channel, index) => {
      const letter = channel === 'letter';
      let attempt = 0;
      // A retry takes a new address: a user the dropped call created after
      // all has no subscription, so the nightly run leaves it alone.
      const reader = await retryTransient(() =>
        data.createUser(undefined, {
          localPart: `e2e+${runId}-${letter ? 'l' : 'm'}${index}${++attempt > 1 ? `r${attempt}` : ''}`,
          address: letter ? data.swissAddress() : undefined,
          cleanup: false,
        })
      );
      existing.push(reader);

      if (letter) {
        const preference = await retryTransient(() => data.setDeliveryMode(reader, 'letter'));

        if (!preference.canReceiveLetters) {
          throw new Error(`${reader.email} cannot get letters at its synthetic address.`);
        }
      }

      await retryTransient(() => data.importDueSubscription({ reader, flow, paidUntil }), {
        recover: () => data.subscriptionOf(reader, flow),
      });

      return { channel, reader };
    });

    const mailReaders = readers.filter(r => r.channel === 'mail').map(r => r.reader);
    const letterReaders = readers.filter(r => r.channel === 'letter').map(r => r.reader);


    ctx.load = {
      mailReaders,
      letterReaders,
      sampleReaders: mailReaders.slice(0, SAMPLE_MAILS),
      mailPrefix: `e2e+${runId}-m`,
      mailsCounted: 0,
    };

    await $testInfo.attach('load readers', {
      contentType: 'text/plain',
      body:
        `${mailReaders.length} by mail, ${letterReaders.length} by letter, paid until ${paidUntil.toISOString()}, ` +
        `created in ${Math.round((Date.now() - created) / 1000)} s (${runId})`,
    });
  }
);

When('the nightly run starts', async ({ data, ctx }) => {
  loadOf(ctx).job = await data.runPeriodicJobNow();
});

Then(
  'the run finishes without the API restarting or nearing its memory limit',
  async ({ data, ctx, inbox, $testInfo }) => {
    const load = loadOf(ctx);
    const job = load.job;

    if (!job) {
      throw new Error('Start the nightly run first.');
    }

    const samples: MemorySample[] = [];
    let lastSweep = 0;

    const run = await poll(
      async () => {
        const at = new Date().toISOString();

        samples.push(
          await data
            .apiProcessStats()
            .then(stats => ({ at, ...stats }))
            .catch((error: Error) => ({ at, error: error.message.slice(0, 200) }))
        );

        if (Date.now() - lastSweep > SWEEP_EVERY_MS) {
          lastSweep = Date.now();
          await sweepMails(inbox, load);
        }

        const current = await data.periodicJobRun(job.id).catch(() => undefined);

        // Not running and not finished: the process that ran it is gone.
        return current && (current.successfullyFinished || current.finishedWithError || !current.running) ?
            current
          : undefined;
      },
      { timeout: RUN_TIMEOUT_MS, interval: SAMPLE_EVERY_MS, message: `the nightly run ${job.id} did not finish` }
    );

    const verdict = memoryVerdict(samples, env.loadMaxRssMib * 1024 * 1024);
    const problems = [
      ...verdict.problems,
      ...(run.finishedWithError ? [`the run failed: ${run.error}`]
      : !run.successfullyFinished ? ['the run stopped without finishing']
      : []),
    ];
    const summary = [
      '## Renewal load test',
      '',
      `${load.mailReaders.length} readers by mail, ${load.letterReaders.length} by letter · ` +
        `peak rss ${Math.round(verdict.peakRssBytes / 1024 / 1024)} MiB of ${env.loadMaxRssMib} MiB allowed · ` +
        `pods ${verdict.hostnames.join(', ') || '—'}`,
      '',
      problems.length ? problems.map(problem => `- ${problem}`).join('\n') : 'The API held up.',
      '',
      memoryTable(samples),
      '',
    ].join('\n');

    // The workflow adds this file to the job summary.
    await writeFile(join(dirname($testInfo.project.outputDir), 'load-memory.md'), summary);
    await $testInfo.attach('memory', { contentType: 'application/json', body: JSON.stringify(samples, null, 2) });
    await $testInfo.attach('memory summary', { contentType: 'text/markdown', body: summary });

    expect(problems, 'the API process held up during the run').toEqual([]);
  }
);

Then('every load reader got the renewal invoice on their channel', async ({ data, ctx, $testInfo }) => {
  const load = loadOf(ctx);
  const readers = [
    ...load.mailReaders.map(reader => ({ reader, channel: 'mail' as const })),
    ...load.letterReaders.map(reader => ({ reader, channel: 'letter' as const })),
  ];

  const outcomes = await inPool(readers, BULK_POOL, async ({ reader, channel }) => {
    const log = newestLogSince(
      await retryTransient(() => data.mailLogs(reader, channel)),
      ctx.startedAt
    );

    return { reader, channel, log, problem: problemOf(channel, log) };
  });

  const byState = new Map<string, number>();

  for (const { channel, log } of outcomes) {
    const key = `${channel}: ${log?.state ?? 'nothing sent'}`;
    byState.set(key, (byState.get(key) ?? 0) + 1);
  }

  await $testInfo.attach('renewals by channel and state', {
    contentType: 'text/plain',
    body: [...byState].map(([key, count]) => `${key}: ${count}`).join('\n'),
  });

  const failed = outcomes.filter(outcome => outcome.problem);

  expect(
    failed.slice(0, 10).map(({ reader, problem }) => `${reader.email}: ${problem}`),
    `${failed.length} of ${outcomes.length} readers did not get their renewal invoice`
  ).toEqual([]);
});

Then(
  'the mailbox received a renewal mail for every mail reader, the samples with the bexio invoice attached',
  async ({ ctx, inbox }) => {
    const load = loadOf(ctx);

    for (const reader of load.sampleReaders) {
      const mail = await inbox.waitForMail({ to: reader.email, timeout: 120_000 });
      const pdfs = mail.attachments.filter(({ contentType }) => contentType === 'application/pdf');

      expect(pdfs, `pdf attachments of "${mail.subject}" to ${reader.email}`).toHaveLength(1);
    }

    if (!(inbox instanceof ImapInbox)) {
      return;
    }

    // Mails can still be on their way after the run.
    const others = load.mailReaders.length - load.sampleReaders.length;

    await poll(
      async () => {
        await sweepMails(inbox, load);

        return load.mailsCounted >= others ? load.mailsCounted : undefined;
      },
      {
        timeout: 5 * 60_000,
        interval: 15_000,
        message: `the mailbox has only ${load.mailsCounted} of the ${others} other renewal mails`,
      }
    );
  }
);

function loadOf(ctx: ScenarioContext): LoadRun {
  if (!ctx.load) {
    throw new Error('No load readers in this scenario. Add the Given step that creates them.');
  }

  return ctx.load;
}

/** Counts and deletes the mails to the mail readers, but the samples': 1200 pdf mails would fill Ethereal. */
async function sweepMails(inbox: unknown, load: LoadRun) {
  if (!(inbox instanceof ImapInbox)) {
    return;
  }

  const counted = await inbox
    .sweep({ toContaining: load.mailPrefix, keep: load.sampleReaders.map(({ email }) => email) })
    .catch(() => 0);

  // Kept mails are counted again on every sweep.
  load.mailsCounted = env.keepMails ? Math.max(load.mailsCounted, counted) : load.mailsCounted + counted;
}

function problemOf(channel: 'mail' | 'letter', log: MailLog | undefined): string | undefined {
  if (!log) {
    return `no ${channel} in the mail log`;
  }

  if (NOT_DELIVERED.includes(log.state)) {
    return `${channel} ${log.state}${log.error ? `: ${log.error}` : ''}`;
  }

  if (channel === 'letter' && !log.providerLetterID) {
    return 'letter without an id at Pingen';
  }

  return undefined;
}

