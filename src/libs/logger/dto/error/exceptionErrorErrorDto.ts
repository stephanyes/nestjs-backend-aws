import { AxiosError } from 'axios';

export default class ExceptionErrorErrorDto {
  stack_trace: string;
  error_detail: string;
  error_code: string;
  constructor(error: AxiosError | Error) {
    if (error instanceof AxiosError) {
      this.stack_trace = error.cause?.stack ?? error.stack ?? '-';
      this.error_detail = error.cause?.message ?? error.message ?? '-';
      this.error_code = error.code ?? '-';
      return;
    }
    this.stack_trace = error.stack ?? '-';
    this.error_detail = error.message ?? '-';
  }
}
