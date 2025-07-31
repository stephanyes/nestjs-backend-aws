import { IncomingMessage, ServerResponse } from 'http';
import { customLogLevelType } from '../../../constants/logger.constants';

const customLogLevel = (
  request: IncomingMessage,
  response: ServerResponse,
  error: Error | undefined,
): customLogLevelType => {
  if (error) {
    return 'error';
  }
  if (response.statusCode >= 400) {
    return 'error';
  }
  return 'info';
};
export { customLogLevel };
