import ResponseBodyIncomingDto from './responseBody.incoming.dto';
import ResponseHeadersIncomingDto from './responseHeaders.incoming.dto';
import ResponseStatusIncomingDto from './responseStatus.incoming.dto';
import ResponseTimeIncomingDto from './responseTime.incoming.dto';
import { ServerResponse } from 'http';
import { LoggingObject } from '../../../interfaces/logger.interfaces';
import { LoggerType } from '../../../constants/logger.constants';

class IncomingPropertiesResponseDto
  implements
    ResponseBodyIncomingDto,
    ResponseHeadersIncomingDto,
    ResponseStatusIncomingDto,
    ResponseTimeIncomingDto
{
  log_type = LoggerType.RESPONSE;
  http_duration: string;
  http_response_status_phrase: string;
  http_response_status_code: string;
  http_request_body: any;
  http_request_header: any;
  constructor(response: ServerResponse, logObj?: LoggingObject) {
    Object.assign(
      this,
      new ResponseBodyIncomingDto(response),
      new ResponseHeadersIncomingDto(response),
      new ResponseStatusIncomingDto(response),
      new ResponseTimeIncomingDto(logObj?.responseTime),
    );
  }
}
export default IncomingPropertiesResponseDto;
