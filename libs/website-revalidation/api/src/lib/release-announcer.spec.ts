import { Test, type TestingModule } from '@nestjs/testing';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { ReleaseAnnouncer } from './release-announcer';
import { WebsiteRevalidationModule } from './website-revalidation.module';

const read = async (connection: DragonflyConnection, key: string) => {
  const reply = await connection.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('ReleaseAnnouncer', () => {
  const modules: TestingModule[] = [];

  const replica = async (dragonfly: DragonflyConnection, releaseId: string) => {
    const module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({
          connection: dragonfly,
          releaseId,
        }),
        WebsiteRevalidationModule,
      ],
    }).compile();
    modules.push(module);
    await module.init();

    return module;
  };

  const websiteWrites = (dragonfly: FakeDragonfly) =>
    dragonfly.commands.filter(
      command =>
        command[0] === 'SET' &&
        !command.includes('NX') &&
        (command[1] === 'nsv:website:layout' ||
          command[1] === 'nsl:website:pages')
    ).length;

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(module => module.close()));
  });

  it('announces its release at boot, so websites rebuild pages a new release may render differently', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2');

    await expect(read(dragonfly, 'release:current')).resolves.toBe('release-2');
    expect(websiteWrites(dragonfly)).toBe(2);
  });

  it('has the websites rebuild their pages once when a new release starts, since its answers may differ', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2');
    const afterFirst = websiteWrites(dragonfly);
    const second = await replica(dragonfly, 'release-2');
    await second.get(ReleaseAnnouncer).announce();

    expect(afterFirst).toBe(2);
    expect(websiteWrites(dragonfly)).toBe(2);
  });

  it('announces every new release', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2');
    await replica(dragonfly, 'release-3');

    expect(websiteWrites(dragonfly)).toBe(4);
  });

  it('announces a rollback to a release that ran before', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2');
    await replica(dragonfly, 'release-3');
    await replica(dragonfly, 'release-2');

    expect(websiteWrites(dragonfly)).toBe(6);
  });

  it('announces a release once when several replicas start it at the same time', async () => {
    const dragonfly = new FakeDragonfly();

    await Promise.all([
      replica(dragonfly, 'release-2'),
      replica(dragonfly, 'release-2'),
      replica(dragonfly, 'release-2'),
    ]);

    expect(websiteWrites(dragonfly)).toBe(2);
    expect(
      dragonfly.commands.filter(
        command => command[0] === 'SET' && command[1] === 'release:current'
      )
    ).toHaveLength(1);
  });

  it('claims the announcement after the release it replaces for ten minutes', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'release-2');
    await replica(dragonfly, 'release-3');

    expect(
      dragonfly.commands
        .filter(command => command[1]?.startsWith('lock:release:'))
        .map(command => [command[1], ...command.slice(3)])
    ).toEqual([
      ['lock:release:release-2:after:none', 'NX', 'PX', '600000'],
      ['lock:release:release-3:after:release-2', 'NX', 'PX', '600000'],
    ]);
  });

  it('announces nothing for local development builds', async () => {
    const dragonfly = new FakeDragonfly();

    await replica(dragonfly, 'dev');

    expect(websiteWrites(dragonfly)).toBe(0);
    await expect(read(dragonfly, 'release:current')).resolves.toBeNull();
  });

  it('announces nothing without Dragonfly', async () => {
    const memory = new MemoryDragonflyConnection();

    await replica(memory, 'release-2');

    await expect(read(memory, 'release:current')).resolves.toBeNull();
    await expect(read(memory, 'nsl:website:pages')).resolves.toBeNull();
  });

  it('announces nothing when Dragonfly refused the health write at boot', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.rejectNext('SET');

    await replica(dragonfly, 'release-2');

    expect(websiteWrites(dragonfly)).toBe(0);
    await expect(read(dragonfly, 'release:current')).resolves.toBeNull();
  });

  it('announces after no release when it cannot read the current one, so the websites rebuild rather than keep old pages', async () => {
    const dragonfly = new FakeDragonfly();
    dragonfly.rejectNext('GET');

    await replica(dragonfly, 'release-2');

    expect(
      dragonfly.commands.filter(command =>
        command[1]?.startsWith('lock:release:')
      )
    ).toEqual([expect.arrayContaining(['lock:release:release-2:after:none'])]);
    await expect(read(dragonfly, 'release:current')).resolves.toBe('release-2');
    expect(websiteWrites(dragonfly)).toBe(2);
  });
});
