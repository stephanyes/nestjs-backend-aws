import CommonTechnologyStackDto from '../common/commonTechnologyStack.dto';
import CustomMessageDto from './customMessage.dto';
import LibraryInfoDto from '../common/libraryInfo.dto';
import {
  customMessageType,
  LoggerType,
} from '../../constants/logger.constants';

class CustomPropertiesDto
  implements CommonTechnologyStackDto, CustomMessageDto, LibraryInfoDto
{
  log_type = LoggerType.CUSTOM;
  logger_name: string;
  logger_version: string;
  logger_lib: string;
  log_level: string;
  technology_stack: string;
  custom_message: customMessageType;
  constructor(message: customMessageType) {
    Object.assign(
      this,
      new CommonTechnologyStackDto(),
      new LibraryInfoDto(),
      new CustomMessageDto(message),
    );
  }
}
export default CustomPropertiesDto;
