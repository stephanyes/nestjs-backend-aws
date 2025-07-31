import { DynamicModule, Global, Module, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';

import { HttpService } from './services/http.service';
import {
  AXIOS_INSTANCE,
  HTTP_MODULE_ID,
  HTTP_MODULE_OPTIONS,
  defaultAxiosConfigInstance,
} from './constants/http.constants';
import {
  HttpModuleAsyncOptions,
  HttpModuleOptions,
  HttpModuleOptionsFactory,
} from './interfaces/http.interfaces';
const createAxiosInstance = (config: HttpModuleOptions): AxiosInstance => {
  const mergedConfig = {
    ...defaultAxiosConfigInstance,
    ...config,
    headers: {
      ...defaultAxiosConfigInstance.headers,
      ...config.headers,
    },
  };
  const instance = axios.create(mergedConfig);
  axiosRetry(instance, mergedConfig);
  return instance;
};

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    HttpService,
    {
      provide: HTTP_MODULE_OPTIONS,
      useFactory: (configService: ConfigService) =>
        configService.get<HttpModuleOptions>('config.http'),
      inject: [ConfigService],
    },
    {
      provide: AXIOS_INSTANCE,
      useFactory: (options: HttpModuleOptions) => createAxiosInstance(options),
      inject: [HTTP_MODULE_OPTIONS],
    },
  ],
  exports: [HttpService, AXIOS_INSTANCE, HTTP_MODULE_OPTIONS],
})
export class HttpModule {
  static register(config: HttpModuleOptions): DynamicModule {
    return {
      module: HttpModule,
      global: true,
      providers: [
        {
          provide: AXIOS_INSTANCE,
          useValue: createAxiosInstance(config),
        },
        {
          provide: HTTP_MODULE_ID,
          useValue: Date.now().toString(36),
        },
        HttpService,
      ],
      exports: [HttpService, AXIOS_INSTANCE],
    };
  }

  static registerAsync(options: HttpModuleAsyncOptions): DynamicModule {
    return {
      module: HttpModule,
      global: true,
      imports: options.imports || [],
      providers: [
        ...this.createAsyncProviders(options),
        {
          provide: AXIOS_INSTANCE,
          useFactory: (options: HttpModuleOptions) =>
            createAxiosInstance(options),
          inject: [HTTP_MODULE_OPTIONS],
        },
        {
          provide: HTTP_MODULE_ID,
          useValue: Date.now().toString(36),
        },
        ...(options.extraProviders || []),
        HttpService,
      ],
      exports: [HttpService, AXIOS_INSTANCE],
    };
  }

  private static createAsyncProviders(
    options: HttpModuleAsyncOptions,
  ): Provider[] {
    const providers: Provider[] = [];

    if (options.useFactory) {
      providers.push({
        provide: HTTP_MODULE_OPTIONS,
        useFactory: options.useFactory,
        inject: options.inject || [],
      });
    } else if (options.useExisting) {
      const useClass = options.useClass || options.useExisting;

      providers.push({
        provide: HTTP_MODULE_OPTIONS,
        useFactory: (factory: HttpModuleOptionsFactory) =>
          factory.createHttpOptions(),
        inject: [useClass],
      });

      if (options.useClass) {
        providers.push({
          provide: options.useClass,
          useClass: options.useClass,
        });
      }
    } else if (options.useClass) {
      const useClass = options.useClass || options.useExisting;

      providers.push({
        provide: HTTP_MODULE_OPTIONS,
        useFactory: (factory: HttpModuleOptionsFactory) =>
          factory.createHttpOptions(),
        inject: [useClass],
      });

      if (options.useClass) {
        providers.push({
          provide: options.useClass,
          useClass: options.useClass,
        });
      }
    }

    return providers;
  }
}
