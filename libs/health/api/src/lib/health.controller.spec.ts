import { HealthIndicatorService } from '@nestjs/terminus';
import {
  DragonflyHealth,
  type DragonflyStatus,
  MemoryDragonflyConnection,
} from '@wepublish/dragonfly/api';
import { FakeDragonfly } from '@wepublish/dragonfly/api/testing';
import { DragonflyHealthIndicator } from './dragonfly.health';
import { HealthController } from './health.controller';

vi.mock('@wepublish/authentication/api', () => ({
  Public: () => () => undefined,
}));

describe('DragonflyHealthIndicator', () => {
  const indicator = (status: DragonflyStatus) =>
    new DragonflyHealthIndicator(new HealthIndicatorService(), {
      status: vi.fn().mockResolvedValue(status),
    } satisfies Pick<DragonflyHealth, 'status'> as unknown as DragonflyHealth);

  const options = { keyPrefix: 'test', production: false, releaseId: 'dev' };

  it('is up while Dragonfly answers', async () => {
    await expect(
      indicator('reachable').isHealthy('dragonfly')
    ).resolves.toEqual({ dragonfly: { status: 'up' } });
  });

  it.each<[DragonflyStatus, string]>([
    ['not-configured', 'REDIS_URL is not set'],
    ['unreachable', 'Dragonfly is unreachable or refuses writes'],
  ])('is down when Dragonfly is %s', async (status, message) => {
    await expect(indicator(status).isHealthy('dragonfly')).resolves.toEqual({
      dragonfly: { status: 'down', message },
    });
  });

  it('asks the Dragonfly connection itself', async () => {
    const dragonfly = new FakeDragonfly();
    const health = new DragonflyHealthIndicator(
      new HealthIndicatorService(),
      new DragonflyHealth(dragonfly, { ...options, url: 'redis://dragonfly' })
    );

    await expect(health.isHealthy('dragonfly')).resolves.toEqual({
      dragonfly: { status: 'up' },
    });

    dragonfly.down();

    await expect(health.isHealthy('dragonfly')).resolves.toEqual({
      dragonfly: {
        status: 'down',
        message: 'Dragonfly is unreachable or refuses writes',
      },
    });
  });

  it('is down without REDIS_URL', async () => {
    const health = new DragonflyHealthIndicator(
      new HealthIndicatorService(),
      new DragonflyHealth(new MemoryDragonflyConnection(), options)
    );

    await expect(health.isHealthy('dragonfly')).resolves.toEqual({
      dragonfly: { status: 'down', message: 'REDIS_URL is not set' },
    });
  });
});

describe('HealthController', () => {
  const setup = () => {
    const health = {
      check: vi.fn(async (checks: Array<() => Promise<unknown>>) =>
        Promise.all(checks.map(check => check()))
      ),
    };
    const dragonfly = {
      isHealthy: vi.fn().mockResolvedValue({ dragonfly: { status: 'down' } }),
    };
    const pingCheck = vi.fn().mockResolvedValue({});
    const controller = new HealthController(
      health as any,
      { pingCheck } as any,
      { pingCheck } as any,
      {} as any,
      dragonfly as any
    );

    return { controller, dragonfly };
  };

  it('checks Dragonfly in /health, which UptimeRobot watches', async () => {
    const { controller, dragonfly } = setup();

    await controller.readiness();

    expect(dragonfly.isHealthy).toHaveBeenCalledWith('dragonfly');
  });

  it('keeps Dragonfly out of the Kubernetes probes, so pods stay in service without it', async () => {
    const { controller, dragonfly } = setup();

    await controller.readinessProbe();
    controller.livenessProbe();
    controller.startupProbe();

    expect(dragonfly.isHealthy).not.toHaveBeenCalled();
  });
});
