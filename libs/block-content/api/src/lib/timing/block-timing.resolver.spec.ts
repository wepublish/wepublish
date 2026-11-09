import { BlockTimingResolver } from './block-timing.resolver';
import { BlockTiming } from './block-timing.model';

describe('BlockTimingResolver', () => {
  const resolver = new BlockTimingResolver();
  const stored = JSON.parse(
    JSON.stringify({
      from: new Date('2026-01-05T08:00:00Z'),
      to: new Date('2026-01-06T08:00:00Z'),
    })
  ) as BlockTiming;

  it('serves dates that were stored as strings as dates', () => {
    expect(resolver.from(stored)).toEqual(new Date('2026-01-05T08:00:00Z'));
    expect(resolver.to(stored)).toEqual(new Date('2026-01-06T08:00:00Z'));
  });

  it('serves missing or unreadable dates as null', () => {
    expect(resolver.from({})).toBeNull();
    expect(resolver.to({ to: 'soon' as unknown as Date })).toBeNull();
  });
});
