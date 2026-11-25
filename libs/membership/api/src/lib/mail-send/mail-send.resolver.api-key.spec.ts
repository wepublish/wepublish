import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { MailSendResolver } from './mail-send.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

describe('MailSendResolver called with an api key', () => {
  it('sends on behalf of the key‘s creator', async () => {
    const job = { mailTemplateId: 'template-1' };
    const mailSendJobService = {
      sendToUser: vi.fn().mockResolvedValue(job),
      createJob: vi.fn().mockResolvedValue(job),
    };
    const prisma = {
      mailTemplate: { findUnique: vi.fn().mockResolvedValue(null) },
    };
    const resolver = new MailSendResolver(
      prisma as any,
      mailSendJobService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await resolver.sendMailTemplateToUser(apiKey, 'template-1', 'reader-1');
    await resolver.createMailSendJob(apiKey, {} as any);

    expect(mailSendJobService.sendToUser).toHaveBeenCalledWith(
      'template-1',
      'reader-1',
      'creator-1'
    );
    expect(mailSendJobService.createJob).toHaveBeenCalledWith({}, 'creator-1');
  });
});
