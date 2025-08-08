import { Module, Global } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { RedisModule } from '../redis/redis.module';
import { BookEventPublisher } from './publishers/book-event.publisher';

@Global()
@Module({
  imports: [
    EventEmitterModule.forRoot({
      // Configuración del event emitter interno de NestJS
      wildcard: false,
      delimiter: '.',
      newListener: false,
      removeListener: false,
      maxListeners: 10,
      verboseMemoryLeak: true,
      ignoreErrors: false,
    }),
    RedisModule,
  ],
  providers: [BookEventPublisher],
  exports: [BookEventPublisher, EventEmitterModule],
})
export class EventsModule {}