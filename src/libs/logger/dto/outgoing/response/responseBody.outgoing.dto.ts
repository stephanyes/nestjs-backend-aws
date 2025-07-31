import { ServerResponse } from 'http';

export default class ResponseBodyOutgoingDto {
  outgoing_http_request_body: any;
  constructor({ body }: ServerResponse) {
    this.outgoing_http_request_body = body;
  }
}
