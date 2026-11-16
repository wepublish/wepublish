import { renderEditorForm } from '../../testing';
import { autocompleteOf, clearButtonOf } from '../../testing/autocomplete';
import { pageFixture, pageListMock } from '../../testing/picker-mocks';
import { screen, waitFor, within } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const about = pageFixture('page-about', 'Über uns');
const contact = pageFixture('page-contact', 'Kontakt');
const imprint = pageFixture('page-imprint', 'Impressum');

const schema = z.object({
  successPageId: formFields.page().nullish().meta({
    label: 'memberPlanEdit.successPage',
    helperText: 'memberPlanEdit.successPageHelp',
  }),
  confirmationPageId: formFields
    .page()
    .meta({ label: 'memberPlanEdit.confirmationPage' }),
  showOnPages: formFields.pages().meta({
    label: 'banner.form.showOnPages',
    description: 'banner.form.showOnPagesInfo',
  }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  defaultValues,
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  defaultValues?: FormDefaultValues<typeof schema>;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, { defaultValues });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="successPageId"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="confirmationPageId" />
      <Field
        name="showOnPages"
        disabled={disabled}
        readOnly={readOnly}
      />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const successPage = () => picker(/^memberPlanEdit\.successPage/);
const confirmationPage = () => picker(/^memberPlanEdit\.confirmationPage\*/);
const showOnPages = () => picker(/^banner\.form\.showOnPages/);

const mocks = () => [pageListMock([about, contact, imprint])];

describe('PageField and PagesField', () => {
  it('label the pickers, mark a required one and explain them', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    expect(successPage()).not.toHaveAccessibleName(/\*/);
    expect(successPage()).not.toBeRequired();
    expect(successPage()).toHaveAccessibleDescription(
      'memberPlanEdit.successPageHelp'
    );
    expect(confirmationPage()).toBeRequired();
    expect(showOnPages()).not.toHaveAccessibleName(/\*/);
    expect(
      screen.getByRole('button', { name: 'banner.form.showOnPagesInfo' })
    ).toBeInTheDocument();
  });

  it('submit the id of the picked page and the ids of the picked pages', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(successPage());
    await user.click(await screen.findByRole('option', { name: 'Über uns' }));
    await user.click(confirmationPage());
    await user.click(await screen.findByRole('option', { name: 'Impressum' }));
    await user.click(showOnPages());
    await user.click(await screen.findByRole('option', { name: 'Kontakt' }));
    await user.click(screen.getByRole('option', { name: 'Impressum' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          successPageId: 'page-about',
          confirmationPageId: 'page-imprint',
          showOnPages: ['page-contact', 'page-imprint'],
        },
        expect.anything()
      )
    );
  });

  it('keep the list of pages open to pick several in a row', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(showOnPages());
    await user.click(await screen.findByRole('option', { name: 'Kontakt' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();

    await user.click(screen.getByRole('option', { name: 'Impressum' }));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(
      within(autocompleteOf(showOnPages())).getByText('Kontakt')
    ).toBeInTheDocument();
    expect(
      within(autocompleteOf(showOnPages())).getByText('Impressum')
    ).toBeInTheDocument();
  });

  it('keep the titles of picked pages while searching for others', async () => {
    const { user } = renderEditorForm(
      <View defaultValues={{ showOnPages: ['page-contact', 'page-about'] }} />,
      { mocks: mocks() }
    );
    const chips = () => within(autocompleteOf(showOnPages()));

    await waitFor(() =>
      expect(chips().getByText('Kontakt')).toBeInTheDocument()
    );

    await user.type(showOnPages(), 'Imp');

    await waitFor(() =>
      expect(screen.getAllByRole('option')[0]).toHaveTextContent('Impressum')
    );
    expect(chips().getByText('Kontakt')).toBeInTheDocument();
    expect(chips().getByText('Über uns')).toBeInTheDocument();
    expect(chips().queryByText('page-contact')).not.toBeInTheDocument();
  });

  it('show the required error once an empty required picker is left', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(confirmationPage());
    await user.keyboard('{Escape}');
    await user.click(document.body);

    await waitFor(() =>
      expect(confirmationPage()).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(confirmationPage()).toHaveAttribute('aria-invalid', 'true');
  });

  it('show the titles of stored pages', async () => {
    renderEditorForm(
      <View
        defaultValues={{
          successPageId: 'page-about',
          showOnPages: ['page-contact'],
        }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(successPage()).toHaveValue('Über uns'));
    expect(
      within(autocompleteOf(showOnPages())).getByText('Kontakt')
    ).toBeInTheDocument();
  });

  it('submit the cleared values once the pickers are cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          successPageId: 'page-about',
          confirmationPageId: 'page-imprint',
          showOnPages: ['page-contact'],
        }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(successPage()).toHaveValue('Über uns'));

    await user.click(await clearButtonOf(user, successPage()));
    await user.click(await clearButtonOf(user, showOnPages()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        {
          successPageId: null,
          confirmationPageId: 'page-imprint',
          showOnPages: [],
        },
        expect.anything()
      )
    );
  });

  it('show the required error of a cleared required page', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ confirmationPageId: 'page-imprint' }}
      />,
      { mocks: mocks() }
    );

    await waitFor(() => expect(confirmationPage()).toHaveValue('Impressum'));

    await user.click(await clearButtonOf(user, confirmationPage()));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(confirmationPage()).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(confirmationPage()).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(successPage()).toBeDisabled();
    expect(showOnPages()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(successPage());

    expect(successPage()).toHaveAttribute('readonly');
    expect(showOnPages()).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
