import { Injectable } from '@nestjs/common';
import { SellableKind } from '@prisma/client';
import { SellableHandler } from './sellable-handler';

@Injectable()
export class SellableRegistry {
  private handlers = new Map<SellableKind, SellableHandler>();

  public register(handler: SellableHandler): void {
    if (this.handlers.has(handler.kind)) {
      throw new Error(
        `A sellable handler for ${handler.kind} is already registered`
      );
    }

    this.handlers.set(handler.kind, handler);
  }

  public get(kind: SellableKind): SellableHandler | undefined {
    return this.handlers.get(kind);
  }

  public kinds(): SellableKind[] {
    return [...this.handlers.keys()];
  }
}
