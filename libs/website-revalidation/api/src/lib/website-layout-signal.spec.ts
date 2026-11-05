import { Test, type TestingModule } from '@nestjs/testing';
import {
  type DragonflyConnection,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { NamespacedCacheTestingModule } from '@wepublish/kv-ttl-cache/api/testing';
import { WebsiteLayoutSignal } from './website-layout-signal';
import { WebsiteSignalsModule } from './website-signals.module';

describe('WebsiteLayoutSignal', () => {
  let module: TestingModule | undefined;

  const start = async (connection: DragonflyConnection) => {
    module = await Test.createTestingModule({
      imports: [
        NamespacedCacheTestingModule.forRoot({ connection }),
        WebsiteSignalsModule,
      ],
    }).compile();
    await module.init();

    return module.get(WebsiteLayoutSignal);
  };

  const layoutChanges = (dragonfly: FakeDragonfly) => () =>
    dragonfly.commands.filter(
      command =>
        command[0] === 'SET' &&
        command[1] === 'nsv:website:layout' &&
        !command.includes('NX')
    ).length;

  afterEach(async () => {
    await module?.close();
    module = undefined;
    vi.useRealTimers();
  });

  it('changes at once and again six seconds later', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = layoutChanges(dragonfly);
    const layout = await start(dragonfly);

    await layout.changed();

    expect(changes()).toBe(1);

    await vi.advanceTimersByTimeAsync(5999);

    expect(changes()).toBe(1);

    await vi.advanceTimersByTimeAsync(1);

    expect(changes()).toBe(2);
  });

  it('leaves the website pages alone', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const layout = await start(dragonfly);

    await layout.changed();
    await vi.advanceTimersByTimeAsync(70_000);

    expect(
      dragonfly.commands.filter(command =>
        command[1]?.endsWith(':website:pages')
      )
    ).toEqual([]);
  });

  it('does not change again once the module is closed', async () => {
    vi.useFakeTimers();
    const dragonfly = new FakeDragonfly();
    const changes = layoutChanges(dragonfly);
    const layout = await start(dragonfly);

    await layout.changed();
    await module?.close();
    await vi.advanceTimersByTimeAsync(10_000);

    expect(changes()).toBe(1);
  });

  it('writes no layout version without Dragonfly, since no website could read it', async () => {
    vi.useFakeTimers();
    const memory = new MemoryDragonflyConnection();
    const layout = await start(memory);

    await layout.changed();
    await vi.advanceTimersByTimeAsync(6000);

    const written = await memory.get('nsv:website:layout');

    expect(written.ok && written.value).toBeNull();
  });
});
