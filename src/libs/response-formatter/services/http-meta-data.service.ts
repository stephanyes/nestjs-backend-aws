import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { MetaData } from '../types/response.types';

@Injectable()
export class HttpMetaDataService {
  buildFullURLFromRequest(req: Request) {
    return `${req.protocol}://${req.headers.host}${req.url}`;
  }
  extractRequestParams(req: Request) {
    const url = new URL(this.buildFullURLFromRequest(req));
    return {
      url: `${url.origin}${url.pathname}`,
      queryParams: Object.fromEntries(url.searchParams.entries()),
      method: req.method,
    };
  }
  createMetaData(metaData: MetaData) {
    return {
      url: metaData.url,
      queryParams: metaData.queryParams,
      method: metaData.method,
      status: metaData.status,
    };
  }
}
