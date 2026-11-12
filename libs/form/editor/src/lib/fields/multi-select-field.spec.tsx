import { renderEditorForm } from '../../testing';
import { act, screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { components } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import { MultiSelectField } from './multi-select-field';

const schema = z.object({
  channels: z
    .array(z.enum(['WEB', 'APP', 'PRINT']))
    .min(1)
    .meta({
      label: 'event.channels',
      helperText: 'event.channelsHelp',
      optionLabelPrefix: 'event.channel.',
    }),
  audiences: z
    .array(z.enum(['KIDS', 'ADULTS']))
    .meta({ label: 'event.audiences' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  channels = [],
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  channels?: Values['channels'];
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: { channels, audiences: [] },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <Field
        name="channels"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field
        name="audiences"
        optionLabel={value => `event.audience.${value}`}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const channels = () =>
  screen.getByRole('combobox', { name: /^event\.channels\*/ });

const chipTexts = (input: HTMLElement) =>
  [
    ...(input
      .closest('.MuiAutocomplete-root')
      ?.querySelectorAll('.MuiChip-label') ?? []),
  ].map(chip => chip.textContent);

const chipOf = (input: HTMLElement, label: string) =>
  [
    ...(input
      .closest('.MuiAutocomplete-root')
      ?.querySelectorAll<HTMLElement>('.MuiChip-root') ?? []),
  ].find(chip => chip.textContent === label);

describe('MultiSelectField', () => {
  it('is the component of the enum-array kind and exported from the package', () => {
    expect(components.enumArray).toBe(MultiSelectField);
    expect(formEditor.MultiSelectField).toBe(MultiSelectField);
  });

  it('labels the field, marks it as required and lists the translated options', async () => {
    const { user } = renderEditorForm(<View />);

    expect(channels()).toHaveAccessibleDescription('event.channelsHelp');
    expect(
      screen.getByRole('combobox', { name: 'event.audiences' })
    ).toBeInTheDocument();

    await user.click(channels());

    expect(
      within(screen.getByRole('listbox'))
        .getAllByRole('option')
        .map(option => option.textContent)
    ).toEqual([
      'event.channel.WEB',
      'event.channel.APP',
      'event.channel.PRINT',
    ]);
  });

  it('selects several options as chips and submits them in the order chosen', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(channels());
    await user.click(
      screen.getByRole('option', { name: 'event.channel.PRINT' })
    );
    await user.click(screen.getByRole('option', { name: 'event.channel.WEB' }));
    await user.keyboard('{Escape}');

    expect(chipTexts(channels())).toEqual([
      'event.channel.PRINT',
      'event.channel.WEB',
    ]);

    await user.click(screen.getByRole('combobox', { name: 'event.audiences' }));
    await user.click(
      screen.getByRole('option', { name: 'event.audience.ADULTS' })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { channels: ['PRINT', 'WEB'], audiences: ['ADULTS'] },
        expect.anything()
      )
    );
  });

  it('renders loaded values as translated chips and removes a chip', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        channels={['APP', 'WEB']}
      />
    );

    expect(chipTexts(channels())).toEqual([
      'event.channel.APP',
      'event.channel.WEB',
    ]);

    const app = chipOf(channels(), 'event.channel.APP');

    await user.click(within(app as HTMLElement).getByTestId('CancelIcon'));

    expect(chipTexts(channels())).toEqual(['event.channel.WEB']);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { channels: ['WEB'], audiences: [] },
        expect.anything()
      )
    );
  });

  it('shows the error of an empty list once it was left', async () => {
    const { user } = renderEditorForm(<View />);

    act(() => channels().focus());
    await user.tab();

    await waitFor(() =>
      expect(channels()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(channels()).toHaveAccessibleDescription('form.errors.required');
  });

  it('can be read only or disabled', async () => {
    const { user, unmount } = renderEditorForm(
      <View
        readOnly
        channels={['APP']}
      />
    );

    expect(channels()).toHaveAttribute('readonly');
    expect(
      within(
        chipOf(channels(), 'event.channel.APP') as HTMLElement
      ).queryByTestId('CancelIcon')
    ).toBeNull();

    await user.click(channels());

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    unmount();

    renderEditorForm(
      <View
        disabled
        channels={['APP']}
      />
    );

    expect(channels()).toBeDisabled();
  });
});
