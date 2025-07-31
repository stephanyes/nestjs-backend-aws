import { HttpException, HttpStatus } from '@nestjs/common';
import {
  Constraint,
  ExceptionResponse,
  handlerExeptionFormat,
} from '../types/filters.types';
import { ValidationError } from '@nestjs/class-validator';

function formatCode(error: string) {
  return error.toUpperCase();
}

export function getCode(exResponse: ExceptionResponse): string {
  if (typeof exResponse === 'string') {
    return formatCode(exResponse);
  }
  if ('error' in exResponse && typeof exResponse.error === 'string') {
    return formatCode(exResponse.error);
  }
  return '';
}
export function findConstants(err: ValidationError): Constraint | undefined {
  let current = err;
  for (let i = 0; current?.children && current?.children.length > 0; i++) {
    current = current.children[0];
  }
  return current?.constraints;
}
export function parserErrorMessage(err: ValidationError): string {
  const messages: Constraint | undefined = findConstants(err);
  if (messages === undefined) {
    return 'invalid parameter';
  }
  return Object.values(messages).join(' -- ');
}

export function getErrorMessage(err: ExceptionResponse | string): string {
  if (typeof err === 'string') {
    return err;
  }
  if (typeof err?.message === 'string') {
    return err.message;
  }
  if (Array.isArray(err?.message)) {
    const error: ValidationError | string = err.message[0];
    if (typeof error === 'string') {
      return error;
    }
    const validationError: string = parserErrorMessage(error);
    if (validationError) {
      return validationError;
    }
  }
  if (typeof err === 'object') {
    return err?.error ?? 'Unknown Error';
  }
  return 'Internal Server Error';
}

/*export function handlerException(err: Error): handlerExceptionFormat {
  let status: number;
  let codeStatus: string;
  let msg: string;

  if (err instanceof HttpException) {
    status = err.getStatus();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    codeStatus = getCode(err.getResponse()['code'] ?? HttpStatus[status]);
    msg = getErrorMessage(err.getResponse());
  } else {
    msg = err.message;
    status = HttpStatus.INTERNAL_SERVER_ERROR;
    codeStatus = HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR];
  }
  return {
    status,
    codeStatus,
    msg,
  };
}*/

export function handleHttpException(
  exception: HttpException,
): handlerExeptionFormat {
  const status = exception.getStatus();
  const response = exception.getResponse();
  const codeStatus = getCode(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    exception.getResponse()['code'] ?? HttpStatus[status],
  );
  const msg = getErrorMessage(response);
  return {
    status,
    codeStatus,
    msg,
  };
}
export function handlerGenericException(
  exception: Error,
): handlerExeptionFormat {
  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    codeStatus: HttpStatus[HttpStatus.INTERNAL_SERVER_ERROR],
    msg: exception.message,
  };
}
