import { Injectable, ExecutionContext } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorRespond, ExtendedErrorResponse } from '../types/response.types';
import { HttpMetaDataService } from './http-meta-data.service';

@Injectable()
export class ResponseFormatterService {
  constructor(private readonly httpMetaDataService: HttpMetaDataService) {}

  respondWithError(respond: ErrorRespond) {
    const { url, queryParams, method } =
      this.httpMetaDataService.extractRequestParams(respond.request);
    const exceptionStack = `${method} - ${new URL(url).pathname}`;
    const meta = this.httpMetaDataService.createMetaData({
      url,
      queryParams,
      method,
      status: respond.status,
    });
    const extendedResponse: ExtendedErrorResponse = {
      meta,
      data: null,
      errors: [
        {
          status: respond.status,
          code: respond.code,
          message: respond.message,
          path: exceptionStack,
        },
      ],
    };
    respond.response.header('Content-Type', 'application/json');
    respond.response.status(respond.status).send(extendedResponse);
  }
  private containsNestedData(data: unknown) {
    return data != null && typeof data == 'object' && 'data' in data;
  }
  private normalizeData<T extends { errors: T['errors'] }>(data: T) {
    if (this.containsNestedData(data)) {
      return data;
    }
    if (data.errors) {
      const { errors, ...rest } = data;
      void errors;
      return rest;
    }
    return data;
  }
  formatResponse<T extends { errors: T['errors'] }>(
    data: T,
    context: ExecutionContext,
  ) {
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    const { url, queryParams, method } =
      this.httpMetaDataService.extractRequestParams(request);
    const meta = this.httpMetaDataService.createMetaData({
      url,
      queryParams,
      method,
      status: response.statusCode,
    });
    return {
      meta,
      data: this.normalizeData(data),
      errors: data.errors,
    };
  }
}
