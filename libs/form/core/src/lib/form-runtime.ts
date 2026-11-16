import { createContext, useContext, type ComponentType } from 'react';
import type { z } from 'zod/v4';
import type { ComponentMap } from './component-types';
import type { ErrorSummaryStore } from './error-summary-store';
import type { ItemScope } from './field-path';
import type { FieldRegistry } from './field-registry';
import type { FormConfig, Translate } from './form-types';
import type { FieldProps, OverrideMap, ResolvedOverride } from './overrides';
import type { BranchChoice } from './schema-at';

export type RenderableComponent = ComponentType<FieldProps>;

export type LoadStatus = 'loading' | 'error' | 'ready';

export type FormRuntime = {
  config: FormConfig<ComponentMap>;
  components: Readonly<Partial<Record<string, RenderableComponent>>>;
  t: Translate;
  schema: z.ZodType;
  fields: OverrideMap;
  disabled: boolean;
  status: LoadStatus;
  loadError: unknown;
  retry: () => void;
  idPrefix: string;
  fieldRegistry: FieldRegistry;
  errorSummary: ErrorSummaryStore;
};

export type FieldRuntime = {
  name: string;
  path: string;
  schema: z.ZodType;
  kind: string | undefined;
  kindParams: unknown;
  container: boolean;
  override: ResolvedOverride;
  branches: BranchChoice;
};

export const FormRuntimeContext = createContext<FormRuntime | null>(null);

export const ItemScopeContext = createContext<ItemScope>({});

export const FieldRuntimeContext = createContext<FieldRuntime | null>(null);

export function useFormRuntime(): FormRuntime {
  const runtime = useContext(FormRuntimeContext);

  if (!runtime) {
    throw new Error('Form fields must be rendered inside <Form>.');
  }

  return runtime;
}

export function useFieldRuntime(hook: string): FieldRuntime {
  const field = useContext(FieldRuntimeContext);

  if (!field) {
    throw new Error(`${hook} must be called inside a form field component.`);
  }

  return field;
}

export function assertOwnSchema(
  runtime: FormRuntime,
  owner: z.ZodType | undefined,
  what: string
) {
  if (
    owner !== undefined &&
    owner !== runtime.schema &&
    process.env.NODE_ENV !== 'production'
  ) {
    throw new Error(`${what} belongs to another schema than its <Form>.`);
  }
}
