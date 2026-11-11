import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod/v4';
import {
  createTestForm,
  fieldText,
  input,
  settle,
  status,
  StatusLine,
} from '../testing/form-test-kit';
import { getChangedValues } from './changed-values';

const form = createTestForm();

const schema = z.object({
  title: z.string(),
  seo: z
    .object({
      slug: z.string().min(1).meta({ label: 'seo.slug' }),
      title: z.string().min(1).meta({ label: 'seo.title' }),
    })
    .optional(),
  address: z
    .object({ street: z.string().min(1).meta({ label: 'address.street' }) })
    .nullable(),
});

type Values = z.output<typeof schema>;

const { Field } = form.fieldsFor(schema);

type Loaded = { title?: string; address?: { street?: string } | null };

function View({
  onSubmit = vi.fn(),
  onChanges = vi.fn(),
  loaded,
}: {
  onSubmit?: (values: Values) => void;
  onChanges?: (changes: unknown) => void;
  loaded?: Loaded;
}) {
  const handle = form.useSchemaForm(
    schema,
    loaded ? { defaultValues: async () => loaded } : {}
  );

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <StatusLine />
      <Field name="title" />
      <Field name="seo" />
      <Field name="address" />
      <button type="submit">save</button>
      <button
        type="button"
        onClick={() => onChanges(getChangedValues(handle.form))}
      >
        changes
      </button>
    </form.Form>
  );
}

const label = (name: string) =>
  screen.getByTestId(`field:${name}`).querySelector('label')?.textContent;

describe('useObjectField', () => {
  it('submits untouched optional and nullable groups as undefined and null', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: '',
      seo: undefined,
      address: null,
    });
  });

  it('is clean again once an edit inside a group is reverted', async () => {
    const onChanges = vi.fn();
    const user = userEvent.setup();

    render(<View onChanges={onChanges} />);
    await user.type(input('seo.slug'), 'a');
    await user.type(input('address.street'), 'b');

    expect(status()).toMatchObject({ dirty: true });

    await user.clear(input('seo.slug'));
    await user.clear(input('address.street'));

    expect(status()).toMatchObject({ dirty: false });

    await user.click(screen.getByText('changes'));

    expect(onChanges).toHaveBeenLastCalledWith({});
  });

  it('expands a null group from the server and submits it as null', async () => {
    const onSubmit = vi.fn();
    const onChanges = vi.fn();
    const user = userEvent.setup();

    render(
      <View
        onSubmit={onSubmit}
        onChanges={onChanges}
        loaded={{ title: 't', address: null }}
      />
    );
    await settle();
    await user.type(input('address.street'), 'b');
    await user.clear(input('address.street'));

    expect(input('address.street')).toHaveValue('');
    expect(status()).toMatchObject({ dirty: false });

    await user.click(screen.getByText('changes'));

    expect(onChanges).toHaveBeenLastCalledWith({});

    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toEqual({
      title: 't',
      seo: undefined,
      address: null,
    });
  });

  it('does not mark the fields of an optional or nullable group as required', () => {
    render(<View />);

    expect(label('seo.slug')).toBe('seo.slug');
    expect(label('address.street')).toBe('address.street');
  });

  it('validates a group once one of its fields is filled', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await user.type(input('seo.slug'), 'a');
    await user.click(screen.getByText('save'));
    await settle();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert')).toHaveTextContent(
      /^form\.errors\.required/
    );
    expect(fieldText('seo.title')).toContain('form.errors.required');
    expect(fieldText('seo.slug')).not.toContain('form.errors');
  });

  it('submits a group as absent again once its fields are cleared', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await user.type(input('address.street'), 'a');
    await user.clear(input('address.street'));
    await user.click(screen.getByText('save'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalled());
    expect(onSubmit.mock.calls[0][0]).toMatchObject({ address: null });
  });
});
