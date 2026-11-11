import { screen, waitFor } from '@testing-library/react';
import { setFieldError } from '@wepublish/form/core';
import { AuthContext } from '@wepublish/ui/editor';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import { formHeader, getFieldByLabel, renderFormRoutes } from '../../testing';
import { formView } from './form-view';
import { FormPage } from './form-page';
import {
  useCreateForm,
  useEditForm,
  useSingletonForm,
  type SaveContext,
} from './use-form-controller';
import { uniqueConstraint } from './unique-constraint';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().min(1).meta({ label: 'demo.slug' }),
  visible: z.boolean().meta({ label: 'demo.visible' }),
});

type Values = z.output<typeof schema>;

type Save = (
  values: Values,
  context: SaveContext<typeof schema>
) => Promise<unknown>;

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [{ title: 'demo.details', fields: ['name', 'slug', 'visible'] }],
  serverErrors: [
    {
      match: uniqueConstraint('slug'),
      path: 'slug',
      error: 'demo.slugTaken',
    },
    {
      match: uniqueConstraint('name'),
      path: 'name',
      error: 'demo.nameTaken',
      modes: ['edit'],
    },
  ],
});

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        demo: {
          slugTaken: 'Slug «{{slug}}» is taken',
          nameTaken: 'Name «{{name}}» is taken',
        },
      },
    },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const stored: Values = { name: 'Konzert', slug: 'konzert', visible: false };

function CreateView({
  save,
  successToast,
}: {
  save: Save;
  successToast?: string | false;
}) {
  const demo = useCreateForm(demoView, {
    title: 'demo.titleCreate',
    successToast,
    save: async (values, context) => {
      const id = await save(values, context);

      return typeof id === 'string' ? id : undefined;
    },
  });

  return <FormPage controller={demo} />;
}

const EDIT_PERMISSIONS = ['CAN_EDIT_DEMO'];

function EditView({
  save,
  writePermissions,
  successToast,
}: {
  save: Save;
  writePermissions?: string[];
  successToast?: string | false;
}) {
  const demo = useEditForm(demoView, {
    title: 'demo.titleEdit',
    writePermissions,
    successToast,
    load: async () => stored,
    save,
  });

  return <FormPage controller={demo} />;
}

function SingletonView({ save }: { save: Save }) {
  const demo = useSingletonForm(demoView, {
    title: 'demo.settings',
    load: async () => stored,
    save,
  });

  return <FormPage controller={demo} />;
}

const slugTaken = () =>
  new Error('Unique constraint failed on the constraint: `demo_slug_key`');

const nameTaken = () =>
  new Error('Unique constraint failed on the constraint: `demo_name_key`');

const renderCreate = (save: Save, successToast?: string | false) =>
  renderFormRoutes(
    {
      '/demo/create': (
        <CreateView
          save={save}
          successToast={successToast}
        />
      ),
    },
    { route: '/demo/create', wrapper: Translated }
  );

const renderEdit = (
  save: Save,
  options: { writePermissions?: string[]; successToast?: string | false } = {}
) =>
  renderFormRoutes(
    {
      '/demo/edit/:id': (
        <EditView
          save={save}
          {...options}
        />
      ),
    },
    { route: '/demo/edit/demo-1', wrapper: Translated }
  );

const fillIn = async (user: ReturnType<typeof renderCreate>['user']) => {
  await user.type(getFieldByLabel('demo.name*'), 'Konzert');
  await user.type(getFieldByLabel('demo.slug*'), 'konzert');
};

const loaded = () =>
  waitFor(() => expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert'));

const leavePage = () => {
  const event = new Event('beforeunload', { cancelable: true });

  window.dispatchEvent(event);

  return event.defaultPrevented;
};

describe('useCreateForm', () => {
  it('saves and opens the new record for editing', async () => {
    const save = vi.fn<Save>(async () => 'demo-7');
    const { user, currentPath } = renderCreate(save);

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/demo/edit/demo-7'));
    expect(save).toHaveBeenCalledWith(
      { name: 'Konzert', slug: 'konzert', visible: false },
      expect.objectContaining({ intent: 'save', mode: 'create' })
    );
    expect(await screen.findByText('toast.createdSuccess')).toBeInTheDocument();
  });

  it('goes to the list after save and close, or when no id comes back', async () => {
    const { user, currentPath, unmount } = renderCreate(async () => 'demo-7');

    await fillIn(user);
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/demo'));

    unmount();

    const again = renderCreate(async () => undefined);

    await fillIn(again.user);
    await again.user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(again.currentPath()).toBe('/demo'));
  });

  it('shows a matched server error at its field with default params', async () => {
    const { user, currentPath } = renderCreate(async () => {
      throw slugTaken();
    });

    await fillIn(user);
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.slug*')).toHaveAccessibleDescription(
        'Slug «konzert» is taken'
      )
    );
    expect(screen.getAllByText('Slug «konzert» is taken')).toHaveLength(1);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByText('toast.createdSuccess')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/demo/create');
    expect(leavePage()).toBe(true);
  });

  it('applies a rule only in the modes it lists', async () => {
    const { user, currentPath } = renderCreate(async () => {
      throw nameTaken();
    });

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    expect(
      await screen.findByText('form.errors.server', {
        selector: '.MuiAlert-message',
      })
    ).toBeInTheDocument();
    expect(getFieldByLabel('demo.name*')).not.toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(currentPath()).toBe('/demo/create');
  });

  it('reports an unknown error as a toast and an inline alert until the next submit', async () => {
    const save = vi
      .fn<Save>()
      .mockRejectedValueOnce(new Error('Something went wrong'))
      .mockResolvedValueOnce('demo-7');
    const { user, currentPath } = renderCreate(save);

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByText('form.errors.server', { selector: '.MuiAlert-message' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/create');

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/demo/edit/demo-7'));
  });

  it('stays without a toast when save sets field errors itself', async () => {
    const { user, currentPath } = renderCreate(async (_values, { form }) => {
      setFieldError(form, 'name', 'demo.nameTaken', { name: 'Konzert' });

      return 'demo-7';
    });

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveAccessibleDescription(
        'Name «Konzert» is taken'
      )
    );
    expect(screen.queryByText('toast.createdSuccess')).not.toBeInTheDocument();
    expect(currentPath()).toBe('/demo/create');
  });

  it('shows another toast key, or none', async () => {
    const { user, unmount } = renderCreate(async () => 'demo-7', 'demo.saved');

    await fillIn(user);
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('demo.saved')).toBeInTheDocument();

    unmount();

    const quiet = renderCreate(async () => 'demo-7', false);

    await fillIn(quiet.user);
    await quiet.user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(quiet.currentPath()).toBe('/demo/edit/demo-7'));
    expect(screen.queryByText('toast.createdSuccess')).not.toBeInTheDocument();
  });
});

describe('useEditForm', () => {
  it('saves, stays on the page and is clean again', async () => {
    const save = vi.fn<Save>(async () => undefined);
    const { user, currentPath } = renderEdit(save);

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByRole('checkbox', { name: 'demo.visible' }));
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith(
      { name: 'Konzert live', slug: 'konzert', visible: true },
      expect.objectContaining({
        intent: 'save',
        mode: 'edit',
        changed: { name: 'Konzert live', visible: true },
        changedKeys: ['name', 'visible'],
      })
    );
    expect(currentPath()).toBe('/demo/edit/demo-1');
    await waitFor(() => expect(leavePage()).toBe(false));
  });

  it('goes back to the list after save and close', async () => {
    const { user, currentPath } = renderEdit(async () => undefined);

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await waitFor(() => expect(currentPath()).toBe('/demo'));
  });

  it('applies an edit-only rule in edit mode', async () => {
    const { user } = renderEdit(async () => {
      throw nameTaken();
    });

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveAccessibleDescription(
        'Name «Konzert live» is taken'
      )
    );
  });

  it('turns read-only without the write permission', async () => {
    renderFormRoutes(
      {
        '/demo/edit/:id': (
          <EditView
            save={async () => undefined}
            writePermissions={EDIT_PERMISSIONS}
          />
        ),
      },
      {
        route: '/demo/edit/demo-1',
        wrapper: ({ children }) => (
          <AuthContext.Provider
            value={{
              session: {
                email: 'reader@wepublish.ch',
                sessionToken: 'token',
                sessionRoles: [],
              },
            }}
          >
            {children}
          </AuthContext.Provider>
        ),
      }
    );

    await loaded();

    expect(screen.getByText('form.view.readOnly')).toBeInTheDocument();
    expect(screen.queryByTestId('saveButton')).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
    expect(getFieldByLabel('demo.name*')).toBeDisabled();
    expect(screen.getByRole('link', { name: 'back' })).toBeInTheDocument();
  });

  it('stays writable without a session to check', async () => {
    renderEdit(async () => undefined, { writePermissions: EDIT_PERMISSIONS });

    await loaded();

    expect(screen.queryByText('form.view.readOnly')).not.toBeInTheDocument();
    expect(getFieldByLabel('demo.name*')).toBeEnabled();
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
  });
});

describe('useSingletonForm', () => {
  it('saves in place without navigating', async () => {
    const save = vi.fn<Save>(async () => undefined);
    const { user, currentPath } = renderFormRoutes(
      { '/settings': <SingletonView save={save} /> },
      { route: '/settings' }
    );

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByTestId('saveButton'));

    expect(await screen.findByText('toast.updatedSuccess')).toBeInTheDocument();
    expect(save).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ mode: 'singleton', changedKeys: ['name'] })
    );
    expect(currentPath()).toBe('/settings');
    expect(formHeader().queryByRole('link')).not.toBeInTheDocument();
  });
});
