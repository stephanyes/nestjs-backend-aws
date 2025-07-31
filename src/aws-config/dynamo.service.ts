import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DynamoService implements OnModuleInit {
  private documentClient: DocumentClient;
  private dynamodb: AWS.DynamoDB;
  private tableName: string;
  private readonly logger = new Logger(DynamoService.name);

  constructor(private readonly configService: ConfigService) {
    const { table, endpoint, region } = this.configService.get('config.dynamo');
    this.tableName = table;

    const config: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {
      region,
    };

    if (endpoint) config.endpoint = endpoint;

    this.documentClient = new AWS.DynamoDB.DocumentClient(config);
    this.dynamodb = new AWS.DynamoDB({ region, endpoint });
  }

  onModuleInit() {
    this.ensureTableExists();
  }

  getClient(): DocumentClient {
    return this.documentClient;
  }

  getTableName(): string {
    return this.tableName;
  }

  async ensureTableExists() {
    try {
      await this.dynamodb.describeTable({ TableName: this.tableName }).promise();
      this.logger.log(`La tabla ${this.tableName} ya existe`);
    } catch (err) {
      if (err.code === 'ResourceNotFoundException') {
        this.logger.warn(`La tabla ${this.tableName} no existe. Creando...`);
        await this.createTable();
      } else {
        this.logger.error(`Error al verificar la tabla: ${err.message}`);
      }
    }
  }

  private async createTable() {
    const params: AWS.DynamoDB.CreateTableInput = {
      TableName: this.tableName,
      AttributeDefinitions: [
        { AttributeName: 'bookId', AttributeType: 'S' },
        { AttributeName: 'author', AttributeType: 'S' },
        { AttributeName: 'publicationYear', AttributeType: 'N' },
      ],
      KeySchema: [{ AttributeName: 'bookId', KeyType: 'HASH' }],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'AuthorYearIndex',
          KeySchema: [
            { AttributeName: 'author', KeyType: 'HASH' },
            { AttributeName: 'publicationYear', KeyType: 'RANGE' },
          ],
          Projection: {
            ProjectionType: 'INCLUDE',
            NonKeyAttributes: ['title'],
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
          },
        },
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5,
      },
    };

    try {
      await this.dynamodb.createTable(params).promise();
      this.logger.log(`Tabla ${this.tableName} creada correctamente.`);
    } catch (error) {
      this.logger.error(`Error al crear la tabla: ${error.message}`);
    }
  }
}
