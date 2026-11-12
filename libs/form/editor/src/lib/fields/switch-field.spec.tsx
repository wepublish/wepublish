import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  active: formFields.switch().meta({
    label: 'banner.form.active',
    description: 'banner.form.activeInfo',
    helperText: 'banner.form.activeHelp',
  }),
  collapsible: formFields
    .switch()
    .default(true)
    .meta({ label: 'banner.form.collapsible' }),
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
      <Field
        name="active"
        disabled={disabled}
        readOnly={readOnly}
        hideLabel={hideLabel}
      />
      <Field name="collapsible" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('SwitchField', () => {
  it('renders a labelled switch with tooltip and helper text, never marked as required', () => {
    renderEditorForm(<View />);

    const active = screen.getByRole('switch', { name: /banner\.form\.active/ });

    expect(active).not.toBeChecked();
    expect(getFieldByLabel('banner.form.active')).toBe(active);
    expect(
      screen.getByRole('button', { name: 'banner.form.activeInfo' })
    ).toBeInTheDocument();
    expect(active).toHaveAccessibleDescription('banner.form.activeHelp');
    expect(getFieldByLabel('banner.form.collapsible')).toBeChecked();
  });

  it('submits the toggled values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(getFieldByLabel('banner.form.active'));
    await user.click(getFieldByLabel('banner.form.collapsible'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { active: true, collapsible: false },
        expect.anything()
      )
    );
  });

  it('can be disabled', () => {
    renderEditorForm(<View disabled />);

    expect(getFieldByLabel('banner.form.active')).toBeDisabled();
  });

  it('ignores clicks while read only', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        readOnly
        onSubmit={onSubmit}
      />
    );
    const active = getFieldByLabel('banner.form.active');

    await user.click(active);

    expect(active).not.toBeChecked();
    expect(active).toHaveAttribute('readonly');

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { active: false, collapsible: true },
        expect.anything()
      )
    );
  });

  it('keeps an accessible name when the label is hidden', () => {
    renderEditorForm(<View hideLabel />);

    expect(
      screen.getByRole('switch', { name: 'banner.form.active' })
    ).toBeInTheDocument();
    expect(screen.queryByText('banner.form.active')).not.toBeInTheDocument();
  });
});
