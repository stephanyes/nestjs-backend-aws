import { DataSource } from 'typeorm';
import { BookLog } from '../book/entities/book-log.entity'
import * as dotenv from 'dotenv';

dotenv.config();

export default new DataSource({
  type: 'postgres',
  host: process.env.TYPEORM_HOST,
  port: parseInt(process.env.TYPEORM_PORT || '5432', 10),
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  synchronize: false, // importante: nunca en true en prod
  logging: false,
  entities: [BookLog], // Agregá más si tenés otras
  migrations: ['src/database/migrations/*.ts'], // ruta donde generás las migraciones
  migrationsTableName: 'migrations',
});
