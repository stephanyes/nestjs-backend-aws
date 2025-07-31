export const AXIOS_INSTANCE = 'AXIOS_INSTANCE';
export const PINO_HTTP_LOGGER = 'PINO_HTTP_LOGGER';
export const PINO_LOGGER = 'PINO_LOGGER'
export enum LoggerLevel {
  INFO = 'info',
  ERROR = 'error',
  WARN = 'warn',
  DEBUG = 'debug',
  TRACE = 'trace',
}
export enum LoggerType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  OUTGOING_REQUEST = 'OUTGOING_REQUEST',
  OUTGOING_RESPONSE = 'OUTGOING_RESPONSE',
  CUSTOM = 'CUSTOM',
}
export type customLogLevelType = 'error' | 'info';
type primitiveCustomMessageType =
  | string
  | object
  | number
  | boolean
  | bigint
  | undefined
  | Error
  | null;
export type customMessageType =
  | string
  | object
  | number
  | boolean
  | bigint
  | undefined
  | null
  | Error
  | Array<primitiveCustomMessageType>;
