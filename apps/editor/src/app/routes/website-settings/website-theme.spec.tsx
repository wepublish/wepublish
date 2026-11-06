import '@testing-library/jest-dom/vitest';

import type { MockedResponse } from '@apollo/client/testing';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import {
  type UpdateWebsiteSettingsMutation,
  type UpdateWebsiteSettingsMutationVariables,
  type WebsiteRemoteFontInput,
  type WebsiteSettingsQuery,
  FontStyle,
  FontWeight,
  UpdateWebsiteSettingsDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import { formHeader, renderFormRoutes } from '@wepublish/form/editor/testing';
import i18n from 'i18next';

import { initI18N } from '../../i18n';
import { downloadJson } from './theme/download-json';
import { mediaQuery } from './theme/typography-breakpoints';
import { WebsiteTheme } from './website-theme';

vi.mock('./theme/download-json', () => ({ downloadJson: vi.fn() }));

type User = ReturnType<typeof renderTheme>['user'];

const roboto: WebsiteRemoteFontInput = {
  name: 'Roboto',
  weight: [FontWeight.Regular, FontWeight.Bold],
  style: [FontStyle.Normal],
};

const unused: WebsiteRemoteFontInput = {
  name: 'Not Used',
  weight: [FontWeight.Regular],
  style: [FontStyle.Normal],
};

const lato: WebsiteRemoteFontInput = {
  name: 'Lato',
  weight: [FontWeight.Regular],
  style: [FontStyle.Italic],
};

const off = {
  __typename: 'KeyEnabled' as const,
  enabled: false,
  key: null,
};

const storedTheme = {
  palette: { primary: { main: '#111111' } },
  typography: { h1: { fontFamily: '"Roboto", Helvetica, Arial, sans-serif' } },
};

const websiteSettings = (
  theme: object,
  fonts: WebsiteRemoteFontInput[]
): WebsiteSettingsQuery['websiteSettings'] => ({
  __typename: 'WebsiteSettings',
  theme,
  analytics: {
    __typename: 'WebsiteAnalytics',
    googleAnalytics: off,
    googleTagManager: off,
    plausible: off,
    piwik: off,
  },
  mail: { __typename: 'WebsiteMail', mailchimp: null },
  ads: { __typename: 'WebsiteAds', sparkLoop: off },
  fonts: fonts.map(font => ({ __typename: 'WebsiteRemoteFont', ...font })),
});

const settingsQuery = (
  theme: object = storedTheme,
  fonts: WebsiteRemoteFontInput[] = [roboto, unused],
  delay?: number
): MockedResponse => ({
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: {
    data: {
      __typename: 'Query',
      websiteSettings: websiteSettings(theme, fonts),
    },
  },
  delay,
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const saved: UpdateWebsiteSettingsMutationVariables[] = [];

const updateMutation = (
  outcome: 'ok' | 'error' = 'ok'
): MockedResponse<
  UpdateWebsiteSettingsMutation,
  UpdateWebsiteSettingsMutationVariables
> => ({
  request: {
    query: UpdateWebsiteSettingsDocument,
    variables: variables => {
      saved.push(variables);

      return true;
    },
  },
  result: variables =>
    outcome === 'error' ?
      { errors: [{ message: 'Theme settings are locked' }] }
    : {
        data: {
          __typename: 'Mutation',
          updateWebsiteSettings: websiteSettings(
            variables.theme ?? {},
            (variables.fonts ?? [roboto, unused]) as WebsiteRemoteFontInput[]
          ),
        },
      },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const themePath = '/settings/website/theme';

const renderTheme = (
  mocks: MockedResponse[] = [settingsQuery(), updateMutation()]
) =>
  renderFormRoutes(
    { [themePath]: <WebsiteTheme /> },
    { route: themePath, mocks }
  );

const save = () => screen.getByRole('button', { name: 'Save' });

const discard = () => screen.getByRole('button', { name: 'Discard changes' });

const errorSummary = () =>
  screen.queryByText('Please fix these entries before saving');

const colorField = (label: string) =>
  screen.getByRole<HTMLInputElement>('textbox', { name: label });

const loaded = async (user: User) => {
  await user.click(await screen.findByRole('button', { name: /^Primary/ }));
  await waitFor(() => expect(colorField('Main')).toHaveValue('#111111'));
};

const changeColor = (label: string, value: string) => {
  const field = colorField(label);

  fireEvent.change(field, { target: { value } });
  fireEvent.blur(field);
};

const fileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

const importFile = (user: User, content: unknown) =>
  user.upload(
    fileInput(),
    new File([JSON.stringify(content)], 'theme.json', {
      type: 'application/json',
    })
  );

type SavedTheme = {
  palette: Record<string, Record<string, unknown>>;
  typography: Record<string, Record<string, unknown>>;
};

const savedTheme = (index = 0) => saved[index].theme as SavedTheme;

beforeAll(async () => {
  initI18N();
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  saved.length = 0;
  vi.mocked(downloadJson).mockReset();
});

describe('WebsiteTheme', () => {
  it('saves the palette and typography as the theme, without touching the fonts', async () => {
    const { user } = renderTheme();
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(save());

    await screen.findByText('Updated successfully');
    expect(saved).toHaveLength(1);
    expect(Object.keys(savedTheme())).toEqual(['palette', 'typography']);
    expect(savedTheme().palette['primary']).toMatchObject({ main: '#123456' });
    expect(savedTheme().typography['h1']).toMatchObject({
      fontFamily: '"Roboto", Helvetica, Arial, sans-serif',
    });
    expect(saved[0].fonts).toBeUndefined();
  });

  it('loads and saves per-breakpoint typography as media queries of the theme', async () => {
    const md = '@media (min-width:900px)';
    const { user } = renderTheme([
      settingsQuery({
        ...storedTheme,
        typography: { h1: { fontSize: '2rem', [md]: { fontSize: '3rem' } } },
      }),
      updateMutation(),
    ]);
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(1));

    const { h1 } = savedTheme().typography;

    expect(h1).toMatchObject({ fontSize: '2rem', [md]: { fontSize: '3rem' } });
    expect(h1).not.toHaveProperty('breakpoints');
  });

  it('saves the typography of the form unchanged, media queries smallest first', async () => {
    const md = mediaQuery('md');
    const lg = mediaQuery('lg');
    const { user } = renderTheme([
      settingsQuery({
        ...storedTheme,
        typography: {
          h2: {
            [lg]: { fontSize: '4rem' },
            fontSize: '2rem',
            [md]: { fontSize: null },
          },
        },
      }),
      updateMutation(),
    ]);
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(1));

    const { h2 } = savedTheme().typography;
    const keys = Object.keys(h2);
    const mediaKeys = keys.filter(key => key.startsWith('@media'));

    expect(h2).toMatchObject({
      fontSize: '2rem',
      [md]: { fontSize: null },
      [lg]: { fontSize: '4rem' },
    });
    expect(h2).not.toHaveProperty('breakpoints');
    expect(mediaKeys).toEqual([md, lg]);
    expect(keys.slice(-mediaKeys.length)).toEqual(mediaKeys);
  });

  it('shows an invalid colour at the field and saves nothing', async () => {
    const { user } = renderTheme();
    await loaded(user);

    changeColor('Main', 'nope');
    await user.click(save());

    expect(
      await screen.findAllByText(/^Invalid color format\./)
    ).toHaveLength(2);
    expect(errorSummary()).toBeInTheDocument();
    expect(saved).toEqual([]);
  });

  it('names the allowed range of a length that is out of range', async () => {
    const { user } = renderTheme([
      settingsQuery({
        ...storedTheme,
        typography: { h1: { fontSize: '100em' } },
      }),
      updateMutation(),
    ]);
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(save());

    expect(
      await screen.findByText('Value must be between 0.5em and 6.5em.')
    ).toBeInTheDocument();
    expect(saved).toEqual([]);
  });

  it('keeps Save and Discard disabled until something changes', async () => {
    const { user } = renderTheme();
    await loaded(user);

    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();

    changeColor('Main', '#123456');

    await waitFor(() => expect(save()).toBeEnabled());
    expect(discard()).toBeEnabled();
  });

  it('shows the header and a progress indicator but no tabs while the theme loads', async () => {
    const { user } = renderTheme([
      settingsQuery(storedTheme, [roboto, unused], 50),
    ]);

    expect(
      screen.getByRole('progressbar', { name: 'Loading …' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Theme' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(save()).toBeDisabled();

    await loaded(user);
  });

  it('shows the server error as a notification and an inline alert and keeps the changes', async () => {
    const { user } = renderTheme([settingsQuery(), updateMutation('error')]);
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(save());

    expect(
      await screen.findByText('Theme settings are locked')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Saving failed. Please try again.', {
        selector: '.MuiAlert-message',
      })
    ).toBeInTheDocument();
    expect(colorField('Main')).toHaveValue('#123456');
    expect(discard()).toBeEnabled();
  });

  it('saves an imported theme together with the fonts it brings', async () => {
    const { user } = renderTheme();
    await loaded(user);

    await importFile(user, {
      version: 1,
      theme: { palette: { primary: { main: '#abcdef' } }, typography: {} },
      fonts: [lato],
    });

    expect(
      await screen.findByText('Theme imported. Click «Save» to persist.')
    ).toBeInTheDocument();
    await waitFor(() => expect(colorField('Main')).toHaveValue('#abcdef'));

    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(savedTheme().palette['primary']).toMatchObject({ main: '#abcdef' });
    expect(saved[0].fonts).toEqual([roboto, unused, lato]);

    await screen.findByText('Updated successfully');
    changeColor('Main', '#123456');
    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(2));
    expect(saved[1].fonts).toBeUndefined();
  });

  it('saves the fonts of an import even when the theme stays the same', async () => {
    const { user } = renderTheme();
    await loaded(user);

    await importFile(user, {
      version: 1,
      theme: storedTheme,
      fonts: [lato],
    });

    await screen.findByText('Theme imported. Click «Save» to persist.');
    await waitFor(() => expect(save()).toBeEnabled());
    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].fonts).toEqual([roboto, unused, lato]);
  });

  it('forgets the imported fonts when the import is discarded', async () => {
    const { user } = renderTheme();
    await loaded(user);

    await importFile(user, {
      version: 1,
      theme: { palette: { primary: { main: '#abcdef' } }, typography: {} },
      fonts: [lato],
    });
    await waitFor(() => expect(colorField('Main')).toHaveValue('#abcdef'));

    await user.click(discard());

    await waitFor(() => expect(colorField('Main')).toHaveValue('#111111'));

    changeColor('Main', '#123456');
    await user.click(save());

    await waitFor(() => expect(saved).toHaveLength(1));
    expect(saved[0].fonts).toBeUndefined();
  });

  it('reports a file that is not a theme', async () => {
    const { user } = renderTheme();
    await loaded(user);

    await importFile(user, ['not', 'a', 'theme']);

    expect(
      await screen.findByText('The theme file could not be read.')
    ).toBeInTheDocument();
    expect(colorField('Main')).toHaveValue('#111111');
  });

  it('exports the theme with the website fonts it uses', async () => {
    const { user } = renderTheme();
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(screen.getByRole('button', { name: 'Export theme' }));

    await waitFor(() => expect(downloadJson).toHaveBeenCalledTimes(1));

    const [file, name] = vi.mocked(downloadJson).mock.calls[0] as [
      { version: number; theme: SavedTheme; fonts: unknown },
      string,
    ];

    expect(name).toBe('website-theme.json');
    expect(file.version).toBe(1);
    expect(Object.keys(file.theme)).toEqual(['palette', 'typography']);
    expect(file.theme.palette['primary']).toMatchObject({ main: '#123456' });
    expect(file.fonts).toEqual([roboto]);
    expect(saved).toEqual([]);
  });

  it('does not export an invalid theme', async () => {
    const { user } = renderTheme();
    await loaded(user);

    changeColor('Main', 'nope');
    await user.click(screen.getByRole('button', { name: 'Export theme' }));

    expect(
      await screen.findAllByText(/^Invalid color format\./)
    ).not.toHaveLength(0);
    expect(downloadJson).not.toHaveBeenCalled();
  });

  it('says which settings page this is', async () => {
    renderTheme();

    expect(
      await screen.findByRole('heading', { level: 1, name: 'Theme' })
    ).toBeInTheDocument();
  });

  it('keeps saving, exporting and importing together in the header', async () => {
    const { user, currentPath } = renderTheme();
    await loaded(user);

    const header = formHeader();

    expect(header.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/settings/website'
    );
    expect(
      header.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['Import theme', 'Export theme', 'Discard changes', 'Save']);

    await user.click(header.getByRole('link', { name: 'Back' }));

    expect(currentPath()).toBe('/settings/website');
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderTheme();
    await loaded(user);

    changeColor('Main', '#123456');
    await user.click(screen.getByRole('link', { name: 'Back' }));

    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe(themePath);
  });
});

const stubMediaQueries = ({
  wide,
  reducedMotion = false,
}: {
  wide: boolean;
  reducedMotion?: boolean;
}) =>
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches:
        query.includes('min-width:1200px') ? wide
        : query.includes('prefers-reduced-motion: reduce') ? reducedMotion
        : false,
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }))
  );

const openTypographyTab = async () =>
  fireEvent.click(await screen.findByRole('tab', { name: 'Typography' }));

const preview = () => screen.getByRole('complementary', { name: 'Preview' });

describe('WebsiteTheme layout', () => {
  const scrollIntoView = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps the palette tab at 500px', async () => {
    renderTheme();

    await screen.findByRole('tab', { name: 'Palette' });
    expect(screen.getByRole('tabpanel')).toHaveStyle({ maxWidth: '500px' });
  });

  it('lets the typography tab use the full width', async () => {
    renderTheme();
    await openTypographyTab();

    expect(screen.getByRole('tabpanel')).not.toHaveStyle({ maxWidth: '500px' });
  });

  it('shows no separate preview on narrow screens', async () => {
    stubMediaQueries({ wide: false });
    renderTheme();
    await openTypographyTab();

    expect(
      screen.queryByRole('complementary', { name: 'Preview' })
    ).not.toBeInTheDocument();
  });

  it('opens a style from the preview on wide screens and moves focus to it', async () => {
    stubMediaQueries({ wide: true });
    renderTheme();
    await openTypographyTab();

    fireEvent.click(
      within(await waitFor(preview)).getByRole('button', { name: 'Heading 3' })
    );

    const header = screen.getByRole('button', {
      name: /^Heading 3/,
      expanded: true,
    });

    await waitFor(() => expect(header).toHaveFocus());
    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'smooth' })
      )
    );

    fireEvent.click(
      within(preview()).getByRole('button', { name: 'Heading 3' })
    );

    expect(header).toHaveAttribute('aria-expanded', 'true');
  });

  it('scrolls to a style from the preview only after the rows stopped moving', async () => {
    stubMediaQueries({ wide: true });
    renderTheme();
    await openTypographyTab();

    fireEvent.click(
      await screen.findByRole('button', { name: /^Heading 1/, expanded: false })
    );

    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /^Heading 1/, expanded: true })
      ).toBeInTheDocument()
    );

    fireEvent.click(
      within(preview()).getByRole('button', { name: 'Block Quote' })
    );

    const header = screen.getByRole('button', {
      name: /^Block Quote/,
      expanded: true,
    });

    expect(header).toHaveFocus();
    expect(scrollIntoView).not.toHaveBeenCalled();

    await waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
    expect(scrollIntoView.mock.contexts[0]).toBe(header);
  });

  it('marks the open style in the preview', async () => {
    stubMediaQueries({ wide: true });
    renderTheme();
    await openTypographyTab();

    fireEvent.click(
      await screen.findByRole('button', { name: /^Heading 2/, expanded: false })
    );

    expect(
      within(preview()).getByRole('button', { name: 'Heading 2' })
    ).toHaveAttribute('aria-current', 'true');
    expect(
      within(preview()).getByRole('button', { name: 'Heading 1' })
    ).not.toHaveAttribute('aria-current');
  });

  it('jumps without animation when reduced motion is preferred', async () => {
    stubMediaQueries({ wide: true, reducedMotion: true });
    renderTheme();
    await openTypographyTab();

    fireEvent.click(
      within(await waitFor(preview)).getByRole('button', { name: 'Body 1' })
    );

    await waitFor(() =>
      expect(scrollIntoView).toHaveBeenCalledWith(
        expect.objectContaining({ behavior: 'auto' })
      )
    );
  });
});
