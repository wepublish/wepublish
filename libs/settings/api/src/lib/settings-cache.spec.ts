import { assertShareableNamespaces } from '@wepublish/kv-ttl-cache/api';
import { SETTINGS_SHARED_NAMESPACES } from '../index';

describe('SETTINGS_SHARED_NAMESPACES', () => {
  it('shares the settings and the website settings', () => {
    expect(SETTINGS_SHARED_NAMESPACES).toEqual([
      'settings',
      'website-settings',
    ]);
  });

  it('never shares integration settings', () => {
    expect(() =>
      assertShareableNamespaces(SETTINGS_SHARED_NAMESPACES)
    ).not.toThrow();
  });
});
