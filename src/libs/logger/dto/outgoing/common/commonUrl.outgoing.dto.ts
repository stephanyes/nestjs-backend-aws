import { UrlTransformUtils } from '../../../utils/urlTransform.utils';
import { IncomingMessage } from 'http';

export default class CommonUrlOutgoingDto {
  outgoing_http_request_path: string;
  outgoing_http_request_query_string: string;
  outgoing_http_request_address: string;
  constructor(request: IncomingMessage) {
    const { searchParams, origin, pathname } =
      UrlTransformUtils.fromRequest(request) ?? {};
    this.outgoing_http_request_path = pathname;
    this.outgoing_http_request_query_string = searchParams?.toString();
    if (origin && pathname) {
      this.outgoing_http_request_address = `${origin}${pathname}`;
    } else {
      this.outgoing_http_request_address = '-';
    }
  }
}
