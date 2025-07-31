import { LogLevel } from "@nestjs/common";
import { LogLevelStreamEntry } from "./types";

export const LOG_LEVELS: Record<LogLevel, number> = {
  verbose: 10,
  debug: 20,
  log: 30,
  warn: 40,
  error: 50,
  fatal: 60
};

export function getMinLevel(streams: LogLevelStreamEntry[]): LogLevel {
  if (streams.length === 0) return 'log';
  
  const minLevel = Math.min(...streams.map(s => LOG_LEVELS[s.level]));
  return Object.entries(LOG_LEVELS).find(
    ([, value]) => value === minLevel
  )?.[0] as LogLevel || 'log';
}