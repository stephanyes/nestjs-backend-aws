import { IncomingMessage } from 'http';
import { isOutgoingRequest } from '../../../utils/outgoing.utils';

const customReceivedMessage = (request: IncomingMessage) => {
  return isOutgoingRequest(request)
    ? 'Outgoing request message'
    : 'Incoming request message';
};
export default customReceivedMessage;
