import { LoggerOptions } from 'pino';
import transport from './transport.options';
import { LogKeyTranslations } from '../../interfaces/logger.interfaces';
export const pinoOptions: LoggerOptions = {
  transport,
  messageKey: LogKeyTranslations.msg,
  /*timestamp() {
    return `${LogKeyTranslations.timestamp}: ${Date.now()}`;
  },*/
  formatters: {
    level(label: string, number: number) {
      if (process.env.LEVEL_FORMAT_STRING?.toLocaleLowerCase() === 'false') {
        return { [LogKeyTranslations.level]: number };
      }
      return { [LogKeyTranslations.level]: label };
    },
  },
};
