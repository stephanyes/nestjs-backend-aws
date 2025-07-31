import {
  ExecutionContext,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Response, Request } from 'express';
import { handlerGenericException } from '../utils/error.utils';
import { ResponseFormatterService } from 'src/libs/response-formatter/services/response-formatter.service';

@Catch()
export class GenericExeptionFilters implements ExceptionFilter {
  constructor(
    private readonly reponseFormatterService: ResponseFormatterService,
  ) {}

  catch(exception: Error, context: ExecutionContext) {
    // 👇 Este check evita que maneje errores HTTP
    if (exception instanceof HttpException) {
      throw exception; // Dejá que lo maneje HttpExceptionsFilter
    }
    const ctx: HttpArgumentsHost = context.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();
    const { status, codeStatus, msg } = handlerGenericException(exception);

    this.reponseFormatterService.respondWithError({
      request,
      response,
      status,
      code: codeStatus,
      message: msg,
    });
  }
}
