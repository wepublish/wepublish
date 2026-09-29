import { EmailQualityEventType } from '@prisma/client';
import { SessionService } from './session.service';

const user = {
  id: 'user-1',
  email: 'jane@example.com',
  active: true,
  totpEnabled: false,
};

const makeService = ({ preview = false } = {}) => {
  const recorder = {
    recordMailSignals: jest.fn(),
    recordUserSignal: jest.fn(async () => undefined),
  };
  const jwtService = {
    verifyImpersonationGrant: jest.fn(async () => null),
    verifyJWT: jest.fn(async () => (preview ? user.id : null)),
  };
  const service = new SessionService(
    { user: { findUnique: jest.fn(async () => user) } } as any,
    7,
    {} as any,
    {} as any,
    { authenticateUserWithJWT: jest.fn(async () => user) } as any,
    jwtService as any,
    {} as any,
    { emailQualityRecorder: recorder } as any,
    {} as any
  );
  jest
    .spyOn(service, 'createUserSession')
    .mockResolvedValue({ token: 'session' } as any);

  return { service, recorder };
};

describe('SessionService email quality evidence', () => {
  it('takes a redeemed login link as proof the address is read', async () => {
    const { service, recorder } = makeService();

    await expect(service.createSessionWithJWT('jwt')).resolves.toEqual({
      token: 'session',
    });
    expect(recorder.recordUserSignal).toHaveBeenCalledWith({
      userId: 'user-1',
      signal: { type: EmailQualityEventType.jwtLogin, email: user.email },
      source: 'session',
    });
  });

  it('ignores an editor preview', async () => {
    const { service, recorder } = makeService({ preview: true });

    await service.createSessionWithJWT('jwt');

    expect(recorder.recordUserSignal).not.toHaveBeenCalled();
  });

  it('logs the user in even when recording fails', async () => {
    const { service, recorder } = makeService();
    recorder.recordUserSignal.mockRejectedValueOnce(new Error('db down'));

    await expect(service.createSessionWithJWT('jwt')).resolves.toEqual({
      token: 'session',
    });
  });
});
