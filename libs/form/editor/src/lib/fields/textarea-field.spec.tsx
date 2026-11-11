import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  html: formFields.textarea().min(1).meta({
    label: 'banner.form.html',
    description: 'banner.form.htmlInfo',
    helperText: 'banner.form.htmlHelp',
  }),
  note: formFields.textarea().optional().meta({ label: 'event.note' }),
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
        name="html"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="note"
        props={{ minRows: 6 }}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('TextareaField', () => {
  it('renders a labelled multi-line input with its tooltip and helper text', () => {
    renderEditorForm(<View />);

    const html = getFieldByLabel('banner.form.html*');

    expect(html.tagName).toBe('TEXTAREA');
    expect(
      screen.getByRole('button', { name: 'banner.form.htmlInfo' })
    ).toBeInTheDocument();
    expect(html).toHaveAccessibleDescription('banner.form.htmlHelp');
    expect(getFieldByLabel('event.note').tagName).toBe('TEXTAREA');
  });

  it('shows the error once the field was left', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(getFieldByLabel('banner.form.html*'));
    await user.tab();

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(screen.queryByText('banner.form.htmlHelp')).not.toBeInTheDocument();
  });

  it('submits several lines and an emptied optional text as empty', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(
      getFieldByLabel('banner.form.html*'),
      '<p>a</p>{Enter}<p>b</p>'
    );
    await user.type(getFieldByLabel('event.note'), 'x');
    await user.clear(getFieldByLabel('event.note'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { html: '<p>a</p>\n<p>b</p>', note: '' },
        expect.anything()
      )
    );
  });

  it('can be disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(getFieldByLabel('banner.form.html*')).toBeDisabled();

    unmount();
    renderEditorForm(<View readOnly />);

    expect(getFieldByLabel('banner.form.html*')).toHaveAttribute('readonly');
  });
});
