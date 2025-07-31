import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuid } from 'uuid';
import { Repository } from 'typeorm';
import { Logger } from 'pino';

import { DynamoService } from 'src/aws-config/dynamo.service';
import { PINO_LOGGER } from 'src/libs/logger/constants/logger.constants';

import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookLog, BookOperation } from './entities/book-log.entity';
import { BookWithLogsDto } from './dto/book-log.dto';
import { CreateBookLogDto } from './dto/create-book-log.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { Book } from './entities/book.entity';



@Injectable()
export class BookService {
  private readonly client: AWS.DynamoDB.DocumentClient;
  private readonly tableName: string;

  constructor(
    @Inject(PINO_LOGGER) private readonly logger: Logger,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookLog)
    private readonly bookLogRepository: Repository<BookLog>, 
    private readonly dynamoService: DynamoService,
  ) {
    this.client = this.dynamoService.getClient();
    this.tableName = this.dynamoService.getTableName();
  }

  async create(createBookDto: CreateBookDto) {
    const bookId = uuid();

    const params = {
      TableName: this.tableName,
      Item: {
        bookId,
        title: createBookDto.title,
        author: createBookDto.author,
        publicationYear: createBookDto.publicationYear,
      },
    };

    try {
      await this.client.put(params).promise();

      await this.bookRepository.save({
        bookId,
        title: createBookDto.title,
        author: createBookDto.author,
        publicationYear: createBookDto.publicationYear,
        views: 0,
      });

      await this.logOperation({
        bookId,
        operation: BookOperation.CREATE,
        author: createBookDto.author,
        title: createBookDto.title,
      });

      return { success: true, bookId };
    } catch (error) {
      this.logger.error('Error inserting book:', error);
      throw new Error('Could not create book');
    }
  }

  async findAll() {
    try {
      const results = await this.client.scan({ TableName: this.tableName }).promise();

      // Log individual por cada libro leído
      for (const item of results.Items ?? []) {
        await this.logOperation({
          bookId: item.bookId,
          operation: BookOperation.READ,
          author: item.author,
          title: item.title,
        });
      }

      return results.Items;
    } catch (error) {
      console.error('Error fetching all books:', error);
      throw new Error('Could not retrieve books');
    }
  }

  async findOne(bookId: string) {
    try {
      const result = await this.client
        .get({
          TableName: this.tableName,
          Key: { bookId },
        })
        .promise();

      if (!result.Item) {
        throw new Error(`Book with ID ${bookId} not found`);
      }

      await this.logOperation({
        bookId,
        operation: BookOperation.READ,
        author: result.Item.author,
        title: result.Item.title,
      });

      const logs = await this.bookLogRepository.find({
        where: { bookId },
        order: { timestamp: 'DESC' },
      });

      return {
        ...result.Item,
        logs,
      };
    } catch (error) {
      this.logger.error(`Error fetching book with ID ${bookId}`, error);
      throw new Error('Could not retrieve book');
    }
  }

  async update(bookId: string, updateBookDto: UpdateBookDto) {
    try {
      const existing = await this.client.get({ TableName: this.tableName, Key: { bookId } }).promise();
      if (!existing.Item) {
        throw new NotFoundException(`Book with ID ${bookId} not found`);
      }
      const updated = await this.client.update({
        TableName: this.tableName,
        Key: { bookId },
        UpdateExpression:
          'set #title = :title, author = :author, publicationYear = :publicationYear, views = if_not_exists(views, :start_views)',
        ExpressionAttributeNames: {
          '#title': 'title',
        },
        ExpressionAttributeValues: {
          ':title': updateBookDto.title,
          ':author': updateBookDto.author,
          ':publicationYear': updateBookDto.publicationYear,
          ':start_views': 0,
        },
        ReturnValues: 'ALL_NEW',
      }).promise();

      await this.bookRepository.save({
        bookId,
        title: updated.Attributes?.title,
        author: updated.Attributes?.author,
        publicationYear: updated.Attributes?.publicationYear,
        views: updated.Attributes?.views ?? 0,
      });

      await this.logOperation({
        bookId,
        operation: BookOperation.UPDATE,
        author: updated.Attributes?.author,
        title: updated.Attributes?.title,
      });

      return updated.Attributes;
    } catch (error) {
      console.error(`Error updating book with ID ${bookId}:`, error);
      throw new Error('Could not update book');
    }
  }

  async updateViewsCount(bookId: string) {
    try {
      const exists = await this.client.get({ TableName: this.tableName, Key: { bookId } }).promise();

      if (!exists.Item) {
        throw new NotFoundException(`Book with ID ${bookId} not found`);
      }

      const updated = await this.client.update({
        TableName: this.tableName,
        Key: { bookId },
        UpdateExpression: 'set views = if_not_exists(views, :start) + :increment',
        ExpressionAttributeValues: {
          ':start': 0,
          ':increment': 1,
        },
        ReturnValues: 'UPDATED_NEW',
      }).promise();

      const updatedViews = updated.Attributes?.views ?? 0;

      await this.bookRepository.save({
        bookId,
        title: exists.Item.title,
        author: exists.Item.author,
        publicationYear: exists.Item.publicationYear,
        views: updatedViews,
      });

      return { views: updatedViews };
    } catch (error) {
      console.error(`Error updating views count for book with ID ${bookId}:`, error);
      throw new Error('Could not update views count');
    }
  }

  async remove(bookId: string) {
    try {
      const existing = await this.client
        .get({ TableName: this.tableName, Key: { bookId } })
        .promise();

      await this.client
        .delete({
          TableName: this.tableName,
          Key: { bookId },
        })
        .promise();

      await this.bookRepository.delete({ bookId });

      await this.logOperation({
        bookId,
        operation: BookOperation.DELETE,
        author: existing.Item?.author,
        title: existing.Item?.title,
      });

      return { success: true };
    } catch (error) {
      console.error(`Error removing book with ID ${bookId}:`, error);
      throw new Error('Could not remove book');
    }
  }

  async batchWrite(createBookDtos: CreateBookDto[]) {
    const writeRequests = [];

    try {
      for (const dto of createBookDtos) {
        const bookId = uuid();

        // DynamoDB write
        writeRequests.push({
          PutRequest: {
            Item: {
              bookId,
              title: dto.title,
              author: dto.author,
              publicationYear: dto.publicationYear,
            },
          },
        });

        // PostgreSQL write
        await this.bookRepository.save({
          bookId,
          title: dto.title,
          author: dto.author,
          publicationYear: dto.publicationYear,
          views: 0,
        });

        // Logging
        await this.logOperation({
          bookId,
          title: dto.title,
          author: dto.author,
          operation: BookOperation.CREATE,
        });
      }

      const params = {
        RequestItems: {
          [this.tableName]: writeRequests,
        },
      };

      const result = await this.client.batchWrite(params).promise();
      if (result.UnprocessedItems && Object.keys(result.UnprocessedItems).length > 0) {
        console.warn('Some items were not processed:', result.UnprocessedItems);
      }

      return { success: true };
    } catch (error) {
      console.error('Error performing batch write:', error);
      throw new Error('Could not perform batch write');
    }
  }

  async batchRead(bookIds: string[]) {
    const keys = bookIds.map((bookId) => ({ bookId }));

    const params = {
      RequestItems: {
        [this.tableName]: {
          Keys: keys,
        },
      },
    };

    try {
      const result = await this.client.batchGet(params).promise();
      const items = result.Responses?.[this.tableName] ?? [];

      for (const item of items) {
        await this.logOperation({
          bookId: item.bookId,
          operation: BookOperation.READ,
          author: item.author,
          title: item.title,
        });
      }

      return items;
    } catch (error) {
      console.error('Error performing batch read:', error);
      throw new Error('Could not perform batch read');
    }
  }

  async findByAuthorAndYear(author: string, year: number) {
    const params = {
      TableName: this.tableName,
      IndexName: 'AuthorYearIndex',
      KeyConditionExpression: 'author = :author and publicationYear = :year',
      ExpressionAttributeValues: {
        ':author': author,
        ':year': year,
      },
      ProjectionExpression: 'title, bookId',
    };

    try {
      const result = await this.client.query(params).promise();

      for (const item of result.Items ?? []) {
        await this.logOperation({
          bookId: item.bookId,
          operation: BookOperation.READ,
          author: item.author,
          title: item.title,
        });
      }

      return result.Items;
    } catch (error) {
      console.error(`Error querying books by author "${author}" and year ${year}:`, error);
      throw new Error('Could not retrieve books by author and year');
    }
  }

  async getLogsForBook(bookId: string, pagination: PaginationQueryDto) {
    const book = await this.client
      .get({ TableName: this.tableName, Key: { bookId } })
      .promise();

    if (!book.Item) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    const { limit = 10, offset = 0 } = pagination;

    const logs = await this.bookLogRepository.find({
      where: { bookId },
      order: { timestamp: 'DESC' },
      skip: offset,
      take: limit,
    });

    return logs;
  }

  private async logOperation(dto: CreateBookLogDto): Promise<void> {
    try {
      const log = this.bookLogRepository.create(dto);
      await this.bookLogRepository.save(log);
      this.logger.debug(`Book operation logged: ${dto.operation} - ${dto.bookId}`);
    } catch (error) {
      this.logger.error(`Failed to log book operation: ${error.message}`);
    }
  }

  async syncAllFromPostgresToDynamo(): Promise<{ synced: number; skipped: number }> {
    const books = await this.bookRepository.find();
    let synced = 0;
    let skipped = 0;

    for (const book of books) {
      const dynamoResult = await this.client
        .get({ TableName: this.tableName, Key: { bookId: book.bookId } })
        .promise();

      const dynamoItem = dynamoResult.Item;

      const hasChanges =
        !dynamoItem ||
        dynamoItem.title !== book.title ||
        dynamoItem.author !== book.author ||
        dynamoItem.publicationYear !== book.publicationYear ||
        (dynamoItem.views ?? 0) !== (book.views ?? 0);

      if (hasChanges) {
        await this.client
          .put({
            TableName: this.tableName,
            Item: {
              bookId: book.bookId,
              title: book.title,
              author: book.author,
              publicationYear: book.publicationYear,
              views: book.views ?? 0,
            },
          })
          .promise();

        await this.logOperation({
          bookId: book.bookId,
          operation: BookOperation.SYNC,
          author: book.author,
          title: book.title,
        });

        synced++;
      } else {
        // Evitar duplicados de log: si ya existe un log, no registrar otro
        const hasAnyLog = await this.bookLogRepository.findOne({
          where: { bookId: book.bookId },
        });

        if (!hasAnyLog) {
          await this.logOperation({
            bookId: book.bookId,
            operation: BookOperation.SYNC,
            author: book.author,
            title: book.title,
          });
        }

        skipped++;
      }
    }

    this.logger.warn(`Postgres → DynamoDB: ${synced} updated, ${skipped} skipped`);
    return { synced, skipped };
  }



  async syncAllFromDynamoToPostgres(): Promise<{ synced: number; skipped: number }> {
    const result = await this.client.scan({ TableName: this.tableName }).promise();
    const dynamoItems = result.Items ?? [];

    let synced = 0;
    let skipped = 0;

    for (const item of dynamoItems) {
      const existing = await this.bookRepository.findOne({ where: { bookId: item.bookId } });

      const hasChanges =
        !existing ||
        existing.title !== item.title ||
        existing.author !== item.author ||
        existing.publicationYear !== item.publicationYear;

      if (hasChanges) {
        await this.bookRepository.save({
          bookId: item.bookId,
          title: item.title,
          author: item.author,
          publicationYear: item.publicationYear,
          views: item.views ?? 0,
        });
        synced++;
      } else {
        skipped++;
      }
    }

    this.logger.warn(`DynamoDB → Postgres: ${synced} updated, ${skipped} skipped`);
    return { synced, skipped };
  }
}
