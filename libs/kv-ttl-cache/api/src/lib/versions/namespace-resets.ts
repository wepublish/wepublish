import { Injectable, Logger } from '@nestjs/common';
import { NamespaceVersions } from './namespace-versions';

export interface NamespaceResetListener {
  onNamespaceReset(namespace: string): Promise<void>;
}

const logger = new Logger('KvCache');

@Injectable()
export class NamespaceResets {
  private listeners: NamespaceResetListener[] = [];

  constructor(private readonly versions: NamespaceVersions) {}

  register(listener: NamespaceResetListener): void {
    this.listeners.push(listener);
  }

  listenerCount(): number {
    return this.listeners.length;
  }

  async reset(
    namespace: string,
    { silent = false }: { silent?: boolean } = {}
  ): Promise<void> {
    await this.versions.bump(namespace);

    if (silent) {
      return;
    }

    for (const listener of this.listeners) {
      try {
        await listener.onNamespaceReset(namespace);
      } catch (error) {
        logger.error(
          `A listener failed after ${namespace} was reset: ${String(error)}`
        );
      }
    }
  }
}
