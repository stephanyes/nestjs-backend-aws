import { ValidationError } from '@nestjs/common';

export interface ExceptionResponse {
  error?: string;
  message?: string | string[] | ValidationError[];
}

export interface handlerExeptionFormat {
  status: number;
  codeStatus: string;
  msg: string;
}

export interface Constraint {
  [type: string]: string;
}
