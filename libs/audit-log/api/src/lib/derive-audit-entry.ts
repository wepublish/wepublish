import { AuditLogAction } from '@prisma/client';

const ACTION_PREFIXES: [string, AuditLogAction][] = [
  ['create', AuditLogAction.create],
  ['add', AuditLogAction.create],
  ['upload', AuditLogAction.create],
  ['import', AuditLogAction.create],
  ['duplicate', AuditLogAction.create],
  ['register', AuditLogAction.create],
  ['delete', AuditLogAction.delete],
  ['remove', AuditLogAction.delete],
  ['discard', AuditLogAction.delete],
  ['revoke', AuditLogAction.delete],
  ['update', AuditLogAction.update],
  ['unpublish', AuditLogAction.update],
  ['publish', AuditLogAction.update],
  ['restore', AuditLogAction.update],
  ['reset', AuditLogAction.update],
  ['approve', AuditLogAction.update],
  ['reject', AuditLogAction.update],
  ['confirm', AuditLogAction.update],
  ['cancel', AuditLogAction.update],
  ['renew', AuditLogAction.update],
  ['extend', AuditLogAction.update],
  ['upgrade', AuditLogAction.update],
  ['enable', AuditLogAction.update],
  ['disable', AuditLogAction.update],
  ['resume', AuditLogAction.update],
  ['switch', AuditLogAction.update],
  ['mark', AuditLogAction.update],
];

const sortedPrefixes = [...ACTION_PREFIXES].sort(
  ([a], [b]) => b.length - a.length
);

export const deriveAction = (mutation: string): AuditLogAction => {
  const match = sortedPrefixes.find(([prefix]) => mutation.startsWith(prefix));

  return match ? match[1] : AuditLogAction.other;
};

export const deriveEntity = (mutation: string): string | null => {
  const match = sortedPrefixes.find(([prefix]) => mutation.startsWith(prefix));

  if (!match) {
    return null;
  }

  const remainder = mutation.slice(match[0].length);

  if (!remainder) {
    return null;
  }

  return remainder.charAt(0).toUpperCase() + remainder.slice(1);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const readId = (value: unknown): string | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { id } = value;

  return typeof id === 'string' ? id : null;
};

export const deriveRecordId = (
  args: unknown,
  result: unknown
): string | null => {
  const fromArgs = readId(args);

  if (fromArgs) {
    return fromArgs;
  }

  if (isRecord(args)) {
    for (const nested of Object.values(args)) {
      const fromNested = readId(nested);

      if (fromNested) {
        return fromNested;
      }
    }
  }

  return readId(result);
};
