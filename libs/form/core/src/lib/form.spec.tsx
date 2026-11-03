import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { type ComponentProps, type ElementType, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useForm, type FieldErrors } from 'react-hook-form';
import { z } from 'zod/v4';
import {
  createTestForm,
  ErrorSummary,
  input,
  settle,
  status,
  StatusLine,
} from '../testing/form-test-kit';
import { getChangedValues } from './changed-values';
import type { SchemaForm, SubmitContext } from './form-types';
import { LoadState } from './load-state';
import { setFieldError } from './set-field-error';

const schema = z.object({
  title: z.string().min(1).meta({ label: 'event.title' }),
  enabled: z.boolean(),
  key: z.string().min(1),
});

type Values = z.output<typeof schema>;

const onLoadError = vi.fn();
const onSubmitError = vi.fn();
const useUnsavedChanges = vi.fn();

const form = createTestForm({
  onLoadError,
  onSubmitError,
  useUnsavedChanges,
  submitErrorKey: error =>
    error instanceof Error && error.message === 'conflict' ?
      'event.conflict'
    : undefined,
});

const { Field } = form.fieldsFor(schema);

const loaded = { title: 'Event', enabled: true, key: 'k' };

function Header() {
  return (
    <header>
      <button
        type="submit"
        name="intent"
        value="save"
      >
        save
      </button>
      <button
        type="submit"
        name="intent"
        value="close"
      >
        save and close
      </button>
      <StatusLine />
    </header>
  );
}

function LegacyPanel({ onSave }: { onSave: () => void }) {
  const legacy = useForm({ defaultValues: { name: 'image' } });

  return createPortal(
    <form onSubmit={legacy.handleSubmit(onSave)}>
      <button type="submit">save image</button>
    </form>,
    document.body
  );
}

type ViewProps = {
  load?: () => Promise<Partial<Values>>;
  onSubmit: (values: Values, context: SubmitContext) => unknown;
  onInvalid?: (errors: FieldErrors) => void;
  disabled?: boolean;
  warnOnUnsavedChanges?: boolean;
  renderKey?: boolean;
  children?: ReactNode;
};

function View({
  load = async () => loaded,
  onSubmit,
  onInvalid,
  disabled,
  warnOnUnsavedChanges,
  renderKey = true,
  children,
}: ViewProps) {
  const handle = form.useSchemaForm(schema, { defaultValues: load });

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
      onInvalid={onInvalid}
      disabled={disabled}
      warnOnUnsavedChanges={warnOnUnsavedChanges}
    >
      <Header />
      <LoadState />
      <Field name="title" />
      <Field name="enabled" />
      {renderKey ?
        <Field name="key" />
      : null}
      {children}
    </form.Form>
  );
}

type HandleSubmit = (
  handle: SchemaForm<typeof schema>['form'],
  values: Values
) => unknown;

function HandleView({ onSubmit }: { onSubmit: HandleSubmit }) {
  const handle = form.useSchemaForm(schema, {
    defaultValues: async () => loaded,
  });

  return (
    <form.Form
      form={handle}
      onSubmit={values => onSubmit(handle.form, values)}
    >
      <Header />
      <Field name="title" />
      <Field name="enabled" />
      <Field name="key" />
    </form.Form>
  );
}

const deferred = () => {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>(done => (resolve = done));

  return { promise, resolve };
};

describe('Form', () => {
  it('renders the header while loading and the fields once loaded', async () => {
    let resolve: (values: Partial<Values>) => void = () => undefined;

    render(
      <View
        load={() => new Promise(done => (resolve = done))}
        onSubmit={vi.fn()}
      />
    );

    expect(screen.getByText('save')).toBeInTheDocument();
    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByLabelText('title')).not.toBeInTheDocument();
    expect(status()).toMatchObject({ loading: true, canSubmit: false });

    resolve({ title: 'Event' });
    await settle();

    expect(screen.queryByText('loading')).not.toBeInTheDocument();
    expect(input('title')).toHaveValue('Event');
    expect(input('enabled')).not.toBeChecked();
    expect(status()).toMatchObject({ loading: false, canSubmit: true });
  });

  it('does not submit while loading', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        load={() => new Promise(() => undefined)}
        onSubmit={onSubmit}
      />
    );
    await user.click(screen.getByText('save'));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows LoadError, reports it and never submits when the loader rejects', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const error = new Error('boom');

    render(
      <View
        load={() => Promise.reject(error)}
        onSubmit={onSubmit}
      />
    );
    await settle();

    expect(screen.getByText('load failed: Error: boom')).toBeInTheDocument();
    expect(screen.queryByLabelText('title')).not.toBeInTheDocument();
    expect(onLoadError).toHaveBeenCalledWith(error);
    expect(status()).toMatchObject({
      canSubmit: false,
      loadError: 'Error: boom',
    });

    await user.click(screen.getByText('save'));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('retries a failed load in place', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    const second = deferred();
    const load = vi
      .fn<() => Promise<Partial<Values>>>()
      .mockRejectedValueOnce(new Error('boom'))
      .mockImplementationOnce(() => second.promise.then(() => loaded));

    render(
      <View
        load={load}
        onSubmit={onSubmit}
      />
    );
    await settle();
    await user.click(screen.getByText('retry load'));

    expect(screen.getByText('loading')).toBeInTheDocument();
    expect(screen.queryByText(/load failed/)).not.toBeInTheDocument();

    await act(async () => second.resolve());

    await waitFor(() => expect(input('title')).toHaveValue('Event'));
    expect(load).toHaveBeenCalledTimes(2);
    expect(status()).toMatchObject({
      loading: false,
      loadError: null,
      canSubmit: true,
      dirty: false,
    });

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        loaded,
        expect.objectContaining({ intent: 'save' })
      )
    );
  });

  it('passes the output values and the intent of the submitter', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.click(screen.getByText('save and close'));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        loaded,
        expect.objectContaining({ intent: 'close' })
      )
    );
  });

  it('drops a submitter value that is not a declared intent', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const intentForm = createTestForm({ intents: ['save', 'close'] });
    const Intent = intentForm.fieldsFor(schema).Field;
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    function IntentView() {
      const handle = intentForm.useSchemaForm(schema, {
        defaultValues: loaded,
      });

      return (
        <intentForm.Form
          form={handle}
          onSubmit={onSubmit}
        >
          <Intent name="title" />
          <button
            type="submit"
            name="intent"
            value="close"
          >
            close
          </button>
          <button
            type="submit"
            name="intent"
            value="publish"
          >
            publish
          </button>
        </intentForm.Form>
      );
    }

    render(<IntentView />);
    await user.click(screen.getByText('close'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    await user.click(screen.getByText('publish'));
    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));

    expect(onSubmit.mock.calls.map(([, context]) => context.intent)).toEqual([
      'close',
      undefined,
    ]);
    expect(error).toHaveBeenCalledWith(expect.stringContaining('"publish"'));

    error.mockRestore();
  });

  it('has no intent when submitted without a submitter', async () => {
    const onSubmit = vi.fn();
    const { container } = render(<View onSubmit={onSubmit} />);

    await settle();
    await act(async () => {
      container.querySelector('form')?.requestSubmit();
    });

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        loaded,
        expect.objectContaining({ intent: undefined })
      )
    );
  });

  it('ignores submits of forms nested through a portal', async () => {
    const onSubmit = vi.fn();
    const onSave = vi.fn();
    const user = userEvent.setup();

    render(
      <View onSubmit={onSubmit}>
        <LegacyPanel onSave={onSave} />
      </View>
    );
    await settle();
    await user.click(screen.getByText('save image'));
    await settle();

    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('keeps its own submit away from an outer legacy form', async () => {
    const onSubmit = vi.fn();
    const onOuterSubmit = vi.fn();
    const user = userEvent.setup();

    function Outer() {
      return (
        <form onSubmit={onOuterSubmit}>
          {createPortal(<View onSubmit={onSubmit} />, document.body)}
        </form>
      );
    }

    render(<Outer />);
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1));
    expect(onOuterSubmit).not.toHaveBeenCalled();
  });

  it('turns a rejected onSubmit into root.server and clears it with the next success', async () => {
    const user = userEvent.setup();
    const error = new Error('Unique constraint');
    const onSubmit = vi
      .fn()
      .mockRejectedValueOnce(error)
      .mockResolvedValueOnce(undefined);

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(status()).toMatchObject({ server: 'form.errors.server' })
    );
    expect(onSubmitError).toHaveBeenCalledWith(error);

    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(status()).toMatchObject({ server: null }));
  });

  it('maps the server error key through submitErrorKey', async () => {
    const user = userEvent.setup();

    render(<View onSubmit={() => Promise.reject(new Error('conflict'))} />);
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(status()).toMatchObject({ server: 'event.conflict' })
    );
  });

  it('is clean again after a successful submit', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.type(input('title'), '!');

    expect(status()).toMatchObject({ dirty: true });

    await user.click(screen.getByText('save'));

    await waitFor(() => expect(status()).toMatchObject({ dirty: false }));
    expect(onSubmit).toHaveBeenCalledWith(
      { ...loaded, title: 'Event!' },
      expect.objectContaining({ intent: 'save' })
    );

    await user.type(input('title'), '?');

    expect(status()).toMatchObject({ dirty: true });

    await user.type(input('title'), '{Backspace}');

    expect(status()).toMatchObject({ dirty: false });
  });

  it('ignores what onSubmit returns when it resets the dirty state', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(() => ({ saved: true }));

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.type(input('title'), '!');
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    await waitFor(() => expect(status()).toMatchObject({ dirty: false }));
  });

  it('keeps edits made while onSubmit is pending dirty', async () => {
    const user = userEvent.setup();
    const save = deferred();
    const sent: unknown[] = [];

    render(
      <HandleView
        onSubmit={async handle => {
          sent.push(getChangedValues(handle));
          await save.promise;
        }}
      />
    );
    await settle();
    await user.type(input('title'), '!');
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(sent).toHaveLength(1));
    await user.type(input('title'), '?');
    await act(async () => save.resolve());
    await settle();

    expect(input('title')).toHaveValue('Event!?');
    expect(status()).toMatchObject({ dirty: true });

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(sent).toEqual([{ title: 'Event!' }, { title: 'Event!?' }])
    );
  });

  it('stays dirty when onSubmit maps a server error to a field', async () => {
    const user = userEvent.setup();
    const sent: unknown[] = [];

    useUnsavedChanges.mockClear();
    render(
      <HandleView
        onSubmit={(handle, values) => {
          sent.push(getChangedValues(handle));

          if (values.key === 'taken') {
            setFieldError(handle, 'key', 'consents.uniqueConstraint', {
              key: values.key,
            });
          }
        }}
      />
    );
    await settle();
    await user.type(input('title'), '!');
    await user.clear(input('key'));
    await user.type(input('key'), 'taken');
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /^consents\.uniqueConstraint/
      )
    );
    expect(status()).toMatchObject({ dirty: true });
    expect(useUnsavedChanges).toHaveBeenLastCalledWith(true);

    await user.clear(input('key'));
    await user.type(input('key'), 'free');
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent[1]).toEqual({ title: 'Event!', key: 'free' });
    await waitFor(() => expect(status()).toMatchObject({ dirty: false }));
  });

  it('submits once while a submit is pending', async () => {
    const save = deferred();
    const onSubmit = vi.fn(() => save.promise);
    const { container } = render(<View onSubmit={onSubmit} />);
    const element = container.querySelector('form');

    await settle();
    await act(async () => {
      element?.requestSubmit();
      element?.requestSubmit();
    });
    await settle();

    expect(onSubmit).toHaveBeenCalledTimes(1);

    await act(async () => save.resolve());
    await settle();
    await act(async () => {
      element?.requestSubmit();
    });

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(2));
  });

  it('submits again after an invalid submit', async () => {
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        onSubmit={onSubmit}
        onInvalid={onInvalid}
      />
    );
    await settle();
    await user.clear(input('title'));
    await user.click(screen.getByText('save'));
    await waitFor(() => expect(onInvalid).toHaveBeenCalledTimes(1));
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onInvalid).toHaveBeenCalledTimes(2));
  });

  it('reports no unsaved changes while onSubmit runs, and again once it fails', async () => {
    const user = userEvent.setup();
    const seen: unknown[] = [];
    const onSubmit = vi.fn(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
      seen.push(useUnsavedChanges.mock.lastCall?.[0]);

      throw new Error('down');
    });

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.type(input('title'), '!');
    await user.click(screen.getByText('save'));
    await waitFor(() =>
      expect(status()).toMatchObject({ server: 'form.errors.server' })
    );

    expect(seen).toEqual([false]);
    expect(useUnsavedChanges).toHaveBeenLastCalledWith(true);
  });

  it('disables its fields and blocks submit when disabled', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        onSubmit={onSubmit}
        disabled
      />
    );
    await settle();

    expect(input('title')).toBeDisabled();
    expect(status()).toMatchObject({ canSubmit: false });

    await user.click(screen.getByText('save'));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('reports unsaved changes to useUnsavedChanges', async () => {
    const user = userEvent.setup();

    render(<View onSubmit={vi.fn()} />);
    await settle();

    expect(useUnsavedChanges).toHaveBeenLastCalledWith(false);

    await user.type(input('title'), '!');

    expect(useUnsavedChanges).toHaveBeenLastCalledWith(true);

    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(useUnsavedChanges).toHaveBeenLastCalledWith(false)
    );
  });

  it('still calls useUnsavedChanges, with false, when the warning is off', async () => {
    const user = userEvent.setup();

    render(
      <View
        onSubmit={vi.fn()}
        warnOnUnsavedChanges={false}
      />
    );
    await settle();
    useUnsavedChanges.mockClear();
    await user.type(input('title'), '!');

    expect(status()).toMatchObject({ dirty: true });
    expect(useUnsavedChanges).toHaveBeenCalled();
    expect(
      useUnsavedChanges.mock.calls.every(([dirty]) => dirty === false)
    ).toBe(true);
  });

  it('focuses the first invalid field', async () => {
    const user = userEvent.setup();
    const onInvalid = vi.fn();

    render(
      <View
        onSubmit={vi.fn()}
        onInvalid={onInvalid}
      />
    );
    await settle();
    await user.clear(input('title'));
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onInvalid).toHaveBeenCalled());
    await waitFor(() => expect(input('title')).toHaveFocus());
  });

  it('logs errors of unrendered fields when no summary is mounted', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onSubmit = vi.fn();
    const onInvalid = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        load={async () => ({ ...loaded, key: '' })}
        onSubmit={onSubmit}
        onInvalid={onInvalid}
        renderKey={false}
      />
    );
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onInvalid).toHaveBeenCalled());
    expect(onSubmit).not.toHaveBeenCalled();
    expect(onInvalid.mock.calls[0][0]).toHaveProperty(
      'key.message',
      'form.errors.required'
    );
    expect(error).toHaveBeenCalledWith(expect.stringContaining('"key"'));

    error.mockRestore();
  });

  it('does not log when a summary is mounted', async () => {
    const error = vi
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);
    const onInvalid = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        load={async () => ({ ...loaded, key: '' })}
        onSubmit={vi.fn()}
        onInvalid={onInvalid}
        renderKey={false}
      >
        <ErrorSummary />
      </View>
    );
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onInvalid).toHaveBeenCalled());
    expect(error).not.toHaveBeenCalled();

    error.mockRestore();
  });
});

describe('Form element', () => {
  const small = z.object({ title: z.string() });

  function StyledForm(props: ComponentProps<'form'>) {
    return (
      <form
        data-testid="styled"
        {...props}
      />
    );
  }

  const styled = createTestForm({ as: StyledForm });

  function ElementView({ as }: { as?: ElementType }) {
    const handle = styled.useSchemaForm(small);

    return (
      <styled.Form
        form={handle}
        onSubmit={vi.fn()}
        as={as}
        id="event-form"
      />
    );
  }

  it('renders the element of the config with the id and noValidate', () => {
    render(<ElementView />);

    expect(screen.getByTestId('styled')).toHaveAttribute('id', 'event-form');
    expect(screen.getByTestId('styled')).toHaveAttribute('novalidate');
    expect(input('title').id).toBe('event-form-title');
  });

  it('renders nothing for children that evaluate to nothing', () => {
    function Conditional({ note }: { note?: string }) {
      const handle = styled.useSchemaForm(small);

      return (
        <styled.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          {note && <p>{note}</p>}
        </styled.Form>
      );
    }

    render(<Conditional />);

    expect(screen.getByTestId('styled')).toBeEmptyDOMElement();
  });

  it('lets the Form choose another element', () => {
    const { container } = render(<ElementView as="section" />);

    expect(container.querySelector('section#event-form')).toContainElement(
      input('title')
    );
    expect(screen.queryByTestId('styled')).not.toBeInTheDocument();
  });
});
