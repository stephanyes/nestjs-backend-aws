import { BookLog } from '../entities/book-log.entity';

export class BookWithLogsDto {
  bookId: string;
  title: string;
  author: string;
  publicationYear: number;
  views?: number;
  logs: BookLog[];
}
