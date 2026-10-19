import { FeaturesService } from '@wepublish/features/api';
import type { Mock } from 'vitest';
import { GatedLetterSender } from './gated-letter-sender';
import { LetterContext } from './letter-context';

function setup(enabled: string[], configured = true) {
  const features = {
    isEnabled: vi.fn(async (key: string) => enabled.includes(key)),
  };
  const context = {
    isConfigured: vi.fn(async () => configured),
    canReceiveLetters: vi.fn(() => true),
    sendLetter: vi.fn(async () => 'log-1'),
  };
  const sender = new GatedLetterSender(
    context as unknown as LetterContext,
    features as unknown as FeaturesService
  );

  return { sender, context, features };
}

describe('GatedLetterSender', () => {
  it('is configured once both features are on and letters can be printed', async () => {
    const { sender } = setup(['paper-letters', 'paper-letter-flow']);

    expect(await sender.isConfigured()).toBe(true);
  });

  it('is not configured without the flow feature', async () => {
    const { sender, context } = setup(['paper-letters']);

    expect(await sender.isConfigured()).toBe(false);
    expect(context.isConfigured).not.toHaveBeenCalled();
  });

  it('is not configured without the letters feature', async () => {
    const { sender } = setup(['paper-letter-flow']);

    expect(await sender.isConfigured()).toBe(false);
  });

  it('is not configured without a letter integration', async () => {
    const { sender } = setup(['paper-letters', 'paper-letter-flow'], false);

    expect(await sender.isConfigured()).toBe(false);
  });

  it('hands sends and address checks to the letter context', async () => {
    const { sender, context } = setup([]);
    const user = { id: 'u1', address: null } as any;
    const props = { mailTemplateId: 't', recipient: user, data: {} };

    expect(sender.canReceiveLetters(user)).toBe(true);
    expect(await sender.sendLetter(props)).toBe('log-1');
    expect((context.sendLetter as Mock).mock.calls[0][0]).toBe(props);
  });
});
