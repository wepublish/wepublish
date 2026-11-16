import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useFormState } from 'react-hook-form';
import { z } from 'zod/v4';
import { createTestForm, settle } from '../testing/form-test-kit';
import type { SchemaFormOptions } from './form-types';
import type { AnyFormSchema } from './value-types';

const onLoadError = vi.fn();
const form = createTestForm({ onLoadError });

const schema = z.object({
  title: z.string(),
  delay: z.number().default(5),
  starts: z.date(),
  tags: z.array(z.string()),
  link: z.object({ url: z.string(), label: z.string().optional() }),
});

const empty = {
  title: '',
  delay: 5,
  starts: null,
  tags: [],
  link: { url: '', label: '' },
};

function useLoadingState<S extends AnyFormSchema>(
  schema: S,
  options?: SchemaFormOptions<S>
) {
  const handle = form.useSchemaForm(schema, options);
  const { isLoading } = useFormState({ control: handle.form.control });

  return { handle, isLoading };
}

describe('useSchemaForm', () => {
  it('returns a handle with the form, the schema and no load error', () => {
    const { result } = renderHook(() => form.useSchemaForm(schema));

    expect(result.current.schema).toBe(schema);
    expect(result.current.loadError).toBeUndefined();
    expect(result.current.form.getValues()).toEqual(empty);
  });

  it('merges sync defaults over the empty values', () => {
    const { result } = renderHook(() =>
      form.useSchemaForm(schema, {
        defaultValues: { title: 'x', link: { url: 'u' } },
      })
    );

    expect(result.current.form.getValues()).toEqual({
      ...empty,
      title: 'x',
      link: { url: 'u', label: '' },
    });
  });

  it('merges async defaults, dropping keys outside the schema', async () => {
    const record = { title: 'loaded', __typename: 'Event' };
    const { result } = renderHook(() =>
      useLoadingState(schema, { defaultValues: async () => record })
    );

    expect(result.current.isLoading).toBe(true);

    await settle();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.handle.form.getValues()).toEqual({
      ...empty,
      title: 'loaded',
    });
  });

  it('catches a rejected loader into loadError and onLoadError, with empty values', async () => {
    const error = new Error('boom');
    const { result } = renderHook(() =>
      useLoadingState(schema, { defaultValues: () => Promise.reject(error) })
    );

    await settle();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.handle.loadError).toBe(error);
    expect(onLoadError).toHaveBeenCalledWith(error);
    expect(result.current.handle.form.getValues()).toEqual(empty);
  });

  it('turns a rejection without a reason into an error', async () => {
    const { result } = renderHook(() =>
      useLoadingState(schema, {
        defaultValues: () => Promise.reject(undefined),
      })
    );

    await settle();

    expect(result.current.handle.loadError).toBeInstanceOf(Error);
  });

  it('validates against the schema of the current render', async () => {
    const loose = z.object({ title: z.string() });
    const strict = z.object({ title: z.string().min(3) });
    const { result, rerender } = renderHook(
      ({ current }: { current: typeof loose }) => form.useSchemaForm(current),
      { initialProps: { current: loose } }
    );

    expect(await result.current.form.trigger()).toBe(true);

    rerender({ current: strict });

    expect(await result.current.form.trigger()).toBe(false);
  });
});

describe('validation modes', () => {
  const titleSchema = z.object({ title: z.string().min(3) });
  const Title = form.fieldsFor(titleSchema).Field;

  function View({
    options,
  }: {
    options?: SchemaFormOptions<typeof titleSchema>;
  }) {
    const handle = form.useSchemaForm(titleSchema, options);

    return (
      <form.Form
        form={handle}
        onSubmit={vi.fn()}
      >
        <Title name="title" />
        <button type="submit">save</button>
      </form.Form>
    );
  }

  it('shows errors on blur, then revalidates on change', async () => {
    const user = userEvent.setup();

    render(<View />);
    await user.type(screen.getByLabelText('title'), 'a');
    await settle();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();

    await user.tab();
    await settle();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'form.errors.too_small.string.min'
    );

    await user.type(screen.getByLabelText('title'), 'bc');
    await settle();

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lets the options choose other modes', async () => {
    const user = userEvent.setup();

    render(<View options={{ mode: 'onChange' }} />);
    await user.type(screen.getByLabelText('title'), 'a');
    await settle();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'form.errors.too_small.string.min'
    );
  });

  it('takes the default modes from the config', async () => {
    const onChangeForm = createTestForm({ mode: 'onChange' });
    const OnChangeTitle = onChangeForm.fieldsFor(titleSchema).Field;
    const user = userEvent.setup();

    function OnChangeView() {
      const handle = onChangeForm.useSchemaForm(titleSchema);

      return (
        <onChangeForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <OnChangeTitle name="title" />
        </onChangeForm.Form>
      );
    }

    render(<OnChangeView />);
    await user.type(screen.getByLabelText('title'), 'a');
    await settle();

    expect(screen.getByRole('alert')).toHaveTextContent(
      'form.errors.too_small.string.min'
    );
  });
});
