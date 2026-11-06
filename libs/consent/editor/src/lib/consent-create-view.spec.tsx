import { screen, waitFor } from '@testing-library/react';
import { CreateConsentDocument } from '@wepublish/editor/api';
import {
  formSectionOf,
  getFieldByLabel,
  renderEditorForm,
} from '@wepublish/form/editor/testing';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { Route, Routes, useLocation } from 'react-router-dom';

import { ConsentCreateView } from './consent-create-view';

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

type ConsentVariables = {
  name: string;
  slug: string;
  defaultValue: boolean;
};

const createdConsent = (variables: ConsentVariables) => ({
  __typename: 'Consent' as const,
  id: 'consent-1',
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  ...variables,
});

const createMock = (
  variables: ConsentVariables,
  result: object = { data: { createConsent: createdConsent(variables) } },
  delay?: number
) => {
  const respond = vi.fn(() => result);

  return {
    respond,
    mock: {
      request: { query: CreateConsentDocument, variables },
      result: respond,
      delay,
    },
  };
};

const slugTaken = {
  errors: [{ message: 'Unique constraint failed on the fields: (`slug`)' }],
};

const slugTakenToday = {
  errors: [
    {
      message:
        '\nInvalid `this.prisma.consent.create()` invocation in\n/app/main.js:93374:46\n\n→ 93374         return yield this.prisma.consent.create(\nUnique constraint failed on the constraint: `consents_slug_key`',
    },
  ],
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
          path="/consents/create"
          element={<ConsentCreateView />}
        />
        <Route
          path="/consents/edit/:id"
          element={<p>edit page</p>}
        />
        <Route
          path="/consents"
          element={<p>consent list</p>}
        />
      </Routes>
      <CurrentPath />
    </I18nextProvider>
  );
}

const renderCreateView = (mocks: object[] = []) =>
  renderEditorForm(<App />, {
    mocks: mocks as never,
    route: '/consents/create',
  });

const currentPath = () => screen.getByTestId('current-path').textContent;

const nameLabel = 'consents.name*';
const slugLabel = 'consents.slug*';

const defaultValueCheckbox = () =>
  screen.getByRole('checkbox', { name: /^consents\.checkedByDefault/ });

const fillIn = async (
  user: ReturnType<typeof renderCreateView>['user'],
  { name, slug }: { name: string; slug: string }
) => {
  await user.type(getFieldByLabel(nameLabel), name);
  await user.type(getFieldByLabel(slugLabel), slug);
};

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

describe('ConsentCreateView', () => {
  it('is memoised by the React Compiler', () => {
    expect(ConsentCreateView.toString()).toMatch(/\$\[\d+\]/);
  });

  it('shows the header with a back link and both save buttons', () => {
    renderCreateView();

    expect(screen.getByText('consents.titleCreate')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/consents'
    );
    expect(screen.getByTestId('saveButton')).toHaveTextContent('save');
    expect(screen.getByTestId('saveAndCloseButton')).toHaveTextContent(
      'saveAndClose'
    );
  });

  it('starts with an empty name and slug and a checked default value', () => {
    renderCreateView();

    expect(getFieldByLabel(nameLabel)).toHaveValue('');
    expect(getFieldByLabel(slugLabel)).toHaveValue('');
    expect(defaultValueCheckbox()).toBeChecked();
  });

  it('marks name and slug as required but not the default value', () => {
    renderCreateView();

    expect(getFieldByLabel(nameLabel)).toBeRequired();
    expect(getFieldByLabel(slugLabel)).toBeRequired();
    expect(defaultValueCheckbox()).not.toBeRequired();
  });

  it('explains the slug and the default value in tooltips', () => {
    renderCreateView();

    expect(
      screen.getByRole('button', { name: 'consents.slugInfo' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'consents.defaultValueInfo' })
    ).toBeInTheDocument();
  });

  it('marks name and slug as invalid and sends nothing when they are empty', async () => {
    const { respond, mock } = createMock({
      name: '',
      slug: '',
      defaultValue: true,
    });
    const { user } = renderCreateView([mock]);

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel(nameLabel)).toHaveAttribute('aria-invalid', 'true')
    );
    expect(getFieldByLabel(slugLabel)).toHaveAttribute('aria-invalid', 'true');
    expect(getFieldByLabel(nameLabel)).toHaveAccessibleDescription(
      'form.errors.required'
    );
    expect(getFieldByLabel(slugLabel)).toHaveAccessibleDescription(
      'form.errors.required'
    );
    expect(respond).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/consents/create');
  });

  it('shows the required error as soon as an empty name is left', async () => {
    const { user } = renderCreateView();

    await user.click(getFieldByLabel(nameLabel));
    await user.tab();

    await waitFor(() =>
      expect(getFieldByLabel(nameLabel)).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(getFieldByLabel(slugLabel)).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('creates the consent and opens it for editing', async () => {
    const { respond, mock } = createMock({
      name: 'Newsletter',
      slug: 'newsletter',
      defaultValue: true,
    });
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
    expect(respond).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('saves with Enter and opens the consent for editing', async () => {
    const { respond, mock } = createMock({
      name: 'Newsletter',
      slug: 'newsletter',
      defaultValue: true,
    });
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.keyboard('{Enter}');

    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
    expect(respond).toHaveBeenCalledTimes(1);
  });

  it('sends the default value the user unchecked', async () => {
    const { respond, mock } = createMock({
      name: 'Tracking',
      slug: 'tracking',
      defaultValue: false,
    });
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Tracking', slug: 'tracking' });
    await user.click(defaultValueCheckbox());
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
    expect(respond).toHaveBeenCalledTimes(1);
  });

  it('goes back to the consent list after save and close', async () => {
    const { respond, mock } = createMock({
      name: 'Newsletter',
      slug: 'newsletter',
      defaultValue: true,
    });
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents'));
    expect(respond).toHaveBeenCalledTimes(1);
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('disables both save buttons while the consent is being created', async () => {
    const { mock } = createMock(
      { name: 'Newsletter', slug: 'newsletter', defaultValue: true },
      undefined,
      200
    );
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(screen.getByTestId('saveButton')).toBeDisabled()
    );
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
  });

  it('shows a taken slug at the slug field and stays on the page', async () => {
    const { respond, mock } = createMock(
      { name: 'Newsletter', slug: 'newsletter', defaultValue: true },
      slugTaken
    );
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(getFieldByLabel(slugLabel)).toHaveAccessibleDescription(
        'Slug «newsletter» is taken'
      )
    );
    expect(getFieldByLabel(slugLabel)).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getAllByText('Slug «newsletter» is taken')).toHaveLength(1);
    expect(respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/consents/create');
    expect(getFieldByLabel(nameLabel)).toHaveValue('Newsletter');
  });

  it('shows a taken slug from the message the API sends today', async () => {
    const { respond, mock } = createMock(
      { name: 'Newsletter', slug: 'newsletter', defaultValue: true },
      slugTakenToday
    );
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel(slugLabel)).toHaveAccessibleDescription(
        'Slug «newsletter» is taken'
      )
    );
    expect(respond).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/consents/create');
  });

  it('creates the consent once the taken slug is changed', async () => {
    const taken = createMock(
      { name: 'Newsletter', slug: 'newsletter', defaultValue: true },
      slugTaken
    );
    const free = createMock({
      name: 'Newsletter',
      slug: 'newsletter-2',
      defaultValue: true,
    });
    const { user } = renderCreateView([taken.mock, free.mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveButton'));
    await waitFor(() =>
      expect(getFieldByLabel(slugLabel)).toHaveAttribute('aria-invalid', 'true')
    );

    await user.type(getFieldByLabel(slugLabel), '-2');

    await waitFor(() =>
      expect(getFieldByLabel(slugLabel)).not.toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
    expect(free.respond).toHaveBeenCalledTimes(1);
  });

  it('shows other server errors as a toast and stays on the page', async () => {
    const { mock } = createMock(
      { name: 'Newsletter', slug: 'newsletter', defaultValue: true },
      { errors: [{ message: 'Something went wrong' }] }
    );
    const { user } = renderCreateView([mock]);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(currentPath()).toBe('/consents/create');
    expect(getFieldByLabel(slugLabel)).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('renders its sections as regions', () => {
    renderCreateView();

    expect(
      formSectionOf('consents.consent').getByLabelText(nameLabel, {
        selector: 'input',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('consents.consent').getByLabelText(slugLabel, {
        selector: 'input',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('consents.defaultValue').getByRole('checkbox', {
        name: /^consents\.checkedByDefault/,
      })
    ).toBeInTheDocument();
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user } = renderCreateView();

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/consents/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await waitFor(() => expect(currentPath()).toBe('/consents'));
  });

  it('warns about unsaved changes until the consent is created', async () => {
    const { mock } = createMock({
      name: 'Newsletter',
      slug: 'newsletter',
      defaultValue: true,
    });
    const { user } = renderCreateView([mock]);

    expect(leavePage()).toBe(false);

    await fillIn(user, { name: 'Newsletter', slug: 'newsletter' });

    await waitFor(() => expect(leavePage()).toBe(true));

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/consents/edit/consent-1'));
    expect(leavePage()).toBe(false);
  });
});
