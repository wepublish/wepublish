import { ForbiddenException } from '@nestjs/common';
import {
  ApiTokenSession,
  AuthSessionType,
} from '@wepublish/authentication/api';
import { MailTemplatesResolver } from './mail-template.resolver';

const apiKey: ApiTokenSession = {
  type: AuthSessionType.ApiToken,
  id: 'api-token-1',
  name: 'Import',
  token: 'secret',
  permissions: [],
  createdBy: { id: 'creator-1', email: 'creator@example.test' },
};

const input = {
  contextId: 'subscription',
  subscriptionId: 'sub-1',
  subject: 'Hi',
  htmlContent: '<p>Hi</p>',
  textContent: 'Hi',
} as any;

describe('MailTemplatesResolver called with an api key', () => {
  const mailTemplateService = {
    preview: vi.fn().mockResolvedValue({ subject: '', html: '', text: '' }),
    previewLetter: vi.fn().mockResolvedValue({}),
    sendTest: vi.fn(),
  };
  const resolver = new MailTemplatesResolver(
    {} as any,
    {} as any,
    mailTemplateService as any,
    {} as any
  );

  it('previews with the data of the key‘s creator', async () => {
    await resolver.mailTemplatePreview(apiKey, input);
    await resolver.mailTemplateLetterPreview(apiKey, input);

    expect(mailTemplateService.preview).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserId: 'creator-1' })
    );
    expect(mailTemplateService.previewLetter).toHaveBeenCalledWith(
      expect.objectContaining({ currentUserId: 'creator-1' })
    );
  });

  it('has no inbox of its own to send a test mail to', async () => {
    await expect(async () =>
      resolver.sendTestMailTemplate(apiKey, input)
    ).rejects.toThrow(ForbiddenException);
    expect(mailTemplateService.sendTest).not.toHaveBeenCalled();
  });
});
