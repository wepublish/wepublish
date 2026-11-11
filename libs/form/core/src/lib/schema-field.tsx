import { useContext, useEffect, useRef, type ReactNode } from 'react';
import { useFormContext, useWatch, type FieldValues } from 'react-hook-form';
import type { z } from 'zod/v4';
import { resolvePath } from './field-path';
import {
  assertOwnSchema,
  FieldRuntimeContext,
  ItemScopeContext,
  useFormRuntime,
  type FieldRuntime,
} from './form-runtime';
import { resolveKind, type ResolvedKind } from './kind';
import {
  evaluateOverride,
  hasDynamic,
  mergeOverrides,
  type ResolvedOverride,
  type RuntimeOverride,
} from './overrides';
import { schemaAt, type BranchChoice } from './schema-at';
import {
  branchChoice,
  isGateOpen,
  unionGates,
  type UnionGate,
} from './union-gates';

const CONTAINER_KINDS: ReadonlySet<string> = new Set([
  'object',
  'array',
  'discriminatedUnion',
]);

const NO_BRANCHES: BranchChoice = {};

const NO_VALUES: FieldValues = {};

const isContainerKind = (resolved: ResolvedKind | undefined) =>
  resolved !== undefined &&
  !resolved.custom &&
  CONTAINER_KINDS.has(resolved.kind);

type ResolvedFieldProps = {
  name: string;
  path: string;
  override: ResolvedOverride;
  branches: BranchChoice;
};

function ResolvedField({ name, path, override, branches }: ResolvedFieldProps) {
  const runtime = useFormRuntime();
  const schema = schemaAt(runtime.schema, name, branches);
  const resolved = schema === undefined ? undefined : resolveKind(schema);
  const container = isContainerKind(resolved);
  const hidden = override.hidden === true;
  const { fieldRegistry } = runtime;
  const form = useFormContext();
  const shown = useRef(!hidden);

  useEffect(
    () => (hidden ? undefined : fieldRegistry.register(path, !container)),
    [fieldRegistry, path, hidden, container]
  );

  useEffect(() => {
    if (hidden && shown.current && form.getFieldState(path).invalid) {
      void form.trigger(path);
    }

    shown.current = !hidden;
  }, [form, path, hidden]);

  if (schema === undefined) {
    throw new Error(`Unknown form path "${name}".`);
  }

  const bound = override.component;
  const Component =
    bound?.component ??
    (resolved === undefined ? undefined : runtime.components[resolved.kind]);

  if (Component === undefined) {
    throw new Error(
      resolved === undefined ?
        `No component for "${name}": its schema has no form kind. Pass a component override.`
      : `No component for kind "${resolved.kind}" at "${name}". Map the kind or pass a component override.`
    );
  }

  if (hidden) {
    return null;
  }

  const field: FieldRuntime = {
    name,
    path,
    schema,
    kind: resolved?.kind,
    kindParams: resolved?.params,
    container,
    override,
    branches,
  };

  return (
    <FieldRuntimeContext.Provider value={field}>
      <Component {...(bound ? bound.props : override.props)} />
    </FieldRuntimeContext.Provider>
  );
}

type FieldElementProps = {
  name: string;
  path: string;
  override: RuntimeOverride;
  branches: BranchChoice;
};

function DynamicField({ name, path, override, branches }: FieldElementProps) {
  const values: FieldValues = useWatch();

  return (
    <ResolvedField
      name={name}
      path={path}
      override={evaluateOverride(override, values)}
      branches={branches}
    />
  );
}

const fieldElement = ({
  name,
  path,
  override,
  branches,
}: FieldElementProps): ReactNode =>
  hasDynamic(override) ?
    <DynamicField
      name={name}
      path={path}
      override={override}
      branches={branches}
    />
  : <ResolvedField
      name={name}
      path={path}
      override={evaluateOverride(override, NO_VALUES)}
      branches={branches}
    />;

type BranchGateProps = Omit<FieldElementProps, 'branches'> & {
  gates: readonly UnionGate[];
};

function BranchGate({ gates, name, path, override }: BranchGateProps) {
  const discriminants: unknown[] = useWatch({
    name: gates.map(gate => gate.discriminatorPath),
  });

  if (!gates.every((gate, index) => isGateOpen(gate, discriminants[index]))) {
    return null;
  }

  return fieldElement({
    name,
    path,
    override,
    branches: branchChoice(gates, discriminants),
  });
}

export type SchemaFieldProps = {
  name: string;
  call?: RuntimeOverride;
  owner?: z.ZodType;
};

export function SchemaField({ name, call, owner }: SchemaFieldProps) {
  const runtime = useFormRuntime();
  const scope = useContext(ItemScopeContext);

  assertOwnSchema(runtime, owner, `Field "${name}"`);

  if (runtime.status !== 'ready') {
    return null;
  }

  const path = resolvePath(name, scope);
  const override = mergeOverrides(runtime.fields, name, call);
  const gates = unionGates(runtime.schema, name, scope);

  return gates.length > 0 ?
      <BranchGate
        gates={gates}
        name={name}
        path={path}
        override={override}
      />
    : fieldElement({ name, path, override, branches: NO_BRANCHES });
}
