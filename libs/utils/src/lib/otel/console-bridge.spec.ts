import { installConsoleBridge } from './console-bridge';

const methods = ['log', 'info', 'warn', 'error', 'debug'] as const;
const marker = Symbol.for('wepublish.otel.console');

describe('installConsoleBridge', () => {
  const originals = Object.fromEntries(
    methods.map(method => [method, console[method]])
  );

  beforeEach(() => {
    for (const method of methods) {
      console[method] = vi.fn();
    }
    delete (console as unknown as Record<symbol, unknown>)[marker];
  });

  afterEach(() => {
    Object.assign(console, originals);
    delete (console as unknown as Record<symbol, unknown>)[marker];
  });

  it('calls the original first and then emits the formatted message', () => {
    const original = console.warn;
    const order: string[] = [];
    vi.mocked(original).mockImplementation(() => order.push('original'));
    const emit = vi.fn(() => order.push('emit'));

    installConsoleBridge(emit);
    console.warn('hello', 42, { a: 1 }, null, undefined);

    expect(original).toHaveBeenCalledWith(
      'hello',
      42,
      { a: 1 },
      null,
      undefined
    );
    expect(emit).toHaveBeenCalledWith(
      { severityNumber: 13, severityText: 'WARN' },
      'hello 42 {"a":1} null undefined'
    );
    expect(order).toEqual(['original', 'emit']);
  });

  it.each([
    ['log', 9, 'INFO'],
    ['info', 9, 'INFO'],
    ['warn', 13, 'WARN'],
    ['error', 17, 'ERROR'],
    ['debug', 5, 'DEBUG'],
  ] as const)(
    'maps console.%s to %s %s',
    (method, severityNumber, severityText) => {
      const emit = vi.fn();

      installConsoleBridge(emit);
      console[method]('x');

      expect(emit).toHaveBeenCalledWith({ severityNumber, severityText }, 'x');
    }
  );

  it('formats errors with their stack', () => {
    const emit = vi.fn();
    const error = new Error('boom');

    installConsoleBridge(emit);
    console.error('failed', error);

    expect(emit).toHaveBeenCalledWith(
      expect.anything(),
      `failed ${error.stack}`
    );
  });

  it('survives values JSON cannot serialize', () => {
    const emit = vi.fn();
    const circular: Record<string, unknown> = {};
    circular.self = circular;

    installConsoleBridge(emit);
    console.log(circular, BigInt(1));

    expect(emit).toHaveBeenCalledWith(expect.anything(), '[object Object] 1');
  });

  it('wraps the console only once', () => {
    const original = console.log;
    const emit = vi.fn();

    installConsoleBridge(emit);
    const wrapped = console.log;
    installConsoleBridge(emit);
    console.log('once');

    expect(console.log).toBe(wrapped);
    expect(original).toHaveBeenCalledTimes(1);
    expect(emit).toHaveBeenCalledTimes(1);
  });

  it('does not recurse when emit logs', () => {
    const original = console.log;
    const emit = vi.fn(() => console.log('from emit'));

    installConsoleBridge(emit);
    console.log('outer');

    expect(emit).toHaveBeenCalledTimes(1);
    expect(original).toHaveBeenCalledTimes(2);
  });

  it('keeps logging when emit throws', () => {
    const emit = vi.fn(() => {
      throw new Error('exporter down');
    });

    installConsoleBridge(emit);

    expect(() => console.info('still works')).not.toThrow();
  });
});
