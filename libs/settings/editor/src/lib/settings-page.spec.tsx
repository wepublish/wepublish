import { screen, waitFor, within } from '@testing-library/react';
import {
  SettingName,
  SettingsListDocument,
  UpdateSettingDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  paywallFixture,
  paywallListMock,
  queryFieldByLabel,
  renderEditorForm,
} from '@wepublish/form/editor/testing';
import { CanGetSettings, CanUpdateSettings } from '@wepublish/permissions';
import { AuthContext, type AuthContextState } from '@wepublish/ui/editor';
import { GraphQLError } from 'graphql';

import { SettingList, SettingsForm } from '../index';

const storedSettings: Record<SettingName, unknown> = {
  [SettingName.AllowCommentEditing]: false,
  [SettingName.AllowGuestCommenting]: false,
  [SettingName.AllowGuestCommentRating]: false,
  [SettingName.AllowGuestPollVoting]: false,
  [SettingName.CommentCharLimit]: 1000,
  [SettingName.MailProviderName]: 'mailgun',
  [SettingName.MakeActiveSubscribersApiPublic]: false,
  [SettingName.MakeExpectedRevenueApiPublic]: false,
  [SettingName.MakeNewDeactivationsApiPublic]: false,
  [SettingName.MakeNewSubscribersApiPublic]: false,
  [SettingName.MakeRenewingSubscribersApiPublic]: false,
  [SettingName.MakeRevenueApiPublic]: false,
  [SettingName.NewArticlePaywall]: null,
  [SettingName.NewArticlePeering]: true,
  [SettingName.PaymentMethodChangeExpiryDays]: 14,
  [SettingName.PeeringTimeoutMs]: 3000,
  [SettingName.ResetPasswordJwtExpiresMin]: 1440,
  [SettingName.SendLoginJwtExpiresMin]: 600,
  [SettingName.SessionTtlDays]: 7,
  [SettingName.ShowPendingWhenNotPublished]: false,
  [SettingName.SubscriptionExtendWindowDays]: 30,
  [SettingName.SubscriptionUpgradeBillsFullDifference]: false,
};

const editableSettings = (Object.keys(storedSettings) as SettingName[]).filter(
  name => name !== SettingName.MailProviderName
);

const settingsListMock = (settings = storedSettings) => ({
  request: { query: SettingsListDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: {
    data: {
      __typename: 'Query' as const,
      settings: Object.entries(settings).map(([name, value], index) => ({
        __typename: 'Setting' as const,
        id: `setting-${index}`,
        name: name as SettingName,
        value,
        settingRestriction: null,
      })),
    },
  },
});

type Failure = { errors: GraphQLError[] } | { error: Error };

const updateMocks = (
  changes: Partial<Record<SettingName, unknown>>,
  failures: Partial<Record<SettingName, Failure>> = {}
) => {
  const sent: SettingName[] = [];
  const mocks = editableSettings.map(name => {
    const value = name in changes ? changes[name] : storedSettings[name];
    const failure = failures[name];
    const request = {
      query: UpdateSettingDocument,
      variables: { name, value },
    };

    if (failure !== undefined && 'error' in failure) {
      return { request, error: failure.error };
    }

    return {
      request,
      result: () => {
        sent.push(name);

        return failure === undefined ?
            {
              data: {
                updateSetting: { __typename: 'Setting' as const, name, value },
              },
            }
          : failure;
      },
    };
  });

  return { sent, mocks };
};

const invalidSettingData = {
  errors: [
    new GraphQLError('Invalid Setting Data', {
      extensions: { code: 'BAD_USER_INPUT' },
    }),
  ],
};

const standard = paywallFixture('paywall-standard', 'Standard');

const sessionWith = (...permissions: string[]): AuthContextState => ({
  session: {
    email: 'settings@wepublish.ch',
    sessionToken: 'session-token',
    sessionRoles: [
      {
        __typename: 'UserRole',
        id: 'settings-role',
        name: 'settings-role',
        description: null,
        systemRole: false,
        permissions: permissions.map(id => ({
          __typename: 'Permission' as const,
          id,
          description: id,
          deprecated: false,
        })),
      },
    ],
  },
});

type RenderOptions = {
  mocks?: object[];
  session?: AuthContextState;
  load?: object[];
};

const renderSettings = ({
  mocks = [],
  session = sessionWith(CanGetSettings.id, CanUpdateSettings.id),
  load = [settingsListMock()],
}: RenderOptions = {}) =>
  renderEditorForm(
    <AuthContext.Provider value={session}>
      <SettingList />
    </AuthContext.Provider>,
    { mocks: [...load, paywallListMock([standard]), ...mocks] as never }
  );

const startsWith = (label: string) =>
  new RegExp(`^${label.replaceAll('.', '\\.')}`);

const checkbox = (label: string) =>
  screen.getByRole('checkbox', { name: startsWith(label) });

const numberField = (label: string) => getFieldByLabel(startsWith(label));

const loaded = () =>
  waitFor(() => expect(numberField('settingList.peerToken')).toHaveValue(3000));

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

type User = ReturnType<typeof renderEditorForm>['user'];

const retype = async (user: User, label: string, value: string) => {
  await user.clear(numberField(label));
  await user.type(numberField(label), value);
};

const changeTwoSettings = async (user: User) => {
  await user.click(checkbox('settingList.guestCommenting'));
  await retype(user, 'settingList.commentCharLimit', '500');
};

const confirmSave = async (user: User) => {
  await user.click(screen.getByTestId('saveButton'));
  await user.click(await screen.findByTestId('confirmSaveButton'));
};

const region = (title: string) => screen.getByRole('region', { name: title });

const follows = (first: HTMLElement, second: HTMLElement) =>
  Boolean(
    first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING
  );

describe('SettingList', () => {
  it('is memoised by the React Compiler', () => {
    expect(SettingsForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a progress indicator while loading', async () => {
    renderSettings();

    expect(screen.getByText('settingList.settings')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await loaded();
  });

  it('offers the settings as checkboxes, not switches', async () => {
    const { baseElement } = renderSettings();

    await loaded();

    expect(checkbox('settingList.guestCommenting')).toBeInTheDocument();
    expect(baseElement.querySelector('.MuiCheckbox-root')).toBeInTheDocument();
    expect(
      baseElement.querySelector('.MuiSwitch-root')
    ).not.toBeInTheDocument();
  });

  it('says what unit a number is in', async () => {
    renderSettings();

    await loaded();

    expect(screen.getAllByText('form.units.milliseconds')).toHaveLength(1);
    expect(screen.getAllByText('form.units.minutes')).toHaveLength(2);
    expect(screen.getAllByText('form.units.days')).toHaveLength(3);
  });

  it('renders its sections as cards in a grid, the collapsed one last', async () => {
    renderSettings();

    await loaded();

    expect(
      formSectionOf('settingList.articlePage').getByRole('combobox', {
        name: startsWith('settingList.newArticlePaywall'),
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('settingList.commentsAndPolls').getByRole('checkbox', {
        name: startsWith('settingList.guestPollVote'),
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('settingList.subscriptionPlans').getByLabelText(
        startsWith('settingList.subscriptionExtendWindowDays'),
        { selector: 'input' }
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('settingList.login').getByLabelText(
        startsWith('settingList.passwordToken'),
        { selector: 'input' }
      )
    ).toBeInTheDocument();
    expect(
      formSectionOf('settingList.peering').getByLabelText(
        startsWith('settingList.peerToken'),
        { selector: 'input' }
      )
    ).toBeInTheDocument();

    const order = [
      'settingList.articlePage',
      'settingList.commentsAndPolls',
      'settingList.login',
      'settingList.subscriptionPlans',
      'settingList.peering',
      'settingList.publicApi',
    ].map(region);

    expect(
      order.slice(1).every((next, index) => follows(order[index], next))
    ).toBe(true);
    expect(
      order.every(section => section.parentElement === order[0].parentElement)
    ).toBe(true);
    expect(
      order.every(section => section.classList.contains('MuiCard-root'))
    ).toBe(true);
    expect(
      getComputedStyle(order[0].parentElement as HTMLElement).display
    ).toBe('grid');
  });

  it('pairs the small cards and gives the wide ones a whole row', async () => {
    renderSettings();

    await loaded();

    const spansRow = (title: string) =>
      /^1\s*\/\s*-1$/.test(getComputedStyle(region(title)).gridColumn);

    expect(spansRow('settingList.articlePage')).toBe(true);
    expect(spansRow('settingList.subscriptionPlans')).toBe(true);
    expect(spansRow('settingList.commentsAndPolls')).toBe(false);
    expect(spansRow('settingList.login')).toBe(false);
    expect(spansRow('settingList.peering')).toBe(false);
    expect(spansRow('settingList.publicApi')).toBe(false);
  });

  it('keeps the toggles of a section in one group', async () => {
    renderSettings();

    await loaded();

    const group = (label: string) =>
      checkbox(label).closest('.MuiFormGroup-root');

    expect(group('settingList.guestCommenting')).toBeInTheDocument();
    expect(group('settingList.guestCommenting')).toBe(
      group('settingList.allowCommentEditing')
    );
    expect(group('settingList.guestCommenting')).toBe(
      group('settingList.guestPollVote')
    );
    expect(group('settingList.newArticlePeering')).toBe(
      group('settingList.showPendingWhenNotPublished')
    );
  });

  it('keeps the public API settings collapsed until asked for', async () => {
    const { user } = renderSettings();

    await loaded();

    const toggle = formSectionOf('settingList.publicApi').getByRole('button', {
      name: startsWith('settingList.publicApi'),
    });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(
      screen.queryByRole('checkbox', {
        name: startsWith('settingList.revenueApiPublic'),
      })
    ).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(
      checkbox('settingList.revenueApiPublic').closest('.MuiFormGroup-root')
    ).toBe(
      checkbox('settingList.newSubscriptionsApiPublic').closest(
        '.MuiFormGroup-root'
      )
    );
  });

  it('lists the changes with their old and new values and saves nothing on Cancel', async () => {
    const { sent, mocks } = updateMocks({});
    const { user } = renderSettings({ mocks });

    await loaded();
    await changeTwoSettings(user);
    await user.click(screen.getByTestId('saveButton'));

    const dialog = await screen.findByRole('dialog', {
      name: 'settingList.confirmTitle',
    });

    expect(
      within(dialog).getByText('settingList.warnings.askOperators')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('settingList.guestCommenting')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('form.value.off')).toBeInTheDocument();
    expect(within(dialog).getByText('form.value.on')).toBeInTheDocument();
    expect(
      within(dialog).getByText('settingList.commentCharLimit')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('1000')).toBeInTheDocument();
    expect(within(dialog).getByText('500')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'cancel' }));

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(sent).toEqual([]);
    expect(numberField('settingList.commentCharLimit')).toHaveValue(500);
    expect(leavePage()).toBe(true);
  });

  it('names the paywall and the unit in the confirmation', async () => {
    const { user } = renderSettings();

    await loaded();
    await user.click(
      screen.getByRole('combobox', {
        name: startsWith('settingList.newArticlePaywall'),
      })
    );
    await user.click(await screen.findByRole('option', { name: 'Standard' }));
    await retype(user, 'settingList.peerToken', '5000');
    await user.click(screen.getByTestId('saveButton'));

    const dialog = await screen.findByRole('dialog', {
      name: 'settingList.confirmTitle',
    });

    expect(within(dialog).getByText('form.value.empty')).toBeInTheDocument();
    expect(within(dialog).getByText('Standard')).toBeInTheDocument();
    expect(
      within(dialog).getByText('3000 form.units.milliseconds')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('5000 form.units.milliseconds')
    ).toBeInTheDocument();
  });

  it('saves exactly the changed settings on Confirm', async () => {
    const { sent, mocks } = updateMocks({
      [SettingName.AllowGuestCommenting]: true,
      [SettingName.CommentCharLimit]: 500,
    });
    const { user } = renderSettings({ mocks });

    await loaded();
    await changeTwoSettings(user);
    await confirmSave(user);

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect([...sent].sort()).toEqual([
      SettingName.AllowGuestCommenting,
      SettingName.CommentCharLimit,
    ]);
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await waitFor(() =>
      expect(screen.getByTestId('saveButton')).toBeDisabled()
    );
    expect(leavePage()).toBe(false);
  });

  it('saves a picked paywall by its id', async () => {
    const { sent, mocks } = updateMocks({
      [SettingName.NewArticlePaywall]: standard.id,
    });
    const { user } = renderSettings({ mocks });

    await loaded();
    await user.click(
      screen.getByRole('combobox', {
        name: startsWith('settingList.newArticlePaywall'),
      })
    );
    await user.click(await screen.findByRole('option', { name: 'Standard' }));
    await confirmSave(user);

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(sent).toEqual([SettingName.NewArticlePaywall]);
  });

  it('never saves or asks through Enter in a field', async () => {
    const { sent, mocks } = updateMocks({
      [SettingName.CommentCharLimit]: 500,
    });
    const { user } = renderSettings({ mocks });

    await loaded();
    await retype(user, 'settingList.commentCharLimit', '500{Enter}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('shows an emptied number as required instead of saving 0', async () => {
    const { sent, mocks } = updateMocks({});
    const { user } = renderSettings({ mocks });

    await loaded();
    await user.clear(numberField('settingList.peerToken'));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(numberField('settingList.peerToken')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(screen.getAllByText('form.errors.required').length).toBeGreaterThan(
      0
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(sent).toEqual([]);
  });

  it('keeps the minimum of the password reset link at 10 minutes', async () => {
    const { user } = renderSettings();

    await loaded();
    await retype(user, 'settingList.passwordToken', '9');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(numberField('settingList.passwordToken')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('shows a setting the server rejects under its field', async () => {
    const { sent, mocks } = updateMocks(
      {
        [SettingName.AllowGuestCommenting]: true,
        [SettingName.PeeringTimeoutMs]: 5000,
      },
      { [SettingName.PeeringTimeoutMs]: invalidSettingData }
    );
    const { user } = renderSettings({ mocks });

    await loaded();
    await user.click(checkbox('settingList.guestCommenting'));
    await retype(user, 'settingList.peerToken', '5000');
    await confirmSave(user);

    await waitFor(() =>
      expect(numberField('settingList.peerToken')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(
      formSectionOf('settingList.peering').getByText(
        'settingList.errors.invalid'
      )
    ).toBeInTheDocument();
    expect([...sent].sort()).toEqual([
      SettingName.AllowGuestCommenting,
      SettingName.PeeringTimeoutMs,
    ]);
    expect(screen.queryByText('toast.updatedSuccess')).not.toBeInTheDocument();
    expect(
      screen.queryByText('form.errors.server', {
        selector: '.MuiAlert-message',
      })
    ).not.toBeInTheDocument();
    expect(leavePage()).toBe(true);
  });

  it('keeps the settings the server accepted when it rejects another', async () => {
    const { mocks } = updateMocks(
      {
        [SettingName.AllowGuestCommenting]: true,
        [SettingName.PeeringTimeoutMs]: 5000,
      },
      { [SettingName.PeeringTimeoutMs]: invalidSettingData }
    );
    const { user } = renderSettings({ mocks });

    await loaded();
    await user.click(checkbox('settingList.guestCommenting'));
    await retype(user, 'settingList.peerToken', '5000');
    await confirmSave(user);

    await waitFor(() =>
      expect(numberField('settingList.peerToken')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );

    await user.click(screen.getByTestId('saveButton'));

    const dialog = await screen.findByRole('dialog', {
      name: 'settingList.confirmTitle',
    });

    expect(
      within(dialog).getByText('settingList.peerToken')
    ).toBeInTheDocument();
    expect(
      within(dialog).queryByText('settingList.guestCommenting')
    ).not.toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'cancel' }));
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    await user.click(screen.getByTestId('discardButton'));

    expect(checkbox('settingList.guestCommenting')).toBeChecked();
    expect(numberField('settingList.peerToken')).toHaveValue(3000);
  });

  it('keeps the settings that saved when another fails with an unknown error', async () => {
    const { mocks } = updateMocks(
      {
        [SettingName.AllowGuestCommenting]: true,
        [SettingName.CommentCharLimit]: 500,
      },
      { [SettingName.CommentCharLimit]: { error: new Error('Server down') } }
    );
    const { user } = renderSettings({ mocks });

    await loaded();
    await changeTwoSettings(user);
    await confirmSave(user);

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );

    await user.click(screen.getByTestId('discardButton'));

    expect(checkbox('settingList.guestCommenting')).toBeChecked();
    expect(numberField('settingList.commentCharLimit')).toHaveValue(1000);
  });

  it('reports an unknown error as a toast and an inline alert', async () => {
    const { mocks } = updateMocks(
      { [SettingName.CommentCharLimit]: 500 },
      { [SettingName.CommentCharLimit]: { error: new Error('Server down') } }
    );
    const { user } = renderSettings({ mocks });

    await loaded();
    await retype(user, 'settingList.commentCharLimit', '500');
    await confirmSave(user);

    expect(await screen.findByText('Server down')).toBeInTheDocument();
    expect(
      screen.getByText('form.errors.server', { selector: '.MuiAlert-message' })
    ).toBeInTheDocument();
    expect(screen.queryByText('toast.updatedSuccess')).not.toBeInTheDocument();
    expect(numberField('settingList.commentCharLimit')).toHaveValue(500);
  });

  it('reports a failed load and loads again on retry', async () => {
    const { user } = renderSettings({
      load: [
        { request: { query: SettingsListDocument }, error: new Error('Down') },
        settingsListMock(),
      ],
    });

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryFieldByLabel(startsWith('settingList.peerToken'))).toBeNull();
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await user.click(
      screen.getByRole('button', { name: 'form.loadError.retry' })
    );

    await loaded();
  });

  it('discards the changes', async () => {
    const { user } = renderSettings();

    await loaded();

    expect(screen.getByTestId('discardButton')).toBeDisabled();

    await user.click(checkbox('settingList.guestCommenting'));
    await user.click(screen.getByTestId('discardButton'));

    expect(checkbox('settingList.guestCommenting')).not.toBeChecked();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
  });

  it('only shows the settings without CanUpdateSettings', async () => {
    renderSettings({ session: sessionWith(CanGetSettings.id) });

    await loaded();

    expect(screen.getByText('form.view.readOnly')).toBeInTheDocument();
    expect(checkbox('settingList.guestCommenting')).toBeDisabled();
    expect(numberField('settingList.peerToken')).toBeDisabled();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('discardButton')).not.toBeInTheDocument();
  });

  it('turns away a user without a settings permission', async () => {
    renderSettings({ session: sessionWith() });

    expect(await screen.findByText('permissions.noAccess')).toBeInTheDocument();
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('can be reached with CanUpdateSettings alone', async () => {
    renderSettings({ session: sessionWith(CanUpdateSettings.id) });

    await loaded();

    expect(checkbox('settingList.guestCommenting')).toBeEnabled();
    expect(screen.queryByText('form.view.readOnly')).not.toBeInTheDocument();
  });
});
