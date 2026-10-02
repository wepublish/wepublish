import { HealthIndicatorService } from '@nestjs/terminus';
import { DragonflyHealthIndicator } from './dragonfly.health';
import { HealthController } from './health.controller';

vi.mock('@wepublish/authentication/api', () => ({
  Public: () => () => undefined,
}));

describe('DragonflyHealthIndicator', () => {
  const indicator = (status: string) =>
    new DragonflyHealthIndicator(new HealthIndicatorService(), {
      dragonflyStatus: vi.fn().mockResolvedValue(status),
    } as any);

  it('is up while Dragonfly answers', async () => {
    await expect(
      indicator('reachable').isHealthy('dragonfly')
    ).resolves.toEqual({ dragonfly: { status: 'up' } });
  });

  it.each([
    ['not-configured', 'REDIS_URL is not set'],
    ['unreachable', 'Dragonfly is unreachable'],
  ])('is down when Dragonfly is %s', async (status, message) => {
    await expect(indicator(status).isHealthy('dragonfly')).resolves.toEqual({
      dragonfly: { status: 'down', message },
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
