const clientOptions = vi.hoisted(() => [] as unknown[]);

vi.mock('@prisma/client', () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      clientOptions.push(options);
    }
  },
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: class {},
}));

import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  beforeEach(() => {
    clientOptions.length = 0;
  });

  // A user row read anywhere, nested relations included, carries none of
  // its secrets unless the query asks for them by name.
  it('leaves the password hash, the TOTP secret and the email-change token hash out of every user query', () => {
    new PrismaService();

    expect(clientOptions[0]).toMatchObject({
      omit: {
        user: {
          password: true,
          totpSecret: true,
          pendingEmailTokenHash: true,
        },
      },
    });
  });
});
