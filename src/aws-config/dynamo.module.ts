// src/dynamo/dynamo.module.ts
import { Module, Global } from '@nestjs/common';
import { DynamoService } from './dynamo.service';

@Global()
@Module({
  providers: [DynamoService],
  exports: [DynamoService],
})
export class DynamoModule {}
