import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import type { FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';

const schema = z.object({
  birthday: z
    .date()
    .meta({ label: 'user.birthday', helperText: 'user.birthdayHelp' }),
  deactivatedAt: z.date().nullish().meta({ label: 'user.deactivatedAt' }),
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
        name="birthday"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="deactivatedAt" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const birthday = () => getFieldByLabel('user.birthday*');

const calendar = () => document.querySelector('.react-datepicker');

describe('DateField', () => {
  it('labels the date input, marks a required date and shows its helper text', () => {
    renderEditorForm(<View />);

    expect(birthday()).toHaveValue('');
    expect(screen.getByText('user.birthdayHelp')).toBeInTheDocument();
    expect(getFieldByLabel('user.deactivatedAt')).toHaveValue('');
  });

  it('shows a loaded date in the editor format', () => {
    renderEditorForm(
      <View defaultValues={{ birthday: new Date(2024, 11, 31) }} />
    );

    expect(birthday()).toHaveValue('31.12.2024');
  });

  it('submits a typed date as a Date instance', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(birthday(), '24.12.1990');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const values = submitted(onSubmit);

    expect(values.birthday).toBeInstanceOf(Date);
    expect(values.birthday.toDateString()).toBe(
      new Date(1990, 11, 24).toDateString()
    );
    expect(values.deactivatedAt).toBeNull();
  });

  it('submits the day picked in the calendar', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ birthday: new Date(2024, 11, 31) }}
      />
    );

    await user.click(birthday());
    await user.click(
      screen.getByRole('gridcell', { name: /December 15th, 2024/ })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).birthday.toDateString()).toBe(
      new Date(2024, 11, 15).toDateString()
    );
  });

  it('clears to the cleared value: a required date reports required, an optional one submits null', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          birthday: new Date(2024, 11, 31),
          deactivatedAt: new Date(2025, 0, 1),
        }}
      />
    );

    await user.clear(birthday());
    await user.clear(getFieldByLabel('user.deactivatedAt'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() => expect(birthday()).toHaveFocus());
    await user.keyboard('01.02.2003');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).deactivatedAt).toBeNull();
  });

  it('ignores text that is not a date', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ birthday: new Date(2024, 11, 31) }}
      />
    );

    await user.type(getFieldByLabel('user.deactivatedAt'), 'abc');
    await user.clear(birthday());
    await user.type(birthday(), '99.99.9999');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(
      screen.queryByText('form.errors.invalid_type.date')
    ).not.toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a loaded Invalid Date as an empty date', () => {
    renderEditorForm(
      <View
        defaultValues={{
          birthday: new Date('nope'),
          deactivatedAt: new Date('nope'),
        }}
      />
    );

    expect(birthday()).toHaveValue('');
    expect(getFieldByLabel('user.deactivatedAt')).toHaveValue('');
  });

  it('offers only the days between the minimum and the maximum of the schema', async () => {
    const bounded = z.object({
      startsOn: z
        .date()
        .min(new Date(2024, 11, 10))
        .max(new Date(2024, 11, 20))
        .meta({ label: 'event.form.startsAt' }),
    });
    const { Field: BoundedField } = editorForm.fieldsFor(bounded);

    function BoundedView() {
      const handle = editorForm.useSchemaForm(bounded, {
        defaultValues: { startsOn: new Date(2024, 11, 15) },
      });

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <BoundedField name="startsOn" />
        </editorForm.Form>
      );
    }

    const { user } = renderEditorForm(<BoundedView />);

    await user.click(getFieldByLabel('event.form.startsAt*'));

    const day = (name: RegExp) => screen.getByRole('gridcell', { name });

    expect(day(/December 9th, 2024/)).toHaveAttribute('aria-disabled', 'true');
    expect(day(/December 10th, 2024/)).toHaveAttribute(
      'aria-disabled',
      'false'
    );
    expect(day(/December 20th, 2024/)).toHaveAttribute(
      'aria-disabled',
      'false'
    );
    expect(day(/December 21st, 2024/)).toHaveAttribute('aria-disabled', 'true');
  });

  it('shows the required error once the field was left', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(birthday());
    await user.click(document.body);

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(birthday()).toHaveAttribute('aria-invalid', 'true');
  });

  it('moves the focus to an invalid date on submit', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(birthday()).toHaveFocus());
  });

  it('can be disabled', () => {
    renderEditorForm(<View disabled />);

    expect(birthday()).toBeDisabled();
  });

  it('shows a read-only date without opening the calendar', async () => {
    const { user } = renderEditorForm(
      <View
        readOnly
        defaultValues={{ birthday: new Date(2024, 11, 31) }}
      />
    );

    expect(birthday()).toHaveAttribute('readonly');
    expect(birthday()).toHaveValue('31.12.2024');

    await user.click(birthday());

    expect(calendar()).toBeNull();
  });
});
