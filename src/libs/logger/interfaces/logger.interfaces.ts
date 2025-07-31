import { AxiosRequestConfig, AxiosResponse } from 'axios';

export enum LogKeyTranslations {
  level = 'level',
  timestamp = 'time',
  msg = 'message',
}
export interface LoggingObject {
  responseTime?: number;
}
export interface fromErrorAxios {
  response?: AxiosResponse;
  message: string;
  config?: AxiosRequestConfig;
}
export enum directions {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
}
