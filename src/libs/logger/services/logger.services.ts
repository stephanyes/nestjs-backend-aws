import { Injectable } from '@nestjs/common';
import { customMessageType, LoggerLevel } from '../constants/logger.constants';
import logger from '../pino/pino.logger';
import CustomPropertiesDto from '../dto/custom';

@Injectable()
export class LoggerServices {
  private logMessage(
    level: LoggerLevel,
    customMessage: customMessageType,
    context?: string,
  ) {
    const message = new CustomPropertiesDto(customMessage);
    context ? logger[level]({ context, ...message }) : logger[level](message);
  }
  public log(customMessage: customMessageType, context?: string) {
    return this.logMessage(LoggerLevel.INFO, customMessage, context);
  }
  public error(customMessage: customMessageType, context?: string) {
    return this.logMessage(LoggerLevel.ERROR, customMessage, context);
  }
  public warn(customMessage: customMessageType, context?: string) {
    return this.logMessage(LoggerLevel.WARN, customMessage, context);
  }
  public debug(customMessage: customMessageType, context?: string) {
    return this.logMessage(LoggerLevel.DEBUG, customMessage, context);
  }
  public verbose(customMessage: customMessageType, context?: string) {
    return this.logMessage(LoggerLevel.TRACE, customMessage, context);
  }
}
