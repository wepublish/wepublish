import type { ReactNode } from 'react';
import type { RefCallBack } from 'react-hook-form';
import type { FormErrorEntry } from './error-entries';
import type { OptionValue } from './field-info';
import type { FieldOptionItem } from './field-text';
import type { ChildOverride } from './override-types';
import {
  useArrayField,
  type ArrayFieldItem,
  type ArrayItemKey,
} from './use-array-field';
import { useField } from './use-field';
import { useFieldErrors } from './use-field-errors';
import { useFormErrorSummary } from './use-form-error-summary';
import { useFormStatus } from './use-form-status';
import { useObjectField } from './use-object-field';
import { useUnionField } from './use-union-field';

describe('field hooks', () => {
  it('types useField by the value of the component', () => {
    const { ref, ...field } = useField<string | null>();

    expectTypeOf(ref).toEqualTypeOf<RefCallBack>();
    expectTypeOf(field.value).toEqualTypeOf<string | null>();
    expectTypeOf(field.onChange).parameter(0).toEqualTypeOf<string | null>();
    expectTypeOf(field.error).toEqualTypeOf<string | undefined>();
    expectTypeOf(field.label).toEqualTypeOf<ReactNode>();
    expectTypeOf(field.placeholder).toEqualTypeOf<string | undefined>();
    expectTypeOf(field.options).toEqualTypeOf<FieldOptionItem[]>();
    expectTypeOf(field.options[0].value).toEqualTypeOf<OptionValue>();
    expectTypeOf(useField().value).toBeUnknown();
  });

  it('types the container hooks', () => {
    expectTypeOf(useArrayField().items).toEqualTypeOf<ArrayFieldItem[]>();
    expectTypeOf(useArrayField().itemKeys).toEqualTypeOf<ArrayItemKey[]>();
    expectTypeOf(useArrayField().itemKeys[0].label).toEqualTypeOf<ReactNode>();
    expectTypeOf(useArrayField().renderItem).toEqualTypeOf<
      (index: number, override?: ChildOverride) => ReactNode
    >();
    expectTypeOf(useObjectField().renderField).toEqualTypeOf<
      (key: string, override?: ChildOverride) => ReactNode
    >();
    expectTypeOf(useUnionField().setType).toEqualTypeOf<
      (discriminant: unknown) => void
    >();
  });

  it('types the child overrides', () => {
    useObjectField().renderField('title', {
      hideLabel: true,
      label: 'x',
      readOnly: true,
    });
    // @ts-expect-error child overrides are static
    useObjectField().renderField('title', { hidden: () => true });
    // @ts-expect-error a component is bound
    useArrayField().renderItem(0, { component: () => null });
  });

  it('types the status hooks', () => {
    expectTypeOf(useFormStatus().canSubmit).toEqualTypeOf<boolean>();
    expectTypeOf(useFormStatus().serverError).toEqualTypeOf<
      string | undefined
    >();
    expectTypeOf(useFormErrorSummary()).toEqualTypeOf<FormErrorEntry[]>();
    expectTypeOf(useFieldErrors(['title', 'lead'])).toEqualTypeOf<
      FormErrorEntry[]
    >();
    expectTypeOf(useFieldErrors('seo')).toEqualTypeOf<FormErrorEntry[]>();
  });
});
