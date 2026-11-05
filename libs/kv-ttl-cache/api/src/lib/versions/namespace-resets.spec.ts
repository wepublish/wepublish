import { Logger } from '@nestjs/common';
import {
  type NamespaceResetListener,
  NamespaceResets,
} from './namespace-resets';
import { type NamespaceVersions } from './namespace-versions';

const createResets = () => {
  const calls: string[] = [];
  const versions = {
    bump: vi.fn(async (name: string) => {
      calls.push(`bump ${name}`);
    }),
  } satisfies Pick<NamespaceVersions, 'bump'>;
  const resets = new NamespaceResets(versions as unknown as NamespaceVersions);

  return { calls, versions, resets };
};

const listener = (
  calls: string[],
  name: string,
  wait = 0
): NamespaceResetListener => ({
  async onNamespaceReset(namespace) {
    calls.push(`${name} start ${namespace}`);
    await new Promise(resolve => setTimeout(resolve, wait));
    calls.push(`${name} end ${namespace}`);
  },
});

describe('NamespaceResets', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('bumps the version of the namespace', async () => {
    const { versions, resets } = createResets();

    await resets.reset('navigations');

    expect(versions.bump).toHaveBeenCalledWith('navigations');
  });

  it('counts its listeners', () => {
    const { calls, resets } = createResets();

    expect(resets.listenerCount()).toBe(0);

    resets.register(listener(calls, 'website'));
    resets.register(listener(calls, 'other'));

    expect(resets.listenerCount()).toBe(2);
  });

  it('tells every listener after the bump, one after the other, and waits for them', async () => {
    const { calls, resets } = createResets();
    resets.register(listener(calls, 'first', 5));
    resets.register(listener(calls, 'second'));

    await resets.reset('navigations');

    expect(calls).toEqual([
      'bump navigations',
      'first start navigations',
      'first end navigations',
      'second start navigations',
      'second end navigations',
    ]);
  });

  it('tells no listener about a silent reset', async () => {
    const { calls, resets } = createResets();
    resets.register(listener(calls, 'website'));

    await resets.reset('graphql:content', { silent: true });

    expect(calls).toEqual(['bump graphql:content']);
  });

  it('logs a listener that fails and still resolves and tells the others', async () => {
    const logged = vi
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    const { calls, resets } = createResets();
    resets.register({
      async onNamespaceReset() {
        throw new Error('website signal failed');
      },
    });
    resets.register(listener(calls, 'second'));

    await expect(resets.reset('navigations')).resolves.toBeUndefined();

    expect(calls).toContain('second end navigations');
    expect(logged).toHaveBeenCalledTimes(1);
    expect(String(logged.mock.calls[0][0])).toContain('website signal failed');
  });
});
