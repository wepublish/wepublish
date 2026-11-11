import { DEFAULT_PRINT, printSettings } from './letter-print-defaults';

describe('printSettings', () => {
  it('falls back to the defaults when nothing was chosen', () => {
    expect(printSettings(null)).toEqual(DEFAULT_PRINT);
    expect(printSettings(undefined)).toEqual(DEFAULT_PRINT);
  });

  it('overlays what was chosen and keeps the rest', () => {
    expect(
      printSettings({ printMode: 'duplex', deliveryProduct: null })
    ).toEqual({ ...DEFAULT_PRINT, printMode: 'duplex' });
  });

  it('lets a second layer refine the first', () => {
    expect(
      printSettings({ printSpectrum: 'color' }, { printMode: 'duplex' })
    ).toEqual({
      ...DEFAULT_PRINT,
      printMode: 'duplex',
      printSpectrum: 'color',
    });
  });
});
