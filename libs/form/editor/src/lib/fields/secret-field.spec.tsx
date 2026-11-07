import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { resolveKind } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  name: z.string().min(1).meta({ label: 'integrations.name' }),
  apiKey: formFields.secret().meta({
    label: 'integrations.apiKey',
    placeholder: 'integrations.placeholderSecret',
  }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  required,
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: { name: 'Stripe' },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field name="name" />
      <Field
        name="apiKey"
        required={required}
        disabled={disabled}
        readOnly={readOnly}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const apiKey = () => getFieldByLabel('integrations.apiKey');

describe('formFields.secret', () => {
  it('marks a nullish string as a secret that leaves an empty value out of the output', () => {
    const secret = formFields.secret().meta({ label: 'integrations.apiKey' });

    expect(resolveKind(secret)?.kind).toBe('secret');
    expect(secret.parse('')).toBeUndefined();
    expect(secret.parse(null)).toBeUndefined();
    expect(secret.parse(undefined)).toBeUndefined();
    expect(secret.parse('sk_live')).toBe('sk_live');
  });
});

describe('SecretField', () => {
  it('hides the value in a password input with a translated placeholder and no autofill', () => {
    renderEditorForm(<View />);

    expect(apiKey()).toHaveAttribute('type', 'password');
    expect(apiKey()).toHaveAttribute(
      'placeholder',
      'integrations.placeholderSecret'
    );
    expect(apiKey()).toHaveAttribute('autocomplete', 'one-time-code');
    expect(apiKey()).not.toBeRequired();
  });

  it('shows and hides the value on request', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(screen.getByRole('button', { name: 'form.secret.show' }));

    expect(apiKey()).toHaveAttribute('type', 'text');

    await user.click(screen.getByRole('button', { name: 'form.secret.hide' }));

    expect(apiKey()).toHaveAttribute('type', 'password');
  });

  it('leaves an untouched secret out of the submitted values', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).apiKey).toBeUndefined();
    expect(JSON.stringify(submitted(onSubmit))).toBe('{"name":"Stripe"}');
  });

  it('submits a typed secret and leaves it out again once cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(apiKey(), 'sk_live_123');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));

    expect(submitted(onSubmit)).toEqual({
      name: 'Stripe',
      apiKey: 'sk_live_123',
    });

    await user.clear(apiKey());
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));

    expect(JSON.stringify(onSubmit.mock.calls[1][0])).toBe('{"name":"Stripe"}');
  });

  it('shows the asterisk when a form marks the secret as required', () => {
    renderEditorForm(<View required />);

    expect(getFieldByLabel('integrations.apiKey*')).toBeRequired();
  });

  it('can be disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(apiKey()).toBeDisabled();
    expect(
      screen.getByRole('button', { name: 'form.secret.show' })
    ).toBeDisabled();

    unmount();
    renderEditorForm(<View readOnly />);

    expect(apiKey()).toHaveAttribute('readonly');
  });
});
