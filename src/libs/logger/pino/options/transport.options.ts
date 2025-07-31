import { TransportSingleOptions } from 'pino';
import { LogKeyTranslations } from '../../interfaces/logger.interfaces';

// 🚀 DEVELOPMENT: Async transport para no bloquear Event Loop
const developmentTransport: TransportSingleOptions = {
  target: 'pino-pretty',
  options: {
    colorize: true,
    translateTime: true,
    messageKey: LogKeyTranslations.msg,
    levelKey: LogKeyTranslations.level,
    timestampKey: LogKeyTranslations.timestamp,
    // 🎯 CLAVE: Modo asíncrono
    sync: false,
    // 🎯 OPCIONAL: Reducir trabajo de formateo
    ignore: 'pid,hostname'
  },
};

// 🚀 PRODUCTION: Async file transport
const productionTransports: TransportSingleOptions = {
  target: 'pino/file',
  options: {
    destination: 1,
    mkdir: true,
    append: true,
    // 🎯 CLAVE: Modo asíncrono
    sync: false
  },
};

// 🧪 PERFORMANCE: Transport optimizado para load testing
const performanceTransport: TransportSingleOptions = {
  target: 'pino/file',
  options: {
    destination: './logs/app.log',
    mkdir: true,
    append: true,
    sync: false,  // ← Async
    // Buffer writes para mejor performance
    bufferSize: 4096
  },
};

// 🎯 Función para seleccionar transport
function getSelectedTransport() {
  // Si estamos haciendo load testing (detectar via env o args)
  if (process.env.LOAD_TESTING === 'true' || 
      process.argv.includes('--load-testing') ||
      process.env.NODE_ENV === 'test') {
    return performanceTransport;
  }
  
  // Modo normal
  return process.env.NODE_ENV === 'production'
    ? productionTransports
    : developmentTransport;
}

// 🎯 Export default como función ejecutada
export default getSelectedTransport();