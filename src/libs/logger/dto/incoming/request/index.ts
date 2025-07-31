import RequestBodyIncomingDto from './requestBody.incoming.dto';
import RequestHeadersIncomingDto from './requestHeaders.incoming.dto';
import { IncomingMessage } from 'http';
import { LoggerType } from '../../../constants/logger.constants';

class IncomingPropertiesRequestDto
  implements RequestBodyIncomingDto, RequestHeadersIncomingDto
{
  log_type = LoggerType.REQUEST;
  http_request_header: any = '-';
  http_request_body: any = '-';
  constructor(request: IncomingMessage) {
    Object.assign(
      this,
      new RequestBodyIncomingDto(request),
      new RequestHeadersIncomingDto(request),
    );
  }
}

export default IncomingPropertiesRequestDto;
