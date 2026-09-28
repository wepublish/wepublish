import { createSwappableProvider } from './swappable-provider';

class Greeter {
  #greeting: string;

  constructor(greeting: string) {
    this.#greeting = greeting;
  }

  get id() {
    return this.#greeting;
  }

  greet(name: string) {
    return `${this.#greeting}, ${name}`;
  }
}

describe('createSwappableProvider', () => {
  test('forwards to whatever is current at call time', () => {
    let current: Greeter | null = new Greeter('Hello');
    const provider = createSwappableProvider<Greeter>('greeter', () => current);

    expect(provider.greet('world')).toBe('Hello, world');

    current = new Greeter('Salut');

    expect(provider.greet('world')).toBe('Salut, world');
  });

  test('binds methods to the instance, not the proxy', () => {
    const provider = createSwappableProvider<Greeter>(
      'greeter',
      () => new Greeter('Hello')
    );

    const detached = provider.greet;

    expect(detached('world')).toBe('Hello, world');
  });

  test('reads getters through the instance', () => {
    const provider = createSwappableProvider<Greeter>(
      'greeter',
      () => new Greeter('Hello')
    );

    expect(provider.id).toBe('Hello');
  });

  test('explains itself when nothing is configured', () => {
    const provider = createSwappableProvider<Greeter>('greeter', () => null);

    expect(() => provider.greet('world')).toThrow('No greeter is configured.');
  });
});
