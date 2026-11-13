import type { CircuitBreakerOptions } from '@nestjs/resilience';

export const HOT_AND_TRENDING_CIRCUIT_BREAKER = {
  failureRateThreshold: 100,
  minimumCalls: 3,
  slidingWindow: { type: 'count', size: 3 },
  openDuration: '5m',
} satisfies Omit<CircuitBreakerOptions, 'name'>;
