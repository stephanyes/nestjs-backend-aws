export default class ResponseTimeOutgoingDto {
  outgoing_http_duration: string;
  constructor(responseTime?: number) {
    this.outgoing_http_duration = responseTime?.toString() ?? '-';
  }
}
