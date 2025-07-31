import { IncomingMessage } from 'http';

export default class RequestHeadersIncomingDto {
  http_request_header: any;
  constructor({ headers }: IncomingMessage) {
    this.http_request_header = headers;
  }
}
