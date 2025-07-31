import { DynamicModule, Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EntityClassOrSchema } from '@nestjs/typeorm/dist/interfaces/entity-class-or-schema.type';
import {
  TYPE_ORM_MODULE_OPTIONS,
  TypeOrmConfig,
} from './constants/typeorm.constanst';
import { TypeOrmModule, TypeOrmModuleAsyncOptions } from '@nestjs/typeorm';
@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forRootAsync({
      useFactory: (options: TypeOrmModuleAsyncOptions) => options,
      inject: [TYPE_ORM_MODULE_OPTIONS],
    }),
  ],
  providers: [
    {
      provide: TYPE_ORM_MODULE_OPTIONS,
      useFactory: (configService: ConfigService) =>
        configService.get<TypeOrmConfig>('config.database.typeorm'),
      inject: [ConfigService],
    },
  ],
  exports: [TypeOrmModule, TYPE_ORM_MODULE_OPTIONS],
})
export class TypeormClientModule {
  static forFeature(features: EntityClassOrSchema[]): DynamicModule {
    return TypeOrmModule.forFeature(features);
  }
}
