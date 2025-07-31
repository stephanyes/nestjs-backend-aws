import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import { ResponseFormatterService } from 'src/libs/response-formatter/services/response-formatter.service';

@Injectable()
export class ResponseParser<T> implements NestInterceptor<T | string> {
  constructor(
    private readonly responseFormatterService: ResponseFormatterService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map(<T extends { errors: T['errors'] }>(data: T) => {
        return this.responseFormatterService.formatResponse(data, context);
      }),
    );
  }
}
