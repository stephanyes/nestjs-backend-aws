import ExceptionErrorErrorDto from './exceptionErrorErrorDto';
import { AxiosError } from 'axios';

class ErrorPropertiesDto implements ExceptionErrorErrorDto {
  error_code: string;
  error_detail: string;
  stack_trace: string;
  constructor(error: AxiosError | Error) {
    Object.assign(this, new ExceptionErrorErrorDto(error));
  }
}
export default ErrorPropertiesDto;
