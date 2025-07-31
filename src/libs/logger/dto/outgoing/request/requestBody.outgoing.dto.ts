import { IncomingMessage } from 'http';

export default class RequestBodyOutgoingDto {
  outgoing_http_request_body: any;
  constructor({ body }: IncomingMessage) {
    this.outgoing_http_request_body = body;
  }
}
