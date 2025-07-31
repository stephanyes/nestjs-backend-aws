import { ServerResponse } from 'http';

export default class ResponseStatusIOutgoingDto {
  outgoing_http_response_status_code: string;
  outgoing_http_response_status_phrase: string;
  constructor({ statusCode, statusMessage }: ServerResponse) {
    this.outgoing_http_response_status_code = statusCode?.toString() ?? '-';
    this.outgoing_http_response_status_phrase = statusMessage ?? '-';
  }
}
