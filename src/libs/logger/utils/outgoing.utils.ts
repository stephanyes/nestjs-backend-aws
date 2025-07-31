import { IncomingMessage, ServerResponse } from 'http';
import { directions } from '../interfaces/logger.interfaces';

export function isOutgoingRequest(request: IncomingMessage) {
  return request.dir === directions.OUTGOING;
}
export function isOutgoingResponse(response: ServerResponse) {
  return response.dir === directions.OUTGOING;
}

export function isOutgoing(obj: IncomingMessage | ServerResponse) {
  if (obj instanceof IncomingMessage) {
    return isOutgoingRequest(obj);
  }
  return isOutgoingResponse(obj);
}
