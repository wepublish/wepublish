import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { resolveKind, type FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  startsAt: formFields.dateTime().meta({ label: 'event.form.startsAt' }),
  endsAt: formFields.dateTime().nullish().meta({ label: 'event.form.endsAt' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  defaultValues,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  defaultValues?: FormDefaultValues<typeof schema>;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, { defaultValues });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="startsAt"
        readOnly={readOnly}
      />
      <Field name="endsAt" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const startsAt = () => getFieldByLabel('event.form.startsAt*');

const endsAt = () => getFieldByLabel('event.form.endsAt');

const calendar = () => document.querySelector<HTMLElement>('.react-datepicker');

describe('formFields.dateTime', () => {
  it('marks a date with the dateTime kind through wrappers and meta', () => {
    const date = formFields
      .dateTime()
      .nullish()
      .meta({ label: 'event.form.endsAt' });

    expect(resolveKind(date)?.kind).toBe('dateTime');
    expect(date.safeParse(new Date(2026, 0, 1)).success).toBe(true);
    expect(date.safeParse(null).success).toBe(true);
  });

  it('rejects an Invalid Date and an ISO string', () => {
    const date = formFields.dateTime();

    expect(date.safeParse(new Date('nope')).success).toBe(false);
    expect(date.safeParse('2026-01-01T00:00:00.000Z').success).toBe(false);
  });
});

describe('DateTimeField', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('labels the input and marks a required date', () => {
    renderEditorForm(<View />);

    expect(startsAt()).toHaveValue('');
    expect(endsAt()).toHaveValue('');
  });

  it('shows a loaded Date with its time', () => {
    renderEditorForm(
      <View defaultValues={{ startsAt: new Date(2026, 11, 24, 18, 30) }} />
    );

    expect(startsAt()).toHaveValue('24.12.2026 18:30');
  });

  it('submits a typed date and time as a Date instance', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(startsAt(), '24.12.2026 18:30');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    const values = submitted(onSubmit);

    expect(values.startsAt).toBeInstanceOf(Date);
    expect(values.startsAt.getTime()).toBe(
      new Date(2026, 11, 24, 18, 30).getTime()
    );
    expect(values.endsAt).toBeNull();
  });

  it('offers the editor shortcuts in the calendar and keeps the chosen time on a day shortcut', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 10, 14, 7));

    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ startsAt: new Date(2026, 2, 4, 9, 30) }}
      />
    );

    await user.click(startsAt());

    const shortcuts = within(screen.getByRole('dialog'));

    expect(
      shortcuts.getByRole('button', { name: 'form.date.now' })
    ).toBeInTheDocument();

    await user.click(
      shortcuts.getByRole('button', { name: 'form.date.tomorrow' })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).startsAt).toEqual(new Date(2026, 2, 11, 9, 30));
  });

  it('jumps to today and keeps the chosen time', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 10, 14, 7));

    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ startsAt: new Date(2026, 2, 4, 9, 30) }}
      />
    );

    await user.click(startsAt());
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'form.date.today',
      })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).startsAt).toEqual(new Date(2026, 2, 10, 9, 30));
  });

  it('sets the clock to now without moving the day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2026, 2, 10, 14, 7));

    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ startsAt: new Date(2026, 2, 4, 9, 30) }}
      />
    );

    await user.click(startsAt());
    await user.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'form.date.now',
      })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).startsAt).toEqual(new Date(2026, 2, 4, 14, 7));
  });

  it('clears with the clear button: an optional date submits null, a required one reports required', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          startsAt: new Date(2026, 2, 4, 9, 30),
          endsAt: new Date(2026, 2, 4, 12, 0),
        }}
      />
    );

    const [clearStart, clearEnd] = screen.getAllByRole('button', {
      name: 'dateTimePicker.clear',
    });

    await user.click(clearEnd);

    expect(endsAt()).toHaveValue('');

    await user.click(clearStart);
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await waitFor(() => expect(startsAt()).toHaveFocus());
    await user.keyboard('05.03.2026 10:00');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).endsAt).toBeNull();
  });

  it('shows a read-only date and time without opening the calendar', async () => {
    const { user } = renderEditorForm(
      <View
        readOnly
        defaultValues={{ startsAt: new Date(2026, 11, 24, 18, 30) }}
      />
    );

    expect(startsAt()).toHaveAttribute('readonly');
    expect(startsAt()).toHaveValue('24.12.2026 18:30');
    expect(
      screen.queryAllByRole('button', { name: 'dateTimePicker.clear' })
    ).toHaveLength(0);

    await user.click(startsAt());

    expect(calendar()).toBeNull();
  });
});
