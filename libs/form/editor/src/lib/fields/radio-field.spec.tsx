import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  position: formFields
    .radio(z.enum(['TOP', 'BOTTOM']))
    .default('TOP')
    .meta({
      label: 'banner.form.position',
      description: 'banner.form.positionInfo',
      helperText: 'banner.form.positionHelp',
      optionLabelPrefix: 'banner.form.position.',
    }),
  style: formFields
    .radio(z.enum(['PRIMARY', 'SECONDARY']))
    .meta({ label: 'banner.form.style' }),
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
        name="position"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="style" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('RadioField', () => {
  it('renders a labelled group of translated options with tooltip and helper text', () => {
    renderEditorForm(<View />);

    const group = screen.getByRole('radiogroup', {
      name: /^banner\.form\.position\*/,
    });

    expect(getFieldByLabel('banner.form.position.TOP')).toBeChecked();
    expect(getFieldByLabel('banner.form.position.BOTTOM')).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: 'banner.form.positionInfo' })
    ).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('banner.form.positionHelp');
    expect(
      screen.getByRole('radiogroup', { name: /^banner\.form\.style\*/ })
    ).toBeInTheDocument();
  });

  it('shows the required error of a group without a choice on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    const style = screen.getByRole('radiogroup', {
      name: /^banner\.form\.style\*/,
    });

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(style).toHaveAccessibleDescription('form.errors.required');
    expect(style).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the chosen values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(getFieldByLabel('banner.form.position.BOTTOM'));
    await user.click(getFieldByLabel('SECONDARY'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { position: 'BOTTOM', style: 'SECONDARY' },
        expect.anything()
      )
    );
  });

  it('can be disabled', () => {
    renderEditorForm(<View disabled />);

    expect(getFieldByLabel('banner.form.position.TOP')).toBeDisabled();
    expect(getFieldByLabel('banner.form.position.BOTTOM')).toBeDisabled();
  });

  it('ignores clicks while read only', async () => {
    const { user } = renderEditorForm(<View readOnly />);

    await user.click(getFieldByLabel('banner.form.position.BOTTOM'));

    expect(getFieldByLabel('banner.form.position.TOP')).toBeChecked();
    expect(
      screen.getByRole('radiogroup', { name: /^banner\.form\.position\*/ })
    ).toHaveAttribute('aria-readonly', 'true');
  });
});
