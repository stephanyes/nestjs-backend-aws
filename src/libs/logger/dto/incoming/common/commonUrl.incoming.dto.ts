import { UrlTransformUtils } from '../../../utils/urlTransform.utils';
import { IncomingMessage } from 'http';

export default class CommonUrlIncomingDto {
  http_request_path: string;
  http_request_query_string: string;
  http_request_address: string;
  constructor(request: IncomingMessage) {
    const { searchParams, origin, pathname } =
      UrlTransformUtils.fromRequest(request) ?? {};
    this.http_request_path = pathname;
    this.http_request_query_string = searchParams?.toString();
    if (origin && pathname) {
      this.http_request_address = `${origin}${pathname}`;
    } else {
      this.http_request_address = '-';
    }
  }
}
