import { pinoHttp } from 'pino-http';
import logger from './pino.logger';
import serializers from './options/serializers.options';
import {
  customErrorObject,
  customLogLevel,
  customReceivedObject,
  customSuccessObject,
} from './options/customObjects';
import {
  customErrorMessage,
  customReceivedMessage,
  customSuccessMessage,
} from './options/customMessages';
import formatters from './options/formatters.options';
import { LogKeyTranslations } from '../interfaces/logger.interfaces';

export function createPinoHttpLogger() {
  return pinoHttp({
    logger,
    serializers,
    customErrorObject,
    customSuccessObject,
    customReceivedObject,
    formatters,
    customReceivedMessage,
    customSuccessMessage,
    customErrorMessage,
    customLogLevel,
    messageKey: LogKeyTranslations.msg,
  });
}
