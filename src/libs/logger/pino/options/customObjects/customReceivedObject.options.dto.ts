import { IncomingMessage } from 'http';
import { isOutgoingRequest } from '../../../utils/outgoing.utils';
import OutgoingPropertiesRequestDto from '../../../dto/outgoing/request';
import IncomingPropertiesRequestDto from '../../../dto/incoming/request';
import OutgoingPropertiesCommonDto from '../../../dto/outgoing/common';
import IncomingPropertiesCommonDto from '../../../dto/incoming/common';
import CommonPropertiesDto from '../../../dto/common';

const customReceivedObject = (request: IncomingMessage) => {
  const requestSelected = isOutgoingRequest(request)
    ? new OutgoingPropertiesRequestDto(request)
    : new IncomingPropertiesRequestDto(request);
  const commonInOut = isOutgoingRequest(request)
    ? new OutgoingPropertiesCommonDto(request)
    : new IncomingPropertiesCommonDto(request);
  return {
    ...new CommonPropertiesDto(),
    ...commonInOut,
    ...requestSelected,
  };
};
export { customReceivedObject };
