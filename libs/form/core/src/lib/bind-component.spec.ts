import {
  bindComponent,
  fieldComponent,
  isBoundComponent,
} from './bind-component';

const CurrencyField = (props: { currency: string }) => props.currency;
const SwitchField = () => null;

describe('bindComponent', () => {
  it('returns the component with its props', () => {
    const bound = bindComponent(CurrencyField, { currency: 'CHF' });

    expect(bound.component).toBe(CurrencyField);
    expect(bound.props).toEqual({ currency: 'CHF' });
  });

  it('marks a component with its value type without wrapping it', () => {
    const CentsField = fieldComponent<number | null>()(CurrencyField);

    expect(CentsField).toBe(CurrencyField);
    expect(bindComponent(CentsField, { currency: 'CHF' }).component).toBe(
      CurrencyField
    );
  });

  it('has empty props when none are given', () => {
    expect(bindComponent(SwitchField).props).toEqual({});
  });

  it('is recognised by isBoundComponent', () => {
    expect(isBoundComponent(bindComponent(SwitchField))).toBe(true);
    expect(isBoundComponent({ component: SwitchField, props: {} })).toBe(false);
    expect(isBoundComponent(SwitchField)).toBe(false);
    expect(isBoundComponent(undefined)).toBe(false);
  });
});
