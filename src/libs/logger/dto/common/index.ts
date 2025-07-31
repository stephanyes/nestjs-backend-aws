import LibraryInfoDto from './libraryInfo.dto';
import ApplicationDto from './application.dto';
import CommonTechnologyStackDto from './commonTechnologyStack.dto';

class CommonPropertiesDto
  implements LibraryInfoDto, ApplicationDto, CommonTechnologyStackDto
{
  application_name = '-';
  application_version = '-';
  technology_stack = '-';
  log_level = '-';
  logger_lib = '-';
  logger_name = '-';
  logger_version = '-';
  '@timestamp' = Date.now();
  constructor() {
    Object.assign(
      this,
      new LibraryInfoDto(),
      new ApplicationDto(),
      new CommonTechnologyStackDto(),
    );
  }
}
export default CommonPropertiesDto;
