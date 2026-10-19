import { Logger } from '@nestjs/common';

const CIRCUIT_BREAKER_THRESHOLD = 3;
const CIRCUIT_BREAKER_COOLDOWN_MS = 5 * 60 * 1000;

/**
 * Stops calling an analytics provider for a while after it failed a few times
 * in a row, so a provider that is down doesn't slow down every request.
 */
export class CircuitBreaker {
  private consecutiveFailures = 0;
  private circuitOpenUntil = 0;

  constructor(
    private readonly provider: string,
    private readonly logger: Logger
  ) {}

  isOpen(): boolean {
    if (this.consecutiveFailures < CIRCUIT_BREAKER_THRESHOLD) {
      return false;
    }

    if (Date.now() >= this.circuitOpenUntil) {
      this.consecutiveFailures = 0;
      return false;
    }

    return true;
  }

  recordFailure(): void {
    this.consecutiveFailures++;

    if (this.consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
      this.circuitOpenUntil = Date.now() + CIRCUIT_BREAKER_COOLDOWN_MS;
      this.logger.warn(
        `Circuit breaker open after ${this.consecutiveFailures} consecutive ${this.provider} failures. ` +
          `Skipping ${this.provider} calls for ${CIRCUIT_BREAKER_COOLDOWN_MS / 1000}s.`
      );
    }
  }

  recordSuccess(): void {
    this.consecutiveFailures = 0;
  }
}
