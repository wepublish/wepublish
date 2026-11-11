import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState, type ReactNode } from 'react';
import { z } from 'zod/v4';
import {
  createTestForm,
  fieldText,
  input,
  settle,
  SwitchInput,
  translate,
} from '../testing/form-test-kit';
import { bindComponent } from './bind-component';
import type { ComponentMap } from './component-types';
import { createForm } from './create-form';
import type { FieldOverrides } from './override-types';
import { useField } from './use-field';
import { useObjectField } from './use-object-field';

const form = createTestForm();

const schema = z.object({
  title: z
    .string()
    .min(1)
    .meta({ label: 'event.title', placeholder: 'event.title.placeholder' }),
  enabled: z.boolean(),
  key: z.string(),
  status: z.enum(['DRAFT', 'PUBLISHED']),
});

const { Field, AutoFields } = form.fieldsFor(schema);

const loaded = {
  title: 'Event',
  enabled: true,
  key: 'k',
  status: 'DRAFT' as const,
};

type FormViewProps = {
  fields?: Parameters<typeof form.Form<typeof schema>>[0]['fields'];
  onSubmit?: (values: z.output<typeof schema>) => unknown;
  children?: ReactNode;
};

function FormView({ fields, onSubmit = vi.fn(), children }: FormViewProps) {
  const handle = form.useSchemaForm(schema, { defaultValues: loaded });

  return (
    <form.Form
      form={handle}
      fields={fields}
      onSubmit={onSubmit}
    >
      {children}
      <button type="submit">save</button>
    </form.Form>
  );
}

function Suffix({ suffix }: { suffix: string }) {
  const { ref, ...field } = useField<string>();

  return (
    <input
      ref={ref}
      aria-label={field.name}
      value={`${field.value}${suffix}`}
      readOnly
    />
  );
}

describe('AutoFields', () => {
  it('renders every field in schema order when the Form has no children', () => {
    function View() {
      const handle = form.useSchemaForm(schema, { defaultValues: loaded });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        />
      );
    }

    const { container } = render(<View />);

    expect(
      [...container.querySelectorAll('[aria-label]')].map(element =>
        element.getAttribute('aria-label')
      )
    ).toEqual(['title', 'enabled', 'key', 'status']);
  });

  it('omits keys', () => {
    render(
      <FormView>
        <AutoFields omit={['key', 'status']} />
      </FormView>
    );

    expect(input('title')).toBeInTheDocument();
    expect(input('enabled')).toBeInTheDocument();
    expect(screen.queryByLabelText('key')).not.toBeInTheDocument();
  });

  it('renders the load state before the fields', async () => {
    function LoadingView() {
      const handle = form.useSchemaForm(schema, {
        defaultValues: () => new Promise(() => undefined),
      });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <AutoFields />
        </form.Form>
      );
    }

    render(<LoadingView />);

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByLabelText('title')).not.toBeInTheDocument();
  });
});

describe('Field', () => {
  it('renders the field of a path with its meta', () => {
    render(
      <FormView>
        <Field name="title" />
      </FormView>
    );

    expect(input('title')).toHaveValue('Event');
    expect(input('title')).toHaveAttribute(
      'placeholder',
      'event.title.placeholder'
    );
    expect(fieldText('title')).toContain('event.title *');
  });

  it('merges fields overrides with per-call values, per call winning', () => {
    render(
      <FormView
        fields={{
          title: { label: 'from.fields', helperText: 'from.fields.help' },
        }}
      >
        <Field
          name="title"
          label="per.call"
        />
      </FormView>
    );

    expect(fieldText('title')).toContain('per.call');
    expect(fieldText('title')).toContain('from.fields.help');
    expect(fieldText('title')).not.toContain('from.fields *');
  });

  it('passes static and Dynamic props to the component of the kind', async () => {
    const user = userEvent.setup();

    render(
      <FormView
        fields={{
          key: {
            props: values => ({ type: values.enabled ? 'email' : 'url' }),
          },
        }}
      >
        <Field name="enabled" />
        <Field
          name="title"
          props={{ type: 'email' }}
        />
        <Field name="key" />
      </FormView>
    );

    expect(input('title')).toHaveAttribute('type', 'email');
    expect(input('key')).toHaveAttribute('type', 'email');

    await user.click(input('enabled'));

    expect(input('key')).toHaveAttribute('type', 'url');
  });

  it('renders a bound component with its props', () => {
    render(
      <FormView>
        <Field
          name="title"
          component={bindComponent(Suffix, { suffix: '!' })}
        />
      </FormView>
    );

    expect(input('title')).toHaveValue('Event!');
  });

  it('re-evaluates Dynamic overrides on value changes and on outside state', async () => {
    const user = userEvent.setup();

    function View() {
      const [allowed, setAllowed] = useState(true);

      return (
        <>
          <button
            type="button"
            onClick={() => setAllowed(current => !current)}
          >
            toggle permission
          </button>
          <FormView
            fields={{ key: { hidden: values => !values.enabled || !allowed } }}
          >
            <Field name="enabled" />
            <Field name="key" />
          </FormView>
        </>
      );
    }

    render(<View />);

    expect(input('key')).toBeInTheDocument();

    await user.click(input('enabled'));

    expect(screen.queryByLabelText('key')).not.toBeInTheDocument();

    await user.click(input('enabled'));

    expect(input('key')).toBeInTheDocument();

    await user.click(screen.getByText('toggle permission'));

    expect(screen.queryByLabelText('key')).not.toBeInTheDocument();
  });

  it('keeps and submits the value of a hidden field', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <FormView
        fields={{ key: { hidden: true } }}
        onSubmit={onSubmit}
      >
        <Field name="key" />
      </FormView>
    );

    expect(screen.queryByLabelText('key')).not.toBeInTheDocument();

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(loaded, expect.anything())
    );
  });

  it('submits disabled and read-only fields', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <FormView
        fields={{ title: { disabled: true }, key: { readOnly: true } }}
        onSubmit={onSubmit}
      >
        <Field name="title" />
        <Field name="key" />
      </FormView>
    );

    expect(input('title')).toBeDisabled();
    expect(input('key')).toHaveAttribute('readonly');

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(loaded, expect.anything())
    );
  });

  it('throws when used inside a Form of another schema', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const other = z.object({ title: z.string() });
    const OtherField = form.fieldsFor(other).Field;

    expect(() =>
      render(
        <FormView>
          <OtherField name="title" />
        </FormView>
      )
    ).toThrow('Field "title" belongs to another schema than its <Form>.');

    error.mockRestore();
  });

  it('throws outside a Form', () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    expect(() => render(<Field name="title" />)).toThrow(
      'Form fields must be rendered inside <Form>.'
    );

    error.mockRestore();
  });
});

describe('fieldsFor', () => {
  it('returns the same components for the same schema and scope', () => {
    const listSchema = z.object({
      items: z.array(z.object({ label: z.string() })),
    });

    expect(form.fieldsFor(schema).Field).toBe(Field);
    expect(form.fieldsFor(schema).AutoFields).toBe(AutoFields);
    expect(form.fieldsFor(listSchema, 'items.*').Field).toBe(
      form.fieldsFor(listSchema, 'items.*').Field
    );
    expect(form.fieldsFor(listSchema, 'items.*').Field).not.toBe(
      form.fieldsFor(listSchema).Field
    );
    expect(form.fieldsFor(z.object({ title: z.string() })).Field).not.toBe(
      Field
    );
  });
});

describe('field errors for misuse', () => {
  const error = vi.spyOn(console, 'error');

  beforeEach(() => {
    error.mockImplementation(() => undefined);
  });

  afterAll(() => {
    error.mockRestore();
  });

  it('throws for a path outside the schema', () => {
    function Broken() {
      const group = useObjectField();

      return group.renderField('missing');
    }

    const brokenForm = createTestForm();
    const nested = z.object({ link: z.object({ url: z.string() }) });
    const Nested = brokenForm.fieldsFor(nested).Field;

    function View() {
      const handle = brokenForm.useSchemaForm(nested);

      return (
        <brokenForm.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={{ link: { component: bindComponent(Broken) } }}
        >
          <Nested name="link" />
        </brokenForm.Form>
      );
    }

    expect(() => render(<View />)).toThrow('Unknown form path "link.missing".');
  });

  it('throws for a kind without a component', () => {
    const components: ComponentMap = { boolean: SwitchInput };
    const bare = createForm({ components, useTranslate: () => translate });
    const bareSchema = z.object({
      title: z.string(),
      meta: z.record(z.string(), z.string()),
    });
    const Bare = bare.fieldsFor(bareSchema).Field;
    const untypedFields = {} as FieldOverrides<typeof bareSchema, ComponentMap>;

    function View({ name }: { name: 'title' | 'meta' }) {
      const handle = bare.useSchemaForm(bareSchema);

      return (
        <bare.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={untypedFields}
        >
          <Bare name={name} />
        </bare.Form>
      );
    }

    expect(() => render(<View name="title" />)).toThrow(
      'No component for kind "string" at "title". Map the kind or pass a component override.'
    );
    expect(() => render(<View name="meta" />)).toThrow(
      'No component for "meta": its schema has no form kind. Pass a component override.'
    );
  });
});

describe('discriminated-union roots', () => {
  const integrationSchema = z.discriminatedUnion('type', [
    z.object({ type: z.literal('stripe'), secretKey: z.string().min(1) }),
    z.object({ type: z.literal('payrexx'), instance: z.string().min(1) }),
  ]);
  const Integration = form.fieldsFor(integrationSchema);

  function View({
    onSubmit,
  }: {
    onSubmit: (values: z.output<typeof integrationSchema>) => void;
  }) {
    const handle = form.useSchemaForm(integrationSchema, {
      defaultValues: async () => ({
        type: 'payrexx' as const,
        instance: 'abc',
      }),
    });

    return (
      <form.Form
        form={handle}
        onSubmit={onSubmit}
      >
        <Integration.AutoFields />
        <button type="submit">save</button>
      </form.Form>
    );
  }

  it('renders the discriminator and the fields of the active branch', async () => {
    render(<View onSubmit={vi.fn()} />);
    await settle();

    expect(input('type')).toHaveValue('payrexx');
    expect(input('instance')).toHaveValue('abc');
    expect(screen.queryByLabelText('secretKey')).not.toBeInTheDocument();
  });

  it('switches branches and submits only the active one', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.selectOptions(input('type'), 'stripe');

    expect(screen.queryByLabelText('instance')).not.toBeInTheDocument();

    await user.type(input('secretKey'), 'sk');
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { type: 'stripe', secretKey: 'sk' },
        expect.anything()
      )
    );
  });
});
