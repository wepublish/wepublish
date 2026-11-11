import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod/v4';
import {
  createTestForm,
  input,
  settle,
  status,
  StatusLine,
} from '../testing/form-test-kit';
import { useFieldErrors } from './use-field-errors';
import { useFormStatus } from './use-form-status';

const form = createTestForm();

const schema = z.object({
  title: z.string().min(1).meta({ label: 'event.title' }),
  lead: z.string().min(1),
  seo: z.object({ slug: z.string().min(1), keywords: z.string() }),
});

const { Field } = form.fieldsFor(schema);

function TabMarker({
  name,
  paths,
}: {
  name: string;
  paths: string | readonly string[];
}) {
  const errors = useFieldErrors(paths);

  return (
    <p data-testid={`tab-${name}`}>
      {errors
        .map(entry => `${entry.path}=${entry.label ?? ''}=${entry.message}`)
        .join(';')}
    </p>
  );
}

function View({ onSubmit = vi.fn() }: { onSubmit?: () => unknown }) {
  const handle = form.useSchemaForm(schema, {
    defaultValues: async () => ({
      title: 'T',
      lead: 'L',
      seo: { slug: 's', keywords: '' },
    }),
  });

  return (
    <form.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <StatusLine />
      <TabMarker
        name="content"
        paths={['title', 'lead']}
      />
      <TabMarker
        name="seo"
        paths="seo"
      />
      <Field name="title" />
      <Field name="lead" />
      <Field name="seo" />
      <button type="submit">save</button>
    </form.Form>
  );
}

describe('useFormStatus', () => {
  it('reports loading, then ready', async () => {
    render(<View />);

    expect(status()).toEqual({
      loading: true,
      submitting: false,
      dirty: false,
      canSubmit: false,
      loadError: null,
      server: null,
    });

    await settle();

    expect(status()).toMatchObject({ loading: false, canSubmit: true });
  });

  it('reports submitting and blocks a second submit meanwhile', async () => {
    let finish: () => void = () => undefined;
    const onSubmit = vi.fn(() => new Promise<void>(done => (finish = done)));
    const user = userEvent.setup();

    render(<View onSubmit={onSubmit} />);
    await settle();
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(status()).toMatchObject({ submitting: true, canSubmit: false })
    );

    finish();

    await waitFor(() =>
      expect(status()).toMatchObject({ submitting: false, canSubmit: true })
    );
  });

  it('reports dirty values', async () => {
    const user = userEvent.setup();

    render(<View />);
    await settle();
    await user.type(input('title'), '!');

    expect(status()).toMatchObject({ dirty: true });
  });

  it('exposes isValid', async () => {
    const results: boolean[] = [];

    function Validity() {
      const { isValid } = useFormStatus();

      results.push(isValid);

      return null;
    }

    function ValidityView() {
      const handle = form.useSchemaForm(schema);

      return (
        <form.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <Validity />
        </form.Form>
      );
    }

    render(<ValidityView />);
    await settle();

    expect(results.at(-1)).toBe(false);
  });
});

describe('useFieldErrors', () => {
  it('lists the translated errors below the given paths', async () => {
    const user = userEvent.setup();

    render(<View />);
    await settle();
    await user.clear(input('title'));
    await user.clear(input('seo.slug'));
    await user.click(screen.getByText('save'));

    await waitFor(() =>
      expect(screen.getByTestId('tab-content').textContent).toMatch(
        /^title=event\.title=form\.errors\.required\|/
      )
    );
    expect(screen.getByTestId('tab-seo').textContent).toMatch(
      /^seo\.slug==form\.errors\.required\|/
    );
  });

  it('is empty without errors', async () => {
    render(<View />);
    await settle();

    expect(screen.getByTestId('tab-content')).toHaveTextContent('');
  });
});
