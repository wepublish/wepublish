import { screen, waitFor, within } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import {
  formSectionOf,
  getFieldByLabel,
  queryFieldByLabel,
  renderEditorForm,
} from '../../testing';
import { formView } from './form-view';
import { FormPage } from './form-page';
import { useCreateForm, useEditForm } from './use-form-controller';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'demo.name' }),
  city: z.string().meta({ label: 'demo.city' }),
  zip: z.string().meta({ label: 'demo.zip' }),
  slug: z.string().meta({ label: 'demo.slug' }),
  newsletter: z.boolean().meta({ label: 'demo.newsletter' }),
  tracking: z.boolean().meta({ label: 'demo.tracking' }),
  status: z.enum(['draft', 'live']).meta({ label: 'demo.status' }),
  notes: z.string().meta({ label: 'demo.notes' }),
  code: z.string().min(1).meta({ label: 'demo.code' }),
  links: z
    .array(z.object({ label: z.string().meta({ label: 'demo.linkLabel' }) }))
    .meta({ label: 'demo.links' }),
  owner: z.string().meta({ label: 'demo.owner' }),
});

type Values = z.input<typeof schema>;

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [
    { title: 'demo.aside', placement: 'aside', fields: ['owner'] },
    {
      title: 'demo.details',
      description: 'demo.detailsInfo',
      fields: ['name', ['city', 'zip']],
    },
    { fields: ['slug'] },
    {
      title: 'demo.choices',
      fields: [{ group: ['newsletter', 'tracking'], title: 'demo.channels' }],
    },
    { title: 'demo.publishing', modes: ['edit'], fields: ['status'] },
    {
      title: 'demo.extra',
      hidden: ({ newsletter }) => !newsletter,
      fields: ['notes'],
    },
    { title: 'demo.code', collapsible: 'closed', fields: ['code'] },
    { title: 'demo.links', fields: ['links'] },
  ],
});

const stored: Values = {
  name: 'Konzert',
  city: 'Bern',
  zip: '3000',
  slug: 'konzert',
  newsletter: false,
  tracking: false,
  status: 'draft',
  notes: '',
  code: 'x',
  links: [{ label: 'Home' }],
  owner: 'Anna',
};

function CreateView() {
  const demo = useCreateForm(demoView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

function EditView({ load }: { load: () => Promise<Values> }) {
  const demo = useEditForm(demoView, {
    title: 'demo.titleEdit',
    load,
    save: async () => undefined,
  });

  return <FormPage controller={demo} />;
}

const loadStored = () => Promise.resolve(stored);

const smallSchema = z.object({
  first: z.string().min(1).meta({ label: 'demo.first' }),
  second: z.string().min(1).meta({ label: 'demo.second' }),
  links: z
    .array(z.object({ label: z.string().meta({ label: 'demo.linkLabel' }) }))
    .meta({ label: 'demo.links' }),
});

const smallView = formView(smallSchema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [
    { title: 'demo.more', collapsible: 'closed', fields: ['first', 'second'] },
    { title: 'demo.links', fields: ['links'] },
  ],
  fields: { links: { hideLabel: false } },
});

function SmallCreateView() {
  const demo = useCreateForm(smallView, {
    title: 'demo.titleCreate',
    save: async () => 'demo-1',
  });

  return <FormPage controller={demo} />;
}

const i18n = i18next.createInstance();

void i18n.init({
  lng: 'en',
  initImmediate: false,
  resources: {
    en: {
      translation: {
        form: {
          view: {
            sectionErrors_one: '{{count}} error',
            sectionErrors_other: '{{count}} errors',
          },
        },
      },
    },
  },
});

const loaded = () =>
  waitFor(() => expect(getFieldByLabel('demo.name*')).toHaveValue('Konzert'));

const fieldControl = (label: string) =>
  getFieldByLabel(label).closest('.MuiFormControl-root');

describe('FormSections', () => {
  it('renders titled sections as named regions with their fields', () => {
    renderEditorForm(<CreateView />);

    expect(
      formSectionOf('demo.details').getByLabelText('demo.name*', {
        selector: 'input',
      })
    ).toBeInTheDocument();
    expect(
      formSectionOf('demo.details').getByText('demo.detailsInfo')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('region', { name: 'demo.details' })).getByRole(
        'heading',
        { level: 2, name: 'demo.details' }
      )
    ).toBeInTheDocument();
  });

  it('renders an untitled section without a region', () => {
    renderEditorForm(<CreateView />);

    expect(getFieldByLabel('demo.slug').closest('section')).toBeNull();
    expect(
      screen.queryByRole('region', { name: 'demo.slug' })
    ).not.toBeInTheDocument();
  });

  it('puts the aside after the main sections in reading order', () => {
    renderEditorForm(<CreateView />);

    const aside = screen.getByRole('region', { name: 'demo.aside' });
    const details = screen.getByRole('region', { name: 'demo.details' });
    const links = screen.getByRole('region', { name: 'demo.links' });

    expect(
      details.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
    expect(
      links.compareDocumentPosition(aside) & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('renders a row of fields side by side', () => {
    renderEditorForm(<CreateView />);

    const row = fieldControl('demo.city')?.parentElement;

    expect(row).not.toBe(fieldControl('demo.name*')?.parentElement);
    expect(row).toBe(fieldControl('demo.zip')?.parentElement);
  });

  it('renders a titled toggle group', () => {
    renderEditorForm(<CreateView />);

    const group = screen.getByRole('group', { name: 'demo.channels' });

    expect(group).toHaveClass('MuiFormGroup-root');
    expect(
      within(group).getByRole('checkbox', { name: 'demo.newsletter' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('checkbox', { name: 'demo.tracking' })
    ).toBeInTheDocument();
  });

  it('shows a section only in the modes it lists', async () => {
    const { unmount } = renderEditorForm(<CreateView />);

    expect(
      screen.queryByRole('region', { name: 'demo.publishing' })
    ).not.toBeInTheDocument();

    unmount();
    renderEditorForm(<EditView load={loadStored} />);
    await loaded();

    expect(
      screen.getByRole('region', { name: 'demo.publishing' })
    ).toBeInTheDocument();
  });

  it('hides a section while its Dynamic hidden is true', async () => {
    const { user } = renderEditorForm(<CreateView />);

    expect(
      screen.queryByRole('region', { name: 'demo.extra' })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('checkbox', { name: 'demo.newsletter' }));

    expect(
      formSectionOf('demo.extra').getByLabelText('demo.notes', {
        selector: 'input',
      })
    ).toBeInTheDocument();
  });

  it('opens and closes a collapsible section', async () => {
    const { user } = renderEditorForm(<CreateView />);
    const toggle = screen.getByRole('button', { name: 'demo.code' });

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(queryFieldByLabel('demo.code*')).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(getFieldByLabel('demo.code*')).toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(queryFieldByLabel('demo.code*')).not.toBeInTheDocument();
  });

  it('opens a collapsed section that holds errors and counts them', async () => {
    const { user } = renderEditorForm(<CreateView />);

    await user.type(getFieldByLabel('demo.name*'), 'Konzert');
    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() =>
      expect(getFieldByLabel('demo.code*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(screen.getByRole('button', { name: /^demo\.code/ })).toHaveAttribute(
      'aria-expanded',
      'true'
    );
    expect(
      formSectionOf(/^demo\.code/).getByText('form.view.sectionErrors')
    ).toBeInTheDocument();
  });

  it('counts the errors of a collapsed section in its chip', async () => {
    const { user } = renderEditorForm(
      <I18nextProvider i18n={i18n}>
        <SmallCreateView />
      </I18nextProvider>
    );

    await user.click(screen.getByTestId('saveButton'));

    expect(
      await formSectionOf(/^demo\.more/).findByText('2 errors')
    ).toBeInTheDocument();
  });

  it('keeps the label of a lone group whose override sets hideLabel false', () => {
    renderEditorForm(<SmallCreateView />);

    expect(screen.getAllByText(/^demo\.links\*?$/)).toHaveLength(2);
  });

  it('renders no sections while loading and after a failed load', async () => {
    const { unmount } = renderEditorForm(
      <EditView load={() => new Promise(() => undefined)} />
    );

    expect(
      screen.getByRole('progressbar', { name: 'form.loading' })
    ).toBeInTheDocument();
    expect(screen.queryAllByRole('region')).toHaveLength(0);

    unmount();
    renderEditorForm(
      <EditView load={() => Promise.reject(new Error('Server down'))} />
    );

    expect(await screen.findByText('form.loadError.title')).toBeInTheDocument();
    expect(screen.queryAllByRole('region')).toHaveLength(0);
  });

  it('hides the label of a lone group in a titled section but keeps its name', () => {
    renderEditorForm(<CreateView />);

    expect(
      formSectionOf('demo.links').getByRole('group', { name: 'demo.links' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('demo.links')).toHaveLength(1);
  });
});
