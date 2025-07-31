import {
  HttpException,
  ExecutionContext,
  Catch,
  ExceptionFilter,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response, Request } from 'express';
import { handleHttpException } from '../utils/error.utils';
import { ResponseFormatterService } from 'src/libs/response-formatter/services/response-formatter.service';

@Catch(HttpException)
export class HttpExeptionsFilter implements ExceptionFilter {
  constructor(
    private readonly reponseFormatterService: ResponseFormatterService,
  ) {}
  catch(exception: HttpException, context: ExecutionContext): void {
    const ctx: HttpArgumentsHost = context.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();
    const { status, codeStatus, msg } = handleHttpException(exception);
    this.reponseFormatterService.respondWithError({
      request,
      response,
      status,
      code: codeStatus,
      message: msg,
    });
  }
}
