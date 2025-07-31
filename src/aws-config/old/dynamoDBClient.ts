import * as AWS from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import 'dotenv/config';

const { ENDPOINT_URL, REGION, DYNAMO_TABLE_NAME } = process.env;

// Configurar el cliente de DynamoDB
export const dynamoDBClient = (): DocumentClient => {
  const config: AWS.DynamoDB.DocumentClient.DocumentClientOptions & AWS.DynamoDB.Types.ClientConfiguration = {
    region: REGION,
  };

  if (ENDPOINT_URL) {
    config.endpoint = ENDPOINT_URL;
  }

  return new AWS.DynamoDB.DocumentClient(config);
};

// Configurar el cliente de DynamoDB para la creación de tablas
const dynamoDB = new AWS.DynamoDB({
  region: REGION,
  endpoint: ENDPOINT_URL,
});

// Función para crear la tabla si no existe
export const ensureTableExists = async () => {
  const params: AWS.DynamoDB.DescribeTableInput = {
    TableName: DYNAMO_TABLE_NAME,
  };

  try {
    // Intentar describir la tabla
    await dynamoDB.describeTable(params).promise();
    console.log(`Table ${DYNAMO_TABLE_NAME} already exists.`);
  } catch (err) {
    // Si la tabla no existe, crearla
    if (err.code === 'ResourceNotFoundException') {
      console.log(`Table ${DYNAMO_TABLE_NAME} does not exist. Creating...`);

      const createTableParams: AWS.DynamoDB.CreateTableInput = {
        TableName: DYNAMO_TABLE_NAME,
        AttributeDefinitions: [
          { AttributeName: 'bookId', AttributeType: 'S' },
          { AttributeName: 'author', AttributeType: 'S' },
          { AttributeName: 'publicationYear', AttributeType: 'N' },
        ],
        KeySchema: [
          { AttributeName: 'bookId', KeyType: 'HASH' },
        ],
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
        await dynamoDB.createTable(createTableParams).promise();
        console.log(`Table ${DYNAMO_TABLE_NAME} created successfully.`);
      } catch (createErr) {
        console.error(`Failed to create table ${DYNAMO_TABLE_NAME}:`, createErr);
      }
    } else {
      console.error(`Failed to describe table ${DYNAMO_TABLE_NAME}:`, err);
    }
  }
};

// Llama a esta función al iniciar tu aplicación
ensureTableExists();
