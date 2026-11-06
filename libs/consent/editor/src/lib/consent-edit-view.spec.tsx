import { screen, waitFor } from '@testing-library/react';
import { ConsentDocument, UpdateConsentDocument } from '@wepublish/editor/api';
import {
  getFieldByLabel,
  queryFieldByLabel,
  renderEditorForm,
} from '@wepublish/form/editor/testing';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { Link, Route, Routes, useLocation } from 'react-router-dom';

import { ConsentEditForm, ConsentEditView } from './consent-edit-view';

vi.mock('node-fetch', () => ({ default: vi.fn() }));

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        consents: { uniqueConstraint: 'Slug «{{slug}}» is taken' },
      },
    },
  },
});

type ConsentValues = {
  name: string;
  slug: string;
  defaultValue: boolean;
};

const storedConsent = (id: string, values: ConsentValues) => ({
  __typename: 'Consent' as const,
  id,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-02T00:00:00.000Z',
  ...values,
});

const newsletter: ConsentValues = {
  name: 'Newsletter',
  slug: 'newsletter',
  defaultValue: false,
};

const loadMock = (
  id = 'consent-1',
  values: ConsentValues = newsletter,
  delay?: number
) => ({
  request: { query: ConsentDocument, variables: { id } },
  result: { data: { consent: storedConsent(id, values) } },
  delay,
});

const updateMock = (
  variables: ConsentValues & { id: string },
  result: object = {
    data: { updateConsent: storedConsent(variables.id, variables) },
  }
) => {
  const respond = vi.fn(() => result);

  return {
    respond,
    mock: {
      request: { query: UpdateConsentDocument, variables },
      result: respond,
    },
  };
};

function CurrentPath() {
  const { pathname } = useLocation();

  return <p data-testid="current-path">{pathname}</p>;
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <Routes>
        <Route
          path="/consents/edit/:id"
          element={<ConsentEditView />}
        />
        <Route
          path="/consents"
          element={<p>consent list</p>}
        />
      </Routes>
      <CurrentPath />
      <Link to="/consents/edit/consent-2">other consent</Link>
    </I18nextProvider>
  );
}

const renderEditView = (mocks: object[], route = '/consents/edit/consent-1') =>
  renderEditorForm(<App />, { mocks: mocks as never, route });

const currentPath = () => screen.getByTestId('current-path').textContent;

const nameLabel = 'consents.name*';
const slugLabel = 'consents.slug*';

const defaultValueCheckbox = () =>
  screen.getByRole('checkbox', { name: /^consents\.checkedByDefault/ });

const loaded = async () =>
  waitFor(() => expect(getFieldByLabel(nameLabel)).toHaveValue('Newsletter'));

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

describe('ConsentEditView', () => {
  it('is memoised by the React Compiler', () => {
    expect(ConsentEditForm.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header and a progress indicator in place of the fields while loading', async () => {
    renderEditView([loadMock('consent-1', newsletter, 100)]);

    expect(screen.getByText('consents.titleEdit')).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();

    await loaded();

    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeEnabled();
  });

  it('reports a failed load in place of the fields and as a toast', async () => {
    renderEditView([
      {
        request: { query: ConsentDocument, variables: { id: 'consent-1' } },
        error: new Error('Server down'),
      },
    ]);

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getAllByText('Server down')).toHaveLength(2);
    expect(queryFieldByLabel(nameLabel)).not.toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/consents'
    );
  });

  it('warns about unsaved changes until they are saved', async () => {
    const { mock } = updateMock({
      id: 'consent-1',
      ...newsletter,
      name: 'Newsletter weekly',
    });
    const { user } = renderEditView([loadMock(), mock]);

    await loaded();

    expect(leavePage()).toBe(false);

    await user.type(getFieldByLabel(nameLabel), ' weekly');

    await waitFor(() => expect(leavePage()).toBe(true));

    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    await waitFor(() => expect(leavePage()).toBe(false));
  });

  it('shows the header and the stored values', async () => {
    renderEditView([loadMock()]);

    await loaded();

    expect(screen.getByText('consents.titleEdit')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/consents'
    );
    expect(getFieldByLabel(slugLabel)).toHaveValue('newsletter');
    expect(defaultValueCheckbox()).not.toBeChecked();
  });

  it('loads the other consent when the route switches to it', async () => {
    const { user } = renderEditView([
      loadMock(),
      loadMock('consent-2', {
        name: 'Tracking',
        slug: 'tracking',
        defaultValue: true,
      }),
    ]);

    await loaded();
    await user.click(screen.getByRole('link', { name: 'other consent' }));

    await waitFor(() =>
      expect(getFieldByLabel(nameLabel)).toHaveValue('Tracking')
    );
    expect(getFieldByLabel(slugLabel)).toHaveValue('tracking');
    expect(defaultValueCheckbox()).toBeChecked();
  });

  it('saves the changes with the id and stays on the page', async () => {
    const { respond, mock } = updateMock({
      id: 'consent-1',
      name: 'Newsletter weekly',
      slug: 'newsletter',
      defaultValue: true,
    });
    const { user } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.type(getFieldByLabel(nameLabel), ' weekly');
    await user.click(defaultValueCheckbox());
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/consents/edit/consent-1');
    expect(getFieldByLabel(nameLabel)).toHaveValue('Newsletter weekly');
    expect(defaultValueCheckbox()).toBeChecked();
  });

  it('goes back to the consent list after save and close', async () => {
    const { respond, mock } = updateMock({
      id: 'consent-1',
      ...newsletter,
      slug: 'newsletter-weekly',
    });
    const { user } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.type(getFieldByLabel(slugLabel), '-weekly');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents'));
    expect(respond).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
  });

  it('marks a cleared name as invalid and sends nothing', async () => {
    const { respond, mock } = updateMock({
      id: 'consent-1',
      ...newsletter,
      name: '',
    });
    const { user } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.clear(getFieldByLabel(nameLabel));
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel(nameLabel)).toHaveAttribute('aria-invalid', 'true')
    );
    expect(getFieldByLabel(nameLabel)).toHaveAccessibleDescription(
      'form.errors.required'
    );
    expect(respond).not.toHaveBeenCalled();
  });

  it('shows a taken slug at the slug field and stays on the page', async () => {
    const { respond, mock } = updateMock(
      { id: 'consent-1', ...newsletter, slug: 'tracking' },
      {
        errors: [
          { message: 'Unique constraint failed on the fields: (`slug`)' },
        ],
      }
    );
    const { user } = renderEditView([loadMock(), mock]);

    await loaded();
    await user.clear(getFieldByLabel(slugLabel));
    await user.type(getFieldByLabel(slugLabel), 'tracking');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(getFieldByLabel(slugLabel)).toHaveAccessibleDescription(
        'Slug «tracking» is taken'
      )
    );
    expect(screen.getAllByText('Slug «tracking» is taken')).toHaveLength(1);
    expect(respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/consents/edit/consent-1');
    expect(getFieldByLabel(slugLabel)).toHaveValue('tracking');
    await waitFor(() => expect(leavePage()).toBe(true));
  });
});
