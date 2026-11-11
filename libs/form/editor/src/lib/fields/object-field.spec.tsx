import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { components } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import { ObjectField } from './object-field';

const schema = z.object({
  address: z
    .object({
      street: z.string().min(1).meta({ label: 'user.street' }),
      zip: z.string().meta({ label: 'user.zip' }),
      geo: z
        .object({ lat: z.number().nullable().meta({ label: 'user.lat' }) })
        .meta({ label: 'user.geo' }),
    })
    .meta({
      label: 'user.address',
      description: 'user.addressInfo',
      helperText: 'user.addressHelp',
    }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  disabled,
  readOnly,
  hideLabel,
}: {
  onSubmit?: (values: Values) => unknown;
  disabled?: boolean;
  readOnly?: boolean;
  hideLabel?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <Field
        name="address"
        disabled={disabled}
        readOnly={readOnly}
        hideLabel={hideLabel}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const addressGroup = () =>
  screen.getByRole('group', { name: /^user\.address/ });

describe('ObjectField', () => {
  it('is the component of the object kind and exported from the package', () => {
    expect(components.object).toBe(ObjectField);
    expect(formEditor.ObjectField).toBe(ObjectField);
  });

  it('renders a titled, described group around its fields', () => {
    renderEditorForm(<View />);

    const group = addressGroup();

    expect(
      within(group).getByRole('heading', { level: 3, name: /^user\.address/ })
    ).toBeInTheDocument();
    expect(group).not.toHaveAccessibleName(/\*/);
    expect(
      within(group).getByRole('button', { name: 'user.addressInfo' })
    ).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('user.addressHelp');
    expect(
      within(group).getByRole('textbox', { name: 'user.street*' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('textbox', { name: 'user.zip' })
    ).toBeInTheDocument();
    expect(
      within(group).getByRole('group', { name: 'user.geo' })
    ).toBeInTheDocument();
  });

  it('shows the errors of its fields at the fields and submits the nested values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(getFieldByLabel('user.street*')).toHaveAttribute(
        'aria-invalid',
        'true'
      )
    );
    expect(getFieldByLabel('user.street*')).toHaveAccessibleDescription(
      'form.errors.required'
    );
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(getFieldByLabel('user.street*'), 'Hauptstrasse 1');
    await user.type(getFieldByLabel('user.lat'), '47.5');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { address: { street: 'Hauptstrasse 1', zip: '', geo: { lat: 47.5 } } },
        expect.anything()
      )
    );
  });

  it('keeps the group named without a visible title on request', () => {
    renderEditorForm(<View hideLabel />);

    const group = screen.getByRole('group', { name: 'user.address' });

    expect(
      within(group).queryByRole('heading', { name: /^user\.address/ })
    ).not.toBeInTheDocument();
    expect(
      within(group).getByRole('heading', { name: 'user.geo' })
    ).toBeInTheDocument();
  });

  it('passes disabled and read only on to its fields', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(getFieldByLabel('user.street*')).toBeDisabled();
    expect(getFieldByLabel('user.lat')).toBeDisabled();

    unmount();

    renderEditorForm(<View readOnly />);

    expect(getFieldByLabel('user.street*')).toHaveAttribute('readonly');
    expect(getFieldByLabel('user.lat')).toHaveAttribute('readonly');
  });
});
