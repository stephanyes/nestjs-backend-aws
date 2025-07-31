import * as https from 'https';
import { HttpModuleOptions } from '../interfaces/http.interfaces';
export const HTTP_MODULE_OPTIONS = 'HTTP_MODULE_OPTIONS';
export const AXIOS_INSTANCE = 'AXIOS_INSTANCE';
export const HTTP_MODULE_ID = 'HTTP_MODULE_ID';
export const selectedHeaders = ['Authorization', 'authorization'];

export const headers = {
  'Content-Type': 'application/json',
};

export const httpsAgent = new https.Agent({
  rejectUnauthorized: true,
  requestCert: true,
  // ca, cert, key opcionales
});

export const defaultAxiosConfigInstance: HttpModuleOptions = {
  headers,
  httpsAgent,
};

export enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  OPTIONS = 'OPTIONS',
  HEAD = 'HEAD',
  ALL = 'ALL',
}
