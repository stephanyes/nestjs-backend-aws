// simple-logger.ts - Todo en un archivo para evitar problemas de imports

import pino from 'pino'; // Importación corregida
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';

// Tipos
type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LoggerConfig {
  level?: LogLevel;
  console?: boolean;
  file?: string;
  pretty?: boolean;
}

// Logger básico (máximo performance)
export function createBasicLogger(): pino.Logger {
  return pino();
}

// Logger con configuración
export function createConfiguredLogger(config: LoggerConfig = {}): pino.Logger {
  const {
    level = 'info',
    console: enableConsole = true,
    file: filePath,
    pretty = process.env.NODE_ENV === 'development'
  } = config;

  // Solo console
  if (!filePath) {
    if (pretty && enableConsole) {
      return pino({
        level,
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        }
      });
    }
    
  return pino({ 
    level: ['trace', 'debug', 'info', 'warn', 'error', 'fatal'].includes(level) ? level : 'info' 
  });
}

  // Console + File (multistream)
  const streams: pino.StreamEntry[] = [];

  // Console stream
  if (enableConsole) {
    if (pretty) {
      streams.push({
        level,
        stream: pino.transport({
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname'
          }
        })
      });
    } else {
      streams.push({
        level,
        stream: process.stdout
      });
    }
  }

  // File stream
  if (filePath) {
    // Crear directorio
    const dir = dirname(filePath);
    mkdir(dir, { recursive: true }).catch(() => {});

    streams.push({
      level,
      stream: pino.destination({
        dest: filePath,
        sync: false,
        mkdir: true
      })
    });
  }

  return pino(
    { level },
    pino.multistream(streams)
  );
}

// Loggers pre-configurados
export function appLogger(config: LoggerConfig = {}): pino.Logger {
  return createConfiguredLogger({
    level: 'info',
    console: true,
    file: './logs/app.log',
    pretty: process.env.NODE_ENV === 'development',
    ...config
  });
}

export function performanceLogger(): pino.Logger {
  return createBasicLogger();
}

export function developmentLogger(): pino.Logger {
  return createConfiguredLogger({
    level: 'debug',
    console: true,
    pretty: true
  });
}

export function productionLogger(): pino.Logger {
  return createConfiguredLogger({
    level: 'info',
    console: false,
    file: './logs/production.log',
    pretty: false
  });
}

// Para NestJS
export class NestLogger {
  private logger: pino.Logger;

  constructor(config: LoggerConfig = {}) {
    this.logger = appLogger(config);
  }

  log(message: string, context?: string) {
    this.logger.info({ context }, message);
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error({ context, trace }, message);
  }

  warn(message: string, context?: string) {
    this.logger.warn({ context }, message);
  }

  debug(message: string, context?: string) {
    this.logger.debug({ context }, message);
  }

  verbose(message: string, context?: string) {
    this.logger.trace({ context }, message);
  }
}

// Export default simple
const logger = appLogger();
export default logger;