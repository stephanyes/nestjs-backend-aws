import { registerAs } from '@nestjs/config';
import * as PACKAGE_JSON from '../../package.json';
export default registerAs('config', () => {
  return {
    project: {
      name: PACKAGE_JSON.name,
      version: PACKAGE_JSON.version,
      description: PACKAGE_JSON.description,
    },
    server: {
      isProd: false,
      port: process.env.PORT,
    },
    swagger: {
      path: process.env.SWAGGER_PATH ?? '',
      enabled: process.env.SWAGGER_ENABLED?.toLowerCase() === 'true',
    },
    authentication: {
      secret: process.env.AUTHENTICATION_SECRET ?? 'secret',
      expire: process.env.JWT_EXPIRES_IN ?? '1h',
      ignoreExpiration: process.env.IGNORE_EXPIRATION?.toLowerCase() === 'true',
      google: {
        clientID: process.env.GOOGLE_CLIENT_ID ?? '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
        callbackURL: process.env.GOOGLE_CALLBACK_URL ?? '',
      },
    },
    dynamo: {
      table: process.env.DYNAMO_TABLE_NAME ?? 'books',
      endpoint: process.env.ENDPOINT_URL,
      region: process.env.REGION ?? 'us-east-1',
    },
    database: {
      typeorm: {
        type: 'postgres',
        host: process.env.TYPEORM_HOST,
        port: parseInt(process.env.TYPEORM_PORT ?? '', 10),
        username: process.env.TYPEORM_USERNAME,
        password: process.env.TYPEORM_PASSWORD,
        database: process.env.TYPEORM_DATABASE,
        synchronize: true, // sincronizar con los cambios en la db, en prod va false
        logging: false,
        autoLoadEntities: true, // para cargar las entidades que generamos en prod debe estar desactivado
        /* extra: {
            trustServerCertificate: true
        } */
      },
    },
    http: {
      timeout: parseInt(process.env.HTTP_TIMEOUT ?? '', 10),
    },
  };
});
