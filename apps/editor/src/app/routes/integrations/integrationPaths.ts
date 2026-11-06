import type { SettingProvider } from '@wepublish/editor/api';
import type { FormPaths } from '@wepublish/form/editor';

export type IntegrationType =
  | 'ai'
  | 'analytics'
  | 'challenge'
  | 'payment'
  | 'tracking-pixel';

export const integrationRoutes = (type: IntegrationType) =>
  ({
    list: `/integrations/${type}`,
    create: `/integrations/${type}/create`,
    edit: `/integrations/${type}/edit/:id`,
  }) as const;

export const integrationPaths = (type: IntegrationType): FormPaths => ({
  list: `/integrations/${type}`,
  edit: id => `/integrations/${type}/edit/${id}`,
});

export const settingName = (setting: SettingProvider & { type?: string }) =>
  setting.name || setting.type || setting.id;

export function findSetting<T extends { id: string }>(
  settings: readonly T[],
  id: string
): T {
  const setting = settings.find(candidate => candidate.id === id);

  if (setting === undefined) {
    throw new Error(id);
  }

  return setting;
}
