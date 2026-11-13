import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ReactNode } from 'react';
import type { FieldValues } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  createTestForm,
  fieldText,
  input,
  settle,
  status,
  StatusLine,
} from '../testing/form-test-kit';
import { bindComponent } from './bind-component';
import { withKind } from './kind';
import { useField } from './use-field';
import type { AnyFormSchema } from './value-types';

const form = createTestForm();

const labelText = (name: string) =>
  screen.getByTestId(`field:${name}`).querySelector('label')?.textContent;

type ViewProps = {
  schema: AnyFormSchema;
  onSubmit?: (values: FieldValues) => unknown;
  children: ReactNode;
};

function View({ schema, onSubmit = vi.fn(), children }: ViewProps) {
  const handle = form.useSchemaForm(schema);

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
    >
      {children}
      <button type="submit">save</button>
    </form.Form>
  );
}

describe('useField text', () => {
  const schema = z.object({
    title: z.string().meta({
      label: 'event.title',
      description: 'event.title.description',
      helperText: 'event.title.help',
    }),
  });
  const { Field } = form.fieldsFor(schema);

  it('translates meta keys', () => {
    render(
      <View schema={schema}>
        <Field name="title" />
      </View>
    );

    expect(fieldText('title')).toBe(
      'event.titleevent.title.descriptionevent.title.help'
    );
  });

  it('renders ReactNode overrides as they are', () => {
    render(
      <View schema={schema}>
        <Field
          name="title"
          label={<em>custom label</em>}
          helperText="custom.help"
        />
      </View>
    );

    expect(screen.getByText('custom label').tagName).toBe('EM');
    expect(fieldText('title')).toContain('custom.help');
  });

  it('hides the label on request', () => {
    render(
      <View schema={schema}>
        <Field
          name="title"
          hideLabel
        />
      </View>
    );

    expect(fieldText('title')).not.toContain(
      'event.title.description event.title'
    );
    expect(screen.queryByText('event.title')).not.toBeInTheDocument();
  });

  it('gives every form its own ids', () => {
    render(
      <>
        <View schema={schema}>
          <Field name="title" />
        </View>
        <View schema={schema}>
          <Field name="title" />
        </View>
      </>
    );

    const [first, second] = screen.getAllByLabelText('title');

    expect(first.id).toMatch(/-title$/);
    expect(first.id).not.toBe(second.id);
  });
});

describe('useField required', () => {
  const schema = z.object({
    delay: z.number().default(0),
    title: z.string().min(1),
    email: z.email(),
    optionalEmail: z.email().optional(),
    note: z.string(),
    status: z.enum(['A', 'B']).default('A'),
    headline: z.string().default('Untitled'),
  });
  const { Field } = form.fieldsFor(schema);

  it.each([
    ['delay', true],
    ['title', true],
    ['email', true],
    ['optionalEmail', false],
    ['note', false],
    ['status', true],
    ['headline', true],
  ] as const)('marks %s as required: %s', (name, required) => {
    render(
      <View schema={schema}>
        <Field name={name} />
      </View>
    );

    expect(labelText(name)?.endsWith(' *')).toBe(required);
  });

  it('lets the override win', () => {
    render(
      <View schema={schema}>
        <Field
          name="note"
          required
        />
        <Field
          name="title"
          required={false}
        />
      </View>
    );

    expect(labelText('note')).toMatch(/ \*$/);
    expect(labelText('title')).not.toMatch(/ \*$/);
  });

  it('reports a cleared defaulted field as required on submit', async () => {
    const delaySchema = z.object({ delay: z.number().default(0) });
    const Delay = form.fieldsFor(delaySchema).Field;
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <View
        schema={delaySchema}
        onSubmit={onSubmit}
      >
        <Delay name="delay" />
      </View>
    );

    expect(input('delay')).toHaveValue(0);

    await user.clear(input('delay'));
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(fieldText('delay')).toContain('form.errors.required')
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports a cleared defaulted string as required on submit', async () => {
    const headlineSchema = z.object({
      headline: z.string().default('Untitled'),
    });
    const Headline = form.fieldsFor(headlineSchema).Field;
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <View
        schema={headlineSchema}
        onSubmit={onSubmit}
      >
        <Headline name="headline" />
      </View>
    );

    expect(input('headline')).toHaveValue('Untitled');

    await user.clear(input('headline'));
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(fieldText('headline')).toContain('form.errors.required')
    );
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

describe('useField values', () => {
  it('stores the cleared value of an emptied optional email', async () => {
    const schema = z.object({
      email: z.email().optional(),
      name: z.string().nullable(),
    });
    const { Field } = form.fieldsFor(schema);
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        schema={schema}
        onSubmit={onSubmit}
      >
        <Field name="email" />
        <Field name="name" />
      </View>
    );

    await user.type(input('email'), 'a@b.ch');
    await user.clear(input('email'));
    await user.type(input('name'), 'x');
    await user.clear(input('name'));
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({ email: undefined, name: '' });
    expect(Object.hasOwn(onSubmit.mock.calls[0][0], 'email')).toBe(true);
  });

  describe('clearing a loaded value whose cleared value is undefined', () => {
    const isImage = (value: unknown) =>
      typeof value === 'object' && value !== null;
    const schema = z.object({
      count: z.number().optional(),
      status: z.enum(['A', 'B']).optional(),
      image: withKind(z.custom<{ id: string }>(isImage), 'image').optional(),
    });
    const loaded = { count: 5, status: 'B' as const, image: { id: 'image-1' } };
    const { Field } = form.fieldsFor(schema);

    function ImageProbe() {
      const field = useField<{ id: string } | undefined>();

      return (
        <>
          <output data-testid="image">
            {JSON.stringify(field.value ?? 'empty')}
          </output>
          <button
            type="button"
            onClick={() => field.onChange(undefined)}
          >
            clear image
          </button>
        </>
      );
    }

    function LoadedView({
      onSubmit,
      async,
    }: {
      onSubmit: (values: FieldValues) => void;
      async: boolean;
    }) {
      const handle = form.useSchemaForm(schema, {
        defaultValues: async ? () => Promise.resolve(loaded) : loaded,
      });

      return (
        <form.Form
          form={handle}
          onSubmit={onSubmit}
          fields={{ image: { component: bindComponent(ImageProbe) } }}
        >
          <Field name="count" />
          <Field name="status" />
          <Field name="image" />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    it.each([false, true])(
      'shows the field empty and submits undefined (async: %s)',
      async async => {
        const onSubmit = vi.fn();
        const user = userEvent.setup();

        render(
          <LoadedView
            onSubmit={onSubmit}
            async={async}
          />
        );

        await waitFor(() => expect(input('count')).toHaveValue(5));
        expect(input('status')).toHaveValue('B');
        expect(screen.getByTestId('image')).toHaveTextContent('image-1');

        await user.clear(input('count'));
        await user.selectOptions(input('status'), '');
        await user.click(screen.getByText('clear image'));

        expect(input('count')).toHaveValue(null);
        expect(input('status')).toHaveValue('');
        expect(screen.getByTestId('image')).toHaveTextContent('empty');

        await user.click(screen.getByText('save'));

        await waitFor(() => expect(onSubmit).toHaveBeenCalled());
        expect(onSubmit.mock.calls[0][0]).toEqual({
          count: undefined,
          status: undefined,
          image: undefined,
        });
        expect(input('count')).toHaveValue(null);
        expect(input('status')).toHaveValue('');
        expect(screen.getByTestId('image')).toHaveTextContent('empty');
      }
    );
  });

  describe('clearing a string that was loaded empty', () => {
    const schema = z.object({
      location: z.string().nullish(),
      headline: z.string().default('Untitled'),
    });
    const { Field } = form.fieldsFor(schema);

    function NullView({
      onSubmit,
    }: {
      onSubmit: (values: FieldValues) => void;
    }) {
      const handle = form.useSchemaForm(schema, {
        defaultValues: () => Promise.resolve({ location: null, headline: '' }),
      });

      return (
        <form.Form
          form={handle}
          onSubmit={onSubmit}
        >
          <Field name="location" />
          <Field name="headline" />
          <StatusLine />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    it('restores the loaded null, so the form is clean again', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<NullView onSubmit={onSubmit} />);

      await waitFor(() => expect(input('location')).toHaveValue(''));
      await user.type(input('location'), 'a');
      expect(status()).toMatchObject({ dirty: true });

      await user.clear(input('location'));
      expect(status()).toMatchObject({ dirty: false });

      await user.type(input('headline'), 'Hello');
      await user.click(screen.getByText('save'));

      await waitFor(() => expect(onSubmit).toHaveBeenCalled());
      expect(onSubmit.mock.calls[0][0]).toEqual({
        location: null,
        headline: 'Hello',
      });
    });

    it('still requires a defaulted string that was loaded empty', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<NullView onSubmit={onSubmit} />);

      await waitFor(() => expect(input('headline')).toHaveValue(''));
      await user.type(input('headline'), 'a');
      await user.clear(input('headline'));
      await user.click(screen.getByText('save'));

      await waitFor(() =>
        expect(fieldText('headline')).toContain('form.errors.required')
      );
      expect(onSubmit).not.toHaveBeenCalled();
    });
  });

  describe('defaults inside an optional group', () => {
    const schema = z.object({
      seo: z
        .object({
          title: z.string().min(1),
          index: z.boolean().default(true),
          size: z.number().default(3),
        })
        .optional(),
    });
    const { Field } = form.fieldsFor(schema);

    function GroupView({
      onSubmit,
    }: {
      onSubmit: (values: FieldValues) => void;
    }) {
      const handle = form.useSchemaForm(schema);

      return (
        <form.Form
          form={handle}
          onSubmit={onSubmit}
        >
          <Field name="seo.title" />
          <Field name="seo.index" />
          <Field name="seo.size" />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    it('shows the defaults it submits', async () => {
      const onSubmit = vi.fn();
      const user = userEvent.setup();

      render(<GroupView onSubmit={onSubmit} />);

      expect(input('seo.index')).toBeChecked();
      expect(input('seo.size')).toHaveValue(3);

      await user.click(screen.getByText('save'));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
      expect(onSubmit.mock.calls[0][0]).toEqual({ seo: undefined });

      await user.type(input('seo.title'), 'Hello');
      await user.click(screen.getByText('save'));
      await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
      expect(onSubmit.mock.calls[1][0]).toEqual({
        seo: { title: 'Hello', index: true, size: 3 },
      });
      expect(input('seo.index')).toBeChecked();
      expect(input('seo.size')).toHaveValue(3);
    });
  });

  it('normalizes, guards and cascades changes', async () => {
    const schema = z.object({ code: z.string(), slug: z.string() });
    const { Field } = form.fieldsFor(schema);
    const user = userEvent.setup();

    render(
      <View schema={schema}>
        <Field
          name="code"
          normalize={next => next.toUpperCase()}
          guard={next => !next.includes('X')}
          onValueChange={(value, actions) =>
            actions.setValue('slug', `slug-${value}`)
          }
        />
        <Field name="slug" />
      </View>
    );

    await user.type(input('code'), 'abx');

    expect(input('code')).toHaveValue('AB');
    expect(input('slug')).toHaveValue('slug-AB');
  });

  it('marks values set through actions as dirty', async () => {
    const schema = z.object({ code: z.string(), slug: z.string() });
    const { Field } = form.fieldsFor(schema);
    const user = userEvent.setup();

    function Probe() {
      const field = useField<string>();

      return <output data-testid="slug">{field.value}</output>;
    }

    render(
      <View schema={schema}>
        <Field
          name="code"
          onValueChange={(value, actions) => actions.setValue('slug', value)}
        />
        <Field
          name="slug"
          component={bindComponent(Probe)}
        />
        <StatusLine />
      </View>
    );

    await user.type(input('code'), 'a');
    await user.clear(input('code'));
    await user.type(input('code'), 'b');

    expect(screen.getByTestId('slug')).toHaveTextContent('b');
    expect(status()).toMatchObject({ dirty: true });
  });
});

describe('useField errors', () => {
  it('translates the error with its params', async () => {
    const schema = z.object({ title: z.string().min(3) });
    const { Field } = form.fieldsFor(schema);
    const user = userEvent.setup();

    render(
      <View schema={schema}>
        <Field name="title" />
      </View>
    );

    await user.type(input('title'), 'a');
    await user.tab();
    await settle();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'form.errors.too_small.string.min|{"origin":"string","minimum":3,"inclusive":true}'
    );
    expect(input('title')).toHaveAttribute('aria-invalid', 'true');
  });

  it('translates an author key', async () => {
    const schema = z.object({
      code: z.string().regex(/^G-/, { error: 'analytics.code.invalid' }),
    });
    const { Field } = form.fieldsFor(schema);
    const user = userEvent.setup();

    render(
      <View schema={schema}>
        <Field name="code" />
      </View>
    );

    await user.type(input('code'), 'x');
    await user.tab();
    await settle();

    expect(screen.getByRole('alert').textContent).toMatch(
      /^analytics\.code\.invalid\|/
    );
  });
});

describe('useField options', () => {
  const schema = z.object({
    status: z
      .enum(['ALL', 'LOGGED_IN'])
      .meta({ optionLabelPrefix: 'banner.status.' }),
    plain: z.enum(['a', 'b']),
  });
  const { Field } = form.fieldsFor(schema);

  const optionTexts = (name: string) =>
    [...input(name).querySelectorAll('option')].map(
      option => option.textContent
    );

  it('labels enum options through the prefix', () => {
    render(
      <View schema={schema}>
        <Field name="status" />
      </View>
    );

    expect(optionTexts('status')).toEqual([
      '-',
      'banner.status.ALL',
      'banner.status.LOGGED_IN',
    ]);
  });

  it('falls back to the raw value and honours optionLabel and options', () => {
    render(
      <View schema={schema}>
        <Field
          name="plain"
          optionLabel={value => `plain.${value}`}
        />
        <Field
          name="status"
          options={['LOGGED_IN', { value: 'ALL', label: 'Everyone' }]}
        />
      </View>
    );

    expect(optionTexts('plain')).toEqual(['-', 'plain.a', 'plain.b']);
    expect(optionTexts('status')).toEqual([
      '-',
      'banner.status.LOGGED_IN',
      'Everyone',
    ]);
  });

  it('stores the option value and the cleared value', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <View
        schema={schema}
        onSubmit={onSubmit}
      >
        <Field name="status" />
        <Field name="plain" />
      </View>
    );

    await user.selectOptions(input('status'), 'LOGGED_IN');
    await user.selectOptions(input('plain'), 'b');
    await user.selectOptions(input('plain'), '');
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(fieldText('plain')).toContain('form.errors.required')
    );
    expect(input('status')).toHaveValue('LOGGED_IN');
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
