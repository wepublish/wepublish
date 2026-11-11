import { renderEditorForm } from '../../testing';
import { autocompleteOf, clearButtonOf } from '../../testing/autocomplete';
import { tagFixture, tagListMock, tagMock } from '../../testing/picker-mocks';
import { screen, waitFor, within } from '@testing-library/react';
import { TagType, type TagListQueryVariables } from '@wepublish/editor/api';
import { withKind, type FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const concert = tagFixture('tag-concert', 'Konzert');
const theatre = tagFixture('tag-theatre', 'Theater');
const archived = tagFixture('tag-archived', 'Archiv');
const column = tagFixture('tag-column', 'Kolumne', TagType.Author);

const schema = z.object({
  tagIds: formFields
    .tags(TagType.Event)
    .meta({ label: 'event.form.tags', helperText: 'event.form.tagsHelp' }),
  topics: formFields
    .tags(TagType.Event)
    .min(1)
    .meta({ label: 'event.form.topics' }),
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
        name="tagIds"
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="topics" />
      <button type="submit">submit</button>
    </editorForm.Form>
  );
}

const picker = (name: RegExp) => screen.getByRole('combobox', { name });

const requests: TagListQueryVariables[] = [];

const mocks = () => [
  tagListMock([concert, theatre, column], variables =>
    requests.push(variables)
  ),
  ...[concert, theatre, archived, column].map(tagMock),
];

beforeEach(() => {
  requests.length = 0;
});

describe('TagsField', () => {
  it('refuses a tags kind without a tag type', () => {
    const untyped = z.object({
      tagIds: withKind(z.array(z.string()), 'tags').meta({
        label: 'event.form.tags',
      }),
    });
    const { Field: UntypedField } = editorForm.fieldsFor(untyped);

    function UntypedView() {
      const handle = editorForm.useSchemaForm(untyped);

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <UntypedField name="tagIds" />
        </editorForm.Form>
      );
    }

    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderEditorForm(<UntypedView />, { mocks: mocks() })).toThrow(
      'kind "tags" needs a tagType; use formFields.tags(tagType)'
    );
  });

  it('labels the picker, marks a required one and explains it', () => {
    renderEditorForm(<View />, { mocks: mocks() });

    const tags = picker(/^event\.form\.tags/);

    expect(tags).not.toHaveAccessibleName(/\*/);
    expect(tags).not.toBeRequired();
    expect(tags).toHaveAccessibleDescription('event.form.tagsHelp');
    expect(picker(/^event\.form\.topics\*/)).toBeRequired();
  });

  it('offers the tags of its type and submits the picked ids', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(picker(/^event\.form\.tags/));
    await user.click(await screen.findByRole('option', { name: 'Konzert' }));
    await user.click(picker(/^event\.form\.topics\*/));
    await user.click(await screen.findByRole('option', { name: 'Theater' }));
    await user.click(picker(/^event\.form\.topics\*/));
    await user.click(await screen.findByRole('option', { name: 'Konzert' }));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { tagIds: ['tag-concert'], topics: ['tag-theatre', 'tag-concert'] },
        expect.anything()
      )
    );
    expect(
      screen.queryByRole('option', { name: 'Kolumne' })
    ).not.toBeInTheDocument();
    expect(
      requests.every(variables => variables.filter?.type === TagType.Event)
    ).toBe(true);
  });

  it('shows the names of stored tags it has not loaded', async () => {
    renderEditorForm(<View defaultValues={{ tagIds: ['tag-archived'] }} />, {
      mocks: mocks(),
    });

    await within(autocompleteOf(picker(/^event\.form\.tags/))).findByText(
      'Archiv'
    );
  });

  it('submits no ids once the picker is cleared', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ tagIds: ['tag-concert'], topics: ['tag-theatre'] }}
      />,
      { mocks: mocks() }
    );
    const tags = autocompleteOf(picker(/^event\.form\.tags/));

    await within(tags).findByText('Konzert');

    await user.click(await clearButtonOf(user, picker(/^event\.form\.tags/)));
    await user.click(screen.getByRole('button', { name: 'submit' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { tagIds: [], topics: ['tag-theatre'] },
        expect.anything()
      )
    );
  });

  it('shows the required error once an empty required picker is left', async () => {
    const { user } = renderEditorForm(<View />, { mocks: mocks() });

    await user.click(picker(/^event\.form\.topics\*/));
    await user.keyboard('{Escape}');
    await user.click(document.body);

    await waitFor(() =>
      expect(picker(/^event\.form\.topics\*/)).toHaveAccessibleDescription(
        'form.errors.required'
      )
    );
    expect(picker(/^event\.form\.topics\*/)).toHaveAttribute(
      'aria-invalid',
      'true'
    );
  });

  it('shows the required error of an empty required picker on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />, {
      mocks: mocks(),
    });

    await user.click(screen.getByRole('button', { name: 'submit' }));

    const topics = picker(/^event\.form\.topics\*/);

    await waitFor(() =>
      expect(topics).toHaveAccessibleDescription('form.errors.required')
    );
    expect(topics).toHaveAttribute('aria-invalid', 'true');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('can be disabled or read only', async () => {
    const { unmount } = renderEditorForm(<View disabled />, { mocks: mocks() });

    expect(picker(/^event\.form\.tags/)).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(<View readOnly />, { mocks: mocks() });

    await user.click(picker(/^event\.form\.tags/));

    expect(picker(/^event\.form\.tags/)).toHaveAttribute('readonly');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});
