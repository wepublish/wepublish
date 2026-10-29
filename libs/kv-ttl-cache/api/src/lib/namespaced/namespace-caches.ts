import { Inject, Injectable } from '@nestjs/common';
import { DragonflyConnection } from '@wepublish/dragonfly/api';
import type { Cache } from 'cache-manager';

export const SHARED_NAMESPACES = Symbol('SHARED_NAMESPACES');
export const SHARED_CACHE = Symbol('SHARED_CACHE');
export const LOCAL_CACHE = Symbol('LOCAL_CACHE');

@Injectable()
export class NamespaceCaches {
  constructor(
    @Inject(SHARED_CACHE) private readonly shared: Cache,
    @Inject(LOCAL_CACHE) private readonly local: Cache,
    @Inject(SHARED_NAMESPACES) private readonly names: ReadonlySet<string>,
    private readonly connection: DragonflyConnection
  ) {}

  cacheFor(namespace: string): Cache {
    return this.isShared(namespace) ? this.shared : this.local;
  }

  isShared(namespace: string): boolean {
    return this.connection.shared && this.names.has(namespace);
  }
}
