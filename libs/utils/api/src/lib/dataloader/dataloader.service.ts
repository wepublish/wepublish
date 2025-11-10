import { Injectable, Scope } from '@nestjs/common';
import DataLoader from 'dataloader';
import { Primeable } from './prime-dataloaders.decorator';

@Injectable({
  scope: Scope.REQUEST,
})
export abstract class DataLoaderService<Type> implements Primeable<Type> {
  protected abstract loadByKeys(keys: string[]): Promise<(Type | null)[]>;

  public readonly dataloader = new DataLoader<string, Type | null>(
    async (keys: readonly string[]) => this.loadByKeys(keys as string[]),
    { name: this.constructor.name }
  );

  public prime(
    ...parameters: Parameters<DataLoader<string, Type | null>['prime']>
  ) {
    return this.dataloader.prime(...parameters);
  }

  public load(
    ...parameters: Parameters<DataLoader<string, Type | null>['load']>
  ) {
    return this.dataloader.load(...parameters);
  }

  public loadMany(
    ...parameters: Parameters<DataLoader<string, Type | null>['loadMany']>
  ) {
    return this.dataloader.loadMany(...parameters);
  }
}
