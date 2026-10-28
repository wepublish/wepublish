import { FontStyle, FontWeight } from '@wepublish/website/api';

import { googleFontsUrl } from './google-fonts';

describe('googleFontsUrl', () => {
  it('returns nothing without fonts', () => {
    expect(googleFontsUrl([])).toBeUndefined();
    expect(googleFontsUrl(undefined)).toBeUndefined();
  });

  it('requests every weight of every named font', () => {
    expect(
      googleFontsUrl([
        {
          name: 'League Spartan',
          weight: [FontWeight.Regular, FontWeight.Bold],
          style: [FontStyle.Normal],
        },
        { name: '', weight: [FontWeight.Regular], style: [FontStyle.Normal] },
        {
          name: 'Roboto',
          weight: [FontWeight.Light, FontWeight.Variable, FontWeight.Regular],
          style: [FontStyle.Normal, FontStyle.Italic],
        },
      ])
    ).toBe(
      'https://fonts.googleapis.com/css2?family=League+Spartan:ital,wght@0,400;0,700&family=Roboto:ital,wght@0,300;0,400;1,300;1,400&display=swap'
    );
  });
});
