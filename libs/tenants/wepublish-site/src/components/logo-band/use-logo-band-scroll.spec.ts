import { advanceScroll, wrapScroll } from './use-logo-band-scroll';

describe('wrapScroll', () => {
  it('keeps a position within the first set of logos', () => {
    expect(wrapScroll(120, 1000)).toBe(120);
  });

  it('jumps back by one set of logos once the first set has run out', () => {
    expect(wrapScroll(1030, 1000)).toBe(30);
  });

  it('jumps forward by one set of logos when dragged before the start', () => {
    expect(wrapScroll(-40, 1000)).toBe(960);
  });

  it('leaves the position alone while the logos are not measured yet', () => {
    expect(wrapScroll(40, 0)).toBe(40);
  });
});

describe('advanceScroll', () => {
  it('moves by the speed for the time that passed', () => {
    expect(advanceScroll(100, 500, 40, 1000)).toBe(120);
  });

  it('runs on endlessly', () => {
    expect(advanceScroll(990, 1000, 40, 1000)).toBe(30);
  });
});
