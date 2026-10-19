import { Logger } from '@nestjs/common';
import { CircuitBreaker } from './circuit-breaker';

describe('CircuitBreaker', () => {
  const logger = { warn: vi.fn() } as unknown as Logger;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-01'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('opens after 3 consecutive failures', () => {
    const breaker = new CircuitBreaker('Plausible', logger);

    breaker.recordFailure();
    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(false);

    breaker.recordFailure();
    expect(breaker.isOpen()).toBe(true);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Plausible')
    );
  });

  it('closes again after the cooldown', () => {
    const breaker = new CircuitBreaker('Plausible', logger);

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordFailure();
    vi.setSystemTime(new Date('2023-01-01T00:06:00'));

    expect(breaker.isOpen()).toBe(false);
  });

  it('resets the failure count on success', () => {
    const breaker = new CircuitBreaker('Plausible', logger);

    breaker.recordFailure();
    breaker.recordFailure();
    breaker.recordSuccess();
    breaker.recordFailure();

    expect(breaker.isOpen()).toBe(false);
  });
});
