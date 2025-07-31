import { pino, DestinationStream } from 'pino';
import { createWriteStream } from 'fs';
import { mkdir } from 'fs/promises';
import { dirname } from 'path';
import { LogLevel, LogLevelStreamEntry } from './types';

export function buildConsoleStream(level: LogLevel = 'info', colorize: boolean = true): LogLevelStreamEntry {
  return {
    level,
    stream: pino.destination({
      dest: 1, // stdout
      sync: false
    })
  };
}

export function buildPrettyConsoleStream(level: LogLevel = 'info', colorize: boolean = true): LogLevelStreamEntry {
  const transport = pino.transport({
    target: 'pino-pretty',
    options: {
      colorize,
      translateTime: 'SYS:standard',
      ignore: 'pid,hostname',
      sync: false
    }
  });

  return {
    level,
    stream: transport
  };
}

export async function buildFileStream(level: LogLevel = 'info', filePath: string = './logs/app.log'): Promise<LogLevelStreamEntry> {
  // Crear directorio si no existe
  const dir = dirname(filePath);
  try {
    await mkdir(dir, { recursive: true });
  } catch (error) {
    // Silent fail si ya existe
  }

  return {
    level,
    stream: pino.destination({
      dest: filePath,
      sync: false,
      mkdir: true
    })
  };
}

export function buildRollingFileStream(level: LogLevel = 'info', filePath: string = './logs/app.log'): LogLevelStreamEntry {
  const dir = dirname(filePath);
  mkdir(dir, { recursive: true }).catch(() => {});

  const transport = pino.transport({
    target: 'pino-roll',
    options: {
      file: filePath,
      frequency: 'daily',
      size: '10m',
      sync: false
    }
  });

  return {
    level,
    stream: transport
  };
}