import { screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import { drawerClosed, getFieldByLabel, renderFormRoutes } from '../../testing';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { formView } from './form-view';
import { useCreateForm, useEditForm } from './use-form-controller';
import { useRouteDrawer } from './use-route-drawer';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().meta({ label: 'demo.slug' }),
});

type Values = z.input<typeof schema>;

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [
    { fields: ['name'] },
    { title: 'demo.advanced', fields: ['slug'] },
  ],
});

const drawerPaths = {
  list: '/demo',
  create: '/demo/create',
  edit: '/demo/edit/:id',
} as const;

type Load = (id: string) => Promise<Values>;

function DemoCreateForm() {
  const demo = useCreateForm(demoView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-7',
  });

  return <FormDrawerPanel controller={demo} />;
}

function DemoEditForm({ id, load }: { id: string; load: Load }) {
  const demo = useEditForm(demoView, {
    title: 'demo.titleEdit',
    load: () => load(id),
    save: async () => undefined,
  });

  return <FormDrawerPanel controller={demo} />;
}

function DemoList({ load }: { load: Load }) {
  const drawer = useRouteDrawer(drawerPaths);

  return (
    <>
      <p>demo list</p>
      <FormDrawer
        open={drawer.open}
        onClose={drawer.close}
      >
        {drawer.mode === 'edit' && drawer.id !== undefined ?
          <DemoEditForm
            key={drawer.id}
            id={drawer.id}
            load={load}
          />
        : <DemoCreateForm />}
      </FormDrawer>
    </>
  );
}

const loadStored: Load = async () => ({ name: 'Konzert', slug: 'konzert' });

const renderList = (route: string, load: Load = loadStored) =>
  renderFormRoutes({ '/demo/*': <DemoList load={load} /> }, { route });

const loaded = () =>
  waitFor(() => expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert'));

const discardPrompt = () =>
  screen.getByRole('dialog', { name: 'form.view.discardChanges.title' });

describe('FormDrawer', () => {
  it('mounts no form and loads nothing while closed', () => {
    const load = vi.fn(loadStored);

    renderList('/demo', load);

    expect(screen.getByText('demo list')).toBeInTheDocument();
    expect(document.querySelector('form')).toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('opens the record of the route with its title and sections', async () => {
    renderList('/demo/edit/demo-1');

    await loaded();

    const drawer = screen.getByRole('presentation');

    expect(
      within(drawer).getByRole('heading', { level: 2, name: 'demo.titleEdit' })
    ).toBeInTheDocument();
    expect(
      within(drawer).getByRole('heading', { level: 3, name: 'demo.advanced' })
    ).toBeInTheDocument();
    expect(within(drawer).getByTestId('saveButton')).toBeInTheDocument();
    expect(
      within(drawer).getByTestId('saveAndCloseButton')
    ).toBeInTheDocument();
  });

  it('names the drawer dialog after the form title', async () => {
    renderList('/demo/edit/demo-1');

    await loaded();

    expect(
      screen.getByRole('dialog', { name: 'demo.titleEdit' })
    ).toBeInTheDocument();
  });

  it('keeps a long title on one line with the full text on hover', async () => {
    renderList('/demo/edit/demo-1');

    await loaded();

    const title = within(screen.getByRole('presentation')).getByRole(
      'heading',
      { level: 2, name: 'demo.titleEdit' }
    );

    expect(title).toHaveAttribute('title', 'demo.titleEdit');
    expect(getComputedStyle(title).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis');
  });

  it('closes a clean form through the close button without asking', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.click(screen.getByRole('button', { name: 'close' }));

    await drawerClosed();
    expect(currentPath()).toBe('/demo');
  });

  it('asks before closing a dirty form through the close button', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByRole('button', { name: 'close' }));

    expect(discardPrompt()).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/edit/demo-1');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert live');

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    await drawerClosed();
    expect(currentPath()).toBe('/demo');
  });

  it('asks before Escape closes a dirty form', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.keyboard('{Escape}');

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/edit/demo-1');
  });

  it('keeps the drawer and its edits when Escape or a backdrop click dismisses the prompt', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/edit/demo-1');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert live');

    await user.click(screen.getByRole('button', { name: 'close' }));
    await user.click(
      document.querySelector('.MuiDialog-container') as HTMLElement
    );

    await waitFor(() =>
      expect(
        screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
      ).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/edit/demo-1');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert live');
  });

  it('asks before a backdrop click closes a dirty form', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(
      document.querySelector('.MuiBackdrop-root') as HTMLElement
    );

    expect(discardPrompt()).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/edit/demo-1');
  });

  it('closes after save and close without asking', async () => {
    const { user, currentPath } = renderList('/demo/edit/demo-1');

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByTestId('saveAndCloseButton'));

    await drawerClosed();
    expect(currentPath()).toBe('/demo');
    expect(
      screen.queryByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).not.toBeInTheDocument();
  });

  it('stays open on the new record after save', async () => {
    const { user, currentPath } = renderList('/demo/create');

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(currentPath()).toBe('/demo/edit/demo-7'));
    await loaded();
    expect(
      screen.getByRole('heading', { level: 2, name: 'demo.titleEdit' })
    ).toBeInTheDocument();
  });
});
