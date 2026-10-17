import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { Prisma, PrismaClient, User } from '@prisma/client';
import {
  AuthenticationService,
  SessionCacheInvalidator,
} from '@wepublish/authentication/api';
import { ImageUploadService } from '@wepublish/image/api';
import { PublicContentCacheInvalidator } from '@wepublish/kv-ttl-cache/api';
import { MailContext, MailchimpContactService } from '@wepublish/mail/api';
import { HibpService } from './hibp.service';
import { ProfileService } from './profile.service';
import { UserDataloaderService } from './user-dataloader.service';
import { UserService } from './user.service';

const recordNotFound = () =>
  new Prisma.PrismaClientKnownRequestError('Record to delete does not exist.', {
    code: 'P2025',
    clientVersion: 'test',
  });

const createDatabase = () => {
  const images = new Map<string, { id: string; title?: string }>([
    ['image-1', { id: 'image-1', title: 'Me' }],
  ]);
  const users = new Map<string, { id: string; userImageID: string | null }>([
    ['user-1', { id: 'user-1', userImageID: 'image-1' }],
  ]);

  const pointUsers = (from: string, to: string | null) => {
    for (const user of users.values()) {
      if (user.userImageID === from) {
        user.userImageID = to;
      }
    }
  };

  const prisma = {
    image: {
      create: vi.fn(async ({ data }: { data: { id: string } }) => {
        images.set(data.id, data);

        return data;
      }),
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { id: string };
        }) => {
          const image = images.get(where.id);

          if (!image) {
            throw recordNotFound();
          }

          const updated = {
            ...image,
            ...Object.fromEntries(
              Object.entries(data).filter(([, value]) => value !== undefined)
            ),
          } as { id: string; title?: string };
          images.delete(where.id);
          images.set(updated.id, updated);
          pointUsers(where.id, updated.id);

          return updated;
        }
      ),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const image = images.get(where.id);

        if (!image) {
          throw recordNotFound();
        }

        images.delete(where.id);
        pointUsers(where.id, null);

        return image;
      }),
    },
    user: {
      update: vi.fn(
        async ({
          where,
          data,
        }: {
          where: { id: string };
          data: { userImageID?: string };
        }) => {
          const user = users.get(where.id)!;

          if (data.userImageID !== undefined) {
            user.userImageID = data.userImageID;
          }

          return { ...user };
        }
      ),
    },
  };

  return { prisma, images, users };
};

const createPublicContentCache = () => ({
  invalidate: vi.fn().mockResolvedValue(undefined),
  invalidateDraft: vi.fn().mockResolvedValue(undefined),
  invalidateComments: vi.fn().mockResolvedValue(undefined),
});

describe('profile image of a commenter', () => {
  const setup = () => {
    const database = createDatabase();
    const mediaAdapter = {
      uploadImage: vi.fn().mockResolvedValue({ id: 'image-2' }),
      deleteImage: vi.fn().mockResolvedValue(true),
    };
    const publicContentCache = createPublicContentCache();
    const sessionCache = { invalidate: vi.fn().mockResolvedValue(undefined) };
    const images = Object.assign(
      new ImageUploadService(
        database.prisma as unknown as PrismaClient,
        mediaAdapter as never,
        publicContentCache as unknown as PublicContentCacheInvalidator
      ),
      { __DATALOADER__ImageDataloaderService: { prime: vi.fn() } }
    );
    const profile = new ProfileService(
      database.prisma as unknown as PrismaClient,
      images,
      sessionCache as unknown as SessionCacheInvalidator,
      publicContentCache as unknown as PublicContentCacheInvalidator
    );

    return {
      ...database,
      mediaAdapter,
      publicContentCache,
      sessionCache,
      profile,
    };
  };

  const upload = { file: Promise.resolve({}) } as never;

  it('replaces a profile image, keeps its row under the new id and removes only the old file', async () => {
    const { profile, images, users, mediaAdapter, sessionCache } = setup();

    const user = await profile.uploadUserProfileImage(
      { id: 'user-1', userImageID: 'image-1' } as User,
      upload
    );

    expect(user.userImageID).toBe('image-2');
    expect([...images.keys()]).toEqual(['image-2']);
    expect(images.get('image-2')?.title).toBe('Me');
    expect(users.get('user-1')?.userImageID).toBe('image-2');
    expect(mediaAdapter.deleteImage).toHaveBeenCalledTimes(1);
    expect(mediaAdapter.deleteImage).toHaveBeenCalledWith('image-1');
    expect(sessionCache.invalidate).toHaveBeenCalled();
  });

  it.each([
    ['replaced', { id: 'user-1', userImageID: 'image-1' }, upload],
    ['added', { id: 'user-1', userImageID: null }, upload],
    ['removed', { id: 'user-1', userImageID: 'image-1' }, null],
  ])(
    'clears cached comment answers after a profile image is %s, since comments show the avatar',
    async (_, user, input) => {
      const { profile, publicContentCache } = setup();

      await profile.uploadUserProfileImage(user as User, input as never);

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith();
    }
  );

  it('leaves cached comment answers alone when the profile image did not change', async () => {
    const { profile, publicContentCache } = setup();

    await profile.uploadUserProfileImage(
      { id: 'user-1', userImageID: null } as User,
      undefined as never
    );

    expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
  });
});

describe('UserService comment cache', () => {
  const previous = {
    id: 'user-1',
    email: 'reader@example.com',
    name: 'Muster',
    firstName: 'Max',
    flair: 'Reader',
    userImageID: 'image-1',
  };
  let service: UserService;
  let prisma: {
    user: { [method: string]: Mock };
    session: { deleteMany: Mock };
    comment: { findMany: Mock };
    article: { findMany: Mock };
  };
  let publicContentCache: ReturnType<typeof createPublicContentCache>;

  beforeEach(async () => {
    publicContentCache = createPublicContentCache();
    prisma = {
      user: {
        findUnique: vi.fn().mockResolvedValue(previous),
        update: vi.fn(async ({ data }) => ({ ...previous, ...data })),
        delete: vi.fn().mockResolvedValue(previous),
      },
      session: { deleteMany: vi.fn().mockResolvedValue({ count: 0 }) },
      comment: { findMany: vi.fn().mockResolvedValue([]) },
      article: { findMany: vi.fn().mockResolvedValue([]) },
    };

    const module = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: PrismaClient, useValue: prisma },
        { provide: MailContext, useValue: {} },
        { provide: HibpService, useValue: {} },
        {
          provide: MailchimpContactService,
          useValue: {
            updateContactEmail: vi.fn().mockResolvedValue(undefined),
          },
        },
        { provide: UserDataloaderService, useValue: { prime: vi.fn() } },
        {
          provide: AuthenticationService,
          useValue: { revokeUserSessions: vi.fn().mockResolvedValue(0) },
        },
        {
          provide: SessionCacheInvalidator,
          useValue: { invalidate: vi.fn().mockResolvedValue(undefined) },
        },
        {
          provide: PublicContentCacheInvalidator,
          useValue: publicContentCache,
        },
      ],
    }).compile();

    service = module.get(UserService);
  });

  it.each([
    ['name', { name: 'Neu' }],
    ['first name', { firstName: 'Moritz' }],
    ['flair', { flair: 'Abonnentin' }],
    ['profile image', { userImageID: 'image-2' }],
    ['profile image removal', { userImageID: null }],
  ])(
    'clears cached comment answers after the %s of a user changed',
    async (_, change) => {
      await service.updateUser({ id: 'user-1', ...change } as never);

      expect(publicContentCache.invalidateComments).toHaveBeenCalledWith();
    }
  );

  it.each([
    ['nothing a comment shows changed', { ...previous, note: 'VIP' }],
    ['only the address changed', { address: { city: 'Bern' } }],
  ])('leaves cached comment answers alone when %s', async (_, change) => {
    await service.updateUser({ id: 'user-1', ...change } as never);

    expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
  });

  it('still tells Mailchimp about a new email address', async () => {
    const mailchimp = (service as any).mailchimpContactService;

    await service.updateUser({
      id: 'user-1',
      email: 'New@Example.com',
      name: 'Neu',
    } as never);

    expect(mailchimp.updateContactEmail).toHaveBeenCalledWith(
      'user-1',
      'reader@example.com',
      'new@example.com'
    );
  });

  it('does not tell Mailchimp anything when the email address was not given', async () => {
    const mailchimp = (service as any).mailchimpContactService;

    await service.updateUser({ id: 'user-1', name: 'Neu' } as never);

    expect(mailchimp.updateContactEmail).not.toHaveBeenCalled();
  });

  it('clears comment answers, comment blocks and the commented article pages after a user with comments is deleted, since their comments lose the author', async () => {
    prisma.comment.findMany.mockResolvedValue([
      { itemID: 'article-1', itemType: 'article' },
      { itemID: 'page-1', itemType: 'page' },
    ]);
    prisma.article.findMany.mockResolvedValue([
      { id: 'article-1', slug: 'one' },
    ]);

    await service.deleteUser('user-1');

    expect(prisma.comment.findMany.mock.invocationCallOrder[0]).toBeLessThan(
      prisma.user.delete.mock.invocationCallOrder[0]
    );
    expect(prisma.article.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: { in: ['article-1'] } } })
    );
    expect(publicContentCache.invalidateComments).toHaveBeenCalledWith(true, {
      id: 'article-1',
      slug: 'one',
    });
  });

  it('leaves public caches alone after a user without comments is deleted', async () => {
    await service.deleteUser('user-1');

    expect(publicContentCache.invalidateComments).not.toHaveBeenCalled();
    expect(prisma.article.findMany).not.toHaveBeenCalled();
  });
});
