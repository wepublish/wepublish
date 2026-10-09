import { ScheduleModule } from '@nestjs/schedule';
import { Test } from '@nestjs/testing';
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

  test('can be awaited when nothing is configured', async () => {
    const provider = createSwappableProvider<Greeter>('greeter', () => null);

    await expect(Promise.resolve(provider)).resolves.toBe(provider);
  });

  test('can be serialized when nothing is configured', () => {
    const provider = createSwappableProvider<Greeter>('greeter', () => null);

    expect(JSON.stringify(provider)).toBe('{}');
  });

  test('survives the Nest lifecycle when nothing is configured', async () => {
    const moduleRef = await Test.createTestingModule({
      // The schedule explorer reads every method of every provider's prototype
      imports: [ScheduleModule.forRoot()],
      providers: [
        {
          provide: 'GREETER',
          useFactory: () =>
            createSwappableProvider<Greeter>('greeter', () => null),
        },
      ],
    }).compile();

    await expect(moduleRef.init()).resolves.toBe(moduleRef);
    await expect(moduleRef.close()).resolves.toBeUndefined();
  });
});
