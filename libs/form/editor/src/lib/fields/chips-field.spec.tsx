import { renderEditorForm } from '../../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { components } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import { ChipsField } from './chips-field';

const schema = z.object({
  keywords: z.array(z.string().max(12)).min(1).meta({
    label: 'article.keywords',
    helperText: 'article.keywordsHelp',
    placeholder: 'article.keywordsPlaceholder',
  }),
  sources: z.array(z.string()).meta({ label: 'article.sources' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  keywords = [],
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  keywords?: string[];
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: { keywords, sources: [] },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <Field
        name="keywords"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="sources" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const keywords = () =>
  screen.getByRole('combobox', { name: /^article\.keywords\*/ });

const chipsOf = (input: HTMLElement) => [
  ...(input
    .closest('.MuiAutocomplete-root')
    ?.querySelectorAll<HTMLElement>('.MuiChip-root') ?? []),
];

const chipTexts = (input: HTMLElement) =>
  chipsOf(input).map(chip => chip.textContent);

describe('ChipsField', () => {
  it('is the component of the primitive-array kind and exported from the package', () => {
    expect(components.primitiveArray).toBe(ChipsField);
    expect(formEditor.ChipsField).toBe(ChipsField);
  });

  it('labels the field and explains it', () => {
    renderEditorForm(<View />);

    expect(keywords()).toHaveAccessibleDescription('article.keywordsHelp');
    expect(keywords()).toHaveAttribute(
      'placeholder',
      'article.keywordsPlaceholder'
    );
    expect(
      screen.getByRole('combobox', { name: 'article.sources' })
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Open' })
    ).not.toBeInTheDocument();
  });

  it('adds a chip on Enter and on leaving the field and submits the list', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(keywords(), 'Politik{Enter}');

    expect(chipTexts(keywords())).toEqual(['Politik']);
    expect(keywords()).toHaveValue('');

    await user.type(keywords(), 'Kultur');
    await user.click(screen.getByRole('combobox', { name: 'article.sources' }));

    expect(chipTexts(keywords())).toEqual(['Politik', 'Kultur']);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { keywords: ['Politik', 'Kultur'], sources: [] },
        expect.anything()
      )
    );
  });

  it('trims entries and skips empty and repeated ones', async () => {
    const { user } = renderEditorForm(<View keywords={['Politik']} />);

    await user.type(keywords(), '  Sport  {Enter}');
    await user.type(keywords(), '   {Enter}');
    await user.type(keywords(), 'Politik{Enter}');
    await user.type(keywords(), 'Sport {Enter}');

    expect(chipTexts(keywords())).toEqual(['Politik', 'Sport']);
  });

  it('removes a chip with its delete icon or with Backspace', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        keywords={['Politik', 'Kultur', 'Sport']}
      />
    );

    await user.click(within(chipsOf(keywords())[1]).getByTestId('CancelIcon'));

    expect(chipTexts(keywords())).toEqual(['Politik', 'Sport']);

    await user.click(keywords());
    await user.keyboard('{Backspace}');

    expect(chipTexts(keywords())).toEqual(['Politik']);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { keywords: ['Politik'], sources: [] },
        expect.anything()
      )
    );
  });

  it('shows the error of an empty list and of a single entry', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(keywords()).toHaveAttribute('aria-invalid', 'true')
    );
    expect(keywords()).toHaveAccessibleDescription('form.errors.required');

    await user.type(keywords(), 'Wirtschaftspolitik{Enter}');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(keywords()).toHaveAccessibleDescription(
        'form.errors.too_big.string.max'
      )
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be read only or disabled', async () => {
    const { user, unmount } = renderEditorForm(
      <View
        readOnly
        keywords={['Politik']}
      />
    );

    expect(keywords()).toHaveAttribute('readonly');
    expect(
      within(chipsOf(keywords())[0]).queryByTestId('CancelIcon')
    ).toBeNull();

    await user.type(keywords(), 'Sport');

    expect(keywords()).toHaveValue('');
    expect(chipTexts(keywords())).toEqual(['Politik']);

    unmount();

    renderEditorForm(
      <View
        disabled
        keywords={['Politik']}
      />
    );

    expect(keywords()).toBeDisabled();
  });
});
