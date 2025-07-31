import { Module } from '@nestjs/common';
import { ResponseFormatterService } from './services/response-formatter.service';
import { HttpMetaDataService } from './services/http-meta-data.service';

@Module({
  providers: [ResponseFormatterService, HttpMetaDataService],
  exports: [ResponseFormatterService, HttpMetaDataService],
})
export class ResponseFormatterModule {}
