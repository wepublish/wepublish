import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { Controller, useFormContext } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  createTestForm,
  ErrorSummary,
  input,
  settle,
} from '../testing/form-test-kit';
import { crossField } from './cross-field';

const form = createTestForm();

const schema = z.object({
  enabled: z.boolean(),
  key: z.string().min(1).meta({ label: 'analytics.key' }),
});

type Values = z.output<typeof schema>;

const { Field } = form.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  enabled = false,
}: {
  onSubmit?: (values: Values) => unknown;
  enabled?: boolean;
}) {
  const [showSummary, setShowSummary] = useState(true);
  const handle = form.useSchemaForm(schema, {
    defaultValues: async () => ({ enabled, key: '' }),
  });

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
      fields={{ key: { hidden: values => !values.enabled } }}
    >
      {showSummary ?
        <ErrorSummary />
      : null}
      <button
        type="button"
        onClick={() => setShowSummary(false)}
      >
        hide summary
      </button>
      <Field name="enabled" />
      <Field name="key" />
      <button type="submit">save</button>
    </form.Form>
  );
}

const entries = () =>
  within(screen.getByRole('list', { name: 'error summary' })).queryAllByRole(
    'listitem'
  );

describe('useFormErrorSummary', () => {
  it('lists invalid fields that are not rendered, with their translated label', async () => {
    const onSubmit = vi.fn();
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();

    expect(entries()).toHaveLength(0);

    await user.click(screen.getByText('save'));

    await waitFor(() => expect(entries()).toHaveLength(1));
    expect(entries()[0].textContent).toMatch(
      /^key:analytics\.key:form\.errors\.required\|/
    );
    expect(onSubmit).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();

    error.mockRestore();
  });

  it('drops an entry once its field is fixed', async () => {
    const user = userEvent.setup();

    render(<View />);
    await settle();
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(entries()).toHaveLength(1));
    await user.click(input('enabled'));
    await user.type(input('key'), 'x');

    await waitFor(() => expect(entries()).toHaveLength(0));
  });

  it('drops an entry as soon as its field is on screen', async () => {
    const user = userEvent.setup();

    render(<View />);
    await settle();
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(entries()).toHaveLength(1));
    await user.click(input('enabled'));

    expect(screen.getByRole('alert')).toHaveTextContent(
      /^form\.errors\.required/
    );
    expect(entries()).toHaveLength(0);
  });

  it('lists an invalid field once it leaves the screen', async () => {
    const user = userEvent.setup();

    render(<View enabled />);
    await settle();
    await user.click(screen.getByText('save'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /^form\.errors\.required/
      )
    );

    expect(entries()).toHaveLength(0);

    await user.click(input('enabled'));

    expect(entries()).toHaveLength(1);
    expect(entries()[0].textContent).toMatch(
      /^key:analytics\.key:form\.errors\.required/
    );
  });

  it('re-validates a field as it leaves the screen, so a conditional error goes away', async () => {
    const conditional = crossField(
      z.object({
        enabled: z.boolean(),
        key: z.string().nullish().meta({ label: 'analytics.key' }),
      }),
      ['enabled', 'key'],
      ({ enabled, key }) => !enabled || (key ?? '').length >= 3,
      { path: ['key'], error: 'analytics.key.tooShort' }
    );
    const Conditional = form.fieldsFor(conditional).Field;
    const user = userEvent.setup();

    function ConditionalView() {
      const handle = form.useSchemaForm(conditional, {
        defaultValues: { enabled: true, key: '' },
      });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <ErrorSummary />
          <Conditional name="enabled" />
          <Conditional
            name="key"
            hidden={values => !values.enabled}
          />
        </form.Form>
      );
    }

    render(<ConditionalView />);
    await user.type(input('key'), 'ab');
    await user.tab();
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'analytics.key.tooShort'
      )
    );

    await user.click(input('enabled'));

    await waitFor(() => expect(entries()).toHaveLength(0));
    await settle();
    expect(entries()).toHaveLength(0);
  });

  it('offers a focus action only for entries whose field is mounted', async () => {
    const legacySchema = z.object({
      key: z.string().min(1).meta({ label: 'analytics.key' }),
      legacy: z.string().min(1),
    });
    const Legacy = form.fieldsFor(legacySchema).Field;
    const user = userEvent.setup();

    function LegacyInput() {
      const { control } = useFormContext<z.output<typeof legacySchema>>();

      return (
        <Controller
          control={control}
          name="legacy"
          render={({ field }) => (
            <input
              ref={field.ref}
              aria-label="legacy input"
              value={field.value}
              onChange={event => field.onChange(event.target.value)}
              onBlur={field.onBlur}
            />
          )}
        />
      );
    }

    function LegacyView() {
      const handle = form.useSchemaForm(legacySchema);

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <ErrorSummary />
          <Legacy
            name="key"
            hidden
          />
          <LegacyInput />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    render(<LegacyView />);
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(entries()).toHaveLength(2));

    const [key, legacy] = entries();

    expect(key.textContent).toMatch(/^key:analytics\.key:/);
    expect(within(key).queryByRole('button')).not.toBeInTheDocument();
    expect(legacy.textContent).toMatch(/^legacy::/);

    await user.click(within(legacy).getByRole('button'));

    expect(screen.getByLabelText('legacy input')).toHaveFocus();
  });

  it('leaves the server error to useFormStatus', async () => {
    const user = userEvent.setup();

    render(
      <View
        onSubmit={() => Promise.reject(new Error('down'))}
        enabled
      />
    );
    await settle();
    await user.type(input('key'), 'x');
    await user.click(screen.getByText('save'));
    await settle();

    expect(entries()).toHaveLength(0);
  });

  it('keeps the value of a hidden field and clears after a valid submit', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(entries()).toHaveLength(1));
    await user.click(input('enabled'));
    await user.type(input('key'), 'x');
    await user.click(input('enabled'));

    expect(screen.queryByLabelText('key')).not.toBeInTheDocument();

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { enabled: false, key: 'x' },
        expect.anything()
      )
    );
    expect(entries()).toHaveLength(0);
  });

  it('evaluates a Dynamic label against the current values', async () => {
    const labelled = z.object({
      name: z.string(),
      key: z.string().min(1).meta({ label: 'key.meta' }),
    });
    const Labelled = form.fieldsFor(labelled).Field;
    const user = userEvent.setup();

    function LabelledView() {
      const handle = form.useSchemaForm(labelled);

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
          fields={{
            key: {
              hidden: true,
              label: values =>
                values.name === '' ? undefined : `key.${values.name}`,
            },
          }}
        >
          <ErrorSummary />
          <Labelled name="name" />
          <Labelled name="key" />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    render(<LabelledView />);
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(entries()).toHaveLength(1));
    expect(entries()[0].textContent).toMatch(
      /^key:key\.meta:form\.errors\.required/
    );

    await user.type(input('name'), 'a');

    expect(entries()[0].textContent).toMatch(
      /^key:key\.a:form\.errors\.required/
    );

    await user.type(input('name'), 'b');

    expect(entries()[0].textContent).toMatch(
      /^key:key\.ab:form\.errors\.required/
    );
  });

  it('lists errors without a path as root.schema', async () => {
    const refined = z
      .object({ starts: z.number(), ends: z.number() })
      .refine(value => value.ends > value.starts, { error: 'event.order' });
    const Refined = form.fieldsFor(refined).Field;
    const user = userEvent.setup();

    function RefinedView() {
      const handle = form.useSchemaForm(refined, {
        defaultValues: { starts: 2, ends: 1 },
      });

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <ErrorSummary />
          <Refined name="starts" />
          <Refined name="ends" />
          <button type="submit">save</button>
        </form.Form>
      );
    }

    render(<RefinedView />);
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(entries()).toHaveLength(1));
    expect(entries()[0]).toHaveTextContent('root.schema::event.order');
  });

  it('logs instead once the summary unmounts', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const user = userEvent.setup();

    render(<View />);
    await settle();
    await user.click(screen.getByText('hide summary'));
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(error).toHaveBeenCalledWith(
        expect.stringContaining('"key" (form.errors.required)')
      )
    );

    error.mockRestore();
  });
});
