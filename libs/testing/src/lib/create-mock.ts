import 'reflect-metadata';

type Constructor<T = any> = new (...args: any[]) => T;

export type DeepMocked<T> = Partial<{
  [K in keyof T]: T[K] extends (...args: any[]) => any ?
    jest.Mock<ReturnType<T[K]>, Parameters<T[K]>>
  : T[K] extends object ? DeepMocked<T[K]>
  : T[K];
}>;

export type Mocked<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ?
    T[K] extends (...args: any[]) => Promise<infer R> ?
      jest.Mock<Promise<Partial<R>>, Parameters<T[K]>>
    : jest.Mock<Partial<ReturnType<T[K]>>, Parameters<T[K]>>
  : T[K];
};

export type PartialMocked<T> = Partial<Mocked<T>>;

export function createMock<T>(cls: Constructor<T>): PartialMocked<T> {
  const proto = cls?.prototype || {};
  const mock: Record<string, jest.Mock> = {};

  for (const prop of Object.getOwnPropertyNames(proto)) {
    if (prop === 'constructor' || typeof proto[prop] !== 'function') {
      continue;
    }

    mock[prop] = jest.fn().mockImplementation(() => {
      throw new Error(
        `Method ${prop} not implemented. You need to mock this method before using it.`
      );
    });
  }

  return mock as unknown as PartialMocked<T>;
}
