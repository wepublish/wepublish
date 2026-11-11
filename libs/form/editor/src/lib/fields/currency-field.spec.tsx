import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { bindComponent, type FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { CurrencyField } from './currency-field';

const CHF = bindComponent(CurrencyField, { currency: 'CHF' });

// @ts-expect-error currency is required
bindComponent(CurrencyField);

const schema = z.object({
  amount: z.number().int().min(0).meta({
    label: 'crowdfunding.goal.amount',
    helperText: 'crowdfunding.goal.amountHelp',
  }),
  extra: z
    .number()
    .int()
    .nullish()
    .meta({ label: 'crowdfunding.additionalRevenue' }),
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
        name="amount"
        component={CHF}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="extra"
        component={CHF}
      />
      <button
        type="button"
        onClick={() => handle.form.reset({ amount: 2500, extra: null })}
      >
        reset
      </button>
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const amount = () => getFieldByLabel('crowdfunding.goal.amount*');

const extra = () => getFieldByLabel('crowdfunding.additionalRevenue');

describe('CurrencyField', () => {
  it('labels a decimal input, marks a required amount and announces the currency', () => {
    renderEditorForm(<View />);

    expect(amount()).toHaveAttribute('inputmode', 'decimal');
    expect(amount()).toHaveValue('');
    expect(amount()).toHaveAccessibleDescription(
      'CHF crowdfunding.goal.amountHelp'
    );
    expect(extra()).toHaveAccessibleDescription('CHF');
  });

  it('shows stored cents as an amount with two decimals', () => {
    renderEditorForm(<View defaultValues={{ amount: 1990, extra: 0 }} />);

    expect(amount()).toHaveValue('19.90');
    expect(extra()).toHaveValue('0.00');
  });

  it('submits the typed amount in cents and accepts a comma as decimal separator', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(amount(), '19.99');
    await user.type(extra(), '12,5');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ amount: 1999, extra: 1250 });
  });

  it('keeps only what makes an amount and formats it once the field was left', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(amount(), 'abc12.345');

    expect(amount()).toHaveValue('12.34');

    await user.type(extra(), '7');

    expect(amount()).toHaveValue('12.34');

    await user.tab();

    expect(extra()).toHaveValue('7.00');

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ amount: 1234, extra: 700 });
  });

  it('clears to the cleared value: a required amount reports required, an optional one submits null', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ amount: 1990, extra: 500 }}
      />
    );

    await user.clear(amount());
    await user.clear(extra());
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(amount(), '1');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ amount: 100, extra: null });
  });

  it('shows a value set from outside once the field is no longer being edited', async () => {
    const { user } = renderEditorForm(
      <View defaultValues={{ amount: 1990 }} />
    );

    await user.clear(amount());
    await user.type(amount(), '5');
    await user.click(screen.getByRole('button', { name: 'reset' }));

    expect(amount()).toHaveValue('25.00');
    expect(extra()).toHaveValue('');
  });

  it('can be disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(amount()).toBeDisabled();

    unmount();
    renderEditorForm(<View readOnly />);

    expect(amount()).toHaveAttribute('readonly');
  });
});
