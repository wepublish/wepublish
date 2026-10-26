import { zodResolver } from '@hookform/resolvers/zod';
import { createTheme, ThemeProvider } from '@mui/material';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FormProvider, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { createEventSchema, EventForm, EventFormValues } from './eventForm';

vi.mock('@wepublish/ui/editor', async importOriginal => ({
  ...(await importOriginal<typeof import('@wepublish/ui/editor')>()),
  ChooseEditImage: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="group"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
  SelectTags: (props: { 'aria-labelledby'?: string }) => (
    <input
      role="combobox"
      aria-expanded="false"
      aria-controls="listbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
  RichTextBlock: (props: { 'aria-labelledby'?: string }) => (
    <div
      role="textbox"
      aria-labelledby={props['aria-labelledby']}
    />
  ),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

function Harness({ create, name = '' }: { create?: boolean; name?: string }) {
  const { t } = useTranslation();
  const form = useForm<EventFormValues>({
    resolver: zodResolver(createEventSchema(t)),
    defaultValues: { name, startsAt: '' },
  });

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => undefined)}>
        <EventForm create={create} />
        <button
          type="submit"
          data-testid="submit"
        />
      </form>
    </FormProvider>
  );
}

const renderForm = (create?: boolean, name?: string) =>
  render(
    <ThemeProvider theme={createTheme({ cssVariables: true })}>
      <Harness
        create={create}
        name={name}
      />
    </ThemeProvider>
  );

describe('EventForm', () => {
  it('moves focus to the first invalid field and explains the error', async () => {
    renderForm(true);

    fireEvent.click(screen.getByTestId('submit'));

    const name = screen.getByRole('textbox', { name: 'event.form.name' });

    await waitFor(() => expect(document.activeElement).toBe(name));
    expect(screen.getByText('errorMessages.noNameErrorMessage')).toBeTruthy();
  });

  it('labels the tags picker, the description editor and the status select', () => {
    renderForm(false);

    expect(
      screen.getByRole('combobox', { name: 'event.form.tags' })
    ).toBeTruthy();
    expect(
      screen.getByRole('textbox', { name: 'event.form.description' })
    ).toBeTruthy();
    expect(
      screen.getByRole('combobox', { name: 'event.form.status' })
    ).toBeTruthy();
  });

  it('moves focus to the start date when it is missing', async () => {
    renderForm(true, 'Concert');

    fireEvent.click(screen.getByTestId('submit'));

    const startsAt = screen.getByRole('textbox', {
      name: 'event.form.startsAt',
    });

    await waitFor(() => expect(document.activeElement).toBe(startsAt));
  });

  it('names the image chooser after its label', () => {
    renderForm(true);

    expect(
      screen.getByRole('group', { name: 'event.form.image' })
    ).toBeTruthy();
  });
});
