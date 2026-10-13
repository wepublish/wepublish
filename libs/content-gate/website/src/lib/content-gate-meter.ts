import { FullContentGateFragment } from '@wepublish/website/api';

const DAY = 24 * 60 * 60 * 1000;

export type ContentGateState = 'none' | 'soft' | 'hard';

type MeterReadState = 'free' | 'soft' | 'newsletter';

export type MeterRead = {
  articleId: string;
  at: number;
  state: MeterReadState;
};

export type ContentGateMeter = {
  gateId: string;
  reads: MeterRead[];
};

export type MeterGate = Pick<
  FullContentGateFragment,
  | 'id'
  | 'freeArticles'
  | 'softGateArticles'
  | 'meterWindowDays'
  | 'newsletterNeverGate'
  | 'newsletterFreeArticles'
>;

type DecideContentGateInput = {
  gate: MeterGate;
  meter: ContentGateMeter | null | undefined;
  articleId: string;
  isNewsletterVisit: boolean;
  now: number;
};

const stateOfRead: Record<MeterReadState, ContentGateState> = {
  free: 'none',
  newsletter: 'none',
  soft: 'soft',
};

/**
 * Decides which gate a reader sees on an article and records the read.
 * Articles behind the hard gate are not recorded, the reader could not read them.
 */
export function decideContentGate({
  gate,
  meter,
  articleId,
  isNewsletterVisit,
  now,
}: DecideContentGateInput): {
  state: ContentGateState;
  meter: ContentGateMeter;
} {
  const windowStart =
    gate.meterWindowDays != null ? now - gate.meterWindowDays * DAY : -Infinity;
  const reads =
    meter?.gateId === gate.id ?
      meter.reads.filter(read => read.at >= windowStart)
    : [];
  const nextMeter = (read?: MeterRead) => ({
    gateId: gate.id,
    reads: read ? [...reads, read] : reads,
  });
  const record = (state: MeterReadState) => ({
    state: stateOfRead[state],
    meter: nextMeter({ articleId, at: now, state }),
  });

  const previousRead = reads.find(read => read.articleId === articleId);

  if (previousRead) {
    return { state: stateOfRead[previousRead.state], meter: nextMeter() };
  }

  if (isNewsletterVisit) {
    if (gate.newsletterNeverGate) {
      return { state: 'none', meter: nextMeter() };
    }

    const newsletterReads = reads.filter(
      read => read.state === 'newsletter'
    ).length;

    if (newsletterReads < gate.newsletterFreeArticles) {
      return record('newsletter');
    }
  }

  const counted = reads.filter(read => read.state !== 'newsletter').length;

  if (counted < gate.freeArticles) {
    return record('free');
  }

  if (counted < gate.freeArticles + gate.softGateArticles) {
    return record('soft');
  }

  return { state: 'hard', meter: nextMeter() };
}
