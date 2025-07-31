import { ServerResponse } from 'http';

export default class ResponseBodyIncomingDto {
  http_request_body: any;
  constructor({ body }: ServerResponse) {
    this.http_request_body = body;
  }
}
