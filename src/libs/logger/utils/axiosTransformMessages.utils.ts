import {
  AxiosError,
  AxiosHeaders,
  AxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import { IncomingMessage, ServerResponse } from 'http';
import { HttpStatus } from '@nestjs/common';
import { fromErrorAxios } from '../interfaces/logger.interfaces';
import { directions } from '../interfaces/logger.interfaces';

export class AxiosTransformMessagesUtils {
  constructor(
    private _response: AxiosResponse,
    private _errorMessage?: string,
    private _config: AxiosRequestConfig = {} as AxiosRequestConfig,
  ) {}
  get request() {
    const {
      url = '/',
      headers: configHeaders = {} as Record<string, string>,
      data,
    } = this._config;
    const request: IncomingMessage = this._response?.request ?? {};
    const headers = Object.fromEntries(
      Object.entries(configHeaders).map(([key, value]) => [
        key,
        value?.toString(),
      ]),
    );
    const readableAborted = this._errorMessage != null;
    Object.assign(request, {
      url,
      headers,
      readableAborted,
      dir: directions.OUTGOING,
      body: data,
    });
    return request;
  }
  private responseTimeMS(startTimeMS?: number) {
    if (!startTimeMS || isNaN(startTimeMS)) {
      return;
    }
    const endTime = Date.now();
    return endTime - startTimeMS;
  }
  get response() {
    const response: ServerResponse = new ServerResponse(this.request);
    const { status, statusText, headers = {}, data } = this._response;
    const { startTime } = this._config;
    Object.entries(headers).forEach(([key, value]) => {
      response.setHeader(key, value as string);
    });
    const responseTime = this.responseTimeMS(startTime);
    const statusCode = status ?? HttpStatus.INTERNAL_SERVER_ERROR;
    const statusMessage = statusText ?? HttpStatus[statusCode];
    Object.assign(response, {
      statusCode,
      responseTime,
      statusMessage,
      dir: directions.OUTGOING,
    });
    Reflect.defineProperty(response, 'body', {
      value: data,
      writable: true,
      enumerable: true,
      configurable: true,
    });
    Reflect.defineProperty(response, 'writableEnded', {
      value: true,
      writable: false,
    });
    return response;
  }
  static fromResponse(response: AxiosResponse) {
    return new AxiosTransformMessagesUtils(
      response,
      undefined,
      response.config,
    );
  }
  static fromError(error: AxiosError) {
    const {
      response = {
        data: null,
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        statusText: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
        headers: {},
        config: { headers: new AxiosHeaders() },
      },
      message,
      config,
    }: fromErrorAxios = error;
    return new AxiosTransformMessagesUtils(
      response,
      message,
      config ?? response?.config,
    );
  }
}
