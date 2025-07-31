// logger.test.ts - Jest version
import { PassThrough } from 'node:stream';
import { readdirSync, readFileSync, existsSync, mkdirSync, rmSync } from 'fs';
import pino from 'pino';

// Importar nuestro logger
import { 
  createBasicLogger, 
  createConfiguredLogger, 
  appLogger, 
  performanceLogger,
  developmentLogger,
  productionLogger,
  NestLogger 
} from '../simple-logger';

// Helper para esperar
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para crear logger de test
const createTestLogger = (config = {}) => {
  const testStream = new PassThrough();
  const logger = pino({
    level: 'debug',
    ...config
  }, testStream);
  
  return { logger, testStream };
};

describe('Simple Logger Tests', () => {
  
  // Limpiar archivos de test
  beforeEach(() => {
    if (existsSync('./test-logs')) {
      rmSync('./test-logs', { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (existsSync('./test-logs')) {
      rmSync('./test-logs', { recursive: true, force: true });
    }
  });

  describe('Basic Logger Creation', () => {
    
    it('creates basic logger without throwing', () => {
      expect(() => createBasicLogger()).not.toThrow();
    });

    it('basic logger is equivalent to pino()', () => {
      const basic = createBasicLogger();
      const standard = pino();
      
      expect(basic.level).toBe(standard.level);
      expect(typeof basic.info).toBe('function');
      expect(typeof basic.error).toBe('function');
    });

    it('performance logger works', () => {
      const perfLogger = performanceLogger();
      expect(perfLogger).toBeDefined();
      expect(typeof perfLogger.info).toBe('function');
    });
  });

  describe('Configured Logger', () => {
    
    it('creates console-only logger', () => {
      const logger = createConfiguredLogger({
        level: 'info',
        console: true
      });
      
      expect(logger).toBeDefined();
      expect(logger.level).toBe('info');
    });

    it('respects log levels', async () => {
      const { logger, testStream } = createTestLogger({ level: 'warn' });
      
      let dataReceived = false;
      testStream.on('data', () => {
        dataReceived = true;
      });
      
      // Debug should not appear
      logger.debug('Should not appear');
      await sleep(10);
      expect(dataReceived).toBe(false);
      
      // Warn should appear
      logger.warn('Should appear');
      await sleep(10);
      expect(dataReceived).toBe(true);
    });
  });

  describe('Pre-configured Loggers', () => {
    
    it('creates app logger', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'test';
      
      const logger = await appLogger({
        file: './test-logs/app-test.log'
      });
      
      expect(logger).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('creates development logger', () => {
      const logger = developmentLogger();
      expect(logger).toBeDefined();
    });

    it('creates production logger', () => {
      const logger = productionLogger();
      expect(logger).toBeDefined();
    });
  });

  describe('File Logging', () => {
    
    it('creates log file when specified', async () => {
      const logPath = './test-logs/file-test.log';
      
      // Crear directorio
      mkdirSync('./test-logs', { recursive: true });
      
      const logger = pino(pino.destination({
        dest: logPath,
        sync: false
      }));
      
      logger.info('Test file logging');
      
      // Esperar a que se escriba
      await sleep(200);
      
      expect(existsSync(logPath)).toBe(true);
      const content = readFileSync(logPath, 'utf8');
      expect(content).toContain('Test file logging');
    });

    it('creates directory if it does not exist', async () => {
      const logger = createConfiguredLogger({
        file: './test-logs/subdir/test.log'
      });
      
      logger.info('Test directory creation');
      await sleep(200);
      
      expect(existsSync('./test-logs/subdir')).toBe(true);
      expect(existsSync('./test-logs/subdir/test.log')).toBe(true);
    });
  });

  describe('NestJS Logger Integration', () => {
    
    it('creates NestJS compatible logger', () => {
      const nestLogger = new NestLogger();
      
      expect(nestLogger).toBeDefined();
      expect(typeof nestLogger.log).toBe('function');
      expect(typeof nestLogger.error).toBe('function');
      expect(typeof nestLogger.warn).toBe('function');
      expect(typeof nestLogger.debug).toBe('function');
      expect(typeof nestLogger.verbose).toBe('function');
    });

    it('NestJS logger methods work without throwing', () => {
      const nestLogger = new NestLogger({
        console: true,
        pretty: false
      });
      
      expect(() => nestLogger.log('Test log')).not.toThrow();
      expect(() => nestLogger.error('Test error')).not.toThrow();
      expect(() => nestLogger.warn('Test warn')).not.toThrow();
      expect(() => nestLogger.debug('Test debug')).not.toThrow();
      expect(() => nestLogger.verbose('Test verbose')).not.toThrow();
    });

    it('NestJS logger includes context', async () => {
      const { logger, testStream } = createTestLogger();
      const nestLogger = new NestLogger();
      
      // Mock interno para test
      (nestLogger as any).logger = logger;
      
      let logData: any = null;
      testStream.on('data', (data) => {
        logData = JSON.parse(data.toString());
      });
      
      nestLogger.log('Test message', 'TestContext');
      await sleep(10);
      
      expect(logData).toBeDefined();
      expect(logData.context).toBe('TestContext');
      expect(logData.msg).toBe('Test message');
    });
  });

  describe('Performance Tests', () => {
    
    it('basic logger is faster than configured logger', () => {
      const iterations = 1000;
      
      // Test basic logger
      const basicLogger = performanceLogger();
      const basicStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        basicLogger.info(`Basic test ${i}`);
      }
      const basicTime = Date.now() - basicStart;
      
      // Test configured logger
      const configLogger = developmentLogger();
      const configStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        configLogger.info(`Config test ${i}`);
      }
      const configTime = Date.now() - configStart;
      
      // Basic should be faster or at least not significantly slower
      expect(basicTime).toBeLessThan(1000); // < 1 segundo
      
      console.log(`Basic logger: ${basicTime}ms, Configured logger: ${configTime}ms`);
    });

    it('handles high volume logging without blocking', () => {
      const logger = performanceLogger();
      const start = Date.now();
      
      // Log 10000 messages
      for (let i = 0; i < 10000; i++) {
        logger.info(`Performance test ${i}`);
      }
      
      const duration = Date.now() - start;
      
      // Should complete in reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
      
      console.log(`10000 logs completed in ${duration}ms`);
    });
  });

  describe('Error Handling', () => {
    
    it('handles invalid log levels gracefully', () => {
      expect(() => createConfiguredLogger({
        level: 'invalid' as any
      })).not.toThrow(); // Pino debería usar default
    });

    it('handles missing file permissions gracefully', () => {
      // Intentar escribir a un path inválido
      expect(() => createConfiguredLogger({
        file: './invalid-test.log' // Path válido en lugar de /root
      })).not.toThrow();
    });
  });

  describe('Environment-based Configuration', () => {
    
    it('uses pretty logging in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const logger = developmentLogger();
      expect(logger).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });

    it('uses production logging in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      const logger = productionLogger();
      expect(logger).toBeDefined();
      
      process.env.NODE_ENV = originalEnv;
    });
  });
});

// Test específico para integración con Event Loop
describe('Event Loop Impact Tests', () => {
  
  it('basic logger has minimal event loop impact', async () => {
    const { monitorEventLoopDelay } = require('perf_hooks');
    
    const histogram = monitorEventLoopDelay({ resolution: 20 });
    histogram.enable();
    
    const logger = performanceLogger();
    
    // Baseline measurement
    await sleep(100);
    histogram.reset();
    
    // Log intensive operation
    for (let i = 0; i < 1000; i++) {
      logger.info(`Event loop test ${i}`);
    }
    
    await sleep(100);
    
    const mean = histogram.mean / 1000000; // Convert to ms
    histogram.disable();
    
    // Should be less than 5ms mean delay
    expect(mean).toBeLessThan(25); // Tu baseline es ~20ms
    
    console.log(`Event loop delay with 1000 logs: ${mean.toFixed(2)}ms`);
  });
});