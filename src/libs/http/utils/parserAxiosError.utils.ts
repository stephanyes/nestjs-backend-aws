import { AxiosError } from 'axios';

export function parseAxiosError(error: unknown): string {
  if (!isAxiosError(error)) {
    return error instanceof Error ? error.message : 'Unknown error';
  }

  const data = error.response?.data;

  if (typeof data === 'string') {
    return data;
  }

  if (typeof data === 'object' && data !== null && 'message' in data) {
    const message = (data as Record<string, unknown>).message;
    return typeof message === 'string' ? message : error.message;
  }

  return error.message || 'Request failed';
}

function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}
