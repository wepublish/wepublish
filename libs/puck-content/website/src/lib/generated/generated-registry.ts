import { FullPuckRegistryFragment } from '@wepublish/website/api';
import { omit } from 'ramda';

export type GeneratedRegistryInput = Pick<
  FullPuckRegistryFragment,
  'components' | 'styles' | 'script'
>;

type GeneratedRegistration = Readonly<Record<string, unknown>>;

export type GeneratedRegistry = {
  hash: string;
  components: Readonly<Record<string, GeneratedRegistration>>;
  styles: string | null;
  script: string | null;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const canonicalJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }

  if (isRecord(value)) {
    return `{${Object.keys(value)
      .filter(key => value[key] !== undefined)
      .sort()
      .map(key => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }

  return JSON.stringify(value) ?? 'null';
};

const hash53 = (text: string, seed: number) => {
  let first = 0xdeadbeef ^ seed;
  let second = 0x41c6ce57 ^ seed;

  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);

    first = Math.imul(first ^ code, 2654435761);
    second = Math.imul(second ^ code, 1597334677);
  }

  first =
    Math.imul(first ^ (first >>> 16), 2246822507) ^
    Math.imul(second ^ (second >>> 13), 3266489909);
  second =
    Math.imul(second ^ (second >>> 16), 2246822507) ^
    Math.imul(first ^ (first >>> 13), 3266489909);

  return (4294967296 * (2097151 & second) + (first >>> 0))
    .toString(36)
    .padStart(11, '0');
};

const contentHash = (text: string) => `${hash53(text, 1)}${hash53(text, 2)}`;

export const toGeneratedRegistry = ({
  components,
  styles,
  script,
}: GeneratedRegistryInput): GeneratedRegistry => {
  const content = {
    components:
      isRecord(components) ?
        Object.fromEntries(
          Object.entries(components).filter(
            (entry): entry is [string, Record<string, unknown>] =>
              isRecord(entry[1])
          )
        )
      : {},
    styles: styles || null,
    script: script || null,
  };

  return { hash: contentHash(canonicalJson(content)), ...content };
};

export const hasGeneratedComponent = (
  { components }: GeneratedRegistry,
  type: string
) => Object.hasOwn(components, type);

export const generatedComponentScript = (
  registry: GeneratedRegistry,
  type: string
): string | null => {
  const script =
    hasGeneratedComponent(registry, type) ?
      registry.components[type]['script']
    : null;

  return typeof script === 'string' && script ? script : null;
};

export const generatedDynamicConfig = ({ components }: GeneratedRegistry) => ({
  components: Object.fromEntries(
    Object.entries(components).map(([type, registration]) => [
      type,
      omit(['script'], registration),
    ])
  ),
});
