import { screen, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import type { CSSProperties, ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import {
  formHeader,
  getFieldByLabel,
  renderEditorForm,
  renderFormRoutes,
} from '../../testing';
import { formView } from './form-view';
import { FormPage } from './form-page';
import {
  useCreateForm,
  useEditForm,
  useSingletonForm,
} from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  slug: z.string().meta({ label: 'demo.slug' }),
});

type Values = z.input<typeof schema>;

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [{ title: 'demo.details', fields: ['name', 'slug'] }],
});

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: { translation: { demo: { titleEdit: 'Edit {{name}}' } } },
  },
});

function Translated({ children }: { children: ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}

const titleParams = ({ name }: { name: string }) => ({ name: name || '…' });

function CreateView({
  save = async () => 'demo-1',
}: {
  save?: () => Promise<string | undefined>;
}) {
  const demo = useCreateForm(demoView, { title: 'demo.titleCreate', save });

  return <FormPage controller={demo} />;
}

function EditView({
  load,
  save = async () => undefined,
  live = false,
}: {
  load: () => Promise<Values>;
  save?: () => Promise<unknown>;
  live?: boolean;
}) {
  const demo = useEditForm(demoView, {
    title: 'demo.titleEdit',
    titleParams: live ? titleParams : undefined,
    load,
    save,
  });

  return <FormPage controller={demo} />;
}

function SingletonView({ load }: { load: () => Promise<Values> }) {
  const demo = useSingletonForm(demoView, {
    title: 'demo.settings',
    load,
    save: async () => undefined,
  });

  return <FormPage controller={demo} />;
}

function SingletonSubPageView({ load }: { load: () => Promise<Values> }) {
  const demo = useSingletonForm(demoView, {
    title: 'demo.analytics',
    closePath: '/demo/settings',
    load,
    save: async () => undefined,
  });

  return <FormPage controller={demo} />;
}

const pathlessView = formView(schema, {
  sections: [{ title: 'demo.details', fields: ['name', 'slug'] }],
});

function PathlessCreateView() {
  const demo = useCreateForm(pathlessView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function PathlessEditView() {
  const demo = useEditForm(pathlessView, {
    title: 'demo.titleEdit',
    load: async () => ({ name: 'Konzert', slug: 'konzert' }),
    save: async () => undefined,
  });

  return <FormPage controller={demo} />;
}

const elsewherePaths = {
  list: '/elsewhere',
  edit: (id: string) => `/elsewhere/${id}`,
};

function HookPathsCreateView() {
  const demo = useCreateForm(pathlessView, {
    title: 'demo.titleCreate',
    paths: elsewherePaths,
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

const loadStored = () => Promise.resolve({ name: 'Konzert', slug: 'konzert' });

const loaded = () =>
  waitFor(() => expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert'));

describe('FormPage', () => {
  it('shows the title, a back link to the list and both save buttons', () => {
    renderEditorForm(<CreateView />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'demo.titleCreate' })
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/demo'
    );
    expect(screen.getByTestId('saveButton')).toHaveTextContent('save');
    expect(screen.getByTestId('saveButton')).toHaveAttribute('type', 'submit');
    expect(screen.getByTestId('saveAndCloseButton')).toHaveTextContent(
      'saveAndClose'
    );
  });

  it('keeps the form header out of the page landmarks', () => {
    renderEditorForm(<CreateView />);

    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(formHeader().getByTestId('saveButton')).toBeInTheDocument();
  });

  it('keeps a live title in step with the form values', async () => {
    const { user } = renderEditorForm(
      <Translated>
        <EditView
          load={loadStored}
          live
        />
      </Translated>
    );

    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit …' })
    ).toBeInTheDocument();

    await loaded();

    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit Konzert' })
    ).toBeInTheDocument();

    await user.type(getFieldByLabel('demo.name*'), ' live');

    expect(
      screen.getByRole('heading', { level: 1, name: 'Edit Konzert live' })
    ).toBeInTheDocument();
  });

  it('keeps a long title on one line with the full text on hover and in its name', async () => {
    const question =
      'Wie oft sollte die Gemeinde die Strassenbeleuchtung in der Nacht abschalten, um Energie zu sparen?';
    const { user } = renderEditorForm(
      <Translated>
        <EditView
          load={loadStored}
          live
        />
      </Translated>
    );

    await loaded();
    await user.clear(getFieldByLabel('demo.name*'));
    await user.type(getFieldByLabel('demo.name*'), question);

    const title = screen.getByRole('heading', {
      level: 1,
      name: `Edit ${question}`,
    });

    expect(title).toHaveAttribute('title', `Edit ${question}`);
    expect(getComputedStyle(title).whiteSpace).toBe('nowrap');
    expect(getComputedStyle(title).textOverflow).toBe('ellipsis');
    expect(getComputedStyle(title).overflow).toBe('hidden');
  });

  it('draws the header without a rule below it', () => {
    renderEditorForm(<CreateView />);

    expect(
      getComputedStyle(screen.getByTestId('formHeader')).borderBottomStyle
    ).not.toBe('solid');
  });

  it('places the title where a list page places its title', () => {
    renderEditorForm(
      <div
        style={
          {
            '--wep-page-padding-y': '32px',
            '--wep-page-padding-x': '24px',
          } as CSSProperties
        }
      >
        <CreateView />
      </div>
    );

    const header = getComputedStyle(screen.getByTestId('formHeader'));

    expect(header.paddingTop).toBe('32px');
    expect(header.paddingLeft).toBe('24px');
    expect(header.paddingRight).toBe('24px');
  });

  it('disables the save buttons while loading and after a failed load', async () => {
    const { unmount } = renderEditorForm(
      <EditView load={() => new Promise(() => undefined)} />
    );

    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();

    unmount();
    renderEditorForm(
      <EditView load={() => Promise.reject(new Error('Server down'))} />
    );

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.getByTestId('saveButton')).toBeDisabled();
    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/demo'
    );
  });

  it('shows progress on the buttons while saving and keeps the title', async () => {
    let finish: () => void = () => undefined;
    const { user } = renderEditorForm(
      <EditView
        load={loadStored}
        save={() => new Promise<void>(done => (finish = done))}
      />
    );

    await loaded();
    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(screen.getByTestId('saveButton')).toBeDisabled()
    );
    expect(screen.getByTestId('saveAndCloseButton')).toBeDisabled();
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0);
    expect(
      screen.getByRole('heading', { level: 1, name: 'demo.titleEdit' })
    ).toBeInTheDocument();

    finish();

    await waitFor(() => expect(screen.getByTestId('saveButton')).toBeEnabled());
  });

  it('tells sticky content below how tall the header is', async () => {
    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}

        observe() {
          this.callback(
            [
              {
                contentRect: { height: 66 },
                borderBoxSize: [{ blockSize: 66, inlineSize: 800 }],
              } as unknown as ResizeObserverEntry,
            ],
            this as unknown as ResizeObserver
          );
        }

        unobserve = vi.fn();
        disconnect = vi.fn();
      }
    );

    renderEditorForm(<CreateView />);

    await waitFor(() =>
      expect(
        getFieldByLabel('demo.name*')
          .closest<HTMLElement>('[style*="--wep-sticky-top"]')
          ?.style.getPropertyValue('--wep-sticky-top')
      ).toBe(
        'calc(66px - var(--wep-page-padding-y, 0px) - max(var(--wep-page-padding-y, 0px) - 16px, 0px))'
      )
    );

    vi.unstubAllGlobals();
  });

  it('keeps a focused field clear of the sticky header', () => {
    renderEditorForm(<CreateView />);

    expect(
      getComputedStyle(getFieldByLabel('demo.name*')).scrollMarginTop
    ).not.toBe('');
  });

  it('leaves through a clean back link without asking', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView /> },
      { route: '/demo/create' }
    );

    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(currentPath()).toBe('/demo');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks before leaving dirty through the back link', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/create');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.keep' })
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/create');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert');

    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    expect(currentPath()).toBe('/demo');
  });

  it('keeps editing when Escape or a backdrop click dismisses the discard prompt', async () => {
    const { user, currentPath } = renderFormRoutes(
      { '/demo/create': <CreateView /> },
      { route: '/demo/create' }
    );

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.keyboard('{Escape}');

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/create');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert');

    await user.click(screen.getByRole('link', { name: 'back' }));
    await user.click(
      document.querySelector('.MuiDialog-container') as HTMLElement
    );

    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    );
    expect(currentPath()).toBe('/demo/create');
    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert');
  });

  it('refuses a create or edit form that has no paths to go to', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => renderEditorForm(<PathlessCreateView />)).toThrow(/paths/);
    expect(() => renderEditorForm(<PathlessEditView />)).toThrow(/paths/);

    error.mockRestore();
  });

  it('accepts paths from the hook when the view has none', () => {
    renderEditorForm(<HookPathsCreateView />);

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/elsewhere'
    );
  });

  it('offers Discard and Save on a singleton, and Discard resets', async () => {
    const { user } = renderEditorForm(<SingletonView load={loadStored} />);

    await loaded();

    expect(
      screen.queryByRole('link', { name: 'back' })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
    expect(screen.getByTestId('discardButton')).toHaveTextContent(
      'form.view.discard'
    );
    expect(screen.getByTestId('discardButton')).toBeDisabled();
    expect(screen.getByTestId('saveButton')).toHaveAttribute('type', 'submit');
    expect(screen.getByTestId('saveButton')).toBeDisabled();

    await user.type(getFieldByLabel('demo.name*'), ' live');

    expect(screen.getByTestId('discardButton')).toBeEnabled();
    expect(screen.getByTestId('saveButton')).toBeEnabled();

    await user.click(screen.getByTestId('discardButton'));

    expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert');
    await waitFor(() =>
      expect(screen.getByTestId('discardButton')).toBeDisabled()
    );
  });

  it('leads a singleton with a closePath back there, asking while dirty', async () => {
    const { user, currentPath } = renderFormRoutes(
      {
        '/demo/settings/analytics': <SingletonSubPageView load={loadStored} />,
      },
      { route: '/demo/settings/analytics' }
    );

    await loaded();

    expect(screen.getByRole('link', { name: 'back' })).toHaveAttribute(
      'href',
      '/demo/settings'
    );
    expect(screen.queryByTestId('saveAndCloseButton')).not.toBeInTheDocument();
    expect(screen.getByTestId('discardButton')).toBeInTheDocument();

    await user.type(getFieldByLabel('demo.name*'), ' live');
    await user.click(screen.getByRole('link', { name: 'back' }));

    expect(
      screen.getByRole('dialog', { name: 'form.view.discardChanges.title' })
    ).toBeInTheDocument();
    expect(currentPath()).toBe('/demo/settings/analytics');

    await user.click(
      screen.getByRole('button', { name: 'form.view.discardChanges.discard' })
    );

    expect(currentPath()).toBe('/demo/settings');
  });
});
