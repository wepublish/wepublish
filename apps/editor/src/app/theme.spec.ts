import { getContrastRatio } from '@mui/material/styles';

import { createEditorTheme } from './theme';

const theme = createEditorTheme();

describe('createEditorTheme', () => {
  it('builds both colour schemes into one theme', () => {
    expect(theme.colorSchemes.light).toBeDefined();
    expect(theme.colorSchemes.dark).toBeDefined();
  });

  it('exposes its palette as CSS variables', () => {
    expect(theme.vars).toBeDefined();
    expect(theme.vars?.palette.primary.main).toMatch(/^var\(--/);
  });

  it('switches scheme on an attribute rather than the media query alone', () => {
    expect(theme.colorSchemeSelector).toBe('data-mui-color-scheme');
  });

  it('keeps the brand blue as primary colour on the dark surfaces', () => {
    expect(theme.colorSchemes.dark?.palette.primary.main).toBe('#3498ff');
  });

  describe.each(['light', 'dark'] as const)('%s scheme contrast', scheme => {
    const palette = theme.colorSchemes[scheme]?.palette ?? theme.palette;

    it.each(['primary', 'error'] as const)(
      'puts readable text on filled %s surfaces',
      colour => {
        expect(
          getContrastRatio(palette[colour].main, palette[colour].contrastText)
        ).toBeGreaterThanOrEqual(4.5);
        expect(
          getContrastRatio(palette[colour].dark, palette[colour].contrastText)
        ).toBeGreaterThanOrEqual(4.5);
      }
    );

    it('keeps primary text readable on the page and on paper', () => {
      expect(
        getContrastRatio(palette.primary.main, palette.background.default)
      ).toBeGreaterThanOrEqual(4.5);
      expect(
        getContrastRatio(palette.primary.main, palette.background.paper)
      ).toBeGreaterThanOrEqual(4.5);
    });
  });

  describe('keyboard focus', () => {
    const focusStyle = (
      component: 'MuiButtonBase' | 'MuiListItemButton' | 'MuiMenuItem',
      slot = 'root'
    ) => {
      const override = (
        theme.components?.[component]?.styleOverrides as
          Record<string, unknown> | undefined
      )?.[slot];
      const style =
        typeof override === 'function' ?
          (override({ theme } as never) as Record<string, unknown>)
        : (override as Record<string, unknown> | undefined);

      return style?.['&.Mui-focusVisible'] as
        Record<string, unknown> | undefined;
    };

    it('draws a solid ring around every focused button', () => {
      expect(focusStyle('MuiButtonBase')).toMatchObject({
        outline: `2px solid ${theme.vars?.palette.primary.main}`,
        outlineOffset: 2,
      });
    });

    it.each(['MuiListItemButton', 'MuiMenuItem'] as const)(
      'keeps the ring of %s inside scrolling lists',
      component => {
        expect(focusStyle(component)).toMatchObject({ outlineOffset: -2 });
      }
    );
  });

  it('keeps focusable label content in the notch out of the tab order', () => {
    const notched = theme.components?.MuiOutlinedInput?.styleOverrides
      ?.notchedOutline as Record<string, unknown>;

    expect(
      notched['& legend :is(a, button, input, select, textarea, [tabindex])']
    ).toEqual({ visibility: 'hidden' });
  });

  it('uses the dark surfaces for the dark scheme', () => {
    const { background } = theme.colorSchemes.dark!.palette!;

    expect(background?.default).toBe('#0a0d12');
    expect(background?.paper).toBe('#14181f');
  });

  it('lifts paper off the page in the light scheme too', () => {
    const { background } = theme.colorSchemes.light!.palette!;

    expect(background?.default).toBe('#f3f4f7');
    expect(background?.paper).toBe('#ffffff');
  });

  it('uses the editor font throughout', () => {
    expect(theme.typography.fontFamily).toMatch(/^'Inter'/);
  });

  it('keeps headings at the sizes the editor chrome uses', () => {
    expect(theme.typography.h1.fontSize).toBe('1.875rem');
    expect(theme.typography.h6.fontSize).toBe('0.875rem');
  });

  it('defaults the editor inputs to the small size', () => {
    expect(theme.components?.MuiTextField?.defaultProps?.size).toBe('small');
    expect(theme.components?.MuiSelect?.defaultProps?.size).toBe('small');
  });

  it('renders a card title as a section heading', () => {
    expect(
      (
        theme.components?.MuiCardHeader?.defaultProps?.slotProps?.title as
          { component?: string } | undefined
      )?.component
    ).toBe('h2');
  });

  it('leaves MuiFormControl without a margin of its own', () => {
    expect(theme.components?.MuiFormControl?.defaultProps?.margin).toBe('none');
  });

  it.each(['MuiInputBase', 'MuiInputLabel', 'MuiFormHelperText'])(
    'does not densify %s',
    name => {
      expect(theme.components?.[name as 'MuiInputBase']).toBeUndefined();
    }
  );

  it('turns the touch ripple off', () => {
    expect(
      theme.components?.MuiButtonBase?.defaultProps?.disableTouchRipple
    ).toBe(true);
  });

  it('lays every drawer out as a column so its header stays put', () => {
    expect(theme.components?.MuiDrawer?.styleOverrides?.paper).toMatchObject({
      display: 'flex',
      flexDirection: 'column',
    });
  });

  describe('alert colours', () => {
    const alertStyle = (severity: string, variant = 'filled') => {
      const root = theme.components?.MuiAlert?.styleOverrides?.root as (args: {
        ownerState: { severity: string; variant: string };
        theme: typeof theme;
      }) => Record<string, unknown>;

      return root({ ownerState: { severity, variant }, theme });
    };

    it.each(['success', 'warning', 'error', 'info'])('softens %s', severity => {
      const hex = alertStyle(severity)?.backgroundColor as string;

      expect(hex).toMatch(/^#[0-9a-f]{6}$/);
      expect(
        [1, 3, 5].every(i => parseInt(hex.slice(i, i + 2), 16) > 0xd0)
      ).toBe(true);
    });

    it('uses the published pill colour for success', () => {
      expect(alertStyle('success')?.backgroundColor).toBe('#e1f8de');
    });

    it('uses the draft pill colour for warning', () => {
      expect(alertStyle('warning')?.backgroundColor).toBe('#f8efde');
    });

    it('colours the standard variant to match the filled one', () => {
      expect(alertStyle('success', 'standard')?.backgroundColor).toBe(
        alertStyle('success', 'filled')?.backgroundColor
      );
    });

    it('tints the border rather than the surface when outlined', () => {
      const outlined = alertStyle('success', 'outlined');

      expect(outlined.backgroundColor).toBeUndefined();
      expect(outlined).toMatchObject({ color: '#2f6b2a' });
    });

    it('carries the dark tint in the same rule', () => {
      expect(JSON.stringify(alertStyle('success'))).toContain('#23402a');
    });
  });
});

describe('tabs', () => {
  const override = (component: 'MuiTabs' | 'MuiTab') => {
    const theme = createEditorTheme();
    const root = theme.components?.[component]?.styleOverrides?.root;

    return typeof root === 'function' ?
        (root({ theme } as never) as Record<string, unknown>)
      : (root as Record<string, unknown>);
  };

  it('keeps every tab bar on one compact row', () => {
    expect(override('MuiTabs')).toMatchObject({ minHeight: 40 });
    expect(override('MuiTab')).toMatchObject({ minHeight: 40 });
  });

  it('gives a scroll arrow no room while it has nothing to scroll', () => {
    expect(
      override('MuiTabs')['& .MuiTabs-scrollButtons.Mui-disabled']
    ).toMatchObject({ display: 'none' });
  });

  it('cuts dot badges out of what they sit on', () => {
    const dot = theme.components?.MuiBadge?.styleOverrides?.dot as (props: {
      theme: typeof theme;
    }) => { boxShadow: string; top: number; right: number };

    expect(dot({ theme })).toEqual({
      top: 2,
      right: 2,
      boxShadow: `0 0 0 2px ${theme.vars?.palette.background.paper}`,
    });
  });
});
