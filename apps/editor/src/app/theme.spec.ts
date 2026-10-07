import { createEditorTheme } from './theme';

describe('createEditorTheme', () => {
  it('keeps the brand blue as primary colour in light mode', () => {
    const theme = createEditorTheme('light');

    expect(theme.palette.mode).toBe('light');
    expect(theme.palette.primary.main).toBe('#3498ff');
  });

  it('uses the rsuite dark surfaces in dark mode', () => {
    const theme = createEditorTheme('dark');

    expect(theme.palette.mode).toBe('dark');
    expect(theme.palette.background.default).toBe('#0f131a');
    expect(theme.palette.background.paper).toBe('#1a1d24');
  });

  it('uses the same font as the rsuite components', () => {
    const theme = createEditorTheme('light');

    expect(theme.typography.fontFamily).toMatch(/^'Inter'/);
  });

  it.each(['light', 'dark'] as const)(
    'draws %s table grid lines in the rsuite border colour',
    mode => {
      const theme = createEditorTheme(mode);

      expect(theme.components?.MuiTableCell?.styleOverrides?.root).toEqual(
        expect.objectContaining({
          borderBottomColor: 'var(--rs-border-primary)',
        })
      );
    }
  );
});
