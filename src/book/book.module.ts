import { Module } from '@nestjs/common';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookLog } from './entities/book-log.entity';
import { Book } from './entities/book.entity';
import { BookSyncCronService } from './book-cron.service';
import { EventsModule } from 'src/events/events.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Book, BookLog]),
    EventsModule
  ],
  controllers: [BookController],
  providers: [
    BookService,
    BookSyncCronService
  ],
})
export class BookModule {}
