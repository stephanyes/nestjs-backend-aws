import { Inject, Injectable } from '@nestjs/common';
import { HttpLogger } from 'pino-http';
import {
  AxiosError,
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';
import { AxiosTransformMessagesUtils } from '../utils/axiosTransformMessages.utils';
import {
  AXIOS_INSTANCE,
  PINO_HTTP_LOGGER,
} from '../constants/logger.constants';

@Injectable()
export class OutgoingRequestResponseInterceptor {
  constructor(
    @Inject(PINO_HTTP_LOGGER) private readonly pinoHttpLogger: HttpLogger,
    @Inject(AXIOS_INSTANCE) private readonly axiosInstance: AxiosInstance,
  ) {
    this.axiosInstance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        config.startTime = Date.now();
        return config;
      },
    );
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        const { request: req, response: res } =
          AxiosTransformMessagesUtils.fromResponse(response);
        this.pinoHttpLogger(req, res);
        if (res) {
          res.emit('finish');
        }
        return response;
      },
      (error: AxiosError) => {
        const { request: req, response: res } =
          AxiosTransformMessagesUtils.fromError(error);
        this.pinoHttpLogger(req, res);
        if (res) {
          res.emit('error', error);
        }
        return Promise.reject(error);
      },
    );
  }
}
