import { IncomingMessage } from 'http';
import { parseIPUtils } from '../../../utils/parseIP.utils';
import * as requestIP from 'request-ip';
export default class RequestRemoteAddressIncomingDto {
  http_request_remote_address: string;
  constructor(request: IncomingMessage) {
    const clientIP = requestIP.getClientIp(request);
    this.http_request_remote_address = parseIPUtils(clientIP) ?? '-';
  }
}
