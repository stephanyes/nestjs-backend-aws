import { IncomingMessage, ServerResponse } from 'http';
import { LoggingObject } from '../../../interfaces/logger.interfaces';
import {
  isOutgoingRequest,
  isOutgoingResponse,
} from '../../../utils/outgoing.utils';
import OutgoingPropertiesResponseDto from '../../../dto/outgoing/response';
import IncomingPropertiesResponseDto from '../../../dto/incoming/response';
import OutgoingPropertiesCommonDto from '../../../dto/outgoing/common';
import IncomingPropertiesCommonDto from '../../../dto/incoming/common';
import CommonPropertiesDto from '../../../dto/common';

const customSuccessObject = (
  request: IncomingMessage,
  response: ServerResponse,
  logObj: LoggingObject,
) => {
  const responseSelected = isOutgoingResponse(response)
    ? new OutgoingPropertiesResponseDto(response)
    : new IncomingPropertiesResponseDto(response, logObj);
  const commonInOut = isOutgoingRequest(request)
    ? new OutgoingPropertiesCommonDto(request)
    : new IncomingPropertiesCommonDto(request);
  return {
    ...new CommonPropertiesDto(),
    ...commonInOut,
    ...responseSelected,
  };
};

export { customSuccessObject };
