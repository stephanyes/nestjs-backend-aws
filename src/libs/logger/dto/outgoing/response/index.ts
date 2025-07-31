import { ServerResponse } from 'http';
import ResponseBodyOutgoingDto from './responseBody.outgoing.dto';
import ResponseHeadersOutgoingDto from './responseHeaders.outgoing.dto';
import ResponseStatusIOutgoingDto from './responseStatus.outgoing.dto';
import ResponseTimeOutgoingDto from './responseTime.outgoing.dto';
import { LoggerType } from '../../../constants/logger.constants';

class OutgoingPropertiesResponseDto
  implements
    ResponseBodyOutgoingDto,
    ResponseHeadersOutgoingDto,
    ResponseStatusIOutgoingDto,
    ResponseTimeOutgoingDto
{
  log_type = LoggerType.OUTGOING_RESPONSE;
  outgoing_http_duration: string;
  outgoing_http_response_status_phrase: string;
  outgoing_http_response_status_code: string;
  outgoing_http_request_body: any;
  outgoing_http_request_header: any;
  constructor(response: ServerResponse) {
    Object.assign(
      this,
      new ResponseBodyOutgoingDto(response),
      new ResponseHeadersOutgoingDto(response),
      new ResponseStatusIOutgoingDto(response),
      new ResponseTimeOutgoingDto(response?.responseTime),
    );
  }
}
export default OutgoingPropertiesResponseDto;
