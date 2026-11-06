import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  ConsentsDocument,
  CreateUserConsentDocument,
  type CreateUserConsentMutationVariables,
  type FullConsentFragment,
  type UserListQueryVariables,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  renderFormRoutes,
  userFixture,
  userListMock,
} from '@wepublish/form/editor/testing';

import { UserConsentCreateView } from './user-consent-create-view';

vi.mock('node-fetch', () => ({ default: vi.fn() }));

const timestamp = '2026-01-01T00:00:00.000Z';

const consentFixture = (id: string, name: string): FullConsentFragment => ({
  __typename: 'Consent',
  id,
  name,
  slug: id,
  defaultValue: true,
  createdAt: timestamp,
  modifiedAt: timestamp,
});

const newsletter = consentFixture('consent-newsletter', 'Newsletter');
const tracking = consentFixture('consent-tracking', 'Tracking');

const matteo = userFixture('user-matteo', 'Matteo', 'Wyss');
const anna = userFixture('user-anna', 'Anna', 'Keller');

const consentsMock = {
  request: { query: ConsentsDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { consents: [newsletter, tracking] } },
};

const createdUserConsent = (variables: CreateUserConsentMutationVariables) => ({
  __typename: 'UserConsent' as const,
  id: 'user-consent-1',
  value: variables.value,
  createdAt: timestamp,
  modifiedAt: timestamp,
  consent: newsletter,
  user: {
    __typename: 'User' as const,
    id: variables.userId,
    name: 'Wyss',
    firstName: 'Matteo',
  },
});

const createMock = (result?: object, delay?: number) => {
  const respond = vi.fn(
    (variables: CreateUserConsentMutationVariables) =>
      result ?? { data: { createUserConsent: createdUserConsent(variables) } }
  );

  return {
    respond,
    mock: {
      request: { query: CreateUserConsentDocument, variables: () => true },
      result: respond,
      delay,
    },
  };
};

const alreadyAnswered = {
  errors: [
    {
      message:
        '\nInvalid `this.prisma.userConsent.create()` invocation in\n/app/main.js:93374:46\n\n→ 93374         return yield this.prisma.userConsent.create(\nUnique constraint failed on the constraint: `user-consents_userId_consentId_key`',
    },
  ],
};

const renderCreateView = (
  mocks: object[] = [],
  onUserSearch: (variables: UserListQueryVariables) => void = () => undefined
) =>
  renderFormRoutes(
    { '/userConsents/create': <UserConsentCreateView /> },
    {
      route: '/userConsents/create',
      mocks: [
        consentsMock,
        userListMock([matteo, anna], onUserSearch),
        ...mocks,
      ] as never,
    }
  );

const userPicker = () =>
  screen.getByRole<HTMLInputElement>('combobox', {
    name: /^userConsents\.user\*/,
  });

const consentPicker = () =>
  screen.getByRole<HTMLInputElement>('combobox', {
    name: /^consents\.consent\*/,
  });

const valueToggle = () =>
  screen.getByRole('checkbox', { name: /^consents\.accepted/ });

const ready = () => waitFor(() => expect(consentPicker()).toBeInTheDocument());

const pick = async (user: UserEvent, input: HTMLElement, option: RegExp) => {
  await user.click(input);
  await user.click(await screen.findByRole('option', { name: option }));
};

const fillIn = async (user: UserEvent) => {
  await ready();
  await pick(user, userPicker(), /Wyss/);
  await pick(user, consentPicker(), /^Newsletter$/);
};

describe('UserConsentCreateView', () => {
  it('is memoised by the React Compiler', () => {
    expect(UserConsentCreateView.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header with a back link and both save buttons', async () => {
    renderCreateView();

    await ready();

    expect(screen.getByText('userConsents.titleCreate')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/userConsents'
    );
    expect(screen.getByTestId('saveButton')).toHaveTextContent('save');
    expect(screen.getByTestId('saveAndCloseButton')).toHaveTextContent(
      'saveAndClose'
    );
  });

  it('starts without a user or consent and with an accepted value', async () => {
    renderCreateView();

    await ready();

    expect(userPicker()).toHaveValue('');
    expect(consentPicker()).toHaveValue('');
    expect(valueToggle()).toBeChecked();
  });

  it('marks the user and the consent as required but not the value', async () => {
    renderCreateView();

    await ready();

    expect(userPicker()).toBeRequired();
    expect(consentPicker()).toBeRequired();
    expect(valueToggle()).not.toBeRequired();
  });

  it('renders its sections as regions', async () => {
    renderCreateView();

    await ready();

    const assignment = formSectionOf('userConsents.sections.assignment');

    expect(
      assignment.getByText('userConsents.sections.assignmentInfo')
    ).toBeInTheDocument();
    expect(
      assignment.getByRole('combobox', { name: /^userConsents\.user/ })
    ).toBeInTheDocument();
    expect(
      assignment.getByRole('combobox', { name: /^consents\.consent/ })
    ).toBeInTheDocument();
    expect(
      formSectionOf('userConsents.sections.decision').getByRole('checkbox', {
        name: /^consents\.accepted/,
      })
    ).toBeInTheDocument();
  });

  it('searches the users on the server', async () => {
    const onUserSearch = vi.fn();
    const { user } = renderCreateView([], onUserSearch);

    await ready();
    await user.type(userPicker(), 'anna');

    await waitFor(() =>
      expect(onUserSearch).toHaveBeenCalledWith(
        expect.objectContaining({ filter: { text: 'anna' } })
      )
    );
    expect(
      await screen.findByRole('option', { name: /^Anna Keller/ })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /^Matteo Wyss/ })
    ).not.toBeInTheDocument();
  });

  it('creates the user consent and opens it for editing', async () => {
    const { respond, mock } = createMock();
    const { user, currentPath } = renderCreateView([mock]);

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(currentPath()).toBe('/userConsents/edit/user-consent-1')
    );
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond.mock.calls[0][0]).toStrictEqual({
      userId: 'user-matteo',
      consentId: 'consent-newsletter',
      value: true,
    });
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('sends a declined value', async () => {
    const { respond, mock } = createMock();
    const { user, currentPath } = renderCreateView([mock]);

    await fillIn(user);
    await user.click(valueToggle());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(currentPath()).toBe('/userConsents/edit/user-consent-1')
    );
    expect(respond.mock.calls[0][0]).toStrictEqual({
      userId: 'user-matteo',
      consentId: 'consent-newsletter',
      value: false,
    });
  });

  it('goes back to the list after save and close', async () => {
    const { respond, mock } = createMock();
    const { user, currentPath } = renderCreateView([mock]);

    await fillIn(user);
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/userConsents'));
    expect(respond).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('sends nothing while the user and the consent are empty', async () => {
    const { respond, mock } = createMock();
    const { user, currentPath } = renderCreateView([mock]);

    await ready();
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(userPicker()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(consentPicker()).toHaveAttribute('aria-invalid', 'true');
    expect(userPicker()).toHaveAccessibleDescription('form.errors.required');
    expect(consentPicker()).toHaveAccessibleDescription('form.errors.required');
    expect(respond).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/userConsents/create');
  });

  it('shows at the consent that the user already answered it and stays on the page', async () => {
    const { respond, mock } = createMock(alreadyAnswered);
    const { user, currentPath } = renderCreateView([mock]);

    await fillIn(user);
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(consentPicker()).toHaveAccessibleDescription(
        'userConsents.alreadyExists'
      )
    );
    expect(consentPicker()).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('userConsents.alreadyExists')).toHaveLength(1);
    expect(
      screen.queryByText('consents.uniqueConstraint')
    ).not.toBeInTheDocument();
    expect(respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/userConsents/create');
    expect(consentPicker()).toHaveValue('Newsletter');
  });

  it('creates the user consent once another consent is picked', async () => {
    const taken = createMock(alreadyAnswered);
    const free = createMock();
    const { user, currentPath } = renderCreateView([taken.mock, free.mock]);

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));
    await waitFor(() =>
      expect(consentPicker()).toHaveAttribute('aria-invalid', 'true')
    );

    await pick(user, consentPicker(), /^Tracking$/);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(currentPath()).toBe('/userConsents/edit/user-consent-1')
    );
    expect(free.respond.mock.calls[0][0]).toStrictEqual({
      userId: 'user-matteo',
      consentId: 'consent-tracking',
      value: true,
    });
  });

  it('shows other server errors as a toast and stays on the page', async () => {
    const { mock } = createMock({
      errors: [{ message: 'Something went wrong' }],
    });
    const { user, currentPath } = renderCreateView([mock]);

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    expect(
      (await screen.findAllByText('Something went wrong')).length
    ).toBeGreaterThan(0);
    expect(currentPath()).toBe('/userConsents/create');
    expect(consentPicker()).not.toHaveAttribute('aria-invalid', 'true');
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderCreateView();

    await fillIn(user);
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/userConsents/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/userConsents'));
  });
});
