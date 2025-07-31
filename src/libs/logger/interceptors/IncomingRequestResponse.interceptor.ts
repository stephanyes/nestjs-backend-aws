import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { HttpLogger } from 'pino-http';
import { IncomingMessage, ServerResponse } from 'http';
import { directions } from '../interfaces/logger.interfaces';
import { PINO_HTTP_LOGGER } from '../constants/logger.constants';

@Injectable()
export class IncomingRequestResponseInterceptor implements NestInterceptor {
  private readonly pinoHttpLogger: HttpLogger;
  constructor(@Inject(PINO_HTTP_LOGGER) pinoHttpLogger: HttpLogger) {
    this.pinoHttpLogger = pinoHttpLogger;
  }
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<IncomingMessage>();
    const response = context.switchToHttp().getResponse<ServerResponse>();
    request.dir = directions.INCOMING;
    response.dir = directions.INCOMING;
    this.pinoHttpLogger(request, response);

    return next.handle().pipe(
      tap((data: string | object | undefined) => {
        if (typeof data === 'string') {
          response.body = { data };
        } else {
          response.body = data;
        }
      }),
    );
  }
}
