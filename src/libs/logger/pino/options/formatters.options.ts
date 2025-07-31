import { Bindings, LoggerOptions } from 'pino';
import { LogKeyTranslations } from '../../interfaces/logger.interfaces';

const formatters: LoggerOptions['formatters'] = {
  bindings: (bindings: Bindings) => ({
    ...bindings,
    [LogKeyTranslations.level]: bindings.level,
    node_version: process.env.npm_config_user_agent ?? '-',
    build_version: process.env.npm_package_version ?? '-',
  }),
};
export default formatters;
