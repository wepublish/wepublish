import { autocompleteOf, renderEditorForm } from '../../testing';
import { act, screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';

const schema = z.object({
  showFor: z.enum(['ALL', 'LOGGED_IN', 'LOGGED_OUT']).default('ALL').meta({
    label: 'banner.form.showForLoginStatus',
    description: 'banner.form.showForLoginStatusInfo',
    helperText: 'banner.form.showForLoginStatusHelp',
    optionLabelPrefix: 'banner.form.loginStatus.',
  }),
  status: z
    .enum(['DRAFT', 'PUBLISHED'])
    .nullish()
    .meta({ label: 'event.status', optionLabelPrefix: 'event.status.' }),
  type: z.enum(['TEXT', 'IMAGE']).meta({ label: 'block.type' }),
  country: z
    .enum(['AT', 'CH', 'DE', 'FR', 'IT'])
    .nullish()
    .meta({ label: 'user.country' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="showFor"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="status" />
      <Field name="type" />
      <Field
        name="country"
        props={{ searchable: true }}
        optionLabel={value => `user.country.${value}`}
        readOnly={readOnly}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const select = (name: RegExp) => screen.getByRole('combobox', { name });

const optionTexts = () =>
  screen.getAllByRole('option').map(option => option.textContent);

describe('SelectField', () => {
  it('labels the select, marks it as required and explains it', () => {
    renderEditorForm(<View />);

    const showFor = select(/^banner\.form\.showForLoginStatus\*/);

    expect(showFor).toHaveTextContent('banner.form.loginStatus.ALL');
    expect(
      screen.getByRole('button', { name: 'banner.form.showForLoginStatusInfo' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('banner.form.showForLoginStatusHelp')
    ).toBeInTheDocument();
    expect(select(/^event\.status/)).not.toHaveAccessibleName(/\*/);
  });

  it('lists the options with translated labels and an empty choice only when the field is optional', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(select(/^banner\.form\.showForLoginStatus\*/));

    expect(optionTexts()).toEqual([
      'banner.form.loginStatus.ALL',
      'banner.form.loginStatus.LOGGED_IN',
      'banner.form.loginStatus.LOGGED_OUT',
    ]);

    await user.keyboard('{Escape}');
    await user.click(select(/^event\.status/));

    expect(optionTexts()).toEqual([
      'form.select.empty',
      'event.status.DRAFT',
      'event.status.PUBLISHED',
    ]);
  });

  it('submits the chosen values and clears an optional select with the empty choice', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(select(/^banner\.form\.showForLoginStatus\*/));
    await user.click(
      screen.getByRole('option', { name: 'banner.form.loginStatus.LOGGED_OUT' })
    );
    await user.click(select(/^event\.status/));
    await user.click(
      screen.getByRole('option', { name: 'event.status.PUBLISHED' })
    );
    await user.click(select(/^event\.status/));
    await user.click(screen.getByRole('option', { name: 'form.select.empty' }));
    await user.click(select(/^block\.type\*/));
    await user.click(screen.getByRole('option', { name: 'IMAGE' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { showFor: 'LOGGED_OUT', status: null, type: 'IMAGE', country: null },
        expect.anything()
      )
    );
  });

  it('shows the required error of an empty select once it was left', async () => {
    const { user } = renderEditorForm(<View />);
    const type = select(/^block\.type\*/);

    act(() => type.focus());
    await user.tab();

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(type).toHaveAttribute('aria-invalid', 'true');
  });

  it('switches to a searchable list on request', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);
    const country = screen.getByRole('combobox', { name: 'user.country' });

    expect(country.tagName).toBe('INPUT');

    await user.type(country, 'user.country.F');

    const listbox = screen.getByRole('listbox');

    expect(
      within(listbox)
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual(['user.country.FR']);

    await user.click(
      within(listbox).getByRole('option', { name: 'user.country.FR' })
    );

    expect(country).toHaveValue('user.country.FR');

    await user.click(select(/^block\.type\*/));
    await user.click(screen.getByRole('option', { name: 'TEXT' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { showFor: 'ALL', status: null, type: 'TEXT', country: 'FR' },
        expect.anything()
      )
    );
  });

  it('translates the texts of the searchable list', async () => {
    const { user } = renderEditorForm(<View />);
    const country = screen.getByRole('combobox', { name: 'user.country' });

    expect(
      within(autocompleteOf(country)).getByRole('button', {
        name: 'form.autocomplete.open',
      })
    ).toBeInTheDocument();

    await user.type(country, 'xyz');

    expect(screen.getByText('form.autocomplete.noOptions')).toBeInTheDocument();
    expect(
      within(autocompleteOf(country)).getByRole('button', {
        name: 'form.autocomplete.close',
      })
    ).toBeInTheDocument();

    await user.clear(country);
    await user.type(country, 'user.country.F');
    await user.click(screen.getByRole('option', { name: 'user.country.FR' }));

    expect(
      within(autocompleteOf(country)).getByRole('button', {
        name: 'form.autocomplete.clear',
      })
    ).toBeInTheDocument();
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(select(/^banner\.form\.showForLoginStatus\*/)).toHaveAttribute(
      'aria-disabled',
      'true'
    );

    unmount();

    const { user } = renderEditorForm(<View readOnly />);

    await user.click(select(/^banner\.form\.showForLoginStatus\*/));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(
      screen.getByRole('combobox', { name: 'user.country' })
    ).toHaveAttribute('readonly');
  });
});
