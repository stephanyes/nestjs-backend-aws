export const TYPE_ORM_MODULE_OPTIONS = 'TYPE_ORM_MODULE_OPTIONS';
export interface TypeOrmConfig {
  type: 'postgres';
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  synchronize: boolean;
  logging: boolean;
  autoLoadEntities: boolean;
  extra?: {
    trustServerCertificate?: boolean;
  };
}
