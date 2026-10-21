import type { TFunction } from 'i18next';
import { sidebarPlugins } from './sidebar';

const t = ((key: string) => key) as unknown as TFunction;

describe('sidebarPlugins', () => {
  it('puts the settings above Puck’s own tabs', () => {
    expect(sidebarPlugins(t).map(plugin => plugin.name)).toEqual([
      'settings',
      'blocks',
      'outline',
      'report',
    ]);
  });
});
