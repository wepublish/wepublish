import { SellableKind } from '@prisma/client';
import { SellableHandler } from './sellable-handler';
import { SellableRegistry } from './sellable-registry.service';

const handler = (kind: SellableKind): SellableHandler => ({
  kind,
  fulfil: vi.fn(),
  revoke: vi.fn(),
});

describe('SellableRegistry', () => {
  it('returns the handler registered for a kind', () => {
    const registry = new SellableRegistry();
    const giftCode = handler(SellableKind.giftCode);

    registry.register(giftCode);

    expect(registry.get(SellableKind.giftCode)).toBe(giftCode);
    expect(registry.kinds()).toEqual([SellableKind.giftCode]);
  });

  it('refuses a second handler for the same kind', () => {
    const registry = new SellableRegistry();
    registry.register(handler(SellableKind.giftCode));

    expect(() => registry.register(handler(SellableKind.giftCode))).toThrow(
      SellableKind.giftCode
    );
  });

  it('returns undefined for a kind without a handler', () => {
    const registry = new SellableRegistry();

    expect(registry.get(SellableKind.giftCode)).toBeUndefined();
    expect(registry.kinds()).toEqual([]);
  });
});
