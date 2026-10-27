import { Test, type TestingModule } from '@nestjs/testing';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespaceVersions } from '@wepublish/kv-ttl-cache/api';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WEBSITE_PAGES_VERSION } from './website-keys';
import { WebsitePagesSignal } from './website-pages-signal';
import { WebsiteRevalidationModule } from './website-revalidation.module';

const replica = async (connection: DragonflyConnection) => {
  const module = await Test.createTestingModule({
    imports: [
      NamespacedCacheTestingModule.forRoot({ connection }),
      WebsiteRevalidationModule,
    ],
  }).compile();
  await module.init();

  return module;
};

const pagesChanges = (dragonfly: FakeDragonfly) => () =>
  dragonfly.commands.filter(
    command =>
      command[0] === 'SET' &&
      command[1] === 'nsv:website:pages' &&
      !command.includes('NX')
  ).length;

const read = async (connection: DragonflyConnection, key: string) => {
  const reply = await connection.get(key);

  return reply.ok ? reply.value : undefined;
};

describe('WebsitePagesSignal', () => {
  const modules: TestingModule[] = [];

  const start = async (connection: DragonflyConnection) => {
    const module = await replica(connection);
    modules.push(module);

    return {
      module,
      pages: module.get(WebsitePagesSignal),
      versions: module.get(NamespaceVersions),
    };
  };

  afterEach(async () => {
    await Promise.all(modules.splice(0).map(module => module.close()));
    vi.useRealTimers();
  });

  it('changes four seconds after a change was recorded', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { pages, versions } = await start(dragonfly);
    const before = await versions.current(WEBSITE_PAGES_VERSION);

    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(3999);

    await expect(read(dragonfly, 'nsv:website:pages')).resolves.toBe(before);

    await vi.advanceTimersByTimeAsync(1);

    await expect(read(dragonfly, 'nsv:website:pages')).resolves.not.toBe(
      before
    );
  });

  it('bundles a publication and its reset three seconds later into one change after the second reset', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = pagesChanges(dragonfly);
    const { pages } = await start(dragonfly);

    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(3000);
    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(3999);

    expect(changes()).toBe(0);

    await vi.advanceTimersByTimeAsync(70_000);

    expect(changes()).toBe(1);
  });

  it('bundles changes made in quick succession into one change', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = pagesChanges(dragonfly);
    const { pages } = await start(dragonfly);

    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(1000);
    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(1500);
    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(70_000);

    expect(changes()).toBe(1);
  });

  it('changes at most once a minute, also across replicas, without losing a change', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = pagesChanges(dragonfly);
    const first = await start(dragonfly);
    const second = await start(dragonfly);

    await first.pages.recordChange();
    await vi.advanceTimersByTimeAsync(10_000);
    await second.pages.recordChange();
    await vi.advanceTimersByTimeAsync(53_000);

    expect(changes()).toBe(1);

    await vi.advanceTimersByTimeAsync(7000);

    expect(changes()).toBe(2);
  });

  it('does not lose a change when the replica that saw it crashes', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const first = await start(dragonfly);
    const second = await start(dragonfly);
    const before = await second.versions.current(WEBSITE_PAGES_VERSION);

    await first.pages.recordChange();
    await first.module.close();
    await vi.advanceTimersByTimeAsync(10_000);

    await expect(read(dragonfly, 'nsv:website:pages')).resolves.not.toBe(
      before
    );
  });

  it('changes once when two replicas fire the same scheduled publication', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = pagesChanges(dragonfly);
    const first = await start(dragonfly);
    const second = await start(dragonfly);

    await Promise.all([
      first.pages.recordChange(),
      second.pages.recordChange(),
    ]);
    await vi.advanceTimersByTimeAsync(3000);
    await Promise.all([
      first.pages.recordChange(),
      second.pages.recordChange(),
    ]);
    await vi.advanceTimersByTimeAsync(70_000);

    expect(changes()).toBe(1);
  });

  it('changes at the latest a minute after the first of a steady stream of changes', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = pagesChanges(dragonfly);
    const { pages } = await start(dragonfly);

    for (let second = 0; second < 64; second += 2) {
      await pages.recordChange();
      await vi.advanceTimersByTimeAsync(2000);
    }

    expect(changes()).toBe(1);
  });

  it('is shared once Dragonfly is back after a change during an outage', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { pages, versions } = await start(dragonfly);
    const before = await versions.current(WEBSITE_PAGES_VERSION);

    dragonfly.down();
    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(4000);
    dragonfly.up();
    await vi.advanceTimersByTimeAsync(5000);

    const shared = await read(dragonfly, 'nsv:website:pages');
    expect(shared).toEqual(expect.any(String));
    expect(shared).not.toBe(before);
  });

  it('records and changes nothing without Dragonfly', async () => {
    vi.useFakeTimers();
    const memory = new MemoryDragonflyConnection();
    const { pages } = await start(memory);

    await pages.recordChange();
    await vi.advanceTimersByTimeAsync(70_000);
    await pages.checkDue();

    await expect(read(memory, 'nsl:website:pages')).resolves.toBeNull();
    await expect(read(memory, 'nsf:website:pages')).resolves.toBeNull();
    await expect(read(memory, 'nsv:website:pages')).resolves.toBeNull();
  });

  it('does not watch for due changes without Dragonfly', async () => {
    vi.useFakeTimers();
    await start(new MemoryDragonflyConnection());

    expect(vi.getTimerCount()).toBe(0);
  });

  it('stops checking once the module is closed', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const { module } = await start(dragonfly);

    await module.close();
    const sent = dragonfly.commands.length;
    await vi.advanceTimersByTimeAsync(70_000);

    expect(dragonfly.commands.length).toBe(sent);
    expect(vi.getTimerCount()).toBe(0);
  });
});
