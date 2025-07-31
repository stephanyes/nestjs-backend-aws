import pino from 'pino';
import { version, name } from '../../logger.module';
import logger from '../../pino/pino.logger';
export default class LibraryInfoDto {
  logger_version = version;
  logger_name = name;
  logger_lib = `${pino.name} v${pino.version}`;
  log_level = logger.level?.toUpperCase();
}
