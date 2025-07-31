import { ServerResponse } from 'http';

export default class ResponseHeadersOutgoingDto {
  outgoing_http_request_header: any;
  constructor(response: ServerResponse) {
    this.outgoing_http_request_header = response.getHeaders();
  }
}
