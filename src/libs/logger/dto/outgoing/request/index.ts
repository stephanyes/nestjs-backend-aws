import { IncomingMessage } from 'http';
import RequestBodyOutgoingDto from './requestBody.outgoing.dto';
import RequestHeadersOutgoingDto from './requestHeaders.outgoing.dto';
import { LoggerType } from '../../../constants/logger.constants';

class OutgoingPropertiesRequestDto
  implements RequestBodyOutgoingDto, RequestHeadersOutgoingDto
{
  log_type = LoggerType.OUTGOING_REQUEST;
  outgoing_http_request_header: any = '-';
  outgoing_http_request_body: any = '-';
  constructor(request: IncomingMessage) {
    Object.assign(
      this,
      new RequestBodyOutgoingDto(request),
      new RequestHeadersOutgoingDto(request),
    );
  }
}

export default OutgoingPropertiesRequestDto;
