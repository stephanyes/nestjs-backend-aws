import '@types/axios';

declare module 'axios' {
  interface AxiosRequestConfig {
    startTime?: number;
  }
  interface AxiosResponse {
    body?: object;
    responseTime?: number;
  }
  interface InternalAxiosRequestConfig {
    startTime?: number;
  }
}
