import { ForbiddenException } from '@nestjs/common';
import { UserEvent } from '@prisma/client';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { SystemMailResolver } from './system-mail.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('SystemMailResolver called with an api key', () => {
  it('has no inbox of its own to send a test mail to', async () => {
    const mailContext = {
      getUserTemplateId: vi.fn().mockResolvedValue('template-1'),
      sendMail: vi.fn(),
    };
    const resolver = new SystemMailResolver({} as any, mailContext as any);

    await expect(async () =>
      resolver.testSystemMail(apiKey, UserEvent.ACCOUNT_CREATION)
    ).rejects.toThrow(ForbiddenException);
    expect(mailContext.sendMail).not.toHaveBeenCalled();
  });
});
