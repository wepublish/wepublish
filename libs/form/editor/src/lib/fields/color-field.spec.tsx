import { getFieldByLabel, renderEditorForm } from '../../testing';
import { screen, waitFor } from '@testing-library/react';
import { resolveKind, type FormDefaultValues } from '@wepublish/form/core';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';
import { formFields } from '../form-fields';

const schema = z.object({
  color: formFields
    .color()
    .meta({ label: 'tag.color', helperText: 'tag.colorHelp' }),
  background: formFields.color().nullish().meta({ label: 'peer.themeColor' }),
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
        name="color"
        props={{ presetColors: ['#123456', '#abcdef'] }}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="background" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const opaqueSchema = z.object({
  color: formFields
    .color({ alpha: false })
    .nullish()
    .meta({ label: 'tags.overview.color' }),
});

const OpaqueField = editorForm.fieldsFor(opaqueSchema).Field;

function OpaqueView({
  onSubmit = vi.fn(),
}: {
  onSubmit?: (values: z.output<typeof opaqueSchema>) => unknown;
}) {
  const handle = editorForm.useSchemaForm(opaqueSchema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <OpaqueField
        name="color"
        props={{ presetColors: ['#0e5c5680', '#123456'] }}
      />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

const submitted = (onSubmit: ReturnType<typeof vi.fn>): Values =>
  onSubmit.mock.calls[0][0];

const color = () => getFieldByLabel('tag.color*');

const palette = () => document.querySelector('.w-color-sketch');

const alphaSlider = () =>
  palette()?.querySelector('.w-color-alpha:not(.w-color-hue)') ?? null;

describe('formFields.color', () => {
  it('marks a hex colour string with the color kind', () => {
    const hex = formFields.color().nullish().meta({ label: 'tag.color' });

    expect(resolveKind(hex)?.kind).toBe('color');

    for (const valid of [
      '#abc',
      '#abcd',
      '#A1B2C3',
      '#a1b2c3d4',
      null,
      undefined,
    ]) {
      expect(hex.safeParse(valid).success).toBe(true);
    }

    for (const invalid of ['red', '#12345', 'a1b2c3', '#gggggg']) {
      expect(hex.safeParse(invalid).success).toBe(false);
    }
  });

  it('accepts only six-digit colours once alpha is off and passes that on', () => {
    const opaque = formFields
      .color({ alpha: false })
      .nullish()
      .meta({ label: 'tags.overview.color' });

    expect(resolveKind(opaque)).toMatchObject({
      kind: 'color',
      params: { alpha: false },
    });

    for (const valid of ['#0e5c56', '#A1B2C3', null, undefined]) {
      expect(opaque.safeParse(valid).success).toBe(true);
    }

    for (const invalid of ['#0e5c56ff', '#abc', '#abcd', 'red']) {
      expect(opaque.safeParse(invalid).error?.issues[0]?.message).toBe(
        'form.color.invalid'
      );
    }
  });
});

describe('ColorField', () => {
  it('labels the input, marks a required colour and names the swatch that opens the palette', () => {
    renderEditorForm(<View defaultValues={{ color: '#ff0000' }} />);

    expect(color()).toHaveValue('#ff0000');
    expect(screen.getByText('tag.colorHelp')).toBeInTheDocument();
    expect(getFieldByLabel('peer.themeColor')).toHaveValue('');

    const [swatch] = screen.getAllByRole('button', { name: 'form.color.pick' });

    expect(swatch).toHaveStyle({ backgroundColor: '#ff0000' });
    expect(palette()).toBeNull();
  });

  it('submits a typed hex colour', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.type(color(), '#00ff00');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ color: '#00ff00', background: null });
  });

  it('submits a colour picked from the palette presets', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    const [swatch] = screen.getAllByRole('button', { name: 'form.color.pick' });

    await user.click(swatch);

    expect(palette()).toBeInTheDocument();
    expect(swatch).toHaveAttribute('aria-expanded', 'true');

    await user.keyboard('{Escape}');

    expect(palette()).toBeNull();

    await user.click(swatch);
    await user.click(screen.getByTitle('#123456'));

    expect(color()).toHaveValue('#123456');

    await user.click(document.body);

    expect(palette()).toBeNull();

    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit).color).toBe('#123456');
  });

  it('offers an alpha slider by default', async () => {
    const { user } = renderEditorForm(<View />);

    await user.click(
      screen.getAllByRole('button', { name: 'form.color.pick' })[0]
    );

    expect(alphaSlider()).not.toBeNull();
  });

  it('hides the alpha slider and submits six-digit hex once alpha is off', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<OpaqueView onSubmit={onSubmit} />);

    await user.click(screen.getByRole('button', { name: 'form.color.pick' }));

    expect(palette()).toBeInTheDocument();
    expect(alphaSlider()).toBeNull();

    await user.click(screen.getByTitle('#0e5c5680'));

    expect(getFieldByLabel('tags.overview.color')).toHaveValue('#0e5c56');

    await user.click(document.body);
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { color: '#0e5c56' },
        expect.anything()
      )
    );
  });

  it('explains a colour with alpha once alpha is off', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<OpaqueView onSubmit={onSubmit} />);

    await user.type(getFieldByLabel('tags.overview.color'), '#0e5c56ff');
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.color.invalid')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('explains a value that is not a hex colour once the field was left', async () => {
    const { user } = renderEditorForm(<View />);

    await user.type(color(), 'red');
    await user.tab();

    expect(await screen.findByText('form.color.invalid')).toBeInTheDocument();
    expect(color()).toHaveAttribute('aria-invalid', 'true');
  });

  it('clears to the cleared value: a required colour reports required, an optional one submits null', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(
      <View
        onSubmit={onSubmit}
        defaultValues={{ color: '#ff0000', background: '#000000' }}
      />
    );

    await user.clear(color());
    await user.clear(getFieldByLabel('peer.themeColor'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();

    await user.type(color(), '#fff');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());

    expect(submitted(onSubmit)).toEqual({ color: '#fff', background: null });
  });

  it('can be disabled or read only without opening the palette', async () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(color()).toBeDisabled();
    expect(
      screen.getAllByRole('button', { name: 'form.color.pick' })[0]
    ).toBeDisabled();

    unmount();

    const { user } = renderEditorForm(
      <View
        readOnly
        defaultValues={{ color: '#ff0000' }}
      />
    );

    expect(color()).toHaveAttribute('readonly');

    await user.click(
      screen.getAllByRole('button', { name: 'form.color.pick' })[0]
    );

    expect(palette()).toBeNull();
  });
});
