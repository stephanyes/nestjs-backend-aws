import RequestMethodIncomingDto from './requestMethod.incoming.dto';
import RequestRemoteAddressIncomingDto from './requestRemoteAddress.incoming.dto';
import CommonUrlIncomingDto from './commonUrl.incoming.dto';
import { IncomingMessage } from 'http';

class IncomingPropertiesCommonDto
  implements
    RequestMethodIncomingDto,
    RequestRemoteAddressIncomingDto,
    CommonUrlIncomingDto
{
  http_request_path: string;
  http_request_address: string;
  http_request_remote_address: string;
  http_request_method: string;
  http_request_query_string: string;

  constructor(request: IncomingMessage) {
    Object.assign(
      this,
      new RequestRemoteAddressIncomingDto(request),
      new RequestMethodIncomingDto(request),
      new CommonUrlIncomingDto(request),
    );
  }
}
export default IncomingPropertiesCommonDto;
