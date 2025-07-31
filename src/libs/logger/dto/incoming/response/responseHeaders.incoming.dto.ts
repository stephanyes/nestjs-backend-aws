import { ServerResponse } from 'http';

export default class ResponseHeadersIncomingDto {
  http_request_header: any;
  constructor(response: ServerResponse) {
    this.http_request_header = response.getHeaders();
  }
}
