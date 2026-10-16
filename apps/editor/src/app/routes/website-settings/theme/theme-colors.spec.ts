import { websiteThemeColors } from './theme-colors';

const palette = {
  primary: { main: '#aa0000', light: '#ff0000', dark: '#660000' },
  secondary: { main: '#00aa00' },
  accent: { main: '#0000aa' },
  background: { default: '#ffffff', paper: '#f5f5f5' },
  text: { primary: '#111111' },
  divider: '#dddddd',
  success: { main: '#00ff00' },
  error: { main: '#ff0000' },
};

describe('websiteThemeColors', () => {
  it('leads with the brand colours', () => {
    expect(websiteThemeColors(palette).slice(0, 3)).toEqual([
      '#aa0000',
      '#00aa00',
      '#0000aa',
    ]);
  });

  it('carries the surfaces and the signal colours too', () => {
    const colors = websiteThemeColors(palette);

    expect(colors).toContain('#ffffff');
    expect(colors).toContain('#111111');
    expect(colors).toContain('#dddddd');
    expect(colors).toContain('#00ff00');
  });

  it('offers a colour once', () => {
    const colors = websiteThemeColors(palette);

    expect(colors.filter(color => color === '#ff0000')).toHaveLength(1);
  });

  it('skips the entries a theme left unset', () => {
    const colors = websiteThemeColors({
      primary: { main: '#aa0000', light: null },
      secondary: {},
    });

    expect(colors).toEqual(['#aa0000']);
  });

  it('has nothing to offer for an empty theme', () => {
    expect(websiteThemeColors({})).toEqual([]);
  });
});
