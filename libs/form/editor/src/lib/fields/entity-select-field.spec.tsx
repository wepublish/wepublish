import { renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { resolveKind, type FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';
import { entityProps } from './entity-select-field';

type Plan = { id: string; name: string; currency: 'CHF' | 'EUR' };

type Method = { slug: string; label: string };

const plans: Plan[] = [
  { id: 'basic', name: 'Basic', currency: 'CHF' },
  { id: 'pro', name: 'Pro', currency: 'EUR' },
];

const methods: Method[] = [
  { slug: 'card', label: 'Card' },
  { slug: 'invoice', label: 'Invoice' },
];

const schema = z.object({
  plan: formFields.entity<Plan>().meta({ label: 'subscription.memberPlan' }),
  method: formFields
    .entity<Method>()
    .nullable()
    .meta({ label: 'subscription.paymentMethod' }),
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
      fields={{
        plan: {
          props: entityProps({
            options: plans,
            getOptionLabel: plan => plan.name,
          }),
        },
        method: {
          props: entityProps({
            options: methods,
            getOptionLabel: method => method.label,
            isOptionEqualToValue: (option, value) => option.slug === value.slug,
          }),
        },
      }}
    >
      <Field
        name="plan"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="method" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

export function MissingEntityProps({
  onSubmit,
}: {
  onSubmit: (values: Values) => unknown;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <>
      {/* @ts-expect-error fields is required for the entity props */}
      <editorForm.Form
        form={handle}
        onSubmit={onSubmit}
      />
      <editorForm.Form
        form={handle}
        onSubmit={onSubmit}
        fields={{
          // @ts-expect-error getOptionLabel is required
          plan: { props: { options: plans } },
          method: {
            props: entityProps({
              options: methods,
              getOptionLabel: method => method.label,
            }),
          },
        }}
      />
    </>
  );
}

export function MismatchedEntityProps({
  onSubmit,
}: {
  onSubmit: (values: Values) => unknown;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
      fields={{
        plan: {
          props: {
            options: plans,
            // @ts-expect-error getOptionLabel typed for an unrelated shape
            getOptionLabel: (other: { foo: number }) => String(other.foo),
          },
        },
        method: {
          props: entityProps({
            options: methods,
            getOptionLabel: method => method.label,
          }),
        },
      }}
    />
  );
}

export function MismatchedEntityHelper() {
  return [
    entityProps({
      options: plans,
      // @ts-expect-error getOptionLabel must take the type of the options
      getOptionLabel: (other: { foo: number }) => String(other.foo),
    }),
    entityProps({
      options: methods,
      getOptionLabel: method => method.label,
      // @ts-expect-error isOptionEqualToValue must take the type of the options
      isOptionEqualToValue: (option: Plan, value: Plan) =>
        option.id === value.id,
    }),
  ];
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const plan = () =>
  screen.getByRole('combobox', { name: 'subscription.memberPlan*' });

const method = () =>
  screen.getByRole('combobox', { name: 'subscription.paymentMethod' });

describe('formFields.entity', () => {
  it('marks an object as an entity that is required until made nullable', () => {
    const required = formFields.entity<Plan>();
    const optional = formFields.entity<Plan>().nullable();

    expect(resolveKind(optional)?.kind).toBe('entity');
    expect(required.safeParse(plans[0]).success).toBe(true);
    expect(required.safeParse(null).error?.issues[0].message).toBe(
      'form.errors.required'
    );
    expect(optional.safeParse(null).success).toBe(true);
  });
});

describe('EntitySelectField', () => {
  it('exports the entityProps helper from the package', () => {
    expect(formEditor.entityProps).toBe(entityProps);
  });

  it('labels a combobox and marks a required entity', () => {
    renderEditorForm(<View />);

    expect(plan()).toHaveValue('');
    expect(method()).toHaveValue('');
  });

  it('lists the options by their label and submits the whole chosen object', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(plan());

    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual(['Basic', 'Pro']);

    await user.click(screen.getByRole('option', { name: 'Pro' }));
    await user.click(method());
    await user.click(screen.getByRole('option', { name: 'Invoice' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ plan: plans[1], method: methods[1] });
  });

  it('matches a loaded copy to its option by id, or by the comparison it was given', async () => {
    const { user } = renderEditorForm(
      <View
        defaultValues={{
          plan: { id: 'pro', name: 'Pro', currency: 'EUR' },
          method: { slug: 'card', label: 'Card' },
        }}
      />
    );

    expect(plan()).toHaveValue('Pro');
    expect(method()).toHaveValue('Card');

    await user.click(plan());

    expect(screen.getByRole('option', { name: 'Pro' })).toHaveAttribute(
      'aria-selected',
      'true'
    );
  });

  it('says so when no option matches the search', async () => {
    const { user } = renderEditorForm(<View />);

    await user.type(plan(), 'zzz');

    expect(screen.getByText('form.autocomplete.noOptions')).toBeInTheDocument();
  });

  it('clears to the cleared value: a required entity reports required, an optional one submits null', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ plan: plans[0], method: methods[0] }}
      />
    );

    const [clearPlan, clearMethod] = screen.getAllByTitle(
      'form.autocomplete.clear'
    );

    await user.click(clearPlan);
    await user.click(clearMethod);
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.click(plan());
    await user.click(screen.getByRole('option', { name: 'Basic' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ plan: plans[0], method: null });
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(plan()).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(
      <View
        readOnly
        defaultValues={{ plan: plans[0] }}
      />
    );

    expect(plan()).toHaveAttribute('readonly');
    expect(
      plan()
        .closest('.MuiAutocomplete-root')
        ?.querySelector('.MuiAutocomplete-popupIndicator')
    ).toBeNull();

    await user.click(plan());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
