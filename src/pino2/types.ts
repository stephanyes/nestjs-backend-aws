import { DestinationStream } from 'pino';

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogLevelStreamEntry {
  level: LogLevel;
  stream: DestinationStream; // Usar DestinationStream de Pino en lugar de NodeJS.WritableStream
}

export interface ConsoleOptions {
  level?: LogLevel;
  colorize?: boolean;
}

export interface FileOptions {
  level?: LogLevel;
  path?: string;
}

export interface LoggerOptions {
  level?: LogLevel;
  console?: ConsoleOptions;
  file?: FileOptions;
}