import { getFieldByLabel, renderEditorForm } from '../../testing';
import { fireEvent, screen, waitFor } from '@testing-library/react';
import i18next from 'i18next';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { z } from 'zod/v4';

import { editorForm } from '../editor-form';

const schema = z.object({
  delay: z.number().min(0).default(5).meta({
    label: 'banner.form.delay',
    description: 'banner.form.delayInfo',
  }),
  limit: z.number().int().nullish().meta({ label: 'banner.form.limit' }),
});

type Values = z.output<typeof schema>;

const { Field } = editorForm.fieldsFor(schema);

function View({
  onSubmit = vi.fn(),
  disabled,
  readOnly,
}: {
  onSubmit?: (values: Values) => unknown;
  disabled?: boolean;
  readOnly?: boolean;
}) {
  const handle = editorForm.useSchemaForm(schema);

  return (
    <editorForm.Form
      form={handle}
      onSubmit={onSubmit}
    >
      <Field
        name="delay"
        props={{ unit: 's' }}
        disabled={disabled}
        readOnly={readOnly}
      />
      <Field name="limit" />
      <button type="submit">save</button>
    </editorForm.Form>
  );
}

describe('NumberField', () => {
  it('labels the input, marks a defaulted number as required and explains it', () => {
    renderEditorForm(<View />);

    const delay = getFieldByLabel('banner.form.delay*');

    expect(delay).toHaveAttribute('type', 'number');
    expect(delay).toHaveValue(5);
    expect(
      screen.getByRole('button', { name: 'banner.form.delayInfo' })
    ).toBeInTheDocument();
    expect(getFieldByLabel('banner.form.limit')).not.toBeRequired();
  });

  it('passes the bounds and the step of the schema to the input', () => {
    const bounded = z.object({
      weight: z
        .number()
        .min(0)
        .max(10)
        .multipleOf(5)
        .meta({ label: 'banner.form.delay' }),
    });
    const { Field: BoundedField } = editorForm.fieldsFor(bounded);

    function BoundedView() {
      const handle = editorForm.useSchemaForm(bounded);

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <BoundedField name="weight" />
        </editorForm.Form>
      );
    }

    renderEditorForm(<BoundedView />);

    const weight = getFieldByLabel('banner.form.delay*');

    expect(weight).toHaveAttribute('min', '0');
    expect(weight).toHaveAttribute('max', '10');
    expect(weight).toHaveAttribute('step', '5');
  });

  it('shows the unit next to the input and announces it with the value', () => {
    renderEditorForm(<View />);

    expect(screen.getByText('s')).toBeInTheDocument();
    expect(getFieldByLabel('banner.form.delay*')).toHaveAccessibleDescription(
      's'
    );
  });

  it('translates a unit given as a key and shows any other unit as it is', () => {
    const i18n = i18next.createInstance();

    void i18n.init({
      lng: 'en',
      initImmediate: false,
      resources: {
        en: { translation: { form: { units: { days: 'days' } } } },
      },
    });

    function Units({ unit }: { unit: ReactNode }) {
      const handle = editorForm.useSchemaForm(schema);

      return (
        <editorForm.Form
          form={handle}
          onSubmit={vi.fn()}
        >
          <Field
            name="delay"
            props={{ unit }}
          />
          <Field name="limit" />
        </editorForm.Form>
      );
    }

    const { unmount } = renderEditorForm(
      <I18nextProvider i18n={i18n}>
        <Units unit="form.units.days" />
      </I18nextProvider>
    );

    expect(getFieldByLabel('banner.form.delay*')).toHaveAccessibleDescription(
      'days'
    );

    unmount();
    renderEditorForm(
      <I18nextProvider i18n={i18n}>
        <Units unit={<b>form.units.days</b>} />
      </I18nextProvider>
    );

    expect(getFieldByLabel('banner.form.delay*')).toHaveAccessibleDescription(
      'form.units.days'
    );
  });

  it('submits numbers, not text', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.clear(getFieldByLabel('banner.form.delay*'));
    await user.type(getFieldByLabel('banner.form.delay*'), '12');
    await user.type(getFieldByLabel('banner.form.limit'), '3');
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { delay: 12, limit: 3 },
        expect.anything()
      )
    );
  });

  it('emits the cleared value when emptied, so a defaulted number becomes required', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);

    await user.clear(getFieldByLabel('banner.form.delay*'));
    await user.click(screen.getByRole('button', { name: 'save' }));

    expect(await screen.findByText('form.errors.required')).toBeInTheDocument();
    expect(getFieldByLabel('banner.form.delay*')).toHaveValue(null);
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits an emptied optional number as null and never as NaN', async () => {
    const onSubmit = vi.fn();
    const { user } = renderEditorForm(<View onSubmit={onSubmit} />);
    const limit = getFieldByLabel('banner.form.limit');

    await user.type(limit, '7');
    fireEvent.change(limit, { target: { value: 'abc' } });
    await user.click(screen.getByRole('button', { name: 'save' }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { delay: 5, limit: null },
        expect.anything()
      )
    );
  });

  it('shows range errors once the field was left', async () => {
    const { user } = renderEditorForm(<View />);
    const delay = getFieldByLabel('banner.form.delay*');

    await user.clear(delay);
    await user.type(delay, '-1');

    expect(
      screen.queryByText(/^form\.errors\.too_small\.number/)
    ).not.toBeInTheDocument();

    await user.tab();

    expect(
      await screen.findByText(/^form\.errors\.too_small\.number/)
    ).toBeInTheDocument();
    expect(delay).toHaveAttribute('aria-invalid', 'true');
  });

  it('can be disabled or read only', () => {
    const { unmount } = renderEditorForm(<View disabled />);

    expect(getFieldByLabel('banner.form.delay*')).toBeDisabled();

    unmount();
    renderEditorForm(<View readOnly />);

    expect(getFieldByLabel('banner.form.delay*')).toHaveAttribute('readonly');
  });
});
