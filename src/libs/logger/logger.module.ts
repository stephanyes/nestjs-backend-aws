import { Global, Module } from '@nestjs/common';
import { createPinoHttpLogger } from './pino/pinoHttp.logger';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { IncomingRequestResponseInterceptor } from './interceptors/IncomingRequestResponse.interceptor';
import { PINO_HTTP_LOGGER, PINO_LOGGER } from './constants/logger.constants';
import { LoggerServices } from './services/logger.services';
import pkg from '../../../package.json';
import logger from './pino/pino.logger';

export const { name, version } = pkg;

@Global()
@Module({
  providers: [
    {
      provide: PINO_HTTP_LOGGER,
      useFactory: () => {
        return createPinoHttpLogger();
      },
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: IncomingRequestResponseInterceptor,
    },
    {
      provide: PINO_LOGGER, // Nuevo provider para el logger básico
      useValue: logger,
    },
    LoggerServices,
  ],
  exports: [PINO_HTTP_LOGGER, PINO_LOGGER, LoggerServices],
})
export class LoggerModule {}
