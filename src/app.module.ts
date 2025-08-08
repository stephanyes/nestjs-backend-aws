import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { config, redis } from './config';

import { DynamoModule } from './aws-config/dynamo.module';
import { BookModule } from './book/book.module';
import { ResponseFormatterModule } from './libs/response-formatter/response-formatter.module';
import { TypeormClientModule } from './libs/typeorm/typeorm.module';
import { HttpModule } from './libs/http/http.module';
import { LoggerModule } from './libs/logger/logger.module';
import { RedisModule } from './redis/redis.module';
import { EventsModule } from './events/events.module';
import { CacheModule } from './cache/cache.module';


@Module({
  imports: [
    ConfigModule.forRoot({
      ignoreEnvFile: false,
      load: [
        config,
        redis
      ],
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    RedisModule,
    EventsModule,
    CacheModule,
    DynamoModule,
    BookModule,
    ResponseFormatterModule,
    TypeormClientModule,
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        timeout: configService.get<number>('config.http.timeout', 5000),
        // otras opciones Axios y retry aquí
      }),
      inject: [ConfigService],
    }),
    LoggerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
