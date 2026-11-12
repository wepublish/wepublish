import { renderEditorForm } from '../../testing';
import { screen, waitFor, within } from '@testing-library/react';
import { z } from 'zod/v4';

import * as formEditor from '../../index';
import { components } from '../components';
import { editorForm } from '../editor-form';
import { FormErrorSummary } from '../form-error-summary';
import {
  DiscriminatedUnionField,
  type DiscriminatedUnionFieldProps,
} from './discriminated-union-field';

const link = z
  .discriminatedUnion('type', [
    z.object({
      type: z
        .literal('page')
        .meta({ optionLabelPrefix: 'navigation.linkType.' }),
      label: z.string().meta({ label: 'navigation.linkLabel' }),
      pageId: z.string().min(1).meta({ label: 'navigation.page' }),
    }),
    z.object({
      type: z.literal('external'),
      label: z.string().meta({ label: 'navigation.linkLabel' }),
      url: z.string().min(1).meta({ label: 'navigation.url' }),
    }),
  ])
  .meta({ label: 'navigation.link', helperText: 'navigation.linkHelp' });

const block = z.discriminatedUnion('kind', [
  z.object({
    kind: z
      .literal('text')
      .meta({ label: 'block.kind', optionLabelPrefix: 'block.kind.' }),
    text: z.string().meta({ label: 'block.text' }),
  }),
  z.object({
    kind: z.literal('image'),
    caption: z.string().meta({ label: 'block.caption' }),
  }),
  z.object({
    kind: z.literal('quote'),
    text: z.string().meta({ label: 'block.text' }),
  }),
  z.object({
    kind: z.literal('embed'),
    url: z.string().meta({ label: 'block.url' }),
  }),
]);

const schema = z.object({ link, block });

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  control,
}: DiscriminatedUnionFieldProps & { onSubmit?: (values: Values) => unknown }) {
  const handle = editorForm.useSchemaForm(schema, {
    defaultValues: {
      link: { type: 'page', label: 'Start', pageId: 'p1' },
      block: { kind: 'text', text: 'Hallo' },
    },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <Field
        name="link"
        props={{ control }}
      />
      <Field name="block" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const optionalSchema = z.object({
  teaser: z
    .discriminatedUnion('type', [
      z.object({
        type: z.literal('url'),
        url: z.string().min(1).meta({ label: 'teaser.url' }),
      }),
      z.object({
        type: z.literal('page'),
        pageId: z.string().min(1).meta({ label: 'teaser.page' }),
      }),
    ])
    .nullish()
    .meta({ label: 'teaser.link' }),
});

const optionalFields = editorForm.fieldsFor(optionalSchema);

function OptionalView({
  onSubmit,
  control,
}: DiscriminatedUnionFieldProps & {
  onSubmit: (values: z.output<typeof optionalSchema>) => unknown;
}) {
  const handle = editorForm.useSchemaForm(optionalSchema, {
    defaultValues: { teaser: null },
  });

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <FormErrorSummary />
      <optionalFields.Field
        name="teaser"
        props={{ control }}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const linkGroup = () => screen.getByRole('group', { name: 'navigation.link' });
const teaserGroup = () => screen.getByRole('group', { name: 'teaser.link' });

describe('DiscriminatedUnionField', () => {
  it('is the component of the discriminated-union kind and exported from the package', () => {
    expect(components.discriminatedUnion).toBe(DiscriminatedUnionField);
    expect(formEditor.DiscriminatedUnionField).toBe(DiscriminatedUnionField);
  });

  it('renders a titled group with a radio choice of the type and the fields of the active branch', () => {
    renderEditorForm(<View />);

    const group = linkGroup();
    const type = within(group).getByRole('radiogroup', {
      name: 'form.union.type*',
    });

    expect(
      within(group).getByRole('heading', { level: 3, name: 'navigation.link' })
    ).toBeInTheDocument();
    expect(group).toHaveAccessibleDescription('navigation.linkHelp');
    expect(
      within(type)
        .getAllByRole('radio')
        .map(radio => radio.closest('label')?.textContent)
    ).toEqual(['navigation.linkType.page', 'navigation.linkType.external']);
    expect(
      within(type).getByRole('radio', { name: 'navigation.linkType.page' })
    ).toBeChecked();
    expect(
      within(group).getByRole('textbox', { name: 'navigation.linkLabel' })
    ).toHaveValue('Start');
    expect(
      within(group).getByRole('textbox', { name: 'navigation.page*' })
    ).toHaveValue('p1');
    expect(
      within(group).queryByRole('textbox', { name: /^navigation\.url/ })
    ).not.toBeInTheDocument();
  });

  it('switches the branch, keeps the shared fields and submits only the active branch', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(
      within(linkGroup()).getByRole('radio', {
        name: 'navigation.linkType.external',
      })
    );

    expect(
      within(linkGroup()).getByRole('textbox', { name: 'navigation.linkLabel' })
    ).toHaveValue('Start');
    expect(
      within(linkGroup()).queryByRole('textbox', { name: /^navigation\.page/ })
    ).not.toBeInTheDocument();

    await user.type(
      within(linkGroup()).getByRole('textbox', { name: 'navigation.url*' }),
      'https://wepublish.ch'
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      link: { type: 'external', label: 'Start', url: 'https://wepublish.ch' },
      block: { kind: 'text', text: 'Hallo' },
    });
  });

  it('shows the errors of the new branch on submit', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.click(
      within(linkGroup()).getByRole('radio', {
        name: 'navigation.linkType.external',
      })
    );
    await user.click(screen.getByRole('button', { name: 'save' }));

    const url = within(linkGroup()).getByRole('textbox', {
      name: 'navigation.url*',
    });

    await waitFor(() => expect(url).toHaveAttribute('aria-invalid', 'true'));
    expect(url).toHaveAccessibleDescription('form.errors.required');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('uses a select for many types and labels the type from its meta', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);
    const kind = screen.getByRole('combobox', { name: 'block.kind*' });

    expect(kind).toHaveTextContent('block.kind.text');
    expect(
      screen.queryByRole('heading', { name: 'block.kind' })
    ).not.toBeInTheDocument();

    await user.click(kind);

    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual([
      'block.kind.text',
      'block.kind.image',
      'block.kind.quote',
      'block.kind.embed',
    ]);

    await user.click(screen.getByRole('option', { name: 'block.kind.quote' }));

    expect(screen.getByRole('textbox', { name: 'block.text' })).toHaveValue(
      'Hallo'
    );

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0].block).toEqual({
      kind: 'quote',
      text: 'Hallo',
    });
  });

  it('uses the requested control for the type', () => {
    renderEditorForm(<View control="select" />);

    expect(
      within(linkGroup()).getByRole('combobox', { name: 'form.union.type*' })
    ).toHaveTextContent('navigation.linkType.page');
    expect(
      within(linkGroup()).queryByRole('radiogroup')
    ).not.toBeInTheDocument();
  });

  it('uses radios for up to three types', () => {
    const three = z.object({
      media: z.discriminatedUnion('kind', [
        z.object({ kind: z.literal('image') }),
        z.object({ kind: z.literal('video') }),
        z.object({ kind: z.literal('audio') }),
      ]),
    });
    const { Field: MediaField } = editorForm.fieldsFor(three);

    function MediaView() {
      const handle = editorForm.useSchemaForm(three, {
        defaultValues: { media: { kind: 'image' } },
      });

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <MediaField name="media" />
        </editorForm.Form>
      );
    }

    renderEditorForm(<MediaView />);

    expect(
      within(
        screen.getByRole('radiogroup', { name: 'form.union.type*' })
      ).getAllByRole('radio')
    ).toHaveLength(3);
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('offers no type for an optional union and submits null once the picked type is taken back', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<OptionalView onSubmit={onSubmit} />);
    const type = within(teaserGroup()).getByRole('radiogroup', {
      name: 'form.union.type',
    });

    expect(
      within(type)
        .getAllByRole('radio')
        .map(radio => radio.closest('label')?.textContent)
    ).toEqual(['form.select.empty', 'url', 'page']);
    expect(
      within(type).getByRole('radio', { name: 'form.select.empty' })
    ).toBeChecked();

    await user.click(within(type).getByRole('radio', { name: 'url' }));
    await user.type(
      within(teaserGroup()).getByRole('textbox', { name: 'teaser.url' }),
      'https://wepublish.ch'
    );
    await user.click(
      within(type).getByRole('radio', { name: 'form.select.empty' })
    );

    expect(
      within(teaserGroup()).queryByRole('textbox', { name: /^teaser\.url/ })
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ teaser: null });
  });

  it('offers no type in the select of an optional union', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <OptionalView
        onSubmit={onSubmit}
        control="select"
      />
    );

    await user.click(
      within(teaserGroup()).getByRole('combobox', { name: 'form.union.type' })
    );
    await user.click(screen.getByRole('option', { name: 'page' }));
    await user.click(
      within(teaserGroup()).getByRole('combobox', { name: 'form.union.type' })
    );

    expect(
      screen.getAllByRole('option').map(option => option.textContent)
    ).toEqual(['form.select.empty', 'url', 'page']);

    await user.click(screen.getByRole('option', { name: 'form.select.empty' }));
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ teaser: null });
  });
});
