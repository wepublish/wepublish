import { TFunction } from 'i18next';

import { overrideDescription } from './typography-screen-sizes';

const t = ((key: string, options?: Record<string, unknown>) =>
  options ? `${key} ${JSON.stringify(options)}` : key) as unknown as TFunction;

describe('overrideDescription', () => {
  it('tells what is inherited while the override is off', () => {
    expect(
      overrideDescription(t, { value: '1.4em', from: 'allVariants' }, false)
    ).toBe(
      'websiteSettings.theme.typography.inheritedFromGeneral {"value":"1.4em"}'
    );
    expect(overrideDescription(t, undefined, false)).toBe(
      'websiteSettings.theme.typography.inheritedNone'
    );
  });

  it('tells what turning the override off brings back while it is on', () => {
    expect(
      overrideDescription(t, { value: '1.4em', from: 'allVariants' }, true)
    ).toBe(
      'websiteSettings.theme.typography.replacesFromGeneral {"value":"1.4em"}'
    );
    expect(overrideDescription(t, { value: '2rem', from: 'sm' }, true)).toBe(
      'websiteSettings.theme.typography.replacesFromWidth {"value":"2rem","name":"sm","width":600}'
    );
    expect(overrideDescription(t, { value: '2rem', from: 'xs' }, true)).toBe(
      'websiteSettings.theme.typography.replacesFromBaseline {"value":"2rem"}'
    );
    expect(
      overrideDescription(t, { value: '1.15em', from: 'theme' }, true)
    ).toBe(
      'websiteSettings.theme.typography.replacesFromTheme {"value":"1.15em"}'
    );
  });

  it('never says there is nothing to inherit while the override is on', () => {
    expect(overrideDescription(t, undefined, true)).toBe(
      'websiteSettings.theme.typography.replacesNone'
    );
  });
});
