import { forwardRef, lazy, memo } from 'react';
import {
  bindComponent,
  fieldComponent,
  type BoundComponent,
} from './bind-component';
import type { ExtraProps, HasRequiredProps } from './component-types';

const CurrencyField = (_: { currency: string; precision?: number }) => null;
const NumberField = (_: { unit?: string }) => null;
const SwitchField = () => null;
const MemoField = memo((_: { label: string }) => null);
const LazyField = lazy(async () => ({
  default: (_: { rows?: number }) => null,
}));
const RefCurrency = forwardRef<HTMLInputElement, { currency: string }>(
  (_props, _ref) => null
);
const MemoRefCurrency = memo(RefCurrency);
const CentsField = fieldComponent<number | null>()(CurrencyField);
const MemoCentsField = fieldComponent<number | null>()(MemoRefCurrency);

describe('bindComponent', () => {
  it('returns a BoundComponent', () => {
    expectTypeOf(
      bindComponent(CurrencyField, { currency: 'CHF' })
    ).toEqualTypeOf<BoundComponent<unknown>>();
  });

  it('records the value type a component declares', () => {
    expectTypeOf(bindComponent(CentsField, { currency: 'CHF' })).toEqualTypeOf<
      BoundComponent<number | null>
    >();
    expectTypeOf(
      bindComponent(MemoCentsField, { currency: 'CHF' })
    ).toEqualTypeOf<BoundComponent<number | null>>();
    expectTypeOf<ExtraProps<typeof CentsField>>().toEqualTypeOf<{
      currency: string;
      precision?: number;
    }>();
    // @ts-expect-error currency is still required
    bindComponent(CentsField);
  });

  it('lets any bound component stand in for an unchecked one', () => {
    expectTypeOf(
      bindComponent(CentsField, { currency: 'CHF' })
    ).toExtend<BoundComponent>();
    expectTypeOf(bindComponent(SwitchField)).toExtend<BoundComponent>();
    expectTypeOf(bindComponent(CentsField, { currency: 'CHF' })).toExtend<
      BoundComponent<number>
    >();
    expectTypeOf(bindComponent(CentsField, { currency: 'CHF' })).not.toExtend<
      BoundComponent<string>
    >();
  });

  it('requires the props when the component has required props', () => {
    bindComponent(CurrencyField, { currency: 'CHF', precision: 2 });
    bindComponent(MemoField, { label: 'x' });
    // @ts-expect-error currency is required
    bindComponent(CurrencyField);
    // @ts-expect-error currency is required
    bindComponent(CurrencyField, { precision: 2 });
  });

  it('checks the prop types', () => {
    // @ts-expect-error currency must be a string
    bindComponent(CurrencyField, { currency: 1 });
    // @ts-expect-error unknown props are rejected
    bindComponent(NumberField, { units: 's' });
  });

  it('makes props optional when every prop is optional', () => {
    bindComponent(NumberField);
    bindComponent(NumberField, { unit: 's' });
    bindComponent(LazyField, { rows: 3 });
  });

  it('leaves ref and key to the form', () => {
    bindComponent(RefCurrency, { currency: 'CHF' });
    bindComponent(MemoRefCurrency, { currency: 'CHF' });
    // @ts-expect-error the form owns the ref
    bindComponent(RefCurrency, { currency: 'CHF', ref: null });
    // @ts-expect-error the form owns the ref
    bindComponent(MemoRefCurrency, { currency: 'CHF', ref: null });
    // @ts-expect-error the form owns the key
    bindComponent(RefCurrency, { currency: 'CHF', key: 'x' });
  });

  it('rejects props for a component without props', () => {
    bindComponent(SwitchField);
    // @ts-expect-error SwitchField takes no props
    bindComponent(SwitchField, { unit: 's' });
  });
});

describe('ExtraProps and HasRequiredProps', () => {
  it('reads the props of plain, memo and lazy components', () => {
    expectTypeOf<ExtraProps<typeof CurrencyField>>().toEqualTypeOf<{
      currency: string;
      precision?: number;
    }>();
    expectTypeOf<ExtraProps<typeof MemoField>>().toEqualTypeOf<{
      label: string;
    }>();
    expectTypeOf<ExtraProps<typeof LazyField>>().toEqualTypeOf<{
      rows?: number;
    }>();
    expectTypeOf<ExtraProps<never>>().toEqualTypeOf<never>();
  });

  it('knows whether a component has required props', () => {
    expectTypeOf<
      HasRequiredProps<ExtraProps<typeof CurrencyField>>
    >().toEqualTypeOf<true>();
    expectTypeOf<
      HasRequiredProps<ExtraProps<typeof NumberField>>
    >().toEqualTypeOf<false>();
    expectTypeOf<
      HasRequiredProps<ExtraProps<typeof SwitchField>>
    >().toEqualTypeOf<false>();
  });
});
