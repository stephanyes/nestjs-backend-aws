import { IncomingMessage } from 'http';

export default class RequestHeadersOutgoingDto {
  outgoing_http_request_header: any;
  constructor({ headers }: IncomingMessage) {
    this.outgoing_http_request_header = headers;
  }
}
