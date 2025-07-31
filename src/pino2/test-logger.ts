// test-logger.ts
import { createLoggerSync } from './simple-logger'; // O el archivo que creaste

const logger = createLoggerSync({
  level: 'info',
  console: { colorize: true }
});

logger.info('✅ Logger funcionando');
logger.warn('⚠️ Test warning');
logger.error('❌ Test error');

console.log('Logger creado exitosamente');