import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { BookService } from './book.service';
import { PINO_LOGGER } from 'src/libs/logger/constants/logger.constants';

@Injectable()
export class BookSyncCronService {
  constructor(
    @Inject(PINO_LOGGER) private readonly logger: Logger,
    private readonly bookService: BookService
) {}

  @Cron(CronExpression.EVERY_10_HOURS)
  async syncBooksBidirectionally() {
    const postgresToDynamo = await this.bookService.syncAllFromPostgresToDynamo();
    this.logger.warn(`[CRON] Postgres → DynamoDB | Synced: ${postgresToDynamo.synced}, Skipped: ${postgresToDynamo.skipped}`);

    const dynamoToPostgres = await this.bookService.syncAllFromDynamoToPostgres();
    this.logger.warn(`[CRON] DynamoDB → Postgres | Synced: ${dynamoToPostgres.synced}, Skipped: ${dynamoToPostgres.skipped}`);
  }
}