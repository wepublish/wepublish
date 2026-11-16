import { screen, waitFor } from '@testing-library/react';
import { Link } from 'react-router-dom';
import { z } from 'zod/v4';

import { drawerClosed, getFieldByLabel, renderFormRoutes } from '../../testing';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { formView } from './form-view';
import { FormPage } from './form-page';
import { useCreateForm, useEditForm } from './use-form-controller';
import { useRouteDrawer } from './use-route-drawer';

vi.mock('@wepublish/ui/editor', async importOriginal => {
  const actual = await importOriginal<typeof import('@wepublish/ui/editor')>();
  const { useBlocker } = await import('react-router-dom');

  return {
    ...actual,
    useUnsavedChangesDialog: (hasChanges: boolean) => {
      useBlocker(
        ({ currentLocation, nextLocation, historyAction }) =>
          hasChanges &&
          historyAction !== 'REPLACE' &&
          currentLocation.pathname !== nextLocation.pathname &&
          !window.confirm('unsavedChangesDialog.message')
      );
    },
  };
});

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
});

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [{ title: 'demo.details', fields: ['name'] }],
});

const elsewhere = <Link to="/elsewhere">elsewhere</Link>;

function CreateView() {
  const demo = useCreateForm(demoView, {
    title: 'demo.titleCreate',
    headerActions: elsewhere,
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function DemoEditForm({ id }: { id: string }) {
  const demo = useEditForm(demoView, {
    title: 'demo.titleEdit',
    load: async () => ({ name: `Konzert ${id}` }),
    save: async () => undefined,
  });

  return <FormDrawerPanel controller={demo} />;
}

const drawerPaths = {
  list: '/demo',
  create: '/demo/create',
  edit: '/demo/edit/:id',
} as const;

function DemoList() {
  const drawer = useRouteDrawer(drawerPaths);

  return (
    <FormDrawer
      open={drawer.open}
      onClose={drawer.close}
    >
      {drawer.id === undefined ? null : (
        <DemoEditForm
          key={drawer.id}
          id={drawer.id}
        />
      )}
    </FormDrawer>
  );
}

const discard = () =>
  screen.getByRole('button', { name: 'form.view.discardChanges.discard' });

describe('the discard prompt on a data router with an unsaved-changes blocker', () => {
  const confirm = vi.fn(() => false);

  beforeEach(() => {
    Object.defineProperty(window, 'confirm', {
      configurable: true,
      writable: true,
      value: confirm,
    });
  });

  afterEach(() => {
    Reflect.deleteProperty(window, 'confirm');
  });

  it('leaves the page after Discard without asking a second time', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.click(discard());

    expect(confirm).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/demo');
  });

  it('still asks before any other navigation leaves a dirty page', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByRole('link', { name: 'elsewhere' }));

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(currentPath()).toBe('/demo/create');
  });

  it('closes the drawer after Discard without asking a second time', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/*': <DemoList /> },
      { route: '/demo/edit/demo-1' }
    );

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert demo-1')
    );
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(discard());

    await drawerClosed();
    expect(confirm).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/demo');
  });

  it('closes the drawer after Escape and Discard without asking a second time', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/*': <DemoList /> },
      { route: '/demo/edit/demo-1' }
    );

    await waitFor(() =>
      expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert demo-1')
    );
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.keyboard('{Escape}');
    await user.click(discard());

    await drawerClosed();
    expect(confirm).not.toHaveBeenCalled();
    expect(currentPath()).toBe('/demo');
  });
});
