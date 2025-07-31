export default class ResponseTimeIncomingDto {
  http_duration: string;
  constructor(responseTime?: number) {
    this.http_duration = responseTime?.toString() ?? '-';
  }
}
