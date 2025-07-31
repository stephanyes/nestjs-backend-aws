import { ServerResponse } from 'http';

export default class ResponseStatusIncomingDto {
  http_response_status_code: string;
  http_response_status_phrase: string;
  constructor({ statusCode, statusMessage }: ServerResponse) {
    this.http_response_status_code = statusCode?.toString() ?? '-';
    this.http_response_status_phrase = statusMessage ?? '-';
  }
}
