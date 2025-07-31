import { IncomingMessage } from 'http';

export default class RequestMethodIncomingDto {
  http_request_method: string;
  constructor({ method }: IncomingMessage) {
    this.http_request_method = method?.toUpperCase() ?? '-';
  }
}
