import { formatBitrate } from './mediaBitrate';

describe('formatBitrate', () => {
  it('reads a three minute, 3 MB track as a 128 kbps one', () => {
    expect(formatBitrate(3 * 1024 * 1024, 192)).toBe('131 kbps');
  });

  it('switches to Mbps once a kbps figure stops being readable', () => {
    expect(formatBitrate(100 * 1000 * 1000, 60)).toBe('13.3 Mbps');
  });

  it('says nothing when the length was never measured', () => {
    expect(formatBitrate(1024, undefined)).toBeUndefined();
  });

  it('says nothing for a zero length rather than dividing by it', () => {
    expect(formatBitrate(1024, 0)).toBeUndefined();
  });
});
