import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, User, UserEvent, UserFlowMail } from '@prisma/client';
import { SystemMailResolver } from './system-mail.resolver';
import { MailContext } from '@wepublish/mail/api';

const mockTemplate1: UserFlowMail = {
  id: 'c29a088f-40f0-4578-a6c4-810249902495',
  event: UserEvent.ACCOUNT_CREATION,
  mailTemplateId: 'ef054424-8749-408c-bff8-198260ddf9ee',
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const mockTemplate2: UserFlowMail = {
  id: 'e57efaa2-afd4-42b0-81f0-f22278b45f1e',
  event: UserEvent.LOGIN_LINK,
  mailTemplateId: '7df91a48-f12c-477c-be37-25b5490a65d3',
  createdAt: new Date(),
  modifiedAt: new Date(),
};

const prismaServiceMock = {
  userFlowMail: {
    findMany: jest.fn((): UserFlowMail[] => [mockTemplate1, mockTemplate2]),
    findUnique: jest.fn(
      ({ where: { event } }): UserFlowMail =>
        [mockTemplate1, mockTemplate2].find(m => m.event === event)!
    ),
    update: jest.fn((): void => undefined),
  },
};

const mailContestMock = {
  getUserTemplateName: jest.fn((): string => 'test-template'),
  sendRemoteTemplateDirect: jest.fn((): void => undefined),
  sendMail: jest.fn((): void => undefined),
};

const FAKE_USER: User = {
  id: 'u02rufq3n',
  createdAt: new Date(),
  modifiedAt: new Date(),
  email: 'test@example.com',
  flair: null,
  name: 'Test User',
  active: false,
  roleIDs: [],
  emailVerifiedAt: new Date(),
  firstName: 'aaa',
  password: 'aaa',
  lastLogin: null,
  userImageID: null,
  birthday: new Date(),
  note: null,
};

describe('SystemMailResolver', () => {
  let resolver: SystemMailResolver;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SystemMailResolver,
        { provide: PrismaClient, useValue: prismaServiceMock },
        { provide: MailContext, useValue: mailContestMock },
      ],
    }).compile();

    resolver = module.get<SystemMailResolver>(SystemMailResolver);
  });

  it('is defined', () => {
    expect(resolver).toBeDefined();
  });

  it('returns all templates for get action', async () => {
    const result = await resolver.systemMails();
    expect(result.length).toEqual(2);
    expect(result[0].event).toEqual(UserEvent.ACCOUNT_CREATION);
    expect(result[1].event).toEqual(UserEvent.LOGIN_LINK);
  });

  it('returns all templates for update action', async () => {
    const result = await resolver.updateSystemMail({
      event: UserEvent.ACCOUNT_CREATION,
      mailTemplateId: '0c517621-4707-49e2-8994-1eeb4cc13b01',
    });

    expect(result.length).toEqual(2);
    expect(result[0].event).toEqual(UserEvent.ACCOUNT_CREATION);
    expect(result[1].event).toEqual(UserEvent.LOGIN_LINK);
  });

  it('should test the system mail', async () => {
    const result = await resolver.testSystemMail(
      {
        user: FAKE_USER,
      } as any,
      UserEvent.ACCOUNT_CREATION
    );
    expect(result).toBeTruthy();
  });
});
