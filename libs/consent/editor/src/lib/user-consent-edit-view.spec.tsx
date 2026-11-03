import { screen, waitFor } from '@testing-library/react';
import {
  ConsentsDocument,
  type FullConsentFragment,
  type FullUserConsentFragment,
  type FullUserFragment,
  UpdateUserConsentDocument,
  type UpdateUserConsentMutationVariables,
  UserConsentDocument,
} from '@wepublish/editor/api';
import {
  formSectionOf,
  renderFormRoutes,
  userFixture,
  userListMock,
} from '@wepublish/form/editor/testing';
import { Link } from 'react-router-dom';

import {
  UserConsentEditForm,
  UserConsentEditView,
} from './user-consent-edit-view';

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

const storedUserConsent = (
  id: string,
  consent: FullConsentFragment,
  { id: userId, name, firstName }: FullUserFragment,
  value: boolean
): FullUserConsentFragment => ({
  __typename: 'UserConsent',
  id,
  value,
  createdAt: timestamp,
  modifiedAt: timestamp,
  consent,
  user: { __typename: 'User', id: userId, name, firstName },
});

const matteoNewsletter = storedUserConsent(
  'user-consent-1',
  newsletter,
  matteo,
  true
);

const annaTracking = storedUserConsent('user-consent-2', tracking, anna, false);

const consentsMock = {
  request: { query: ConsentsDocument },
  maxUsageCount: Number.POSITIVE_INFINITY,
  result: { data: { consents: [newsletter, tracking] } },
};

const loadMock = (userConsent = matteoNewsletter, delay?: number) => ({
  request: { query: UserConsentDocument, variables: { id: userConsent.id } },
  result: { data: { userConsent } },
  delay,
});

const updateMock = (result?: object) => {
  const respond = vi.fn(
    (variables: UpdateUserConsentMutationVariables) =>
      result ?? {
        data: {
          updateUserConsent: { ...matteoNewsletter, value: variables.value },
        },
      }
  );

  return {
    respond,
    mock: {
      request: { query: UpdateUserConsentDocument, variables: () => true },
      result: respond,
    },
  };
};

const renderEditView = (
  mocks: object[],
  route = '/userConsents/edit/user-consent-1'
) =>
  renderFormRoutes(
    {
      '/userConsents/edit/:id': (
        <>
          <UserConsentEditView />
          <Link to="/userConsents/edit/user-consent-2">other user consent</Link>
        </>
      ),
    },
    {
      route,
      mocks: [consentsMock, userListMock([matteo, anna]), ...mocks] as never,
    }
  );

const userPicker = () =>
  screen.getByRole<HTMLInputElement>('combobox', {
    name: /^userConsents\.user/,
  });

const consentPicker = () =>
  screen.getByRole<HTMLInputElement>('combobox', {
    name: /^consents\.consent/,
  });

const queryConsentPicker = () =>
  screen.queryByRole<HTMLInputElement>('combobox', {
    name: /^consents\.consent/,
  });

const valueToggle = () =>
  screen.getByRole('checkbox', { name: /^consents\.accepted/ });

const storedUser = 'Matteo Wyss ';

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

const loaded = (consent = 'Newsletter') =>
  waitFor(() => expect(consentPicker()).toHaveValue(consent));

describe('UserConsentEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(UserConsentEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a progress indicator in place of the fields while loading', async () => {
    renderEditView([loadMock(matteoNewsletter, 100)]);

    expect(screen.getByText('userConsents.titleEdit')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryConsentPicker()).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();

    await loaded();

    expect(screen.getByTestId('saveButton')).toBeEnabled();
  });

  it('reports a failed load in place of the fields', async () => {
    renderEditView([
      {
        request: {
          query: UserConsentDocument,
          variables: { id: 'user-consent-1' },
        },
        error: new Error('Server down'),
      },
    ]);

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(queryConsentPicker()).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/userConsents'
    );
  });

  it('shows the header and the stored user, consent and value', async () => {
    renderEditView([loadMock()]);

    await loaded();

    expect(screen.getByText('userConsents.titleEdit')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/userConsents'
    );
    expect(userPicker()).toHaveValue(storedUser);
    expect(valueToggle()).toBeChecked();
  });

  it('shows the user and the consent read only', async () => {
    const { user } = renderEditView([loadMock()]);

    await loaded();

    expect(userPicker()).toHaveAttribute('readonly');
    expect(userPicker()).toBeEnabled();
    expect(consentPicker()).toHaveAttribute('readonly');
    expect(consentPicker()).toBeEnabled();

    await user.click(consentPicker());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('renders its sections as regions', async () => {
    renderEditView([loadMock()]);

    await loaded();

    expect(
      formSectionOf('userConsents.sections.assignment').getByRole('combobox', {
        name: /^consents\.consent/,
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('userConsents.sections.decision').getByRole('checkbox', {
        name: /^consents\.accepted/,
      })
    ).toBeInTheDocument();
  });

  it('saves only the value with the id and stays on the page', async () => {
    const { respond, mock } = updateMock();
    const { user, currentPath } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.click(valueToggle());
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(respond).toHaveBeenCalledTimes(1);
    expect(respond.mock.calls[0][0]).toStrictEqual({
      id: 'user-consent-1',
      value: false,
    });
    expect(currentPath()).toBe('/userConsents/edit/user-consent-1');
    expect(valueToggle()).not.toBeChecked();
    await waitFor(() => expect(leavePage()).toBe(false));
  });

  it('goes back to the list after save and close', async () => {
    const { respond, mock } = updateMock();
    const { user, currentPath } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.click(valueToggle());
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/userConsents'));
    expect(respond).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
  });

  it('stays on the page on a plain save after a failed save and close', async () => {
    const failed = updateMock({ errors: [{ message: 'Server down' }] });
    const saved = updateMock();
    const { user, currentPath } = renderEditView([
      loadMock(),
      failed.mock,
      saved.mock,
    ]);

    await loaded();
    await user.click(valueToggle());
    await user.click(screen.getByTestId('saveAndCloseButton'));

    expect((await screen.findAllByText('Server down')).length).toBeGreaterThan(
      0
    );
    expect(currentPath()).toBe('/userConsents/edit/user-consent-1');

    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(saved.respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/userConsents/edit/user-consent-1');
  });

  it('loads the other user consent when the route switches to it', async () => {
    const { user } = renderEditView([loadMock(), loadMock(annaTracking)]);

    await loaded();
    await user.click(screen.getByRole('link', { name: 'other user consent' }));

    await loaded('Tracking');
    expect(userPicker()).toHaveValue('Anna Keller ');
    expect(valueToggle()).not.toBeChecked();
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderEditView([loadMock()]);

    await loaded();
    await user.click(valueToggle());
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', {
          name: 'form.view.discardChanges.title',
        })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/userConsents/edit/user-consent-1');
    expect(valueToggle()).not.toBeChecked();
  });
});
