import { Test, type TestingModule } from '@nestjs/testing';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespaceVersions } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WEBSITE_LAYOUT_VERSION, WEBSITE_PAGES_VERSION } from './website-keys';
import { WebsitePathsSignal } from './website-paths-signal';
import { WebsiteSignalsModule } from './website-signals.module';

const read = async (connection: DragonflyConnection, key: string) => {
  const reply = await connection.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('WebsitePathsSignal', () => {
  let module: TestingModule | undefined;

  const start = async (connection: DragonflyConnection) => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({ connection }),
        WebsiteSignalsModule,
      ],
    }).compile();
    await module.init();

    return {
      paths: module.get(WebsitePathsSignal),
      versions: module.get(NamespaceVersions),
    };
  };

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.useRealTimers();
  });

  it('changes the versions of the given pages at once and again six seconds later', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    await paths.changed(['/a/one', '/a/id/1']);
    const first = await read(dragonfly, 'nsv:website:path:/a/one');

    expect(first).toEqual(expect.any(String));
    await expect(read(dragonfly, 'nsv:website:path:/a/id/1')).resolves.toEqual(
      expect.any(String)
    );

    await vi.advanceTimersByTimeAsync(5999);

    await expect(read(dragonfly, 'nsv:website:path:/a/one')).resolves.toBe(
      first
    );

    await vi.advanceTimersByTimeAsync(1);

    await expect(read(dragonfly, 'nsv:website:path:/a/one')).resolves.not.toBe(
      first
    );
  });

  it('forgets the versions after four hours', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    await paths.changed(['/a/one']);
    await vi.advanceTimersByTimeAsync(6000 + 4 * 60 * 60 * 1000);

    await expect(
      read(dragonfly, 'nsv:website:path:/a/one')
    ).resolves.toBeNull();
  });

  it('writes the versions once Dragonfly is back after a longer outage', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    dragonfly.down();
    await paths.changed(['/a/one', '/a/id/1']);
    await vi.advanceTimersByTimeAsync(30_000);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(5000);

    await expect(read(dragonfly, 'nsv:website:path:/a/one')).resolves.toEqual(
      expect.any(String)
    );
    await expect(read(dragonfly, 'nsv:website:path:/a/id/1')).resolves.toEqual(
      expect.any(String)
    );
  });

  it('forgets versions written after an outage after four hours too', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    dragonfly.down();
    await paths.changed(['/a/one']);
    await vi.advanceTimersByTimeAsync(30_000);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(10_000);
    await vi.advanceTimersByTimeAsync(4 * 60 * 60 * 1000);

    await expect(
      read(dragonfly, 'nsv:website:path:/a/one')
    ).resolves.toBeNull();
  });

  it('leaves the website pages and layout versions alone', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths, versions } = await start(dragonfly);
    const pages = await versions.current(WEBSITE_PAGES_VERSION);
    const layout = await versions.current(WEBSITE_LAYOUT_VERSION);

    await paths.changed(['/a/one']);
    await vi.advanceTimersByTimeAsync(70_000);

    await expect(read(dragonfly, 'nsv:website:pages')).resolves.toBe(pages);
    await expect(read(dragonfly, 'nsv:website:layout')).resolves.toBe(layout);
  });

  it('writes lowercased paths, since the websites look them up lowercased', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    await paths.changed(['/a/Mein-Artikel', '/a/id/AbC1']);

    await expect(
      read(dragonfly, 'nsv:website:path:/a/mein-artikel')
    ).resolves.toEqual(expect.any(String));
    await expect(
      read(dragonfly, 'nsv:website:path:/a/id/abc1')
    ).resolves.toEqual(expect.any(String));
    expect(
      dragonfly.commands.filter(
        command => command[0] === 'SET' && /[A-Z]/.test(command[1])
      )
    ).toEqual([]);
  });

  it('writes a path once when it is given in several spellings', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { paths } = await start(dragonfly);

    await paths.changed(['/a/One', '/a/one', '/A/ONE']);

    expect(
      dragonfly.commands.filter(
        command =>
          command[0] === 'SET' && command[1] === 'nsv:website:path:/a/one'
      )
    ).toHaveLength(1);
  });

  it('writes no path versions without Dragonfly, since no website could read them', async () => {
    vi.useFakeTimers();
    const memory = new MemoryDragonflyConnection();
    const { paths } = await start(memory);

    await paths.changed(['/a/one']);
    await vi.advanceTimersByTimeAsync(6000);

    await expect(read(memory, 'nsv:website:path:/a/one')).resolves.toBeNull();
  });
});
