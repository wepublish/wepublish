import { PuckRegistryInput } from '@wepublish/editor/api';

import { isRecord } from './graphql-values';

export type PuckRegistration = {
  html: string;
  label?: string;
  styles?: string;
  script?: string;
  fields?: Record<string, unknown>;
  defaultProps?: Record<string, unknown>;
  streaming?: boolean;
  [key: string]: unknown;
};

export type PuckDynamicConfig = {
  components: Record<string, PuckRegistration>;
  styles?: string;
  script?: string;
};

export type StoredPuckRegistry = {
  components: unknown;
  styles?: string | null;
  script?: string | null;
};

const toRegistration = (value: unknown): PuckRegistration | undefined => {
  if (!isRecord(value)) {
    return undefined;
  }

  const { html, label, styles, script, fields, defaultProps, ...unknown } =
    value;

  return {
    ...unknown,
    html: typeof html === 'string' ? html : '',
    ...(typeof label === 'string' && { label }),
    ...(typeof styles === 'string' && { styles }),
    ...(typeof script === 'string' && { script }),
    ...(isRecord(fields) && { fields }),
    ...(isRecord(defaultProps) && { defaultProps }),
  };
};

const toRegistrations = (components: unknown) =>
  Object.fromEntries(
    Object.entries(isRecord(components) ? components : {}).flatMap(
      ([name, value]): [string, PuckRegistration][] => {
        const registration = toRegistration(value);

        return registration ? [[name, registration]] : [];
      }
    )
  );

const toConfig = ({
  components,
  styles,
  script,
}: StoredPuckRegistry): PuckDynamicConfig => ({
  components: toRegistrations(components),
  ...(typeof styles === 'string' && { styles }),
  ...(typeof script === 'string' && { script }),
});

const dynamicConfigKey = '_dynamicConfig';

export const dynamicConfigOf = (rootProps: object | null | undefined) =>
  rootProps && dynamicConfigKey in rootProps ?
    rootProps[dynamicConfigKey]
  : undefined;

export const withoutDynamicConfig = <Props extends object>(
  rootProps: Props
): Props =>
  dynamicConfigKey in rootProps ?
    (Object.fromEntries(
      Object.entries(rootProps).filter(([key]) => key !== dynamicConfigKey)
    ) as Props)
  : rootProps;

export const readDynamicConfig = (
  value: unknown
): PuckDynamicConfig | undefined =>
  isRecord(value) ?
    toConfig({
      components: value.components,
      styles: typeof value.styles === 'string' ? value.styles : undefined,
      script: typeof value.script === 'string' ? value.script : undefined,
    })
  : undefined;

export const isDynamicConfigStreaming = (value: unknown) =>
  Object.values(readDynamicConfig(value)?.components ?? {}).some(
    ({ streaming }) => !!streaming
  );

export const toDynamicConfig = (
  registry: StoredPuckRegistry | null | undefined
): PuckDynamicConfig | undefined => (registry ? toConfig(registry) : undefined);

const isEmpty = ({ components, styles, script }: PuckDynamicConfig) =>
  !Object.keys(components).length &&
  styles === undefined &&
  script === undefined;

export const toPuckRegistryInput = (
  dynamicConfig: unknown
): PuckRegistryInput | null => {
  const config = readDynamicConfig(dynamicConfig);

  return config && !isEmpty(config) ? config : null;
};
