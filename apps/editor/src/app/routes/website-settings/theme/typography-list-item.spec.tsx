import '@testing-library/jest-dom/vitest';

import { createTheme, ThemeProvider } from '@mui/material';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import { minimalTheme } from '@wepublish/ui';
import { enqueueSnackbar } from '@wepublish/ui/editor';
import { PropsWithChildren, useEffect } from 'react';
import {
  FormProvider,
  Resolver,
  useForm,
  UseFormReturn,
} from 'react-hook-form';

import { mediaQuery, ScreenSize } from './typography-breakpoints';
import { TypographyListItem } from './typography-list-item';

vi.mock('@apollo/client/react', async importOriginal => ({
  ...(await importOriginal<typeof import('@apollo/client/react')>()),
  useQuery: () => ({ data: undefined, loading: false }),
}));

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  enqueueSnackbar: vi.fn(),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key} ${JSON.stringify(options)}` : key,
    i18n: { language: 'en' },
  }),
}));

type Values = {
  typography: {
    allVariants: Record<string, unknown>;
    h1: Record<string, unknown>;
  };
};

let form: UseFormReturn<Values>;

const captureForm = (value: UseFormReturn<Values>) => {
  form = value;
};

const Wrapper = ({
  children,
  defaultValues,
  resolver,
}: PropsWithChildren<{
  defaultValues: Values;
  resolver?: Resolver<Values>;
}>) => {
  const form = useForm<Values>({ defaultValues, resolver });

  useEffect(() => captureForm(form), [form]);

  return (
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <FormProvider {...form}>{children}</FormProvider>
    </ThemeProvider>
  );
};

const renderItem = (
  h1: Record<string, unknown> = {},
  {
    allVariants = { lineHeight: '1.4em', letterSpacing: null },
    resolver,
    isOpen = true,
    compact,
  }: {
    allVariants?: Record<string, unknown>;
    resolver?: Resolver<Values>;
    isOpen?: boolean;
    compact?: boolean;
  } = {}
) =>
  render(
    <Wrapper
      resolver={resolver}
      defaultValues={{
        typography: {
          allVariants,
          h1: { fontSize: '2rem', lineHeight: null, ...h1 },
        },
      }}
    >
      <ul>
        <TypographyListItem
          name="typography.h1"
          parentName="typography"
          isOpen={isOpen}
          compact={compact}
          onOpen={() => undefined}
        />
      </ul>
    </Wrapper>
  );

const stubReducedMotion = (reducedMotion: boolean) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query.includes('prefers-reduced-motion: reduce') && reducedMotion,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

const listItemsOutsideList = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('li')).filter(
    item => !['UL', 'OL'].includes(item.parentElement?.tagName ?? '')
  );

const tab = (name: RegExp | string) => screen.getByRole('tab', { name });

const mq = {
  sm: mediaQuery('sm'),
  md: mediaQuery('md'),
  lg: mediaQuery('lg'),
  xl: mediaQuery('xl'),
};

const h1Values = () => form.getValues('typography.h1');

const override = (screenSize: ScreenSize) =>
  h1Values()[mediaQuery(screenSize)] as Record<string, unknown> | undefined;

const trailingMediaQueries = () => {
  const keys = Object.keys(h1Values());
  const first = keys.findIndex(key => key.startsWith('@media'));

  return first === -1 ? [] : keys.slice(first);
};

const overrides = () =>
  Object.fromEntries(
    Object.entries(h1Values()).filter(([key]) => key.startsWith('@media'))
  );

const removeControl = () => screen.getByTestId('remove-screen-size');

const addScreenSize = (width: number) => {
  fireEvent.click(
    screen.getByRole('button', {
      name: 'websiteSettings.theme.typography.addScreenSize',
    })
  );
  fireEvent.click(
    screen.getByRole('menuitem', {
      name: new RegExp(`fromWidth \\{"width":${width}\\}`),
    })
  );
};

describe('TypographyListItem screen sizes', () => {
  it('starts on the all screens tab', () => {
    renderItem();

    expect(tab('websiteSettings.theme.typography.baseline')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(
      screen.getByRole('tabpanel', {
        name: 'websiteSettings.theme.typography.baseline',
      })
    ).toBeInTheDocument();
  });

  it('adds an empty screen size and selects it', () => {
    renderItem();

    addScreenSize(900);

    expect(overrides()).toEqual({
      [mq.md]: { fontSize: null, lineHeight: null, letterSpacing: null },
    });
    expect(tab(/fromWidth \{"width":900\}/)).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('starts a re-added screen size empty instead of restoring its loaded values', () => {
    renderItem({ [mq.md]: { fontSize: '3rem' } });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(removeControl());
    addScreenSize(900);

    expect(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.fontSize',
      })
    ).not.toBeChecked();
    expect(override('md')?.fontSize ?? null).toBeNull();
  });

  it('adds a screen size in ascending order after the other values', () => {
    renderItem({ [mq.lg]: { fontSize: '4rem' } });

    addScreenSize(900);

    expect(trailingMediaQueries()).toEqual([mq.md, mq.lg]);
    expect(override('lg')).toEqual({ fontSize: '4rem' });
  });

  it('writes the fields of a screen size under its media query', () => {
    renderItem({ [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.fontSize',
      })
    );

    expect(form.getValues(`typography.h1.${mq.md}.fontSize` as never)).toBe(
      '2rem'
    );
    expect(override('md')).toEqual({ fontSize: '2rem' });
    expect(h1Values()).not.toHaveProperty('breakpoints');
  });

  it('names the screen size tabs after their breakpoint', () => {
    renderItem({ [mq.md]: {}, [mq.sm]: {} });

    expect(
      screen
        .getAllByRole('tab')
        .slice(1)
        .map(item => item.textContent)
    ).toEqual([
      'sm websiteSettings.theme.typography.fromWidth {"width":600}',
      'md websiteSettings.theme.typography.fromWidth {"width":900}',
    ]);
  });

  it('gives focus back to the add button when the menu is closed', async () => {
    renderItem();

    const add = screen.getByRole('button', {
      name: 'websiteSettings.theme.typography.addScreenSize',
    });

    fireEvent.click(add);
    fireEvent.keyDown(screen.getByRole('menu'), { key: 'Escape' });

    await waitFor(() => expect(add).toHaveFocus());
  });

  it('only offers the screen sizes that are not set yet', () => {
    renderItem({ [mq.sm]: {}, [mq.md]: {}, [mq.lg]: {} });

    fireEvent.click(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.typography.addScreenSize',
      })
    );

    expect(
      screen.getAllByRole('menuitem').map(item => item.textContent)
    ).toEqual(['xl websiteSettings.theme.typography.fromWidth {"width":1536}']);
  });

  it('cannot add a screen size when all of them are set', () => {
    renderItem({ [mq.sm]: {}, [mq.md]: {}, [mq.lg]: {}, [mq.xl]: {} });

    expect(
      screen.getByRole('button', {
        name: 'websiteSettings.theme.typography.addScreenSize',
      })
    ).toBeDisabled();
  });

  it('only shows size, line height and letter spacing for a screen size', () => {
    renderItem({ [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    const panel = screen.getByRole('tabpanel');

    expect(within(panel).getAllByRole('switch')).toHaveLength(3);
    expect(
      within(panel).queryByText('websiteSettings.theme.typography.fontFamily')
    ).not.toBeInTheDocument();
  });

  it('describes the inherited value and seeds it when overriding', () => {
    renderItem({ [mq.sm]: { fontSize: '2.5rem' }, [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    const fontSize = screen.getByRole('switch', {
      name: 'websiteSettings.theme.typography.fontSize',
    });

    expect(fontSize).not.toBeChecked();
    expect(fontSize).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromWidth {"value":"2.5rem","name":"sm","width":600}'
    );

    fireEvent.click(fontSize);

    expect(override('md')?.fontSize).toBe('2.5rem');

    fireEvent.click(fontSize);

    expect(override('md')?.fontSize).toBeNull();
  });

  it('falls back to the general line height', () => {
    renderItem({ [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    expect(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.lineHeight',
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromGeneral {"value":"1.4em"}'
    );
  });

  it('says what an override replaces while it is on', () => {
    renderItem({
      lineHeight: '1.2em',
      [mq.sm]: { fontSize: '2.5rem' },
      [mq.md]: {
        fontSize: '3rem',
        lineHeight: '1.1em',
        letterSpacing: '0.01em',
      },
    });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    const fontSize = screen.getByRole('switch', {
      name: 'websiteSettings.theme.typography.fontSize',
    });

    expect(fontSize).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromWidth {"value":"2.5rem","name":"sm","width":600}'
    );
    expect(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.lineHeight',
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromBaseline {"value":"1.2em"}'
    );
    expect(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.letterSpacing',
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromBrowser {"value":"0em"}'
    );

    fireEvent.click(fontSize);

    expect(fontSize).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromWidth {"value":"2.5rem","name":"sm","width":600}'
    );
  });

  it('says an override of the theme value replaces it', () => {
    renderItem({ fontSize: null, [mq.md]: { fontSize: '3rem' } });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    expect(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.fontSize',
      })
    ).toHaveAccessibleDescription(
      `websiteSettings.theme.typography.replacesFromTheme {"value":"${minimalTheme.typography.h1.fontSize}"}`
    );
  });

  it('only shows the remove control on the selected screen size', () => {
    renderItem({ [mq.md]: {}, [mq.xl]: {} });

    expect(screen.queryByTestId('remove-screen-size')).not.toBeInTheDocument();

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    expect(
      within(tab(/fromWidth \{"width":900\}/)).getByTestId('remove-screen-size')
    ).toHaveAttribute('aria-hidden', 'true');
  });

  it('removes a screen size and selects the previous one', () => {
    renderItem({ [mq.sm]: {}, [mq.md]: { fontSize: '3rem' }, [mq.xl]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(removeControl());

    expect(overrides()).toEqual({
      [mq.sm]: {},
      [mq.xl]: {},
    });
    expect(tab(/fromWidth \{"width":600\}/)).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(tab(/fromWidth \{"width":600\}/)).toHaveFocus();
  });

  it('goes back to the baseline when no smaller screen size is left', () => {
    renderItem({ [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(removeControl());

    expect(tab('websiteSettings.theme.typography.baseline')).toHaveAttribute(
      'aria-selected',
      'true'
    );
    expect(tab('websiteSettings.theme.typography.baseline')).toHaveFocus();
  });

  it('removes the focused screen size with the Delete key', () => {
    renderItem({ [mq.md]: {} });

    const md = tab(/fromWidth \{"width":900\}/);

    expect(md).toHaveAttribute('aria-keyshortcuts', 'Delete');
    expect(md).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.removeScreenSizeHint'
    );

    fireEvent.keyDown(md, { key: 'Delete' });

    expect(overrides()).toEqual({});
  });

  it('cannot remove the baseline', () => {
    renderItem({ [mq.md]: {} });

    const baseline = tab('websiteSettings.theme.typography.baseline');

    fireEvent.keyDown(baseline, { key: 'Delete' });

    expect(baseline).not.toHaveAttribute('aria-keyshortcuts');
    expect(overrides()).toEqual({ [mq.md]: {} });
  });

  it('offers to undo removing a screen size', () => {
    renderItem({ [mq.md]: { fontSize: '3rem' } });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(removeControl());

    expect(enqueueSnackbar).toHaveBeenCalledWith(
      'websiteSettings.theme.typography.screenSizeRemoved {"name":"md"}',
      expect.objectContaining({
        action: expect.objectContaining({
          label: 'websiteSettings.theme.typography.undo',
        }),
      })
    );

    act(() => {
      vi.mocked(enqueueSnackbar).mock.lastCall?.[1]?.action?.onClick();
    });

    expect(overrides()).toEqual({
      [mq.md]: { fontSize: '3rem' },
    });
    expect(tab(/fromWidth \{"width":900\}/)).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('restores an undone screen size in ascending order', () => {
    renderItem({ [mq.sm]: {}, [mq.md]: { fontSize: '3rem' }, [mq.xl]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(removeControl());

    expect(overrides()).toEqual({ [mq.sm]: {}, [mq.xl]: {} });

    act(() => {
      vi.mocked(enqueueSnackbar).mock.lastCall?.[1]?.action?.onClick();
    });

    expect(trailingMediaQueries()).toEqual([mq.sm, mq.md, mq.xl]);
    expect(override('md')).toEqual({ fontSize: '3rem' });
  });

  it('previews the values that apply at the selected screen size', () => {
    renderItem({ [mq.md]: { fontSize: '3rem' } });

    const preview = screen.getByText('websiteSettings.theme.typography.h1');

    expect(getComputedStyle(preview).fontSize).toBe('32px');

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    expect(getComputedStyle(preview).fontSize).toBe('48px');
  });

  it('falls back to the standard value of the theme when nothing is set', () => {
    renderItem({ fontSize: null, [mq.md]: {} });

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    const fontSize = screen.getByRole('switch', {
      name: 'websiteSettings.theme.typography.fontSize',
    });
    const standard = minimalTheme.typography.h1.fontSize;

    expect(fontSize).toHaveAccessibleDescription(
      `websiteSettings.theme.typography.inheritedFromTheme {"value":"${standard}"}`
    );

    fireEvent.click(fontSize);

    expect(override('md')?.fontSize).toBe(standard);
  });

  it('seeds an inherited value clamped to the range of the field', () => {
    renderItem(
      { [mq.md]: {} },
      { allVariants: { lineHeight: '4em', letterSpacing: null } }
    );

    fireEvent.click(tab(/fromWidth \{"width":900\}/));
    fireEvent.click(
      screen.getByRole('switch', {
        name: 'websiteSettings.theme.typography.lineHeight',
      })
    );

    expect(override('md')?.lineHeight).toBe('3em');
  });

  it('names the slider, number input and unit of a screen size field', () => {
    renderItem({ [mq.sm]: { fontSize: '2.5rem' } });

    fireEvent.click(tab(/fromWidth \{"width":600\}/));

    const name =
      'websiteSettings.theme.typography.fieldAtWidth {"label":"websiteSettings.theme.typography.fontSize","name":"sm","width":600}';

    expect(screen.getByRole('slider', { name })).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromBaseline {"value":"2rem"}'
    );
    expect(screen.getByRole('spinbutton', { name })).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', {
        name: `websiteSettings.theme.typography.unitOf {"label":"${name.replace(/"/g, '\\"')}"}`,
      })
    ).toBeInTheDocument();
  });

  it('announces the validation message of the font size', async () => {
    renderItem(
      { fontSize: '200rem' },
      {
        resolver: async () =>
          ({
            values: {},
            errors: {
              typography: {
                h1: { fontSize: { type: 'range', message: 'too big' } },
              },
            },
          }) as never,
      }
    );

    await act(() => form.handleSubmit(() => undefined)());

    expect(
      screen.getByRole('spinbutton', {
        name: 'websiteSettings.theme.typography.fontSize',
      })
    ).toHaveAccessibleDescription('too big');
  });

  it('marks a screen size with errors and opens it on submit', async () => {
    renderItem(
      { [mq.md]: { fontSize: '200px' } },
      {
        resolver: async values =>
          ({
            values: {},
            errors: {
              typography: {
                h1: {
                  [mq.md]: {
                    fontSize: { type: 'range', message: 'too big' },
                  },
                },
              },
            },
          }) as never,
      }
    );

    await act(() => form.handleSubmit(() => undefined)());

    const md = tab(/fromWidth \{"width":900\}/);

    expect(md).toHaveAccessibleName(
      /websiteSettings\.theme\.typography\.hasErrors/
    );
    expect(md).toHaveAttribute('aria-selected', 'true');
    await waitFor(() =>
      expect(
        within(screen.getByRole('tabpanel')).getAllByRole('spinbutton')[0]
      ).toHaveFocus()
    );
  });
});

describe('TypographyListItem row', () => {
  it('connects the row header to the region it expands', () => {
    renderItem();

    const header = screen.getByRole('button', { expanded: true });
    const region = screen.getByRole('region');

    expect(header).toHaveAttribute('aria-controls', region.id);
    expect(region).toHaveAttribute('aria-labelledby', header.id);
    expect(header.id).not.toBe(region.id);
  });

  it('marks a closed row as collapsed', () => {
    renderItem({}, { isOpen: false });

    expect(screen.getByRole('button', { expanded: false })).toHaveAttribute(
      'aria-controls'
    );
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('previews a closed row in its own style', () => {
    renderItem(
      {
        fontWeight: 700,
        lineHeight: '40px',
        textTransform: 'uppercase',
        fontStyle: 'italic',
      },
      {
        isOpen: false,
        allVariants: {
          fontFamily: "'Fraunces', serif",
          lineHeight: '1.4em',
          letterSpacing: '1px',
        },
      }
    );

    const style = getComputedStyle(
      screen.getByText('websiteSettings.theme.typography.h1')
    );

    expect(style.fontSize).toBe('32px');
    expect(style.fontWeight).toBe('700');
    expect(style.lineHeight).toBe('40px');
    expect(style.letterSpacing).toBe('1px');
    expect(style.textTransform).toBe('uppercase');
    expect(style.fontStyle).toBe('italic');
    expect(style.fontFamily).toMatch(/^'?Fraunces'?, serif$/);
  });

  it('uses the weight of the theme variant before the weight of the base', () => {
    renderItem(
      {},
      { isOpen: false, allVariants: { fontWeight: 300, lineHeight: null } }
    );

    expect(
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'))
        .fontWeight
    ).toBe('600');
  });

  it('summarises the values the row inherits', () => {
    renderItem(
      { fontSize: null },
      {
        isOpen: false,
        allVariants: { fontFamily: '"Inter", sans-serif', lineHeight: '1.6em' },
      }
    );

    expect(
      screen.getByText(
        `Inter · ${minimalTheme.typography.h1.fontSize} · websiteSettings.theme.typography.fontWeightSemiBold · 1.6em`
      )
    ).toBeInTheDocument();
  });

  it('summarises the values of the row', () => {
    renderItem(
      { fontSize: '3rem', fontWeight: 700, lineHeight: '1.06em' },
      { isOpen: false }
    );

    expect(
      screen.getByText(
        '3rem · websiteSettings.theme.typography.fontWeightBold · 1.06em'
      )
    ).toBeInTheDocument();
  });

  it('updates the summary while editing', () => {
    renderItem({}, { isOpen: false });

    act(() => form.setValue('typography.h1.fontSize', '4rem'));

    expect(
      screen.getByText(
        '4rem · websiteSettings.theme.typography.fontWeightSemiBold · 1.4em'
      )
    ).toBeInTheDocument();
  });

  it('tells which screen sizes have their own values', () => {
    renderItem(
      {
        [mq.sm]: {},
        [mq.lg]: { lineHeight: '1.2em' },
        [mq.md]: { fontSize: '3rem' },
      },
      { isOpen: false }
    );

    const header = screen.getByRole('button', { expanded: false });

    const names = [
      'websiteSettings.theme.typography.screenSizeName {"name":"md","width":900}',
      'websiteSettings.theme.typography.screenSizeName {"name":"lg","width":1333}',
    ].join(', ');

    expect(header).toHaveAccessibleName(
      expect.stringContaining(
        `websiteSettings.theme.typography.screenSizeOverrides ${JSON.stringify({ names })}`
      )
    );
    expect(
      within(header).getByText('md').closest('.MuiChip-root')
    ).toHaveAttribute(
      'title',
      'websiteSettings.theme.typography.fromWidth {"width":900}'
    );
    expect(within(header).getByText('lg')).toBeInTheDocument();
    expect(within(header).queryByText('sm')).not.toBeInTheDocument();
  });

  it('shows no screen size note without overrides', () => {
    renderItem({ [mq.md]: {} }, { isOpen: false });

    expect(screen.queryByText(/screenSizeOverrides/)).not.toBeInTheDocument();
  });

  it('describes what line height and letter spacing inherit on all screens', () => {
    renderItem(
      {},
      { allVariants: { lineHeight: '1.4em', letterSpacing: '0.01em' } }
    );

    expect(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.lineHeight/,
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromGeneral {"value":"1.4em"}'
    );
    expect(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.letterSpacing/,
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromGeneral {"value":"0.01em"}'
    );
  });

  it('says what the all screens line height and letter spacing replace', () => {
    renderItem({ lineHeight: '1.2em', letterSpacing: '0.02em' });

    expect(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.lineHeight/,
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromGeneral {"value":"1.4em"}'
    );
    expect(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.letterSpacing/,
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.replacesFromBrowser {"value":"0em"}'
    );
  });

  it('inherits the 0 letter spacing of the browser when nothing sets one', () => {
    renderItem({}, { allVariants: { lineHeight: null, letterSpacing: null } });

    const letterSpacing = screen.getByRole('switch', {
      name: /^websiteSettings\.theme\.typography\.letterSpacing/,
    });

    expect(letterSpacing).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromBrowser {"value":"0em"}'
    );

    fireEvent.click(letterSpacing);

    expect(form.getValues('typography.h1.letterSpacing')).toBe('0em');
  });

  it('falls back to the theme on all screens when the base sets nothing', () => {
    renderItem({}, { allVariants: { lineHeight: null, letterSpacing: null } });

    expect(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.lineHeight/,
      })
    ).toHaveAccessibleDescription(
      'websiteSettings.theme.typography.inheritedFromTheme {"value":"1.15em"}'
    );
  });

  it('seeds the all screens line height with the inherited value', () => {
    renderItem({}, { allVariants: { lineHeight: null, letterSpacing: null } });

    fireEvent.click(
      screen.getByRole('switch', {
        name: /^websiteSettings\.theme\.typography\.lineHeight/,
      })
    );

    expect(form.getValues('typography.h1.lineHeight')).toBe('1.15em');
  });

  it.each(['lineHeight', 'letterSpacing'])(
    'keeps the info button out of the label of the %s switch',
    property => {
      renderItem();

      const toggle = screen.getByRole('switch', {
        name: `websiteSettings.theme.typography.${property}`,
      });

      expect(toggle.closest('label')).not.toBeNull();
      expect(toggle.closest('label')?.querySelector('button')).toBeNull();
      expect(
        screen.getAllByRole('button', {
          name: 'websiteSettings.theme.typography.overrideInfo',
        })
      ).toHaveLength(2);
    }
  );

  it.each(['fontSize', 'lineHeight'])(
    'names the slider, number input and unit of the %s on all screens',
    property => {
      renderItem({ lineHeight: '1.2em' });

      const name = `websiteSettings.theme.typography.${property}`;

      expect(screen.getByRole('slider', { name })).toBeInTheDocument();
      expect(screen.getByRole('spinbutton', { name })).toBeInTheDocument();
      expect(
        screen.getByRole('combobox', {
          name: `websiteSettings.theme.typography.unitOf {"label":"${name}"}`,
        })
      ).toBeInTheDocument();
    }
  );

  it.each(['fontFamily', 'fontWeight', 'textTransform'])(
    'names the %s select after its label',
    property => {
      renderItem();

      expect(
        screen.getByRole('combobox', {
          name: `websiteSettings.theme.typography.${property}`,
        })
      ).toBeInTheDocument();
    }
  );

  it('nests the fields of an open row in proper lists', () => {
    const { container } = renderItem({ [mq.md]: {} });

    expect(listItemsOutsideList(container)).toEqual([]);

    fireEvent.click(tab(/fromWidth \{"width":900\}/));

    expect(listItemsOutsideList(container)).toEqual([]);
  });

  it('keeps a closed row plain when the side preview shows the styles', () => {
    renderItem({}, { isOpen: false, compact: true });

    expect(
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'))
        .fontSize
    ).not.toBe('32px');
  });

  it('still previews the open row when the side preview shows the styles', () => {
    renderItem({}, { compact: true });

    expect(
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'))
        .fontSize
    ).toBe('32px');
  });
});

describe('TypographyListItem motion', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('animates the preview by default', () => {
    stubReducedMotion(false);
    renderItem({}, { isOpen: false });

    expect(
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'))
        .transition
    ).not.toBe('');
  });

  const renderToggle = (compact: boolean, h1: Record<string, unknown> = {}) => {
    const tree = (isOpen: boolean) => (
      <Wrapper
        defaultValues={{
          typography: {
            allVariants: { lineHeight: '1.4em', letterSpacing: null },
            h1: { fontSize: '2rem', lineHeight: null, ...h1 },
          },
        }}
      >
        <ul>
          <TypographyListItem
            name="typography.h1"
            parentName="typography"
            isOpen={isOpen}
            compact={compact}
            onOpen={() => undefined}
          />
        </ul>
      </Wrapper>
    );
    const result = render(tree(true));

    return { ...result, close: () => result.rerender(tree(false)) };
  };

  it('animates a row on the side preview layout back to plain text when it closes', () => {
    stubReducedMotion(false);
    const { close } = renderToggle(true);

    close();

    const label = getComputedStyle(
      screen.getByText('websiteSettings.theme.typography.h1')
    );

    expect(label.fontSize).toBe('16px');
    expect(label.transition).toContain('250ms');
  });

  it('keeps the typeface of a closing row until it has finished closing', async () => {
    stubReducedMotion(false);
    const { close, container } = renderToggle(true, {
      fontFamily: '"Fraunces", serif',
      textTransform: 'uppercase',
    });
    const row = container.querySelector('li') as HTMLElement;
    const label = () =>
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'));

    close();

    expect(label().fontFamily).toContain('Fraunces');
    expect(label().textTransform).toBe('uppercase');
    expect(label().fontSize).toBe('16px');

    await waitFor(() =>
      expect(getComputedStyle(row).borderColor).toBe('transparent')
    );
    expect(label().fontFamily).not.toContain('Fraunces');
    expect(label().textTransform).toBe('none');
  });

  it('keeps the row framed until it has finished closing', async () => {
    stubReducedMotion(false);
    const { close, container } = renderToggle(false);
    const row = container.querySelector('li') as HTMLElement;

    close();

    expect(getComputedStyle(row).borderColor).not.toBe('transparent');
    await waitFor(() =>
      expect(getComputedStyle(row).borderColor).toBe('transparent')
    );
  });

  it('does not animate the preview when reduced motion is preferred', () => {
    stubReducedMotion(true);
    renderItem({}, { isOpen: false });

    expect(
      getComputedStyle(screen.getByText('websiteSettings.theme.typography.h1'))
        .transition
    ).toBe('');
  });
});
