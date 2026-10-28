import { fontFamilyName } from './font-family-name';

describe('fontFamilyName', () => {
  it('strips the quotes and fallbacks of a css font family', () => {
    expect(fontFamilyName("'Fraunces'")).toBe('Fraunces');
    expect(fontFamilyName("'Fraunces', Georgia, serif")).toBe('Fraunces');
    expect(fontFamilyName('"Open Sans", Helvetica, Arial, sans-serif')).toBe(
      'Open Sans'
    );
    expect(fontFamilyName(' Roboto ,sans-serif')).toBe('Roboto');
  });

  it('keeps an empty value empty', () => {
    expect(fontFamilyName('')).toBe('');
    expect(fontFamilyName(null)).toBe('');
    expect(fontFamilyName(undefined)).toBe('');
  });
});
