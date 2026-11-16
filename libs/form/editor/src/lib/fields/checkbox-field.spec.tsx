import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';

const schema = z.object({
  newsletter: z.boolean().meta({
    label: 'user.newsletter',
    description: 'user.newsletterInfo',
    helperText: 'user.newsletterHelp',
  }),
  terms: z
    .boolean()
    .refine(value => value, { error: 'user.termsRequired' })
    .meta({ label: 'user.terms' }),
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
        name="newsletter"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="terms"
        required
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('CheckboxField', () => {
  it('renders a labelled checkbox with tooltip and helper text', () => {
    renderEditorForm(<View />);

    const newsletter = screen.getByRole('checkbox', {
      name: /user\.newsletter/,
    });

    expect(getFieldByLabel('user.newsletter')).toBe(newsletter);
    expect(newsletter).not.toBeChecked();
    expect(
      screen.getByRole('button', { name: 'user.newsletterInfo' })
    ).toBeInTheDocument();
    expect(newsletter).toHaveAccessibleDescription('user.newsletterHelp');
    expect(getFieldByLabel('user.terms*')).toBeRequired();
  });

  it('names the checkbox by its label alone', () => {
    renderEditorForm(<View />);

    expect(
      screen.getByRole('checkbox', { name: 'user.newsletter' })
    ).toBeInTheDocument();
  });

  it('shows the error of a refused value on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('user.termsRequired')).toBeInTheDocument();
    expect(getFieldByLabel('user.terms*')).toHaveAttribute(
      'aria-invalid',
      'true'
    );
    expect(getFieldByLabel('user.terms*')).toHaveAccessibleDescription(
      'user.termsRequired'
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits the checked values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(getFieldByLabel('user.newsletter'));
    await user.click(getFieldByLabel('user.terms*'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { newsletter: true, terms: true },
        expect.anything()
      )
    );
  });

  it('can be disabled', () => {
    renderEditorForm(<View disabled />);

    expect(getFieldByLabel('user.newsletter')).toBeDisabled();
  });

  it('ignores clicks while read only', async () => {
    const { user } = renderEditorForm(<View readOnly />);
    const newsletter = getFieldByLabel('user.newsletter');

    await user.click(newsletter);

    expect(newsletter).not.toBeChecked();
  });
});
