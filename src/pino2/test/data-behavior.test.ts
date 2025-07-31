// data-behavior.test.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  createBasicLogger, 
  performanceLogger,
  developmentLogger 
} from '../simple-logger';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper para cargar test data
const loadTestData = (folder: string, file: string) => {
  const filePath = join(__dirname, 'test-data', folder, file);
  if (!existsSync(filePath)) {
    throw new Error(`Test data file not found: ${filePath}`);
  }
  
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
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
    duration: Math.round(duration * 100) / 100, // Round to 2 decimals
    memory: {
      rss: Math.round(memDiff.rss / 1024 / 1024 * 100) / 100, // MB
      heapUsed: Math.round(memDiff.heapUsed / 1024 / 1024 * 100) / 100, // MB
      heapTotal: Math.round(memDiff.heapTotal / 1024 / 1024 * 100) / 100 // MB
    }
  };
};

describe('Data Behavior Tests - Small Keys Small Values', () => {
  
  describe('Test Data Loading', () => {
    
    it('loads 100.json successfully', () => {
      const data = loadTestData('small-num-keys-small-values', '100.json');
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`📊 100.json contains ${data.length} log entries`);
      console.log(`📄 First entry keys: ${Object.keys(data[0]).join(', ')}`);
      console.log(`📏 First entry sample:`, JSON.stringify(data[0]).substring(0, 100) + '...');
    });
    
    it('loads 1000.json successfully', () => {
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      expect(data).toBeDefined();
      expect(Array.isArray(data)).toBe(true);
      expect(data.length).toBeGreaterThan(0);
      
      console.log(`📊 1000.json contains ${data.length} log entries`);
      console.log(`📄 First entry keys: ${Object.keys(data[0]).join(', ')}`);
      console.log(`📏 Average entry size: ~${Math.round(JSON.stringify(data[0]).length)} chars`);
    });
  });

  describe('Basic Logger Behavior with Small Data', () => {
    
    it('logs 100 entries with basic logger', async () => {
      const data = loadTestData('small-num-keys-small-values', '100.json');
      const logger = createBasicLogger();
      
      const result = await measurePerformance('Basic Logger - 100 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Log entry ${index + 1}`);
        });
      });
      
      console.log(`⚡ Basic Logger (100 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(3)}ms`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
    
    it('logs 1000 entries with basic logger', async () => {
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      const logger = createBasicLogger();
      
      const result = await measurePerformance('Basic Logger - 1000 entries', () => {
        data.forEach((entry: any, index: number) => {
          logger.info(entry, `Log entry ${index + 1}`);
        });
      });
      
      console.log(`⚡ Basic Logger (1000 entries):`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Memory change: ${result.memory.heapUsed}MB heap`);
      console.log(`   Avg per log: ${(result.duration / data.length).toFixed(3)}ms`);
      
      expect(result.duration).toBeGreaterThan(0);
    });
  });

  describe('Performance Logger vs Development Logger', () => {
    
    it('compares performance logger vs development logger with 1000 entries', async () => {
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      
      // Test Performance Logger
      const perfLogger = performanceLogger();
      const perfResult = await measurePerformance('Performance Logger', () => {
        data.forEach((entry: any, index: number) => {
          perfLogger.info(entry, `Perf log ${index + 1}`);
        });
      });
      
      // Small delay between tests
      await sleep(100);
      
      // Test Development Logger
      const devLogger = developmentLogger();
      const devResult = await measurePerformance('Development Logger', () => {
        data.forEach((entry: any, index: number) => {
          devLogger.info(entry, `Dev log ${index + 1}`);
        });
      });
      
      console.log(`\n📊 PERFORMANCE COMPARISON (1000 entries):`);
      console.log(`🚀 Performance Logger:`);
      console.log(`   Duration: ${perfResult.duration}ms`);
      console.log(`   Memory: ${perfResult.memory.heapUsed}MB`);
      console.log(`   Per log: ${(perfResult.duration / data.length).toFixed(3)}ms`);
      
      console.log(`🛠️  Development Logger:`);
      console.log(`   Duration: ${devResult.duration}ms`);
      console.log(`   Memory: ${devResult.memory.heapUsed}MB`);
      console.log(`   Per log: ${(devResult.duration / data.length).toFixed(3)}ms`);
      
      console.log(`📈 Difference:`);
      console.log(`   Speed: ${(devResult.duration / perfResult.duration).toFixed(2)}x slower`);
      console.log(`   Memory: ${(devResult.memory.heapUsed - perfResult.memory.heapUsed).toFixed(2)}MB more`);
      
      // Just verify both completed
      expect(perfResult.duration).toBeGreaterThan(0);
      expect(devResult.duration).toBeGreaterThan(0);
    });
  });

  describe('Event Loop Impact with Real Data', () => {
    
    it('measures event loop impact while logging real data', async () => {
      const { monitorEventLoopDelay } = require('perf_hooks');
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      
      const histogram = monitorEventLoopDelay({ resolution: 20 });
      histogram.enable();
      
      const logger = performanceLogger();
      
      // Baseline
      await sleep(50);
      histogram.reset();
      
      const start = Date.now();
      
      // Log real data
      data.forEach((entry: any, index: number) => {
        logger.info(entry, `Real data log ${index + 1}`);
      });
      
      const duration = Date.now() - start;
      await sleep(50);
      
      const mean = histogram.mean / 1000000; // Convert to ms
      const p99 = histogram.percentile(99) / 1000000;
      histogram.disable();
      
      console.log(`\n🔄 EVENT LOOP IMPACT (Real Data - 1000 entries):`);
      console.log(`   Logging duration: ${duration}ms`);
      console.log(`   Event Loop mean: ${mean.toFixed(3)}ms`);
      console.log(`   Event Loop P99: ${p99.toFixed(3)}ms`);
      console.log(`   Throughput: ${(data.length / duration * 1000).toFixed(0)} logs/sec`);
      
      expect(duration).toBeGreaterThan(0);
      expect(mean).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage Patterns', () => {
    
    it('analyzes memory usage pattern during sustained logging', async () => {
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      const logger = performanceLogger();
      
      const memorySnapshots: Array<{time: number, memory: NodeJS.MemoryUsage}> = [];
      
      // Take initial snapshot
      memorySnapshots.push({
        time: 0,
        memory: process.memoryUsage()
      });
      
      const start = Date.now();
      
      // Log in batches and take memory snapshots
      const batchSize = 100;
      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        
        batch.forEach((entry: any, index: number) => {
          logger.info(entry, `Batch log ${i + index + 1}`);
        });
        
        // Take memory snapshot every batch
        memorySnapshots.push({
          time: Date.now() - start,
          memory: process.memoryUsage()
        });
        
        // Small delay to let memory settle
        await sleep(10);
      }
      
      console.log(`\n💾 MEMORY USAGE PATTERN:`);
      console.log(`   Snapshots taken: ${memorySnapshots.length}`);
      
      const initial = memorySnapshots[0].memory;
      const final = memorySnapshots[memorySnapshots.length - 1].memory;
      
      console.log(`   Initial heap: ${(initial.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Final heap: ${(final.heapUsed / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   Heap growth: ${((final.heapUsed - initial.heapUsed) / 1024 / 1024).toFixed(2)}MB`);
      console.log(`   RSS growth: ${((final.rss - initial.rss) / 1024 / 1024).toFixed(2)}MB`);
      
      // Show memory trend
      memorySnapshots.forEach((snapshot, index) => {
        if (index % 3 === 0) { // Show every 3rd snapshot
          const heapMB = (snapshot.memory.heapUsed / 1024 / 1024).toFixed(1);
          console.log(`   ${snapshot.time.toString().padStart(4)}ms: ${heapMB}MB heap`);
        }
      });
      
      expect(memorySnapshots.length).toBeGreaterThan(1);
    });
  });
});