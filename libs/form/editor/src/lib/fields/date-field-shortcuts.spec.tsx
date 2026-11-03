import { fireEvent, screen, waitFor } from '@testing-library/react';
import { z } from 'zod/v4';

import { getFieldByLabel, renderEditorForm } from '../../testing';
import { editorForm } from '../editor-form';
import type { DateShortcut } from './date-field';

const schema = z.object({
  expiresAt: z.date().meta({ label: 'demo.expiresAt' }),
  startsAt: z.date().nullish().meta({ label: 'demo.startsAt' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

const newYear = new Date(2031, 0, 1);

const shortcuts: readonly DateShortcut[] = [
  { label: 'demo.newYear', date: () => newYear },
];

const endOfDay = (date: Date | null) => {
  if (date === null) {
    return null;
  }

  const day = new Date(date);
  day.setHours(23, 59, 59, 999);

  return day;
};

function View({ onSubmit }: { onSubmit: (values: Values) => unknown }) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="expiresAt"
        normalize={endOfDay}
        props={{ shortcuts }}
      />
      <Field name="startsAt" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const shortcut = () => screen.queryByRole('button', { name: 'demo.newYear' });

describe('DateField shortcuts', () => {
  it('sits inside the calendar, next to a Done button', () => {
    renderEditorForm(<View onSubmit={vi.fn()} />);

    expect(shortcut()).not.toBeInTheDocument();

    fireEvent.focus(getFieldByLabel('demo.expiresAt*'));

    expect(shortcut()).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'dateTimePicker.done' })
    ).toBeInTheDocument();
  });

  it('sets the date the shortcut returns, through normalize', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    fireEvent.focus(getFieldByLabel('demo.expiresAt*'));
    fireEvent.click(shortcut() as HTMLElement);

    await waitFor(() =>
      expect(getFieldByLabel('demo.expiresAt*')).toHaveValue('01.01.2031')
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].expiresAt).toEqual(
      new Date(2031, 0, 1, 23, 59, 59, 999)
    );
  });

  it('closes the calendar from Done', () => {
    renderEditorForm(<View onSubmit={vi.fn()} />);

    fireEvent.focus(getFieldByLabel('demo.expiresAt*'));
    fireEvent.click(screen.getByRole('button', { name: 'dateTimePicker.done' }));

    expect(shortcut()).not.toBeInTheDocument();
  });

  it('leaves a date field without shortcuts without a footer', () => {
    renderEditorForm(<View onSubmit={vi.fn()} />);

    fireEvent.focus(getFieldByLabel('demo.startsAt'));

    expect(document.querySelector('.react-datepicker')).not.toBeNull();
    expect(
      screen.queryByRole('button', { name: 'dateTimePicker.done' })
    ).not.toBeInTheDocument();
  });
});
