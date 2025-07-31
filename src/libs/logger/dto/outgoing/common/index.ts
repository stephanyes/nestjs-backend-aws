import { IncomingMessage } from 'http';
import RequestMethodOutgoingDto from './requestMethod.outgoing.dto';
import RequestRemoteAddressOutgoingDto from './requestRemoteAddress.outgoing.dto';
import CommonUrlOutgoingDto from './commonUrl.outgoing.dto';

class OutgoingPropertiesCommonDto
  implements
    RequestMethodOutgoingDto,
    RequestRemoteAddressOutgoingDto,
    CommonUrlOutgoingDto
{
  outgoing_http_request_path: string;
  outgoing_http_request_address: string;
  outgoing_http_request_remote_address: string;
  outgoing_http_request_method: string;
  outgoing_http_request_query_string: string;

  constructor(request: IncomingMessage) {
    Object.assign(
      this,
      new RequestRemoteAddressOutgoingDto(request),
      new RequestMethodOutgoingDto(request),
      new CommonUrlOutgoingDto(request),
    );
  }
}
export default OutgoingPropertiesCommonDto;
