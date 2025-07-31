import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { config } from './config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ResponseParser } from './libs/response-parser/interceptors/response-parser.interceptor';
import { ResponseFormatterService } from './libs/response-formatter/services/response-formatter.service';
import { GenericExeptionFilters } from './libs/filters/filters/generic.filters';
import { HttpExeptionsFilter } from './libs/filters/filters/http.filters';
import { LoggerServices } from './libs/logger/services/logger.services';

async function bootstrap() {
  const { server, swagger, project } = config();
  const logger = new LoggerServices();
  const app = await NestFactory.create(AppModule, {
    logger,
  });
  app.useGlobalInterceptors(
    new ResponseParser(app.get(ResponseFormatterService)),
  );
  app.useGlobalFilters(
    new GenericExeptionFilters(app.get(ResponseFormatterService)),
    new HttpExeptionsFilter(app.get(ResponseFormatterService)),
  );
  if (swagger.enabled) {
    const configSwagger = new DocumentBuilder()
      .setTitle(`${project.name}`)
      .setDescription(`Swagger - ${project.description}`)
      .setVersion(`${project.version}`)
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Introduce el token JWT: Bearer <token>',
        in: 'header',
      })
      .addSecurityRequirements('bearer')
      .build();
    const documentFactory = () =>
      SwaggerModule.createDocument(app, configSwagger);
    SwaggerModule.setup(`${swagger.path}`, app, documentFactory);
  }
  await app.listen(server.port ?? 3000, () => {
    logger.log(`server on http://localhost:${3000}/`);
  });
}

bootstrap();
