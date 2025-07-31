import { ModuleMetadata, Provider, Type } from '@nestjs/common';
import { CreateAxiosDefaults } from 'axios';
import { IAxiosRetryConfig } from 'axios-retry';

export interface HttpModuleOptions
  extends CreateAxiosDefaults,
    IAxiosRetryConfig {}

export interface HttpModuleOptionsFactory {
  createHttpOptions(): Promise<HttpModuleOptions> | HttpModuleOptions;
}

export interface HttpModuleAsyncOptions
  extends Pick<ModuleMetadata, 'imports'> {
  useClass?: Type<HttpModuleOptionsFactory>;
  useFactory?: (
    ...args: any[]
  ) => Promise<HttpModuleOptions> | HttpModuleOptions;
  useExisting?: Type<HttpModuleOptionsFactory>;
  inject?: any[];
  extraProviders?: Provider[];
}
