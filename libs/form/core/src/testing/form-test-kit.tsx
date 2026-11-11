import { act, screen } from '@testing-library/react';
import { createForm } from '../lib/create-form';
import type { OptionValue } from '../lib/field-info';
import type { FormConfig } from '../lib/form-types';
import { useArrayField } from '../lib/use-array-field';
import { useField } from '../lib/use-field';
import { useFormErrorSummary } from '../lib/use-form-error-summary';
import { useFormStatus } from '../lib/use-form-status';
import { useObjectField } from '../lib/use-object-field';
import { useUnionField } from '../lib/use-union-field';

export const translate = (key: string, params?: Record<string, unknown>) =>
  params === undefined ? key : `${key}|${JSON.stringify(params)}`;

export function TextInput({
  type = 'text',
}: {
  type?: 'text' | 'email' | 'url';
}) {
  const { ref, ...field } = useField<string | null | undefined>();

  return (
    <div data-testid={`field:${field.name}`}>
      {field.hideLabel ? null : (
        <label htmlFor={field.id}>
          {field.label}
          {field.required ? ' *' : ''}
        </label>
      )}
      <input
        ref={ref}
        id={field.id}
        name={field.name}
        type={type}
        aria-label={field.name}
        aria-invalid={field.invalid}
        value={field.value ?? ''}
        placeholder={field.placeholder}
        disabled={field.disabled}
        readOnly={field.readOnly}
        onChange={event => field.onChange(event.target.value)}
        onBlur={field.onBlur}
      />
      {field.description ?
        <small>{field.description}</small>
      : null}
      {field.error ?
        <p role="alert">{field.error}</p>
      : null}
      {!field.error && field.helperText ?
        <p>{field.helperText}</p>
      : null}
    </div>
  );
}

export function NumberInput() {
  const { ref, ...field } = useField<number | null | undefined>();

  return (
    <div data-testid={`field:${field.name}`}>
      <label htmlFor={field.id}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      <input
        ref={ref}
        id={field.id}
        type="number"
        aria-label={field.name}
        value={field.value ?? ''}
        disabled={field.disabled}
        onChange={event =>
          field.onChange(
            event.target.value === '' ? null : Number(event.target.value)
          )
        }
        onBlur={field.onBlur}
      />
      {field.error ?
        <p role="alert">{field.error}</p>
      : null}
    </div>
  );
}

export function SwitchInput() {
  const { ref, ...field } = useField<boolean>();

  return (
    <div data-testid={`field:${field.name}`}>
      <input
        ref={ref}
        id={field.id}
        type="checkbox"
        aria-label={field.name}
        checked={field.value}
        disabled={field.disabled}
        onChange={event => field.onChange(event.target.checked)}
        onBlur={field.onBlur}
      />
      <label htmlFor={field.id}>{field.label}</label>
    </div>
  );
}

export function SelectInput() {
  const { ref, ...field } = useField<OptionValue | null | undefined>();

  return (
    <div data-testid={`field:${field.name}`}>
      <label htmlFor={field.id}>
        {field.label}
        {field.required ? ' *' : ''}
      </label>
      <select
        ref={ref}
        id={field.id}
        aria-label={field.name}
        value={
          field.value === null || field.value === undefined ?
            ''
          : String(field.value)
        }
        disabled={field.disabled}
        onChange={event =>
          field.onChange(
            field.options.find(
              option => String(option.value) === event.target.value
            )?.value ?? ''
          )
        }
        onBlur={field.onBlur}
      >
        <option value="">-</option>
        {field.options.map(option => (
          <option
            key={String(option.value)}
            value={String(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>
      {field.error ?
        <p role="alert">{field.error}</p>
      : null}
    </div>
  );
}

export function GroupField() {
  const group = useObjectField();

  return (
    <fieldset aria-label={group.name}>
      <legend>{group.label}</legend>
      {group.keys.map(key => group.renderField(key))}
      {group.error ?
        <p role="alert">{group.error}</p>
      : null}
    </fieldset>
  );
}

export function ListField({ addLabel = 'add' }: { addLabel?: string }) {
  const list = useArrayField();

  return (
    <section aria-label={list.name}>
      <h3>{list.label}</h3>
      {list.items.map(item => (
        <div
          key={item.key}
          data-testid={`${list.name}.row`}
        >
          {list.renderItem(item.index)}
        </div>
      ))}
      <button
        type="button"
        onClick={() => list.append()}
      >
        {addLabel} {list.name}
      </button>
      {list.error ?
        <p role="alert">{list.error}</p>
      : null}
    </section>
  );
}

export function UnionField() {
  const union = useUnionField();

  return (
    <fieldset aria-label={union.name}>
      <select
        aria-label={`${union.name}:${union.discriminator}`}
        value={String(union.active ?? '')}
        onChange={event =>
          union.setType(
            union.options.find(
              option => String(option.value) === event.target.value
            )?.value ?? event.target.value
          )
        }
      >
        {union.options.map(option => (
          <option
            key={String(option.value)}
            value={String(option.value)}
          >
            {option.label}
          </option>
        ))}
      </select>
      {union.renderBranch()}
    </fieldset>
  );
}

export function StatusLine() {
  const status = useFormStatus();

  return (
    <output data-testid="status">
      {JSON.stringify({
        loading: status.isLoading,
        submitting: status.isSubmitting,
        dirty: status.isDirty,
        canSubmit: status.canSubmit,
        loadError:
          status.loadError === undefined ? null : String(status.loadError),
        server: status.serverError ?? null,
      })}
    </output>
  );
}

export function ErrorSummary() {
  const entries = useFormErrorSummary();

  return (
    <ul aria-label="error summary">
      {entries.map(entry => (
        <li key={entry.path}>
          {entry.focus ?
            <button
              type="button"
              onClick={entry.focus}
            >
              {entry.path}:{entry.label}:{entry.message}
            </button>
          : <>
              {entry.path}:{entry.label}:{entry.message}
            </>
          }
        </li>
      ))}
    </ul>
  );
}

export const testComponents = {
  string: TextInput,
  number: NumberInput,
  boolean: SwitchInput,
  enum: SelectInput,
  object: GroupField,
  array: ListField,
  discriminatedUnion: UnionField,
};

export type TestComponents = typeof testComponents;

export const createTestForm = (
  config: Omit<Partial<FormConfig<TestComponents>>, 'components'> = {}
) =>
  createForm({
    components: testComponents,
    useTranslate: () => translate,
    Loading: () => <p>loading</p>,
    LoadError: ({ error, retry }) => (
      <>
        <p role="alert">load failed: {String(error)}</p>
        <button
          type="button"
          onClick={retry}
        >
          retry load
        </button>
      </>
    ),
    ...config,
  });

export const settle = () =>
  act(async () => {
    await new Promise(resolve => setTimeout(resolve, 0));
  });

export const status = (): Record<string, unknown> =>
  JSON.parse(screen.getByTestId('status').textContent ?? '{}');

export const input = (name: string) =>
  screen.getByLabelText<HTMLInputElement>(name);

export const fieldText = (name: string) =>
  screen.getByTestId(`field:${name}`).textContent;
