import { MockedProvider as MockedProviderBase } from '@apollo/client/testing/react';
import '@testing-library/jest-dom/vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import {
  FeaturesDocument,
  PaywallListDocument,
  SettingName,
  SettingsListDocument,
  SettingsListQuery,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
import {
  actWait,
  AuthContext,
  closeSnackbar,
  FeaturesProvider,
  sessionWithPermissions,
} from '@wepublish/ui/editor';
import * as v2Client from '@wepublish/editor/api';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { SettingList } from './settings-list';
import { createTheme, ThemeProvider } from '@mui/material';

const theme = createTheme({ cssVariables: true });

const MockedProvider = MockedProviderBase as any;

const settingsMockData = {
  settings: [
    {
      __typename: 'Setting',
      id: '1',
      name: SettingName.AllowGuestCommenting,
      value: false,
      settingRestriction: null,
    },
    {
      __typename: 'Setting',
      id: '2',
      name: SettingName.AllowGuestPollVoting,
      value: false,
      settingRestriction: null,
    },
    {
      __typename: 'Setting',
      id: '3',
      name: SettingName.PeeringTimeoutMs,
      value: 100,
      settingRestriction: null,
    },
  ],
} as SettingsListQuery;

const toggleSettingMockData = {
  toggleSetting: true,
};

const settingsListMock = {
  request: {
    query: SettingsListDocument,
  },
  result: () => ({
    data: settingsMockData,
  }),
};

const updateSettingMock = {
  request: {
    query: UpdateSettingDocument,
    variables: {
      id: '1',
    },
  },
  result: () => ({
    data: toggleSettingMockData,
  }),
};

const paywallListMock = {
  request: {
    query: PaywallListDocument,
  },
  result: () => ({
    data: { paywalls: [] },
  }),
};

describe('SettingList', () => {
  beforeAll(() => {
    vi.spyOn(v2Client, 'getApiClientV2').mockReturnValue(undefined as any);
  });

  afterEach(() => {
    closeSnackbar();
  });

  test('renders successfully', async () => {
    const { baseElement, asFragment } = render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    // Apollo Client 4 delivers the first result a tick later than v3, so wait
    // for rendered content instead of a fixed tick — otherwise the snapshot
    // captures an empty fragment.
    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    // Rendering the list is not the last state change: one effect copies the
    // loaded settings into the reducer, a second then diffs them and empties
    // `changedSetting`, which disables save and reset. Snapshot before those
    // flush and the buttons are still enabled — that is the frame a fast
    // machine caught, and why this snapshot disagreed with CI.
    await waitFor(() => {
      const save = baseElement.querySelector('button[type="submit"]');

      expect(save).toBeTruthy();
      expect(save).toBeDisabled();
    });

    expect(baseElement).toBeTruthy();
    expect(asFragment()).toMatchSnapshot();
  });

  test('keeps the checkboxes of a card in one group', async () => {
    const { baseElement } = render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    const group = (label: string) =>
      screen.getByText(label).closest('.MuiFormGroup-root');

    expect(group('settingList.guestCommenting')).toBeInTheDocument();
    expect(group('settingList.guestCommenting')).toBe(
      group('settingList.allowCommentEditing')
    );
    expect(
      Array.from(baseElement.querySelectorAll('.MuiFormGroup-root')).filter(
        group => group.querySelector('input[type="checkbox"]')
      )
    ).toHaveLength(2);
  });

  test('gives the print settings their own section while the print export is on', async () => {
    const featuresMock = {
      request: { query: FeaturesDocument },
      result: () => ({ data: { features: ['print-export'] } }),
    };

    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[
              settingsListMock,
              updateSettingMock,
              paywallListMock,
              featuresMock,
            ]}
            addTypename={false}
          >
            <FeaturesProvider>
              <RouterProvider
                router={createMemoryRouter([
                  { path: '*', element: <SettingList /> },
                ])}
              />
            </FeaturesProvider>
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    const card = (label: string) =>
      screen.getByText(label).closest('.MuiCard-root');

    await waitFor(() =>
      expect(
        screen.getByText('settingList.printExportDefaults')
      ).toBeInTheDocument()
    );

    expect(card('settingList.printIssues')).toBe(
      card('settingList.printExportDefaults')
    );
    // the number field shows its label twice (label and outline legend)
    const perYear = screen
      .getByLabelText('settingList.printIssuesPerYear')
      .closest('.MuiCard-root');

    expect(card('settingList.printIssues')).toBe(perYear);
    expect(card('settingList.subscriptionPlans')).not.toBe(perYear);

    // the bexio kinds are edited in the same card; without any, the defaults say so
    expect(card('settingList.printBexioKinds')).toBe(perYear);
    expect(
      screen
        .getByRole('button', { name: 'printBexioKinds.add' })
        .closest('.MuiCard-root')
    ).toBe(perYear);
    expect(
      screen.getByText('printExportOptions.bexioNoKinds')
    ).toBeInTheDocument();
  });

  describe('how the medium numbers its print issues', () => {
    const numberingMock = (counting: string, format: string) => ({
      request: { query: SettingsListDocument },
      result: () => ({
        data: {
          settings: [
            // the form only saves while these hold valid numbers
            ...[
              [SettingName.SendLoginJwtExpiresMin, 60],
              [SettingName.ResetPasswordJwtExpiresMin, 60],
              [SettingName.PeeringTimeoutMs, 3000],
            ].map(([name, value], index) => ({
              __typename: 'Setting',
              id: `valid-${index}`,
              name,
              value,
              settingRestriction: null,
            })),
            {
              __typename: 'Setting',
              id: 'numbering',
              name: SettingName.PrintIssueNumbering,
              value: counting,
              settingRestriction: {
                allowedValues: { stringChoice: ['perYear', 'continuous'] },
              },
            },
            {
              __typename: 'Setting',
              id: 'format',
              name: SettingName.PrintIssueLabelFormat,
              value: format,
              settingRestriction: null,
            },
          ],
        } as SettingsListQuery,
      }),
    });
    const featuresMock = {
      request: { query: FeaturesDocument },
      result: () => ({ data: { features: ['print-export'] } }),
    };

    const renderNumbering = (counting: string, format: string) =>
      render(
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={sessionWithPermissions}>
            <MockedProvider
              mocks={[
                numberingMock(counting, format),
                paywallListMock,
                featuresMock,
              ]}
              addTypename={false}
            >
              <FeaturesProvider>
                <RouterProvider
                  router={createMemoryRouter([
                    { path: '*', element: <SettingList /> },
                  ])}
                />
              </FeaturesProvider>
            </MockedProvider>
          </AuthContext.Provider>
        </ThemeProvider>
      );

    const templateField = () =>
      screen.getByRole('textbox', {
        name: 'settingList.printIssueLabelFormat',
      });

    test('shows the stored counting and template with a preview of both kinds of issue', async () => {
      renderNumbering('continuous', '#{range}');

      expect(
        await screen.findByRole('radio', {
          name: 'settingList.printIssueNumberingChoice.continuous',
        })
      ).toBeChecked();
      expect(templateField()).toHaveValue('#{range}');
      expect(
        screen.getByText(/settingList\.printIssueLabelFormatPreview/)
      ).toHaveTextContent('#117 · #117/118');
      // both sit in the print issues card, below the issues per year
      expect(
        screen
          .getByRole('radiogroup', { name: 'settingList.printIssueNumbering' })
          .closest('.MuiCard-root')
      ).toBe(templateField().closest('.MuiCard-root'));
    });

    test('fills the template in from a preset', async () => {
      renderNumbering('perYear', '{range}.{yy}');

      fireEvent.click(await screen.findByRole('button', { name: 'Nr. 6/2026' }));

      expect(templateField()).toHaveValue('Nr. {range}/{yyyy}');
    });

    test('refuses a template without the year while numbers restart every year', async () => {
      renderNumbering('perYear', '{range}.{yy}');

      fireEvent.change(await screen.findByRole('textbox', {
        name: 'settingList.printIssueLabelFormat',
      }), { target: { value: '#{range}' } });
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      expect(
        await screen.findByText('settingList.printIssueLabelFormatError.noYear')
      ).toBeInTheDocument();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  test('offers the settings as checkboxes, not switches', async () => {
    const { baseElement } = render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument()
    );

    expect(baseElement.querySelector('.MuiCheckbox-root')).toBeInTheDocument();
    expect(
      baseElement.querySelector('.MuiSwitch-root')
    ).not.toBeInTheDocument();
  });

  test('says what unit a number is in', async () => {
    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('settingList.ms')).toBeInTheDocument()
    );
    expect(screen.getAllByText('settingList.minutes')).toHaveLength(2);
    // session lifetime, the email-quality window, the evidence warning, the
    // subscription renewal window and the expiry of a pending payment method
    // change
    expect(screen.getAllByText('settingList.days')).toHaveLength(5);
  });

  test('spaces every card in the second column alike', async () => {
    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(screen.getByText('settingList.peering')).toBeInTheDocument()
    );

    const gridItem = (heading: string) =>
      screen.getByText(heading).closest('.MuiGrid-root')?.parentElement;

    expect(gridItem('settingList.articlePage')).toBe(
      gridItem('settingList.peering')
    );
  });

  test('names each control by its label alone, with the help beside it', async () => {
    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await waitFor(() =>
      expect(
        screen.getByRole('checkbox', { name: 'settingList.guestCommenting' })
      ).toBeInTheDocument()
    );

    expect(
      screen.getByRole('spinbutton', { name: 'settingList.peerToken' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'settingList.newArticlePaywall' })
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole('button', {
          name: 'settingList.warnings.guestCommenting',
        })
        .closest('label')
    ).toBeNull();
  });

  describe('what feeds carry for paywalled articles', () => {
    const feedSettingsMock = {
      request: {
        query: SettingsListDocument,
      },
      result: () => ({
        data: {
          settings: [
            ...[
              [SettingName.SendLoginJwtExpiresMin, 60],
              [SettingName.ResetPasswordJwtExpiresMin, 60],
              [SettingName.PeeringTimeoutMs, 3000],
            ].map(([name, value], index) => ({
              __typename: 'Setting',
              id: `valid-${index}`,
              name,
              value,
              settingRestriction: null,
            })),
            {
              __typename: 'Setting',
              id: '4',
              name: SettingName.FeedPaywalledContent,
              value: 'visible',
              settingRestriction: {
                allowedValues: { stringChoice: ['lead', 'visible', 'full'] },
              },
            },
          ],
        } as SettingsListQuery,
      }),
    };

    const renderFeedSettings = () =>
      render(
        <ThemeProvider theme={theme}>
          <AuthContext.Provider value={sessionWithPermissions}>
            <MockedProvider
              mocks={[feedSettingsMock, paywallListMock]}
              addTypename={false}
            >
              <RouterProvider
                router={createMemoryRouter([
                  { path: '*', element: <SettingList /> },
                ])}
              />
            </MockedProvider>
          </AuthContext.Provider>
        </ThemeProvider>
      );

    test('shows the stored choice in its own card', async () => {
      renderFeedSettings();

      expect(
        await screen.findByRole('radio', {
          name: 'settingList.feedPaywalledContentChoice.visible',
        })
      ).toBeChecked();
      expect(screen.getByText('settingList.feeds')).toBeInTheDocument();
      expect(
        screen.getByRole('radiogroup', {
          name: 'settingList.feedPaywalledContent',
        })
      ).toBeInTheDocument();
    });

    test('names the choices in the confirmation', async () => {
      renderFeedSettings();

      fireEvent.click(
        await screen.findByRole('radio', {
          name: 'settingList.feedPaywalledContentChoice.full',
        })
      );
      fireEvent.click(screen.getByRole('button', { name: /save/i }));

      const dialog = await screen.findByRole('dialog');

      expect(dialog).toHaveTextContent(
        'settingList.feedPaywalledContentChoice.visible'
      );
      expect(dialog).toHaveTextContent(
        'settingList.feedPaywalledContentChoice.full'
      );
    });
  });

  test('renders the setting list view with settings', async () => {
    render(
      <ThemeProvider theme={theme}>
        <AuthContext.Provider value={sessionWithPermissions}>
          <MockedProvider
            mocks={[settingsListMock, updateSettingMock, paywallListMock]}
            addTypename={false}
          >
            <RouterProvider
              router={createMemoryRouter([
                { path: '*', element: <SettingList /> },
              ])}
            />
          </MockedProvider>
        </AuthContext.Provider>
      </ThemeProvider>
    );

    await actWait();

    await waitFor(() => {
      expect(
        screen.getByText('settingList.guestCommenting')
      ).toBeInTheDocument();
      expect(
        screen.getByText('settingList.allowGuestCommentRating')
      ).toBeInTheDocument();
    });
  });
});
