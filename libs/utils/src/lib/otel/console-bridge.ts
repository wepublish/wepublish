import { OtelSeverity, toOtelSeverity } from './otel-config';

const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
const marker = Symbol.for('wepublish.otel.console');

const formatArg = (arg: unknown): string => {
  if (arg instanceof Error) {
    return arg.stack ?? `${arg.name}: ${arg.message}`;
  }

  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg);
    } catch {
      return String(arg);
    }
  }

  return String(arg);
};

export function installConsoleBridge(
  emit: (severity: OtelSeverity, body: string) => void
): void {
  const target = console as unknown as Record<symbol, unknown>;

  if (target[marker]) {
    return;
  }

  target[marker] = true;
  let emitting = false;

  for (const method of methods) {
    const original = console[method];
    const severity = toOtelSeverity(method);

    console[method] = (...args: unknown[]) => {
      original.apply(console, args);

      if (emitting) {
        return;
      }

      emitting = true;

      try {
        emit(severity, args.map(formatArg).join(' '));
      } catch {
        return;
      } finally {
        emitting = false;
      }
    };
  }
}
