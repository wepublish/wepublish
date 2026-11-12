import { ThemeOptions } from '@mui/material';
import { minimalTheme } from '@wepublish/ui';
import { de } from 'date-fns/locale';

import { neuewegeConfig } from './config';

describe('neuewegeConfig', () => {
  it('identifies the tenant', () => {
    expect(neuewegeConfig.id).toBe('neuewege');
    expect(neuewegeConfig.builder.meta?.siteTitle).toBe('Neue Wege');
  });

  it('builds the theme on top of the minimal theme', () => {
    const theme = neuewegeConfig.createTheme();

    expect(theme.palette.primary.main).toBe(minimalTheme.palette.primary.main);
  });

  it('lets the website settings theme win', () => {
    const theme = neuewegeConfig.createTheme({
      palette: { primary: { main: '#123456' } },
    } as ThemeOptions);

    expect(theme.palette.primary.main).toBe('#123456');
  });

  it('labels Payrexx as card or TWINT', () => {
    expect(neuewegeConfig.translations).toEqual({
      lng: 'de',
      overrides: {
        de: {
          paymentMethodLabels: {
            payrexx: 'Karte oder TWINT',
            'payrexx-subscription': 'Karte oder TWINT',
          },
        },
      },
    });
  });

  it('formats dates in german', () => {
    const date = new Date(2026, 9, 4, 9, 5);

    expect(neuewegeConfig.dateLocale).toBe(de);
    expect(neuewegeConfig.builder.date?.format?.(date)).toBe(
      '04. Oktober 2026 um 09:05'
    );
    expect(neuewegeConfig.builder.date?.format?.(date, false)).toBe(
      '04. Oktober 2026'
    );
  });

  it('does not bind a framework specific link', () => {
    expect(neuewegeConfig.builder.elements).toBeUndefined();
  });
});
