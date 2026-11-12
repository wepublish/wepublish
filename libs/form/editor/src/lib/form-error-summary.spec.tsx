import { getFieldByLabel, renderEditorForm } from '../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod/v4';

import { editorForm } from './editor-form';
import { FormErrorSummary } from './form-error-summary';

const schema = z.object({
  enabled: z.boolean().meta({ label: 'analytics.enabled' }),
  key: z.string().min(1).meta({ label: 'analytics.key' }),
  legacy: z.string().min(1),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function LegacyInput() {
  const { control } = useFormContext<Values>();

  return (
    <Controller
      control={control}
      name="legacy"
      render={({ field }) => (
        <input
          ref={field.ref}
          name={field.name}
          aria-label="legacy input"
          value={field.value ?? ''}
          onChange={event => field.onChange(event.target.value)}
          onBlur={field.onBlur}
        />
      )}
    />
  );
}

function View({
  onSubmit = vi.fn(),
  legacy = 'x',
}: {
  onSubmit?: (values: Values) => unknown;
  legacy?: string;
}) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: { enabled: false, key: '', legacy },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
      fields={{ key: { hidden: values => !values.enabled } }}
    >
      <FormErrorSummary />
      <Field name="enabled" />
      <Field name="key" />
      <LegacyInput />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('FormErrorSummary', () => {
  it('renders nothing while there is nothing to report', () => {
    renderEditorForm(<View />);

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lists an invalid hidden field with its translated label on submit', async () => {
    const onSubmit = vi.fn();
    const error = vi.spyOn(console, 'error');
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    const summary = await screen.findByRole('alert');

    expect(
      within(summary).getByText('form.errorSummary.title')
    ).toBeInTheDocument();
    expect(
      within(summary)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['analytics.key: form.errors.required']);
    expect(within(summary).queryByRole('button')).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalledWith(
      expect.stringContaining('not rendered')
    );

    error.mockRestore();
  });

  it('drops an entry once its field is on screen', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(screen.getByRole('button', { name: 'save' }));
    await screen.findByRole('alert');
    await user.click(getFieldByLabel('analytics.enabled'));

    await waitFor(() =>
      expect(
        screen.queryByText('form.errorSummary.title')
      ).not.toBeInTheDocument()
    );
    expect(screen.getByText('form.errors.required')).toBeInTheDocument();
  });

  it('moves the focus to a field that is rendered outside the form library', async () => {
    const { user } = renderEditorForm(<View legacy="" />);

    await user.click(getFieldByLabel('analytics.enabled'));
    await user.type(getFieldByLabel('analytics.key*'), 'G-1');
    await user.click(screen.getByRole('button', { name: 'save' }));

    const summary = await screen.findByRole('alert');

    expect(
      within(summary)
        .getAllByRole('listitem')
        .map(item => item.textContent)
    ).toEqual(['form.errors.required']);

    await user.click(
      within(summary).getByRole('button', { name: 'form.errors.required' })
    );

    expect(getFieldByLabel('legacy input')).toHaveFocus();
  });
});
