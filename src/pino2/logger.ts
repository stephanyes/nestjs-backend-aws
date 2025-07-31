import { pino } from 'pino';
import { LogLevel, LoggerOptions, LogLevelStreamEntry } from './types';
import { buildConsoleStream, buildPrettyConsoleStream, buildFileStream } from './destinations';
import { getMinLevel } from './factory';

export async function createLogger(options: LoggerOptions = {}) {
  const streams: LogLevelStreamEntry[] = [];
  
  // Default level
  const defaultLevel: LogLevel = options.level || 'info';
  
  // Console stream
  const consoleOptions = options.console || { level: defaultLevel, colorize: true };
  if (process.env.NODE_ENV === 'development') {
    streams.push(buildPrettyConsoleStream(
      consoleOptions.level || defaultLevel,
      consoleOptions.colorize ?? true
    ));
  } else {
    streams.push(buildConsoleStream(
      consoleOptions.level || defaultLevel,
      false
    ));
  }
  
  // File stream
  if (options.file) {
    const fileOptions = options.file;
    const fileStream = await buildFileStream(
      fileOptions.level || defaultLevel,
      fileOptions.path || './logs/app.log'
    );
    streams.push(fileStream);
  }
  
  // Crear multistream logger
  const logger = pino(
    {
      level: getMinLevel(streams),
      formatters: {
        level: (label) => ({ level: label })
      }
    },
    pino.multistream(streams, {
      dedupe: true // Evitar logs duplicados
    })
  );
  
  return logger;
}

// Versión sync para casos simples
export function createLoggerSync(options: LoggerOptions = {}) {
  const streams: LogLevelStreamEntry[] = [];
  
  // Default level
  const defaultLevel: LogLevel = options.level || 'info';
  
  // Console stream
  const consoleOptions = options.console || { level: defaultLevel, colorize: true };
  if (process.env.NODE_ENV === 'development') {
    streams.push(buildPrettyConsoleStream(
      consoleOptions.level || defaultLevel,
      consoleOptions.colorize ?? true
    ));
  } else {
    streams.push(buildConsoleStream(
      consoleOptions.level || defaultLevel,
      false
    ));
  }
  
  // Crear logger sin file (sync)
  const logger = pino(
    {
      level: getMinLevel(streams),
      formatters: {
        level: (label) => ({ level: label })
      }
    },
    pino.multistream(streams, {
      dedupe: true
    })
  );
  
  return logger;
}