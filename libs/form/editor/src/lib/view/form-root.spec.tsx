import { render, screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import { getFieldByLabel, renderEditorForm } from '../../testing';
import { FormErrorSummary } from '../form-error-summary';
import { FormDrawer, FormDrawerPanel } from './form-drawer';
import { formView } from './form-view';
import { FormPage, FormPageHeader } from './form-page';
import { FormBody, FormRoot } from './form-root';
import { FormSaveActions } from './form-save-actions';
import { FormRow, FormSection } from './form-section';
import { useFormView } from './form-view-context';
import { useCreateForm } from './use-form-controller';

const schema = z.object({
  name: z.string().meta({ label: 'demo.name' }),
  code: z.string().min(1).meta({ label: 'demo.code' }),
});

function Unrendered() {
  return null;
}

function ModeProbe() {
  const { mode, readOnly } = useFormView();

  return <p>{`${mode} ${readOnly ? 'read-only' : 'writable'}`}</p>;
}

const demoView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [
    { fields: ['name'], component: ModeProbe },
    { component: Unrendered, covers: ['code'] },
  ],
});

const rowView = formView(schema, {
  paths: { list: '/demo', edit: id => `/demo/edit/${id}` },
  sections: [{ component: Unrendered, covers: ['name', 'code'] }],
});

const save = async () => 'demo-1';

function PageView() {
  const demo = useCreateForm(demoView, { title: 'demo.title', save });

  return <FormPage controller={demo} />;
}

function DrawerView() {
  const demo = useCreateForm(demoView, { title: 'demo.title', save });

  return (
    <FormDrawer
      open
      onClose={() => undefined}
    >
      <FormDrawerPanel controller={demo} />
    </FormDrawer>
  );
}

function ComposedView() {
  const demo = useCreateForm(demoView, { title: 'demo.title', save });

  return (
    <FormRoot controller={demo}>
      <FormPageHeader />
      <FormBody />
    </FormRoot>
  );
}

function HandmadeView() {
  const demo = useCreateForm(rowView, { title: 'demo.title', save });

  return (
    <FormRoot controller={demo}>
      <FormErrorSummary />
      <FormSection
        title="demo.details"
        description="demo.detailsInfo"
      >
        <FormRow>
          <rowView.Field name="name" />
          <rowView.Field name="code" />
        </FormRow>
      </FormSection>
      <FormSaveActions />
    </FormRoot>
  );
}

const summary = () =>
  screen.getByText('form.errorSummary.title').closest('[role="alert"]');

describe('the error summary of form views', () => {
  it.each([
    ['FormPage', PageView],
    ['FormDrawerPanel', DrawerView],
    ['FormRoot with FormBody', ComposedView],
  ])('lists errors of fields no section shows in %s', async (_name, View) => {
    const { user } = renderEditorForm(<View />);

    await user.click(screen.getByTestId('saveButton'));

    await waitFor(() => expect(summary()).toBeInTheDocument());
    expect(
      within(summary() as HTMLElement).getByText(/form\.errors\.required/)
    ).toBeInTheDocument();
  });
});

describe('FormRoot', () => {
  it('lets a hand-made body use the section primitives', async () => {
    renderEditorForm(<HandmadeView />);

    const section = screen.getByRole('region', { name: 'demo.details' });

    expect(within(section).getByText('demo.detailsInfo')).toBeInTheDocument();
    expect(
      getFieldByLabel('demo.name').closest('.MuiFormControl-root')
        ?.parentElement
    ).toBe(
      getFieldByLabel('demo.code*').closest('.MuiFormControl-root')
        ?.parentElement
    );
    expect(screen.getByTestId('saveButton')).toBeInTheDocument();
  });

  it('tells section components the mode and whether the form is read-only', () => {
    renderEditorForm(<PageView />);

    expect(screen.getByText('create writable')).toBeInTheDocument();
  });
});

describe('useFormView', () => {
  it('throws outside a form view', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => render(<ModeProbe />)).toThrow('useFormView');

    vi.mocked(console.error).mockRestore();
  });
});
