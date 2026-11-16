import { bindComponent } from './bind-component';
import {
  evaluateOverride,
  hasDynamic,
  mergeOverrides,
  toOverride,
} from './overrides';

const Currency = (props: { currency: string }) => props.currency;

describe('toOverride', () => {
  it('reads objects and ignores everything else', () => {
    expect(toOverride({ label: 'x' })).toEqual({ label: 'x' });
    expect(toOverride(undefined)).toEqual({});
    expect(toOverride('x')).toEqual({});
  });
});

describe('mergeOverrides', () => {
  it('uses the override of the path', () => {
    expect(mergeOverrides({ title: { label: 'a' } }, 'title')).toEqual({
      label: 'a',
    });
  });

  it('lets per-call values win', () => {
    expect(
      mergeOverrides({ title: { label: 'a', placeholder: 'p' } }, 'title', {
        label: 'b',
      })
    ).toEqual({ label: 'b', placeholder: 'p' });
  });

  it('ignores undefined per-call values', () => {
    expect(
      mergeOverrides({ title: { label: 'a' } }, 'title', { label: undefined })
    ).toEqual({
      label: 'a',
    });
  });

  it('applies the * override to concrete item paths', () => {
    expect(
      mergeOverrides(
        {
          'actions.*.label': { label: 'any', hidden: true },
          'actions.0.label': { label: 'first' },
        },
        'actions.0.label'
      )
    ).toEqual({ label: 'first', hidden: true });
  });

  it('merges static props', () => {
    expect(
      mergeOverrides({ tags: { props: { tagType: 'Event' } } }, 'tags', {
        props: { multiple: true },
      })
    ).toEqual({ props: { tagType: 'Event', multiple: true } });
  });

  it('merges Dynamic props into one Dynamic', () => {
    const merged = mergeOverrides(
      {
        delay: {
          props: (values: { active: boolean }) => ({
            unit: values.active ? 's' : 'ms',
          }),
        },
      },
      'delay',
      { props: { step: 5 } }
    );

    expect(hasDynamic(merged)).toBe(true);
    expect(evaluateOverride(merged, { active: true }).props).toEqual({
      unit: 's',
      step: 5,
    });
  });

  it('keeps a bound component', () => {
    const component = bindComponent(Currency, { currency: 'CHF' });

    expect(mergeOverrides({ goal: { component } }, 'goal').component).toBe(
      component
    );
  });
});

describe('hasDynamic', () => {
  it('is true when a Dynamic key holds a function', () => {
    expect(hasDynamic({ hidden: () => true })).toBe(true);
    expect(hasDynamic({ options: () => [] })).toBe(true);
  });

  it('ignores callbacks that are not Dynamic', () => {
    expect(
      hasDynamic({
        label: 'x',
        normalize: value => value,
        guard: () => true,
        onValueChange: () => undefined,
        optionLabel: value => String(value),
        layout: () => null,
      })
    ).toBe(false);
  });
});

describe('evaluateOverride', () => {
  it('calls every Dynamic function with the values', () => {
    const values = { active: false, name: 'n' };

    expect(
      evaluateOverride(
        {
          label: (current: typeof values) => `label.${current.name}`,
          hidden: (current: typeof values) => !current.active,
          required: true,
          options: () => ['a'],
        },
        values
      )
    ).toEqual({
      label: 'label.n',
      hidden: true,
      required: true,
      options: ['a'],
    });
  });

  it('keeps the other callbacks', () => {
    const normalize = (value: unknown) => value;

    expect(evaluateOverride({ normalize }, {}).normalize).toBe(normalize);
  });
});
