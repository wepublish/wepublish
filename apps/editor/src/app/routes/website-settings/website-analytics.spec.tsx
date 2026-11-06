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
import { WebsiteAnalytics } from './website-analytics';

type Provider = { enabled: boolean; key: string | null };

type Analytics = {
  googleAnalytics: Provider;
  googleTagManager: Provider;
  plausible: Provider;
  piwik: Provider;
};

const off: Provider = { enabled: false, key: null };

const stored: Analytics = {
  googleAnalytics: { enabled: true, key: 'G-ABC123' },
  googleTagManager: off,
  plausible: { enabled: true, key: 'pa-old_key' },
  piwik: { enabled: false, key: 'piwik-site-id' },
};

const keyEnabled = ({ enabled, key }: Provider) => ({
  __typename: 'KeyEnabled' as const,
  enabled,
  key,
});

const websiteSettings = (
  analytics: Analytics
): WebsiteSettingsQuery['websiteSettings'] => ({
  __typename: 'WebsiteSettings',
  theme: {},
  analytics: {
    __typename: 'WebsiteAnalytics',
    googleAnalytics: keyEnabled(analytics.googleAnalytics),
    googleTagManager: keyEnabled(analytics.googleTagManager),
    plausible: keyEnabled(analytics.plausible),
    piwik: keyEnabled(analytics.piwik),
  },
  mail: { __typename: 'WebsiteMail', mailchimp: null },
  ads: { __typename: 'WebsiteAds', sparkLoop: keyEnabled(off) },
  fonts: [],
});

const settingsQuery = (
  analytics: Analytics = stored,
  delay?: number
): MockedResponse => ({
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: {
    data: { __typename: 'Query', websiteSettings: websiteSettings(analytics) },
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
      { errors: [{ message: 'Analytics settings are locked' }] }
    : {
        data: {
          __typename: 'Mutation',
          updateWebsiteSettings: websiteSettings(
            variables.analytics as Analytics
          ),
        },
      },
  maxUsageCount: Number.POSITIVE_INFINITY,
});

const analyticsPath = '/settings/website/analytics';

const renderAnalytics = (mocks: MockedResponse[] = [settingsQuery()]) =>
  renderFormRoutes(
    { [analyticsPath]: <WebsiteAnalytics /> },
    { route: analyticsPath, mocks }
  );

const loaded = () =>
  screen.findByRole('checkbox', { name: 'Enable Google Analytics' });

const textbox = (name: string) =>
  screen.getByRole<HTMLInputElement>('textbox', { name });

const queryTextbox = (name: string) => screen.queryByRole('textbox', { name });

const save = () => screen.getByRole('button', { name: 'Save' });

const confirmed = () => screen.findByText('Updated successfully');

const errorSummary = () =>
  screen.queryByText('Please fix these entries before saving');

const back = () => screen.getByRole('link', { name: 'Back' });

const discard = () => screen.getByRole('button', { name: 'Discard changes' });

beforeAll(async () => {
  initI18N();
  await i18n.changeLanguage('en');
});

beforeEach(() => {
  saved.length = 0;
});

describe('WebsiteAnalytics', () => {
  it('shows a progress indicator and no fields while the settings load', async () => {
    renderAnalytics([settingsQuery(stored, 50)]);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);

    await loaded();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('renders the title, the provider sections and one toggle per provider', async () => {
    renderAnalytics();
    await loaded();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Analytics' })
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('heading', { level: 2 }).map(item => item.textContent)
    ).toEqual(['Google', 'Plausible', 'Piwik PRO']);
    expect(
      screen
        .getAllByRole('checkbox')
        .map(item => [
          item.getAttribute('name'),
          (item as HTMLInputElement).checked,
        ])
    ).toEqual([
      ['googleAnalytics.enabled', true],
      ['googleTagManager.enabled', false],
      ['plausible.enabled', true],
      ['piwik.enabled', false],
    ]);
    expect(
      screen.getByRole('checkbox', { name: 'Enable Google Tag Manager' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Enable Plausible' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('checkbox', { name: 'Enable Piwik PRO' })
    ).toBeInTheDocument();
  });

  it('renders its sections as regions', async () => {
    renderAnalytics();
    await loaded();

    expect(
      formSectionOf('Google')
        .getAllByRole('checkbox')
        .map(item => item.getAttribute('name'))
    ).toEqual(['googleAnalytics.enabled', 'googleTagManager.enabled']);
    expect(
      formSectionOf('Google').getByRole('textbox', {
        name: 'Google Analytics ID',
      })
    ).toHaveValue('G-ABC123');
    expect(
      formSectionOf('Plausible').getByRole('checkbox', {
        name: 'Enable Plausible',
      })
    ).toBeChecked();
    expect(
      formSectionOf('Plausible').getByRole('textbox', { name: 'Plausible ID' })
    ).toHaveValue('pa-old_key');
    expect(
      formSectionOf('Piwik PRO').getByRole('checkbox', {
        name: 'Enable Piwik PRO',
      })
    ).not.toBeChecked();
  });

  it('explains every provider with a link to its website', async () => {
    renderAnalytics();
    await loaded();

    expect(
      screen.getByText(/is a web analytics tool from Google/)
    ).toBeInTheDocument();
    expect(
      [
        'Google Analytics',
        'Google Tag Manager',
        'Plausible Analytics',
        'Piwik PRO',
      ].map(name => screen.getByRole('link', { name }).getAttribute('href'))
    ).toEqual([
      'https://developers.google.com/analytics',
      'https://marketingplatform.google.com/about/tag-manager/',
      'https://plausible.io',
      'https://piwik.pro',
    ]);
    expect(
      screen.getByRole('link', { name: 'Google Analytics' })
    ).toHaveAttribute('target', '_blank');
  });

  it('shows the key of a provider only while the provider is enabled', async () => {
    const { user } = renderAnalytics();
    await loaded();

    expect(textbox('Google Analytics ID')).toHaveValue('G-ABC123');
    expect(textbox('Plausible ID')).toHaveValue('pa-old_key');
    expect(queryTextbox('Google Tag Manager ID')).not.toBeInTheDocument();
    expect(queryTextbox('Piwik PRO ID')).not.toBeInTheDocument();

    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Google Tag Manager' })
    );

    expect(textbox('Google Tag Manager ID')).toHaveValue('');

    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Google Analytics' })
    );

    expect(queryTextbox('Google Analytics ID')).not.toBeInTheDocument();
  });

  it('shows placeholders, no required markers and a hint where to find each key', async () => {
    const { user } = renderAnalytics();
    await loaded();

    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Google Tag Manager' })
    );
    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Piwik PRO' })
    );

    expect(
      [
        textbox('Google Analytics ID'),
        textbox('Google Tag Manager ID'),
        textbox('Plausible ID'),
        textbox('Piwik PRO ID'),
      ].map(input => [input.getAttribute('placeholder'), input.required])
    ).toEqual([
      ['G-XXXXXXXXXX', false],
      ['GTM-XXXXXXX', false],
      ['pa-XXXXXXXXXXXXXXXXXXXXX', false],
      ['xxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx', false],
    ]);
    expect(screen.queryByText('*')).not.toBeInTheDocument();
    expect(
      screen
        .getAllByRole('link', { name: 'admin dashboard' })
        .map(link => link.getAttribute('href'))
    ).toEqual([
      'https://support.google.com/analytics/answer/9539598',
      'https://support.google.com/tagmanager/answer/15107467',
    ]);
    expect(
      screen.getByRole('link', { name: 'website settings' })
    ).toHaveAttribute('href', 'https://plausible.io/docs/website-settings');
    expect(
      screen.getByText(
        'You can find it in the Menu > Administration > Site > ID of your administration panel'
      )
    ).toBeInTheDocument();
  });

  it.each([
    [
      'Google Analytics',
      'Google Analytics ID',
      'XYZ-123',
      'G-NEW-1',
      'Must be a valid GA ID (e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X)',
    ],
    [
      'Google Tag Manager',
      'Google Tag Manager ID',
      'GTM-12_3',
      'GTM-ABC123',
      'Must be a valid GTM ID (e.g., GTM-XXXXXXX)',
    ],
    [
      'Plausible',
      'Plausible ID',
      'plausible',
      'PA-new_key-1',
      'Must be a valid PA ID (e.g., pa-XXXXXXXXXXXXXXXXXXXX)',
    ],
  ])(
    'rejects a malformed %s key once the field is left and accepts a valid one',
    async (provider, label, invalid, valid, message) => {
      const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
      await loaded();

      const toggle = screen.getByRole('checkbox', {
        name: `Enable ${provider}`,
      });

      if (!(toggle as HTMLInputElement).checked) {
        await user.click(toggle);
      }

      await user.clear(textbox(label));
      await user.type(textbox(label), invalid);

      expect(screen.queryByText(message)).not.toBeInTheDocument();

      await user.tab();

      expect(await screen.findByText(message)).toBeInTheDocument();
      expect(textbox(label)).toHaveAttribute('aria-invalid', 'true');

      await user.click(save());

      expect(saved).toEqual([]);

      await user.clear(textbox(label));
      await user.type(textbox(label), valid);

      await waitFor(() =>
        expect(screen.queryByText(message)).not.toBeInTheDocument()
      );
    }
  );

  it('accepts any Piwik PRO key and an empty key for an enabled provider', async () => {
    const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
    await loaded();

    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Piwik PRO' })
    );

    await user.clear(textbox('Piwik PRO ID'));
    await user.type(textbox('Piwik PRO ID'), 'anything goes');
    await user.clear(textbox('Google Analytics ID'));
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0].analytics?.piwik).toStrictEqual({
      enabled: true,
      key: 'anything goes',
    });
    expect(saved[0].analytics?.googleAnalytics).toStrictEqual({
      enabled: true,
      key: '',
    });
  });

  it('saves exactly the analytics settings, without type names, and confirms it', async () => {
    const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
    await loaded();

    await user.clear(textbox('Google Analytics ID'));
    await user.type(textbox('Google Analytics ID'), 'UA-1234-5');
    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Plausible' })
    );
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      analytics: {
        googleAnalytics: { enabled: true, key: 'UA-1234-5' },
        googleTagManager: { enabled: false, key: null },
        plausible: { enabled: false, key: 'pa-old_key' },
        piwik: { enabled: false, key: 'piwik-site-id' },
      },
    });
  });

  it('saves the loaded settings unchanged apart from the edit', async () => {
    const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
    await loaded();

    await user.type(textbox('Google Analytics ID'), '4');
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0]).toStrictEqual({
      analytics: {
        ...stored,
        googleAnalytics: { enabled: true, key: 'G-ABC1234' },
      },
    });
  });

  it('saves a disabled provider with a malformed stored key unchanged', async () => {
    const error = vi.spyOn(console, 'error');
    const { user } = renderAnalytics([
      settingsQuery({
        ...stored,
        googleTagManager: { enabled: false, key: 'not-a-gtm-id' },
      }),
      updateMutation(),
    ]);
    await loaded();

    await user.type(textbox('Google Analytics ID'), '4');
    await user.click(save());

    await confirmed();
    expect(saved).toHaveLength(1);
    expect(saved[0].analytics?.googleTagManager).toStrictEqual({
      enabled: false,
      key: 'not-a-gtm-id',
    });
    expect(queryTextbox('Google Tag Manager ID')).not.toBeInTheDocument();
    expect(errorSummary()).not.toBeInTheDocument();
    expect(error).not.toHaveBeenCalledWith(
      expect.stringContaining('not rendered')
    );

    error.mockRestore();
  });

  it('shows the server error as a notification and an inline alert and keeps the entries', async () => {
    const { user } = renderAnalytics([
      settingsQuery(),
      updateMutation('error'),
    ]);
    await loaded();

    await user.clear(textbox('Google Analytics ID'));
    await user.type(textbox('Google Analytics ID'), 'G-KEEP');
    await user.click(save());

    expect(
      await screen.findByText('Analytics settings are locked')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Saving failed. Please try again.', {
        selector: '.MuiAlert-message',
      })
    ).toBeInTheDocument();
    expect(screen.queryByText('Updated successfully')).not.toBeInTheDocument();
    expect(textbox('Google Analytics ID')).toHaveValue('G-KEEP');
    expect(discard()).toBeEnabled();
  });

  it('disables the save button while saving', async () => {
    const { user } = renderAnalytics([
      settingsQuery(),
      { ...updateMutation(), delay: 100 },
    ]);
    await loaded();
    await user.type(textbox('Google Analytics ID'), '4');

    await user.click(save());

    await waitFor(() => expect(save()).toBeDisabled());
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    await confirmed();
    expect(saved).toHaveLength(1);
  });

  it('keeps the header with a link back to the overview', async () => {
    const { user, currentPath } = renderAnalytics();
    await loaded();

    const header = formHeader();

    expect(header.getByRole('link', { name: 'Back' })).toHaveAttribute(
      'href',
      '/settings/website'
    );
    expect(
      header.getAllByRole('button').map(button => button.textContent)
    ).toEqual(['Discard changes', 'Save']);
    expect(header.queryByRole('button', { name: 'Save & Close' })).toBeNull();

    await user.click(back());

    expect(currentPath()).toBe('/settings/website');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderAnalytics();
    await loaded();

    await user.type(textbox('Google Analytics ID'), '9');
    await user.click(back());

    expect(
      screen.getByRole('dialog', { name: 'Discard unsaved changes?' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe(analyticsPath);

    await user.click(screen.getByRole('button', { name: 'Keep editing' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe(analyticsPath);
    expect(textbox('Google Analytics ID')).toHaveValue('G-ABC1239');

    await user.click(back());
    await user.click(screen.getByRole('button', { name: 'Discard' }));

    expect(currentPath()).toBe('/settings/website');
    expect(saved).toEqual([]);
  });

  it('discards the changes back to the loaded settings', async () => {
    const { user } = renderAnalytics();
    await loaded();

    expect(discard()).toBeDisabled();

    await user.type(textbox('Google Analytics ID'), '9');
    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Piwik PRO' })
    );

    expect(discard()).toBeEnabled();

    await user.click(discard());

    expect(textbox('Google Analytics ID')).toHaveValue('G-ABC123');
    expect(queryTextbox('Piwik PRO ID')).not.toBeInTheDocument();
    await waitFor(() => expect(discard()).toBeDisabled());
    expect(saved).toEqual([]);
  });
});

describe('WebsiteAnalytics with the form library', () => {
  const leavePage = () => {
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    return event.defaultPrevented;
  };

  it.each([
    [
      'Google Analytics',
      'googleAnalytics',
      'Google Analytics ID',
      'Must be a valid GA ID (e.g., G-XXXXXXXXXX or UA-XXXXXXXX-X)',
    ],
    [
      'Google Tag Manager',
      'googleTagManager',
      'Google Tag Manager ID',
      'Must be a valid GTM ID (e.g., GTM-XXXXXXX)',
    ],
    [
      'Plausible',
      'plausible',
      'Plausible ID',
      'Must be a valid PA ID (e.g., pa-XXXXXXXXXXXXXXXXXXXX)',
    ],
  ] as const)(
    'drops the %s key error once the provider is disabled and saves the key unchanged',
    async (provider, field, label, message) => {
      const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
      await loaded();

      const toggle = screen.getByRole('checkbox', {
        name: `Enable ${provider}`,
      });

      if (!(toggle as HTMLInputElement).checked) {
        await user.click(toggle);
      }

      await user.clear(textbox(label));
      await user.type(textbox(label), 'bad');
      await user.tab();
      await screen.findByText(message);

      await user.click(toggle);

      await waitFor(() => expect(errorSummary()).not.toBeInTheDocument());
      expect(screen.queryByText(message)).not.toBeInTheDocument();

      await user.click(save());

      await confirmed();
      expect(saved).toHaveLength(1);
      expect(saved[0].analytics?.[field]).toStrictEqual({
        enabled: false,
        key: 'bad',
      });
    }
  );

  it('checks a malformed stored key on save once its provider is enabled', async () => {
    const { user } = renderAnalytics([
      settingsQuery({
        ...stored,
        googleTagManager: { enabled: false, key: 'not-a-gtm-id' },
      }),
      updateMutation(),
    ]);
    await loaded();

    await user.click(
      screen.getByRole('checkbox', { name: 'Enable Google Tag Manager' })
    );
    await user.click(save());

    expect(
      await screen.findByText('Must be a valid GTM ID (e.g., GTM-XXXXXXX)')
    ).toBeInTheDocument();
    expect(textbox('Google Tag Manager ID')).toHaveAccessibleDescription(
      'Must be a valid GTM ID (e.g., GTM-XXXXXXX)'
    );
    expect(saved).toEqual([]);
  });

  it('links the provider explanation and the key hint to their inputs', async () => {
    renderAnalytics();
    await loaded();

    expect(
      screen.getByRole('checkbox', { name: 'Enable Google Analytics' })
    ).toHaveAccessibleDescription(
      'Google Analytics is a web analytics tool from Google that tracks how readers use your website.'
    );
    expect(textbox('Google Analytics ID')).toHaveAccessibleDescription(
      'You can find it in the admin dashboard under data streams'
    );
  });

  it('warns before leaving the page with unsaved changes until they are saved', async () => {
    const { user } = renderAnalytics([settingsQuery(), updateMutation()]);
    await loaded();

    expect(leavePage()).toBe(false);

    await user.type(textbox('Google Analytics ID'), '9');

    await waitFor(() => expect(leavePage()).toBe(true));

    await user.click(save());
    await confirmed();
    expect(saved).toHaveLength(1);

    await waitFor(() => expect(leavePage()).toBe(false));
  });

  it('reports a failed load instead of showing the fields and loads again on retry', async () => {
    const { user } = renderAnalytics([
      {
        request: { query: WebsiteSettingsDocument, variables: {} },
        error: new Error('Settings service unavailable'),
      },
      settingsQuery(),
    ]);

    expect(
      await screen.findByText('The data could not be loaded')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Try again' })
    ).toBeInTheDocument();
    expect(
      await screen.findAllByText('Settings service unavailable')
    ).not.toHaveLength(0);
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(save()).toBeDisabled();

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await loaded();
    expect(textbox('Google Analytics ID')).toHaveValue('G-ABC123');
  });

  it('shows the header while the settings load', async () => {
    renderAnalytics([settingsQuery(stored, 50)]);

    expect(
      screen.getByRole('progressbar', { name: 'Loading …' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Analytics' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();

    await loaded();

    expect(save()).toBeDisabled();
    expect(discard()).toBeDisabled();
  });
});
