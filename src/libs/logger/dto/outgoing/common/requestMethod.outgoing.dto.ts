import { IncomingMessage } from 'http';

export default class RequestMethodOutgoingDto {
  outgoing_http_request_method: string;
  constructor({ method }: IncomingMessage) {
    this.outgoing_http_request_method = method?.toUpperCase() ?? '-';
  }
}
