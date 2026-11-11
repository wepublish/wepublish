import { renderEditorForm } from '../../testing';
import type { MockedResponse } from '@apollo/client/testing';
import { screen, waitFor } from '@testing-library/react';
import type { UserEvent } from '@testing-library/user-event';
import {
  WebsiteSettingsDocument,
  type WebsiteSettingsQuery,
} from '@wepublish/editor/api';
import { resolveKind, type FormDefaultValues } from '@wepublish/form/core';
import type { RichtextJSONDocument } from '@wepublish/richtext';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const paragraph = (text: string): RichtextJSONDocument => ({
  type: 'doc',
  attrs: undefined,
  content: [
    {
      type: 'paragraph',
      attrs: { textAlign: null },
      content: [{ type: 'text', attrs: undefined, text }],
    },
  ],
});

const keyDisabled = {
  __typename: 'KeyEnabled',
  enabled: false,
  key: null,
} as const;

const websiteSettingsData: WebsiteSettingsQuery = {
  __typename: 'Query',
  websiteSettings: {
    __typename: 'WebsiteSettings',
    theme: {},
    analytics: {
      __typename: 'WebsiteAnalytics',
      googleAnalytics: keyDisabled,
      googleTagManager: keyDisabled,
      plausible: keyDisabled,
      piwik: keyDisabled,
      umami: keyDisabled,
    },
    ads: { __typename: 'WebsiteAds', sparkLoop: keyDisabled },
    fonts: [],
  },
};

const websiteSettings: MockedResponse = {
  request: { query: WebsiteSettingsDocument, variables: {} },
  result: { data: websiteSettingsData },
  maxUsageCount: Number.POSITIVE_INFINITY,
};

const schema = z.object({
  description: formFields.richText().nullish().meta({
    label: 'event.form.description',
    description: 'event.form.descriptionInfo',
  }),
  information: formFields.richText().meta({
    label: 'peer.information',
    helperText: 'peer.informationHelp',
  }),
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
      <Field name="description" />
      <Field
        name="information"
        disabled={disabled}
        readOnly={readOnly}
      />
      <button
        type="button"
        onClick={() =>
          handle.form.reset({
            description: null,
            information: paragraph('Neu geladen'),
          })
        }
      >
        reset
      </button>
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const render = (ui: Parameters<typeof renderEditorForm>[0]) =>
  renderEditorForm(ui, { mocks: [websiteSettings] });

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const description = () =>
  screen.getByRole('group', { name: 'event.form.description' });

const information = () =>
  screen.getByRole('group', { name: 'peer.information*' });

const content = (group: HTMLElement) =>
  waitFor(() => {
    const editable = group.querySelector<HTMLElement>('.tiptap');

    if (!editable) {
      throw new Error('The editor has not mounted yet');
    }

    return editable;
  });

const typeInto = async (user: UserEvent, group: HTMLElement, text: string) => {
  const editable = await content(group);

  await user.click(editable.querySelector('p') ?? editable);
  await user.keyboard(text);
};

describe('formFields.richText', () => {
  it('marks a rich text document that is required until made nullish', () => {
    const required = formFields.richText();
    const optional = formFields.richText().nullish();

    expect(resolveKind(optional)?.kind).toBe('richText');
    expect(required.safeParse(paragraph('Hallo')).success).toBe(true);
    expect(required.safeParse(null).error?.issues[0].message).toBe(
      'form.errors.required'
    );
    expect(optional.safeParse(null).success).toBe(true);
  });
});

describe('RichTextField', () => {
  it('names the editable text box after the field', async () => {
    render(<View />);

    expect(await content(description())).toHaveAccessibleName(
      'event.form.description'
    );
    expect(await content(information())).toHaveAccessibleName(
      'peer.information*'
    );
  });

  it('labels each editor as a group, marks a required one and keeps it out of a card', async () => {
    render(<View />);

    expect(
      screen.getByRole('button', { name: 'event.form.descriptionInfo' })
    ).toBeInTheDocument();
    expect(information()).toHaveAccessibleDescription('peer.informationHelp');
    expect(await content(information())).toHaveAttribute(
      'contenteditable',
      'true'
    );
    expect(information().closest('.MuiCard-root')).toBeNull();
  });

  it('shows a loaded document and submits it unchanged when untouched', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <View
        onSubmit={onSubmit}
        defaultValues={{ information: paragraph('Hallo Welt') }}
      />
    );

    await waitFor(async () =>
      expect(await content(information())).toHaveTextContent('Hallo Welt')
    );

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({
      description: null,
      information: paragraph('Hallo Welt'),
    });
  });

  it('submits typed text as the editor document', async () => {
    const onSubmit = vi.fn();
    const { user } = render(<View onSubmit={onSubmit} />);

    await typeInto(user, information(), 'Neu');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({
      description: null,
      information: paragraph('Neu'),
    });
  });

  it('clears an emptied editor: a required one reports required, an optional one submits null', async () => {
    const onSubmit = vi.fn();
    const { user } = render(
      <View
        onSubmit={onSubmit}
        defaultValues={{
          description: paragraph('Alt'),
          information: paragraph('Info'),
        }}
      />
    );

    await waitFor(async () =>
      expect(await content(description())).toHaveTextContent('Alt')
    );
    await waitFor(async () =>
      expect(await content(information())).toHaveTextContent('Info')
    );

    for (const group of [description(), information()]) {
      await user.click(await content(group));
      await user.keyboard('{Control>}a{/Control}{Backspace}');
    }

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(information()).toHaveAccessibleDescription('form.errors.required')
    );
    expect(screen.getAllByText('form.errors.required')).toHaveLength(1);
    expect(onSubmit).not.toHaveBeenCalled();

    await typeInto(user, information(), 'Wieder');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({
      description: null,
      information: paragraph('Wieder'),
    });
  });

  it('shows a document set from outside after the user typed', async () => {
    const onSubmit = vi.fn();
    const { user } = render(<View onSubmit={onSubmit} />);

    await typeInto(user, information(), 'Entwurf');
    await user.click(screen.getByRole('button', { name: 'reset' }));

    await waitFor(async () =>
      expect(await content(information())).toHaveTextContent('Neu geladen')
    );

    await typeInto(user, information(), '!');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(await content(information())).not.toHaveTextContent('Entwurf');
    expect(submitted(onSubmit).information).toEqual(paragraph('Neu geladen!'));
  });

  it('cannot be edited while disabled or read only', async () => {
    const { unmount } = render(<View disabled />);

    expect(await content(information())).toHaveAttribute(
      'contenteditable',
      'false'
    );

    unmount();
    render(<View readOnly />);

    expect(await content(information())).toHaveAttribute(
      'contenteditable',
      'false'
    );
    expect(await content(description())).toHaveAttribute(
      'contenteditable',
      'true'
    );
  });

  it('shows the required error once an empty required editor is left', async () => {
    const { user } = render(<View />);
    const editable = await content(information());

    await user.click(editable.querySelector('p') ?? editable);
    await user.click(document.body);

    await waitFor(() =>
      expect(information()).toHaveAccessibleDescription('form.errors.required')
    );
  });
});
