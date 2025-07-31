import { Request, Response } from 'express';

export type MetaData = {
  url: URL['origin'];
  queryParams: Record<string, string>;
  method: Request['method'];
  status: Response['statusCode'];
};
export interface ErrorDetail {
  status: number;
  code: string;
  message: string;
  path?: string;
}
export interface ExtendedErrorResponse {
  meta: any;
  data: null;
  errors: ErrorDetail[];
}
export interface ErrorRespond {
  request: Request;
  response: Response;
  status: number;
  code: string;
  message: string;
}
