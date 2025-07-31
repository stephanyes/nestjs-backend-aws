import { BookOperation } from '../entities/book-log.entity';

export class CreateBookLogDto {
  bookId: string;
  title?: string;
  author?: string;
  operation: BookOperation;
}