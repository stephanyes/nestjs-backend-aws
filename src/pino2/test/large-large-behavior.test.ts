// large-large-performance.test.ts
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

// Helper para crear logger silencioso
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
  let logCount = 0;
  const measureStream = new PassThrough();
  
  measureStream.on('data', (chunk) => {
    bytesWritten += chunk.length;
    logCount++;
  });
  
  const logger = pino({
    level: 'info'
  }, measureStream);
  
  return {
    logger,
    getBytesWritten: () => bytesWritten,
    getLogCount: () => logCount,
    reset: () => { bytesWritten = 0; logCount = 0; }
  };
};

// Helper para medir performance
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

describe('Performance Tests - Large Keys Large Values (The Beast Mode)', () => {
  
  describe('Data Analysis', () => {
    
    it('analyzes large-num-keys-large-values data structure', () => {
      const data100 = loadTestData('large-num-keys-large-values', '100.json');
      const data1000 = loadTestData('large-num-keys-large-values', '1000.json');
      
      const sample100 = data100[0];
      const sample1000 = data1000[0];
      
      const keys = Object.keys(sample100);
      const values = Object.values(sample100);
      const avgValueSize = values.length > 0 ? 
        values.map((val: any) => typeof val === 'string' ? val.length : JSON.stringify(val).length)
                .reduce((a: number, b: number) => a + b, 0) / values.length : 0;
      
      console.log(`\n🔥 LARGE-NUM-KEYS-LARGE-VALUES Analysis (Beast Mode):`);
      console.log(`   100.json: ${data100.length} entries`);
      console.log(`   1000.json: ${data1000.length} entries`);
      console.log(`   Sample keys count: ${keys.length}`);
      console.log(`   Sample entry size: ~${JSON.stringify(sample100).length} chars`);
      console.log(`   Average value size: ~${Math.round(avgValueSize)} chars`);
      console.log(`   Keys sample: ${keys.slice(0, 5).join(', ')}...`);
      
      // Show size distribution - CORREGIDO
      interface SizeRanges {
        small: number;
        medium: number;
        large: number;
        huge: number;
      }
      
    const sizeRanges = { small: 0, medium: 0, large: 0, huge: 0 };
        values.forEach((val: any) => {
        const size = typeof val === 'string' ? val.length : JSON.stringify(val).length;
        if (size < 50) sizeRanges.small++;
        else if (size < 200) sizeRanges.medium++;
        else if (size < 1000) sizeRanges.large++;
        else sizeRanges.huge++;
    });
      
      console.log(`   Value size distribution:`);
      console.log(`     Small (<50 chars): ${sizeRanges.small}`);
      console.log(`     Medium (50-200): ${sizeRanges.medium}`);
      console.log(`     Large (200-1000): ${sizeRanges.large}`);
      console.log(`     Huge (>1000): ${sizeRanges.huge}`);
      
      expect(data100.length).toBeGreaterThan(0);
      expect(data1000.length).toBeGreaterThan(0);
      expect(keys.length).toBeGreaterThan(10); // Many keys
      expect(JSON.stringify(sample100).length).toBeGreaterThan(1000); // Large values
    });
  });

  describe('Beast Mode Performance', () => {
    
    it('measures performance with 100 beast entries', async () => {
      const data = loadTestData('large-num-keys-large-values', '100.json');
      const logger = createSilentLogger();
      
      const result = await measurePerformance('Beast Mode - 100 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Beast entry ${index + 1}`);
        });
      });
      
      const avgEntrySize = JSON.stringify(data[0]).length;
      const totalDataSize = data.length * avgEntrySize;
      
      console.log(`\n🔥 BEAST MODE PERFORMANCE (100 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
      console.log(`   Data throughput: ${Math.round(totalDataSize / result.duration / 1024)} KB/sec`);
      console.log(`   Avg entry size: ${avgEntrySize} chars`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
    
    it('measures performance with 1000 beast entries', async () => {
      const data = loadTestData('large-num-keys-large-values', '1000.json');
      const logger = createSilentLogger();
      
      const result = await measurePerformance('Beast Mode - 1000 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Beast entry ${index + 1}`);
        });
      });
      
      const avgEntrySize = JSON.stringify(data[0]).length;
      const totalDataSize = data.length * avgEntrySize;
      
      console.log(`\n🔥 BEAST MODE PERFORMANCE (1000 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
      console.log(`   Data throughput: ${Math.round(totalDataSize / result.duration / 1024)} KB/sec`);
      console.log(`   Avg entry size: ${avgEntrySize} chars`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Heavy Serialization Analysis', () => {
    
    it('analyzes serialization overhead with beast objects', async () => {
      const data = loadTestData('large-num-keys-large-values', '1000.json');
      const { logger, getBytesWritten, reset } = createMeasuredLogger();
      
      reset();
      
      const result = await measurePerformance('Beast Serialization', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Serialization beast ${index + 1}`);
        });
      });
      
      const totalBytes = getBytesWritten();
      const avgBytesPerLog = Math.round(totalBytes / data.length);
      const rawJsonSize = JSON.stringify(data[0]).length;
      
      console.log(`\n📝 BEAST SERIALIZATION ANALYSIS:`);
      console.log(`   Total bytes written: ${Math.round(totalBytes / 1024)}KB`);
      console.log(`   Avg bytes per log: ${avgBytesPerLog} bytes`);
      console.log(`   Raw JSON size: ${rawJsonSize} bytes`);
      console.log(`   Pino overhead: ${avgBytesPerLog - rawJsonSize} bytes (${((avgBytesPerLog / rawJsonSize - 1) * 100).toFixed(1)}%)`);
      console.log(`   Serialization rate: ${Math.round(totalBytes / result.duration / 1024)} KB/ms`);
      console.log(`   Processing rate: ${Math.round(data.length / result.duration * 1000)} objects/sec`);
      
      expect(totalBytes).toBeGreaterThan(0);
    });
  });

  describe('Event Loop Stress Test', () => {
    
    it('measures event loop impact under beast load', async () => {
      const { monitorEventLoopDelay } = require('perf_hooks');
      const data = loadTestData('large-num-keys-large-values', '1000.json');
      
      const histogram = monitorEventLoopDelay({ resolution: 20 });
      histogram.enable();
      
      const logger = createSilentLogger();
      
      // Baseline
      await new Promise(resolve => setTimeout(resolve, 50));
      histogram.reset();
      
      const start = Date.now();
      
      // Log beast objects
      data.forEach((entry: any, index: number) => {
        logger.info(entry, `Beast stress ${index + 1}`);
      });
      
      const duration = Date.now() - start;
      await new Promise(resolve => setTimeout(resolve, 50));
      
      const mean = histogram.mean / 1000000; // Convert to ms
      const p99 = histogram.percentile(99) / 1000000;
      const max = histogram.max / 1000000;
      histogram.disable();
      
      console.log(`\n🔄 EVENT LOOP STRESS TEST (Beast Objects):`);
      console.log(`   Logging duration: ${duration}ms`);
      console.log(`   Event Loop mean: ${mean.toFixed(3)}ms`);
      console.log(`   Event Loop P99: ${p99.toFixed(3)}ms`);
      console.log(`   Event Loop max: ${max.toFixed(3)}ms`);
      console.log(`   Throughput: ${Math.round(data.length / duration * 1000)} logs/sec`);
      console.log(`   Keys per object: ${Object.keys(data[0]).length}`);
      console.log(`   Avg object size: ${JSON.stringify(data[0]).length} chars`);
      
      expect(duration).toBeGreaterThan(0);
      expect(mean).toBeGreaterThan(0);
    });
  });

  describe('Memory Pressure Analysis', () => {
    
    it('analyzes memory behavior under beast load', async () => {
      const data = loadTestData('large-num-keys-large-values', '1000.json');
      const logger = createSilentLogger();
      
      const memorySnapshots: Array<{batch: number, memory: NodeJS.MemoryUsage}> = [];
      
      // Initial snapshot
      memorySnapshots.push({
        batch: 0,
        memory: process.memoryUsage()
      });
      
      // Process in smaller batches to see memory pressure
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        batch.forEach((entry: any, index: number) => {
          logger.info(entry, `Memory test ${i + index + 1}`);
        });
        
        // Take snapshot after each batch
        memorySnapshots.push({
          batch: Math.floor(i / batchSize) + 1,
          memory: process.memoryUsage()
        });
        
        // Small delay for memory to settle
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      console.log(`\n💾 MEMORY PRESSURE ANALYSIS (Beast Objects):`);
      
      const initial = memorySnapshots[0].memory;
      const final = memorySnapshots[memorySnapshots.length - 1].memory;
      
      console.log(`   Batches processed: ${memorySnapshots.length - 1}`);
      console.log(`   Initial heap: ${(initial.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Final heap: ${(final.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap growth: ${((final.heapUsed - initial.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   RSS growth: ${((final.rss - initial.rss) / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   External growth: ${((final.external - initial.external) / 1024 / 1024).toFixed(2)}MB`);
      
      // Show memory progression
      console.log(`   Memory progression:`);
      memorySnapshots.forEach((snapshot, index) => {
        if (index % 2 === 0) { // Show every 2nd snapshot
          const heapMB = (snapshot.memory.heapUsed / 1024 / 1024).toFixed(1);
          console.log(`     Batch ${snapshot.batch}: ${heapMB}MB heap`);
        }
      });
      
      expect(memorySnapshots.length).toBeGreaterThan(5);
    });
  });
});