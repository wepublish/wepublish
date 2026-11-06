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
import {
  autocompleteOf,
  formHeader,
  formSectionOf,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import i18n from 'i18next';

import { initI18N } from '../../i18n';
import { loadGoogleFont } from './google-fonts';
import { WebsiteFonts } from './website-fonts';

vi.mock('./google-fonts', async importOriginal => ({
  ...(await importOriginal<typeof import('./google-fonts')>()),
  loadGoogleFont: vi.fn(),
}));

type User = ReturnType<typeof renderFonts>['user'];

const roboto: WebsiteRemoteFontInput = {
  name: 'Roboto',
  weight: [FontWeight.Regular, FontWeight.Bold],
  style: [FontStyle.Normal],
};

const custom: WebsiteRemoteFontInput = {
  name: 'Not On Google',
  weight: [FontWeight.Variable],
  style: [FontStyle.Normal, FontStyle.Italic],
};

const stored = [roboto, custom];

const lato: WebsiteRemoteFontInput = {
  name: 'Lato',
  weight: [
    FontWeight.Thin,
    FontWeight.Light,
    FontWeight.Regular,
    FontWeight.Bold,
    FontWeight.Black,
  ],
  style: [FontStyle.Normal, FontStyle.Italic],
};

const off = {
  __typename: 'KeyEnabled' as const,
  enabled: false,
  key: null,
};

const websiteSettings = (
  fonts: WebsiteRemoteFontInput[]
): WebsiteSettingsQuery['websiteSettings'] => ({
  __typename: 'WebsiteSettings',
  theme: {},
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
  fonts: WebsiteRemoteFontInput[] = stored,
  delay?: number
): MockedResponse => ({
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: {
    data: { __typename: 'Query', websiteSettings: websiteSettings(fonts) },
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
      { errors: [{ message: 'Font settings are locked' }] }
    : {
        data: {
          __typename: 'Mutation',
          updateWebsiteSettings: websiteSettings(
            (variables.fonts ?? []) as WebsiteRemoteFontInput[]
          ),
        },
      },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const fontsPath = '/settings/website/fonts';

const renderFonts = (mocks: MockedResponse[] = [settingsQuery()]) =>
  renderFormRoutes(
    { [fontsPath]: <WebsiteFonts /> },
    { route: fontsPath, mocks }
  );

const pickers = () =>
  screen.queryAllByRole<HTMLInputElement>('combobox', { name: 'Font*' });

const loaded = () =>
  waitFor(() => expect(pickers()[0]).toHaveValue('Roboto'));

const save = () => screen.getByRole('button', { name: 'Save' });

const confirmed = () => screen.findByText('Updated successfully');

const addFont = () => screen.getByRole('button', { name: 'Add Font' });

const removeFont = (position: number) =>
  screen.getByRole('button', { name: `Remove entry ${position}` });

const required = 'This field is required';

const errorSummary = () =>
  screen.queryByText('Please fix these entries before saving');

const back = () => screen.getByRole('link', { name: 'Back' });

const discard = () => screen.getByRole('button', { name: 'Discard changes' });

const pickFont = async (user: User, input: HTMLElement, family: string) => {
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: family } });
  await user.click(await screen.findByRole('option', { name: family }));
};

const clearFont = (user: User, input: HTMLElement) => {
  fireEvent.focus(input);

  return user.click(
    within(autocompleteOf(input)).getByRole('button', {
      name: 'Clear',
      hidden: true,
    })
  );
};

beforeAll(async () => {
  initI18N();
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  saved.length = 0;
});

describe('WebsiteFonts', () => {
  it('shows the header and a progress indicator but no fonts while the settings load', async () => {
    renderFonts([settingsQuery(stored, 50)]);

    expect(
      screen.getByRole('progressbar', { name: 'Loading …' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Fonts' })
    ).toBeInTheDocument();
    expect(pickers()).toHaveLength(0);
    expect(save()).toBeDisabled();

    await loaded();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders a Google Fonts section with the hint and one picker per stored font', async () => {
    renderFonts();
    await loaded();

    expect(
      screen.getAllByRole('heading', { level: 2 }).map(item => item.textContent)
    ).toEqual(['Google Fonts']);
    expect(
      formSectionOf('Google Fonts').getByRole('group', { name: 'Fonts' })
    ).toHaveAccessibleDescription(
      /^Uses Google Fonts ?\. The best way to look for an ideal font is directly there\.$/
    );
    expect(screen.getByRole('link', { name: 'Google Fonts' })).toHaveAttribute(
      'href',
      'https://fonts.google.com/'
    );
    expect(screen.getByRole('link', { name: 'Google Fonts' })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(pickers().map(input => input.value)).toEqual([
      'Roboto',
      'Not On Google',
    ]);
    expect(pickers()[0]).toHaveAttribute(
      'placeholder',
      'Search Google Fonts …'
    );
  });

  it('previews each font in its own typeface', async () => {
    const { user } = renderFonts();
    await loaded();

    expect(loadGoogleFont).toHaveBeenCalledWith('Roboto');
    expect(loadGoogleFont).not.toHaveBeenCalledWith('Not On Google');
    expect(pickers()[0]).toHaveStyle({ fontFamily: 'Roboto' });

    await pickFont(user, pickers()[1], 'Lato');

    expect(loadGoogleFont).toHaveBeenCalledWith('Lato');
    expect(pickers()[1]).toHaveStyle({ fontFamily: 'Lato' });
  });

  it('saves the loaded fonts unchanged, without type names, and confirms it', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(removeFont(2));
    await user.click(addFont());
    await pickFont(user, pickers()[1], 'Lato');
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({ fonts: [roboto, lato] });
  });

  it('stores the weights and styles Google offers for a picked font', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await pickFont(user, pickers()[0], 'Lato');
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({ fonts: [lato, custom] });
  });

  it('adds a font', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(addFont());

    expect(pickers()).toHaveLength(3);
    expect(pickers()[2]).toHaveValue('');

    await pickFont(user, pickers()[2], 'Inter');
    await user.click(save());

    await confirmed();
    expect(saved[0]).toStrictEqual({
      fonts: [
        ...stored,
        {
          name: 'Inter',
          weight: [
            FontWeight.Thin,
            FontWeight.ExtraLight,
            FontWeight.Light,
            FontWeight.Regular,
            FontWeight.Medium,
            FontWeight.SemiBold,
            FontWeight.Bold,
            FontWeight.ExtraBold,
            FontWeight.Black,
          ],
          style: [FontStyle.Normal, FontStyle.Italic],
        },
      ],
    });
  });

  it('removes a font', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(removeFont(1));

    expect(pickers()).toHaveLength(1);

    await user.click(save());

    await confirmed();
    expect(saved[0]).toStrictEqual({ fonts: [custom] });
  });

  it('saves an empty font list', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(removeFont(2));
    await user.click(removeFont(1));

    expect(screen.getByText('No entries yet')).toBeInTheDocument();

    await user.click(save());

    await confirmed();
    expect(saved[0]).toStrictEqual({ fonts: [] });
  });

  it('requires a font in an added row instead of saving it without a name', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(addFont());
    await user.click(save());

    expect(await screen.findByText(required)).toBeInTheDocument();
    expect(pickers()[2]).toHaveAccessibleDescription(required);
    expect(pickers()[2]).toHaveAttribute('aria-invalid', 'true');
    expect(errorSummary()).not.toBeInTheDocument();
    expect(saved).toEqual([]);

    await pickFont(user, pickers()[2], 'Lato');

    await waitFor(() =>
      expect(screen.queryByText(required)).not.toBeInTheDocument()
    );

    await user.click(save());

    await confirmed();
    expect(saved[0]).toStrictEqual({ fonts: [...stored, lato] });
  });

  it('requires a font in a cleared row instead of dropping it', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation()]);
    await loaded();

    await clearFont(user, pickers()[0]);
    await user.click(save());

    expect(await screen.findByText(required)).toBeInTheDocument();
    expect(pickers()[0]).toHaveAccessibleDescription(required);
    expect(saved).toEqual([]);

    await pickFont(user, pickers()[0], 'Lato');

    await waitFor(() =>
      expect(screen.queryByText(required)).not.toBeInTheDocument()
    );
  });

  it('shows the server error as a notification and an inline alert and keeps the fonts', async () => {
    const { user } = renderFonts([settingsQuery(), updateMutation('error')]);
    await loaded();

    await user.click(removeFont(2));
    await user.click(save());

    expect(
      await screen.findByText('Font settings are locked')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Saving failed. Please try again.', {
        selector: '.MuiAlert-message',
      })
    ).toBeInTheDocument();
    expect(pickers().map(input => input.value)).toEqual(['Roboto']);
    expect(discard()).toBeEnabled();
  });

  it('keeps the header with a link back to the overview', async () => {
    const { user, currentPath } = renderFonts();
    await loaded();

    const header = formHeader();

    expect(header.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/settings/website'
    );
    expect(
      header.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['Discard changes', 'Save']);

    await user.click(back());

    expect(currentPath()).toBe('/settings/website');
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderFonts();
    await loaded();

    await user.click(removeFont(1));
    await user.click(back());

    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe(fontsPath);

    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(currentPath()).toBe('/settings/website');
    expect(saved).toEqual([]);
  });

  it('discards the changes back to the loaded fonts', async () => {
    const { user } = renderFonts();
    await loaded();

    expect(discard()).toBeDisabled();

    await user.click(removeFont(1));
    await user.click(addFont());

    expect(discard()).toBeEnabled();

    await user.click(discard());

    expect(pickers().map(input => input.value)).toEqual([
      'Roboto',
      'Not On Google',
    ]);
    await waitFor(() => expect(discard()).toBeDisabled());
    expect(saved).toEqual([]);
  });

  it('reports a failed load instead of showing the fonts and loads again on retry', async () => {
    const { user } = renderFonts([
      {
        request: { query: WebsiteSettingsDocument, variables: {} },
        error: new Error('Settings service unavailable'),
      },
      settingsQuery(),
    ]);

    expect(
      await screen.findByText('The data could not be loaded')
    ).toBeInTheDocument();
    expect(pickers()).toHaveLength(0);
    expect(save()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await loaded();
  });
});
