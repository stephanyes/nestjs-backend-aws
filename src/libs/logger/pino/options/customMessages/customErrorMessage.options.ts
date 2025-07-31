import { IncomingMessage } from 'http';
import { isOutgoingRequest } from '../../../utils/outgoing.utils';

const customErrorMessage = (request: IncomingMessage) => {
  return isOutgoingRequest(request)
    ? 'Outgoing Response error'
    : 'Incoming Response error';
};
export default customErrorMessage;
