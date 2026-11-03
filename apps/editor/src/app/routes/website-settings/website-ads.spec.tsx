import '@testing-library/jest-dom/vitest';

import type { MockedResponse } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import {
  type UpdateWebsiteSettingsMutation,
  type UpdateWebsiteSettingsMutationVariables,
  type WebsiteSettingsQuery,
  UpdateWebsiteSettingsDocument,
  WebsiteSettingsDocument,
} from '@wepublish/editor/api';
import {
  formHeader,
  formSectionOf,
  renderFormRoutes,
} from '@wepublish/form/editor/testing';
import i18n from 'i18next';

import { initI18N } from '../../i18n';
import { WebsiteAds } from './website-ads';

type SparkLoop = { enabled: boolean; key: string | null };

const stored: SparkLoop = { enabled: true, key: 'pub_0123456789ab' };

const keyEnabled = ({ enabled, key }: SparkLoop) => ({
  __typename: 'KeyEnabled' as const,
  enabled,
  key,
});

const off = keyEnabled({ enabled: false, key: null });

const websiteSettings = (
  sparkLoop: SparkLoop
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
  ads: { __typename: 'WebsiteAds', sparkLoop: keyEnabled(sparkLoop) },
  fonts: [],
});

const settingsQuery = (
  sparkLoop: SparkLoop = stored,
  delay?: number
): MockedResponse => ({
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: {
    data: { __typename: 'Query', websiteSettings: websiteSettings(sparkLoop) },
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
      { errors: [{ message: 'Ad settings are locked' }] }
    : {
        data: {
          __typename: 'Mutation',
          updateWebsiteSettings: websiteSettings(
            variables.ads?.sparkLoop as SparkLoop
          ),
        },
      },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const adsPath = '/settings/website/ads';

const renderAds = (mocks: MockedResponse[] = [settingsQuery()]) =>
  renderFormRoutes({ [adsPath]: <WebsiteAds /> }, { route: adsPath, mocks });

const toggle = () =>
  screen.getByRole<HTMLInputElement>('checkbox', { name: 'Enable SparkLoop' });

const loaded = () =>
  screen.findByRole('checkbox', { name: 'Enable SparkLoop' });

const keyInput = () =>
  screen.getByRole<HTMLInputElement>('textbox', { name: 'SparkLoop ID' });

const queryKeyInput = () =>
  screen.queryByRole('textbox', { name: 'SparkLoop ID' });

const save = () => screen.getByRole('button', { name: 'Save' });

const confirmed = () => screen.findByText('Updated successfully');

const errorSummary = () =>
  screen.queryByText('Please fix these entries before saving');

const back = () => screen.getByRole('link', { name: 'Back' });

const discard = () => screen.getByRole('button', { name: 'Discard changes' });

const invalid = 'Must be a valid SparkLoop ID (e.g., pub_xxxxxxxxxxxx)';

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

beforeAll(async () => {
  initI18N();
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  saved.length = 0;
});

describe('WebsiteAds', () => {
  it('shows the header and a progress indicator but no fields while the settings load', async () => {
    renderAds([settingsQuery(stored, 50)]);

    expect(
      screen.getByRole('progressbar', { name: 'Loading …' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Ads' })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();

    await loaded();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(save()).toBeDisabled();
  });

  it('renders the title and a SparkLoop section with its toggle and key', async () => {
    renderAds();
    await loaded();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Ads' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map(item => item.textContent)
    ).toEqual(['SparkLoop']);
    expect(
      formSectionOf('SparkLoop').getByRole('checkbox', {
        name: 'Enable SparkLoop',
      })
    ).toBeChecked();
    expect(toggle()).toHaveAttribute('name', 'sparkLoop.enabled');
    expect(
      formSectionOf('SparkLoop').getByRole('textbox', { name: 'SparkLoop ID' })
    ).toHaveValue('pub_0123456789ab');
  });

  it('explains SparkLoop and where to find the key, with links', async () => {
    renderAds();
    await loaded();

    expect(toggle()).toHaveAccessibleDescription(
      'SparkLoop is a newsletter referral and recommendation platform that helps you grow your audience.'
    );
    expect(screen.getByRole('link', { name: 'SparkLoop' })).toHaveAttribute(
      'href',
      'https://sparkloop.app'
    );
    expect(screen.getByRole('link', { name: 'SparkLoop' })).toHaveAttribute(
      'target',
      '_blank'
    );
    expect(keyInput()).toHaveAccessibleDescription(
      'You can find your ID in the script section of your SparkLoop dashboard.'
    );
    expect(
      screen.getByRole('link', { name: 'script section' })
    ).toHaveAttribute('href', 'https://dash.sparkloop.app/settings/script');
  });

  it('shows the key with a placeholder and no required marker only while SparkLoop is enabled', async () => {
    const { user } = renderAds();
    await loaded();

    expect(keyInput()).toHaveAttribute('placeholder', 'pub_xxxxxxxxxxxx');
    expect(keyInput().required).toBe(false);
    expect(screen.queryByText('*')).not.toBeInTheDocument();

    await user.click(toggle());

    expect(queryKeyInput()).not.toBeInTheDocument();

    await user.click(toggle());

    expect(keyInput()).toHaveValue('pub_0123456789ab');
  });

  it('rejects a malformed key once the field is left and accepts a valid one', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    await user.clear(keyInput());
    await user.type(keyInput(), 'pub_XYZ');

    expect(screen.queryByText(invalid)).not.toBeInTheDocument();

    await user.tab();

    expect(await screen.findByText(invalid)).toBeInTheDocument();
    expect(keyInput()).toHaveAttribute('aria-invalid', 'true');
    expect(keyInput()).toHaveAccessibleDescription(invalid);

    await user.click(save());

    expect(saved).toEqual([]);

    await user.clear(keyInput());
    await user.type(keyInput(), 'pub_abcdef012345');

    await waitFor(() =>
      expect(screen.queryByText(invalid)).not.toBeInTheDocument()
    );
  });

  it('saves exactly the ad settings, without type names, and confirms it', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    await user.clear(keyInput());
    await user.type(keyInput(), 'pub_abcdef012345');
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      ads: { sparkLoop: { enabled: true, key: 'pub_abcdef012345' } },
    });
  });

  it('accepts an empty key for an enabled SparkLoop', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    await user.clear(keyInput());
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      ads: { sparkLoop: { enabled: true, key: '' } },
    });
  });

  it('saves a disabled SparkLoop and keeps its key', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(toggle());
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      ads: { sparkLoop: { enabled: false, key: 'pub_0123456789ab' } },
    });
  });

  it('checks a malformed stored key on save once SparkLoop is enabled', async () => {
    const { user } = renderAds([
      settingsQuery({ enabled: false, key: 'not-a-sparkloop-id' }),
      updateMutation(),
    ]);
    await loaded();

    await user.click(toggle());
    await user.click(save());

    expect(await screen.findByText(invalid)).toBeInTheDocument();
    expect(keyInput()).toHaveAccessibleDescription(invalid);
    expect(saved).toEqual([]);
  });

  it('drops the key error once SparkLoop is disabled and saves the key unchanged', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    await user.clear(keyInput());
    await user.type(keyInput(), 'bad');
    await user.tab();
    await screen.findByText(invalid);

    await user.click(toggle());

    await waitFor(() => expect(errorSummary()).not.toBeInTheDocument());
    expect(screen.queryByText(invalid)).not.toBeInTheDocument();

    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      ads: { sparkLoop: { enabled: false, key: 'bad' } },
    });
  });

  it('shows the server error as a notification and an inline alert and keeps the entries', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation('error')]);
    await loaded();

    await user.clear(keyInput());
    await user.type(keyInput(), 'pub_abcdef012345');
    await user.click(save());

    expect(
      await screen.findByText('Ad settings are locked')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Saving failed. Please try again.', {
        selector: '.MuiAlert-message',
      })
    ).toBeInTheDocument();
    expect(screen.queryByText('Updated successfully')).not.toBeInTheDocument();
    expect(keyInput()).toHaveValue('pub_abcdef012345');
    expect(discard()).toBeEnabled();
  });

  it('disables the save button while saving', async () => {
    const { user } = renderAds([
      settingsQuery(),
      { ...updateMutation(), delay: 100 },
    ]);
    await loaded();
    await user.click(toggle());

    await user.click(save());

    await waitFor(() => expect(save()).toBeDisabled());
    await confirmed();
    expect(saved).toHaveLength(1);
  });

  it('keeps the header with a link back to the overview', async () => {
    const { user, currentPath } = renderAds();
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
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderAds();
    await loaded();

    await user.type(keyInput(), '9');
    await user.click(back());

    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe(adsPath);

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(keyInput()).toHaveValue('pub_0123456789ab9');

    await user.click(back());
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(currentPath()).toBe('/settings/website');
    expect(saved).toEqual([]);
  });

  it('discards the changes back to the loaded settings', async () => {
    const { user } = renderAds();
    await loaded();

    expect(discard()).toBeDisabled();

    await user.click(toggle());

    expect(discard()).toBeEnabled();

    await user.click(discard());

    expect(toggle()).toBeChecked();
    expect(keyInput()).toHaveValue('pub_0123456789ab');
    await waitFor(() => expect(discard()).toBeDisabled());
    expect(saved).toEqual([]);
  });

  it('warns before leaving the page with unsaved changes until they are saved', async () => {
    const { user } = renderAds([settingsQuery(), updateMutation()]);
    await loaded();

    expect(leavePage()).toBe(false);

    await user.click(toggle());

    await waitFor(() => expect(leavePage()).toBe(true));

    await user.click(save());
    await confirmed();

    await waitFor(() => expect(leavePage()).toBe(false));
  });

  it('reports a failed load instead of showing the fields and loads again on retry', async () => {
    const { user } = renderAds([
      {
        request: { query: WebsiteSettingsDocument, variables: {} },
        error: new Error('Settings service unavailable'),
      },
      settingsQuery(),
    ]);

    expect(
      await screen.findByText('The data could not be loaded')
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(save()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await loaded();
    expect(keyInput()).toHaveValue('pub_0123456789ab');
  });
});
