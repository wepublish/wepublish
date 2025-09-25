import { ModuleMetadata, Provider, Type } from '@nestjs/common';

export interface ModuleAsyncOptions<OptionsType>
  extends Pick<ModuleMetadata, 'imports'> {
  global?: boolean;
  useExisting?: Type<OptionsType>;
  useClass?: Type<OptionsType>;
  useFactory?: (...args: any[]) => Promise<OptionsType> | OptionsType;
  inject?: Type[];
}

export const createAsyncOptionsProvider = <OptionsType>(
  provide: string,
  options: ModuleAsyncOptions<OptionsType>
): Provider => {
  if (options.useFactory) {
    return {
      provide,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };
  }
  if (options.useExisting) {
    return {
      provide,
      useExisting: options.useExisting,
    };
  }
  if (options.useClass) {
    return {
      provide,
      useExisting: options.useClass,
    };
  }
  throw new Error(`Provider ${provide} not set up properly`);
};
