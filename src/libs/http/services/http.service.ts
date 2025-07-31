import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  isAxiosError,
} from 'axios';
import { parseAxiosError } from '../utils/parserAxiosError.utils';
import { AXIOS_INSTANCE, selectedHeaders } from '../constants/http.constants';

@Injectable()
export class HttpService {
  private headers: Record<string, string> = {};

  constructor(
    @Inject(AXIOS_INSTANCE) private readonly axiosRef: AxiosInstance,
  ) {}

  public initAxios(headers: Record<string, string>) {
    this.headers = headers;
  }

  private async fetch<T = any>(
    url: string,
    config: AxiosRequestConfig,
  ): Promise<AxiosResponse<T>> {
    const { method = 'GET', ...restConfig } = config;

    const finalHeaders = {
      ...(config.headers || {}),
      ...this.pickSelectedHeaders(this.headers),
    };

    try {
      return await this.axiosRef.request<T>({
        url: encodeURI(url),
        method,
        headers: finalHeaders,
        ...restConfig,
      });
    } catch (error: unknown) {
      const status =
        isAxiosError(error) && error.response?.status
          ? error.response.status
          : HttpStatus.INTERNAL_SERVER_ERROR;

      const message = parseAxiosError(error);

      throw new HttpException(
        {
          statusCode: status,
          message,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
        status,
      );
    }
  }
  public get<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.fetch(url, { ...config, method: 'GET' });
  }

  public post<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.fetch(url, { ...config, method: 'POST' });
  }

  public put<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.fetch(url, { ...config, method: 'PUT' });
  }

  public patch<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.fetch(url, { ...config, method: 'PATCH' });
  }

  public delete<T = any>(
    url: string,
    config: AxiosRequestConfig = {},
  ): Promise<AxiosResponse<T>> {
    return this.fetch(url, { ...config, method: 'DELETE' });
  }

  private pickSelectedHeaders(
    source: Record<string, any>,
  ): Record<string, any> {
    return selectedHeaders.reduce(
      (acc, key) => {
        if (source[key] != null) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          acc[key] = source[key];
        }
        return acc;
      },
      {} as Record<string, any>,
    );
  }
}
