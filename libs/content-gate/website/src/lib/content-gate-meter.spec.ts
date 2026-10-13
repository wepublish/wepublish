import {
  ContentGateMeter,
  MeterGate,
  decideContentGate,
} from './content-gate-meter';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-10-13T12:00:00Z').getTime();

const gate: MeterGate = {
  id: 'gate-1',
  freeArticles: 2,
  softGateArticles: 1,
  meterWindowDays: null,
  newsletterNeverGate: false,
  newsletterFreeArticles: 0,
};

const emptyMeter: ContentGateMeter = { gateId: 'gate-1', reads: [] };

const readInOrder = (
  articleIds: string[],
  meter = emptyMeter,
  options: Partial<Parameters<typeof decideContentGate>[0]> = {}
) =>
  articleIds.reduce<{ states: string[]; meter: ContentGateMeter }>(
    (result, articleId) => {
      const { state, meter } = decideContentGate({
        gate,
        meter: result.meter,
        articleId,
        isNewsletterVisit: false,
        now,
        ...options,
      });

      return { states: [...result.states, state], meter };
    },
    { states: [], meter }
  );

describe('decideContentGate', () => {
  it('lets readers read the free articles, then shows the soft gate, then the hard gate', () => {
    expect(readInOrder(['a', 'b', 'c', 'd', 'e']).states).toEqual([
      'none',
      'none',
      'soft',
      'hard',
      'hard',
    ]);
  });

  it('shows the hard gate right away without free or soft articles', () => {
    expect(
      readInOrder(['a'], emptyMeter, {
        gate: { ...gate, freeArticles: 0, softGateArticles: 0 },
      }).states
    ).toEqual(['hard']);
  });

  it('shows the same gate again when a reader comes back to an article', () => {
    const { meter } = readInOrder(['a', 'b', 'c']);

    expect(readInOrder(['a', 'c'], meter).states).toEqual(['none', 'soft']);
  });

  it('does not count articles that were behind the hard gate', () => {
    const { meter } = readInOrder(['a', 'b', 'c', 'd']);

    expect(meter.reads.map(read => read.articleId)).toEqual(['a', 'b', 'c']);
  });

  it('forgets reads older than the meter window', () => {
    const windowGate = { ...gate, meterWindowDays: 30 };
    const { meter } = readInOrder(['a', 'b', 'c'], emptyMeter, {
      gate: windowGate,
      now: now - 31 * DAY,
    });

    expect(readInOrder(['d'], meter, { gate: windowGate }).states).toEqual([
      'none',
    ]);
  });

  it('starts over once a different gate is active', () => {
    const { meter } = readInOrder(['a', 'b', 'c', 'd']);

    expect(
      readInOrder(['e'], meter, { gate: { ...gate, id: 'gate-2' } })
    ).toMatchObject({
      states: ['none'],
      meter: { gateId: 'gate-2', reads: [{ articleId: 'e' }] },
    });
  });

  describe('newsletter visits', () => {
    it('never gates them when the gate says so, and does not count them', () => {
      const { states, meter } = readInOrder(['a', 'b', 'c', 'd'], emptyMeter, {
        gate: { ...gate, newsletterNeverGate: true },
        isNewsletterVisit: true,
      });

      expect(states).toEqual(['none', 'none', 'none', 'none']);
      expect(meter.reads).toEqual([]);
    });

    it('lets the first newsletter articles through without counting them', () => {
      const newsletterGate = { ...gate, newsletterFreeArticles: 2 };
      const { states, meter } = readInOrder(['a', 'b', 'c'], emptyMeter, {
        gate: newsletterGate,
        isNewsletterVisit: true,
      });

      expect(states).toEqual(['none', 'none', 'none']);
      expect(
        readInOrder(['d', 'e', 'f'], meter, { gate: newsletterGate }).states
      ).toEqual(['none', 'soft', 'hard']);
    });

    it('meters newsletter visits normally once their free articles are used up', () => {
      expect(
        readInOrder(['a', 'b', 'c', 'd'], emptyMeter, {
          gate: { ...gate, newsletterFreeArticles: 1 },
          isNewsletterVisit: true,
        }).states
      ).toEqual(['none', 'none', 'none', 'soft']);
    });
  });
});
