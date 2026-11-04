import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { bindComponent } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { CurrencyField } from './currency-field';

const PerYear = bindComponent(CurrencyField, { currency: 'CHF', scale: 12 });

const schema = z.object({
  monthly: z.number().meta({ label: 'userSubscriptionEdit.periodAmount' }),
});

const { Field } = editorForm.fieldsFor(schema);

function View({ onSubmit }: { onSubmit: (values: unknown) => unknown }) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: { monthly: 5000 / 12 },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="monthly"
        component={PerYear}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const amount = () => getFieldByLabel('userSubscriptionEdit.periodAmount*');

describe('CurrencyField with a scale', () => {
  it('shows the stored value times the scale', () => {
    renderEditorForm(<View onSubmit={vi.fn()} />);

    expect(amount()).toHaveValue('50.00');
  });

  it('stores the typed cents divided by the scale', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.clear(amount());
    await user.type(amount(), '120');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { monthly: 1000 },
        expect.anything()
      )
    );
  });
});
