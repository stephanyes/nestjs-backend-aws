import { IncomingMessage, ServerResponse } from 'http';
import {
  isOutgoingRequest,
  isOutgoingResponse,
} from '../../../utils/outgoing.utils';
import CommonPropertiesDto from '../../../dto/common';
import ErrorPropertiesDto from '../../../dto/error';
import OutgoingPropertiesResponseDto from '../../../dto/outgoing/response';
import OutgoingPropertiesCommonDto from '../../../dto/outgoing/common';
import IncomingPropertiesResponseDto from '../../../dto/incoming/response';
import IncomingPropertiesCommonDto from '../../../dto/incoming/common';
const customErrorObject = (
  request: IncomingMessage,
  response: ServerResponse,
  error: Error,
) => {
  const responseSelected = isOutgoingResponse(response)
    ? new OutgoingPropertiesResponseDto(response)
    : new IncomingPropertiesResponseDto(response);
  const commonInOut = isOutgoingRequest(request)
    ? new OutgoingPropertiesCommonDto(request)
    : new IncomingPropertiesCommonDto(request);
  return {
    ...new CommonPropertiesDto(),
    ...commonInOut,
    ...responseSelected,
    ...new ErrorPropertiesDto(error),
  };
};
export { customErrorObject };
