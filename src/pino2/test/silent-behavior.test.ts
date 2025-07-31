// silent-performance.test.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import { PassThrough } from 'stream';

// Helper para cargar test data
const loadTestData = (folder: string, file: string) => {
  const filePath = join(__dirname, 'test-data', folder, file);
  if (!existsSync(filePath)) {
    throw new Error(`Test data file not found: ${filePath}`);
  }
  
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
};

// Helper para crear logger silencioso (no output)
const createSilentLogger = () => {
  const silentStream = new PassThrough();
  silentStream.on('data', () => {}); // Consume pero no muestra
  
  return pino({
    level: 'info'
  }, silentStream);
};

// Helper para crear logger con medición de throughput
const createMeasuredLogger = () => {
  let bytesWritten = 0;
  const measureStream = new PassThrough();
  
  measureStream.on('data', (chunk) => {
    bytesWritten += chunk.length;
  });
  
  const logger = pino({
    level: 'info'
  }, measureStream);
  
  return {
    logger,
    getBytesWritten: () => bytesWritten,
    reset: () => { bytesWritten = 0; }
  };
};

// Helper para medir performance sin logs en consola
const measurePerformance = async (name: string, fn: () => void | Promise<void>) => {
  const start = process.hrtime.bigint();
  const memStart = process.memoryUsage();
  
  await fn();
  
  const end = process.hrtime.bigint();
  const memEnd = process.memoryUsage();
  
  const duration = Number(end - start) / 1_000_000; // Convert to ms
  const memDiff = {
    rss: memEnd.rss - memStart.rss,
    heapUsed: memEnd.heapUsed - memStart.heapUsed,
    heapTotal: memEnd.heapTotal - memStart.heapTotal
  };
  
  return {
    name,
    duration: Math.round(duration * 100) / 100,
    memory: {
      rss: Math.round(memDiff.rss / 1024 / 1024 * 100) / 100,
      heapUsed: Math.round(memDiff.heapUsed / 1024 / 1024 * 100) / 100,
      heapTotal: Math.round(memDiff.heapTotal / 1024 / 1024 * 100) / 100
    }
  };
};

describe('Silent Performance Tests - Large Number of Keys, Small Values', () => {
  
  describe('Data Analysis', () => {
    
    it('analyzes large-num-keys-small-values data structure', () => {
      const data100 = loadTestData('large-num-keys-small-values', '100.json');
      const data1000 = loadTestData('large-num-keys-small-values', '1000.json');
      
      const sample100 = data100[0];
      const sample1000 = data1000[0];
      
      console.log(`\n📊 LARGE-NUM-KEYS-SMALL-VALUES Analysis:`);
      console.log(`   100.json: ${data100.length} entries`);
      console.log(`   1000.json: ${data1000.length} entries`);
      console.log(`   Sample keys count: ${Object.keys(sample100).length}`);
      console.log(`   Sample entry size: ~${JSON.stringify(sample100).length} chars`);
      console.log(`   Keys: ${Object.keys(sample100).slice(0, 5).join(', ')}...`);
      
      expect(data100.length).toBeGreaterThan(0);
      expect(data1000.length).toBeGreaterThan(0);
      expect(Object.keys(sample100).length).toBeGreaterThan(5); // Many keys
    });
  });

  describe('Performance with Many Keys', () => {
    
    it('measures performance with 100 entries (many keys, small values)', async () => {
      const data = loadTestData('large-num-keys-small-values', '100.json');
      const logger = createSilentLogger();
      
      const result = await measurePerformance('Large Keys - 100 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Entry ${index + 1}`);
        });
      });
      
      console.log(`\n⚡ LARGE-NUM-KEYS-SMALL-VALUES (100 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
    
    it('measures performance with 1000 entries (many keys, small values)', async () => {
      const data = loadTestData('large-num-keys-small-values', '1000.json');
      const logger = createSilentLogger();
      
      const result = await measurePerformance('Large Keys - 1000 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Entry ${index + 1}`);
        });
      });
      
      console.log(`\n⚡ LARGE-NUM-KEYS-SMALL-VALUES (1000 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Serialization Impact', () => {
    
    it('measures serialization overhead with many keys', async () => {
      const data = loadTestData('large-num-keys-small-values', '1000.json');
      const { logger, getBytesWritten, reset } = createMeasuredLogger();
      
      reset();
      
      const result = await measurePerformance('Serialization test', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Serialization test ${index + 1}`);
        });
      });
      
      const totalBytes = getBytesWritten();
      const avgBytesPerLog = Math.round(totalBytes / data.length);
      
      console.log(`\n📝 SERIALIZATION IMPACT (Many Keys):`);
      console.log(`   Total bytes written: ${Math.round(totalBytes / 1024)}KB`);
      console.log(`   Avg bytes per log: ${avgBytesPerLog} bytes`);
      console.log(`   Serialization rate: ${Math.round(totalBytes / result.duration / 1024)} KB/ms`);
      console.log(`   JSON overhead factor: ~${(avgBytesPerLog / JSON.stringify(data[0]).length).toFixed(2)}x`);
      
      expect(totalBytes).toBeGreaterThan(0);
    });
  });

  describe('Event Loop Impact with Complex Objects', () => {
    
    it('measures event loop impact with many-key objects', async () => {
      const { monitorEventLoopDelay } = require('perf_hooks');
      const data = loadTestData('large-num-keys-small-values', '1000.json');
      
      const histogram = monitorEventLoopDelay({ resolution: 20 });
      histogram.enable();
      
      const logger = createSilentLogger();
      
      // Baseline
      await new Promise(resolve => setTimeout(resolve, 50));
      histogram.reset();
      
      const start = Date.now();
      
      // Log complex objects
      data.forEach((entry: any, index: number) => {
        logger.info(entry, `Complex object ${index + 1}`);
      });
      
      const duration = Date.now() - start;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const mean = histogram.mean / 1000000; // Convert to ms
      const p99 = histogram.percentile(99) / 1000000;
      histogram.disable();
      
      console.log(`\n🔄 EVENT LOOP IMPACT (Many Keys Objects):`);
      console.log(`   Logging duration: ${duration}ms`);
      console.log(`   Event Loop mean: ${mean.toFixed(3)}ms`);
      console.log(`   Event Loop P99: ${p99.toFixed(3)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / duration * 1000)} logs/sec`);
      console.log(`   Keys per object: ${Object.keys(data[0]).length}`);
      
      expect(duration).toBeGreaterThan(0);
      expect(mean).toBeGreaterThan(0);
    });
  });
});

describe('Silent Performance Tests - Small Keys, Large Values', () => {
  
  describe('Data Analysis', () => {
    
    it('analyzes small-num-keys-large-values data structure', () => {
      const data100 = loadTestData('small-num-keys-large-values', '100.json');
      const data1000 = loadTestData('small-num-keys-large-values', '1000.json');
      
      const sample100 = data100[0];
      const sample1000 = data1000[0];
      
      console.log(`\n📊 SMALL-NUM-KEYS-LARGE-VALUES Analysis:`);
      console.log(`   100.json: ${data100.length} entries`);
      console.log(`   1000.json: ${data1000.length} entries`);
      console.log(`   Sample keys count: ${Object.keys(sample100).length}`);
      console.log(`   Sample entry size: ~${JSON.stringify(sample100).length} chars`);
      console.log(`   Keys: ${Object.keys(sample100).join(', ')}`);
      
      // Show value sizes
      const valueSizes = Object.entries(sample100).map(([key, value]) => 
        `${key}:${typeof value === 'string' ? value.length : JSON.stringify(value).length}chars`
      );
      console.log(`   Value sizes: ${valueSizes.slice(0, 3).join(', ')}...`);
      
      expect(data100.length).toBeGreaterThan(0);
      expect(data1000.length).toBeGreaterThan(0);
      expect(Object.keys(sample100).length).toBeLessThan(10); // Few keys
    });
  });

  describe('Performance with Large Values', () => {
    
    it('measures performance with large values', async () => {
      const data = loadTestData('small-num-keys-large-values', '1000.json');
      const logger = createSilentLogger();
      
      const result = await measurePerformance('Large Values - 1000 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Large value entry ${index + 1}`);
        });
      });
      
      console.log(`\n⚡ SMALL-NUM-KEYS-LARGE-VALUES (1000 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
  });
});