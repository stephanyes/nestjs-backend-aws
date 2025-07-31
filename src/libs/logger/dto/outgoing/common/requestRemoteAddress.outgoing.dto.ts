import { IncomingMessage } from 'http';
import { parseIPUtils } from '../../../utils/parseIP.utils';
import * as requestIP from 'request-ip';
export default class RequestRemoteAddressOutgoingDto {
  outgoing_http_request_remote_address: string;
  constructor(request: IncomingMessage) {
    const clientIP = requestIP.getClientIp(request);
    this.outgoing_http_request_remote_address = parseIPUtils(clientIP) ?? '-';
  }
}
