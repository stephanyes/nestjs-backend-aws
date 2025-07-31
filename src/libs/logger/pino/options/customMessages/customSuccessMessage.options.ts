import { IncomingMessage, ServerResponse } from 'http';
import { isOutgoingResponse } from '../../../utils/outgoing.utils';

const customSuccessMessage = (
  request: IncomingMessage,
  response: ServerResponse,
) => {
  return isOutgoingResponse(response)
    ? 'Outgoing Response message'
    : 'Incoming Response message';
};
export default customSuccessMessage;
