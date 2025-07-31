import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto, UpdateBookDto } from './dto/book.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()
  async create(@Body() createBookDto: CreateBookDto) {
    return await this.bookService.create(createBookDto);
  }

  @Get()
  async findAll() {
    return await this.bookService.findAll();
  }

  @Get(':bookId')
  async findOne(@Param('bookId') bookId: string) {
    return await this.bookService.findOne(bookId);
  }

  @Get('logs/:bookId')
  async getLogsForBook(
    @Param('bookId') bookId: string,
    @Query() pagination: PaginationQueryDto,
  ) {
    return await this.bookService.getLogsForBook(bookId, pagination);
  }

  @Get('author/:author/year/:year')
  async findByAuthorAndYear(
    @Param('author') author: string,
    @Param('year') year: number,
  ) {
    return await this.bookService.findByAuthorAndYear(author, year);
  }

  @Put(':bookId')
  async update(
    @Param('bookId') bookId: string,
    @Body() updateBookDto: UpdateBookDto,
  ) {
    return await this.bookService.update(bookId, updateBookDto);
  }

  @Delete(':bookId')
  async remove(@Param('bookId') bookId: string) {
    return await this.bookService.remove(bookId);
  }
}