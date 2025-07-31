import { pino } from 'pino';
import { LogLevel, LoggerOptions, LogLevelStreamEntry } from './types';
import { buildConsoleStream, buildPrettyConsoleStream, buildRollingFileStream, buildFileStream } from './destinations';

// utils.ts - Utilidades
const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

export function getMinLevel(streams: LogLevelStreamEntry[]): LogLevel {
  if (streams.length === 0) return 'info';
  
  const minLevel = Math.min(...streams.map(s => LOG_LEVELS[s.level]));
  return Object.entries(LOG_LEVELS).find(
    ([, value]) => value === minLevel
  )?.[0] as LogLevel || 'info';
}

export async function loggerApp(options: LoggerOptions = {}) {
  const streams: LogLevelStreamEntry[] = [];
  
  const defaultLevel: LogLevel = options.level || 'info';
  
  // Console
  if (process.env.NODE_ENV === 'development') {
    streams.push(buildPrettyConsoleStream(defaultLevel, true));
  } else {
    streams.push(buildConsoleStream(defaultLevel, false));
  }
  
  // File
  const fileStream = await buildFileStream(defaultLevel, './logs/app.log');
  streams.push(fileStream);
  
  return pino(
    { level: getMinLevel(streams) },
    pino.multistream(streams, { dedupe: true })
  );
}

export function loggerAppSync(options: LoggerOptions = {}) {
  const streams: LogLevelStreamEntry[] = [];
  
  const defaultLevel: LogLevel = options.level || 'info';
  
  // Console only (sync version)
  if (process.env.NODE_ENV === 'development') {
    streams.push(buildPrettyConsoleStream(defaultLevel, true));
  } else {
    streams.push(buildConsoleStream(defaultLevel, false));
  }
  
  return pino(
    { level: getMinLevel(streams) },
    pino.multistream(streams, { dedupe: true })
  );
}

export function loggerAppRolling(options: LoggerOptions = {}) {
  const streams: LogLevelStreamEntry[] = [];
  
  const defaultLevel: LogLevel = options.level || 'info';
  
  // Console
  if (process.env.NODE_ENV === 'development') {
    streams.push(buildPrettyConsoleStream(defaultLevel, true));
  } else {
    streams.push(buildConsoleStream(defaultLevel, false));
  }
  
  // Rolling file
  streams.push(buildRollingFileStream(defaultLevel, './logs/app.log'));
  
  return pino(
    { level: getMinLevel(streams) },
    pino.multistream(streams, { dedupe: true })
  );
}