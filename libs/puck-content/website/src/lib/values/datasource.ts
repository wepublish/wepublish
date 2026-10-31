import { PuckDatasources } from '../blocks/graphql-shape';

export type PuckDatasourceModel = keyof PuckDatasources;

export const datasourceIds = (
  value: PuckDatasources | null | undefined,
  model: PuckDatasourceModel
): string[] => {
  const current = value?.[model];

  if (current?.type === 'single') {
    return current.id ? [current.id] : [];
  }

  if (current?.type === 'multiple') {
    return [...(current.ids ?? [])];
  }

  return [];
};
