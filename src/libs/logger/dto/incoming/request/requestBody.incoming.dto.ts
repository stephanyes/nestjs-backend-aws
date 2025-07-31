import { IncomingMessage } from 'http';

export default class RequestBodyIncomingDto {
  http_request_body: any;
  constructor({ body }: IncomingMessage) {
    this.http_request_body = body;
  }
}
