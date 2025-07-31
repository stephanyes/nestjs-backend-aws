// real-vs-silent.test.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import pino from 'pino';
import { PassThrough } from 'stream';

const loadTestData = (folder: string, file: string) => {
  const filePath = join(__dirname, 'test-data', folder, file);
  const content = readFileSync(filePath, 'utf8');
  return JSON.parse(content);
};

const measurePerformance = async (name: string, fn: () => void | Promise<void>) => {
  const start = process.hrtime.bigint();
  const memStart = process.memoryUsage();
  
  await fn();
  
  const end = process.hrtime.bigint();
  const memEnd = process.memoryUsage();
  
  const duration = Number(end - start) / 1_000_000;
  return {
    name,
    duration: Math.round(duration * 100) / 100,
    memory: Math.round((memEnd.heapUsed - memStart.heapUsed) / 1024 / 1024 * 100) / 100
  };
};

describe('Real vs Silent Logger Performance', () => {
  
  describe('Console Output Impact', () => {
    
    it('compares silent vs console vs file logging with small data', async () => {
      const data = loadTestData('small-num-keys-small-values', '1000.json');
      
      // 1. Silent Logger (no output)
      const silentStream = new PassThrough();
      silentStream.on('data', () => {}); // Consume but don't show
      const silentLogger = pino({ level: 'info' }, silentStream);
      
      // 2. Console Logger (real stdout)
      const consoleLogger = pino({ level: 'info' });
      
      // 3. File Logger (async file write)
      const fileLogger = pino(pino.destination({
        dest: './test-real-performance.log',
        sync: false
      }));
      
      console.log('\n🔬 SMALL DATA PERFORMANCE COMPARISON (1000 entries):');
      
      // Test Silent
      const silentResult = await measurePerformance('Silent', () => {
        data.forEach((entry: any, index: number) => {
          silentLogger.info(entry, `Silent ${index}`);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Test Console (THIS WILL SPAM - but real performance)
      console.log('\n⚠️  About to spam console for REAL performance test...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const consoleResult = await measurePerformance('Console', () => {
        data.forEach((entry: any, index: number) => {
          consoleLogger.info(entry, `Console ${index}`);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Test File
      const fileResult = await measurePerformance('File', () => {
        data.forEach((entry: any, index: number) => {
          fileLogger.info(entry, `File ${index}`);
        });
      });
      
      // Wait for file writes to complete
      await new Promise(resolve => setTimeout(resolve, 200));
      
      console.log('\n📊 SMALL DATA RESULTS:');
      console.log(`Silent:  ${silentResult.duration}ms  (${Math.round(data.length / silentResult.duration * 1000)} logs/sec)`);
      console.log(`Console: ${consoleResult.duration}ms  (${Math.round(data.length / consoleResult.duration * 1000)} logs/sec)`);
      console.log(`File:    ${fileResult.duration}ms  (${Math.round(data.length / fileResult.duration * 1000)} logs/sec)`);
      
      console.log('\n📈 PERFORMANCE IMPACT:');
      console.log(`Console vs Silent: ${(consoleResult.duration / silentResult.duration).toFixed(2)}x slower`);
      console.log(`File vs Silent:    ${(fileResult.duration / silentResult.duration).toFixed(2)}x slower`);
      
      expect(silentResult.duration).toBeGreaterThan(0);
      expect(consoleResult.duration).toBeGreaterThan(0);
      expect(fileResult.duration).toBeGreaterThan(0);
    });
    
    it('compares silent vs console with BEAST data (smaller sample)', async () => {
      // Use only 100 entries for beast mode to avoid too much spam
      const data = loadTestData('large-num-keys-large-values', '100.json');
      
      const silentStream = new PassThrough();
      silentStream.on('data', () => {});
      const silentLogger = pino({ level: 'info' }, silentStream);
      
      const consoleLogger = pino({ level: 'info' });
      
      console.log('\n🔬 BEAST DATA PERFORMANCE COMPARISON (100 entries, ~20KB each):');
      
      // Silent test
      const silentResult = await measurePerformance('Silent Beast', () => {
        data.forEach((entry: any, index: number) => {
          silentLogger.info(entry, `Silent beast ${index}`);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Console test (will be VERY spammy)
      console.log('\n⚠️  MASSIVE CONSOLE SPAM INCOMING - Real beast mode test...');
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const consoleResult = await measurePerformance('Console Beast', () => {
        data.forEach((entry: any, index: number) => {
          consoleLogger.info(entry, `Console beast ${index}`);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('\n📊 BEAST DATA RESULTS:');
      console.log(`Silent Beast:  ${silentResult.duration}ms  (${Math.round(data.length / silentResult.duration * 1000)} logs/sec)`);
      console.log(`Console Beast: ${consoleResult.duration}ms  (${Math.round(data.length / consoleResult.duration * 1000)} logs/sec)`);
      
      const impactFactor = consoleResult.duration / silentResult.duration;
      console.log(`\n🎯 REAL IMPACT: Console is ${impactFactor.toFixed(2)}x slower than silent`);
      
      if (impactFactor > 2) {
        console.log(`🚨 SIGNIFICANT IMPACT: Console output heavily impacts performance!`);
      } else if (impactFactor > 1.5) {
        console.log(`⚠️  MODERATE IMPACT: Console output moderately impacts performance`);
      } else {
        console.log(`✅ MINIMAL IMPACT: Console output has minimal performance impact`);
      }
      
      expect(silentResult.duration).toBeGreaterThan(0);
      expect(consoleResult.duration).toBeGreaterThan(silentResult.duration);
    });
  });
  
  describe('Real World Scenarios', () => {
    
    it('simulates production logging scenario', async () => {
      const data = loadTestData('small-num-keys-large-values', '1000.json');
      
      // Production: File logging only
      const prodLogger = pino(pino.destination({
        dest: './prod-sim.log',
        sync: false
      }));
      
      // Development: Console + File  
      const devStreams = [
        { level: 'info', stream: process.stdout },
        { level: 'info', stream: pino.destination({ dest: './dev-sim.log', sync: false }) }
      ];
      const devLogger = pino({ level: 'info' }, pino.multistream(devStreams));
      
      console.log('\n🏭 PRODUCTION vs DEVELOPMENT LOGGING:');
      
      const prodResult = await measurePerformance('Production (file only)', () => {
        data.forEach((entry: any, index: number) => {
          prodLogger.info(entry, `Prod ${index}`);
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('\n⚠️  Development mode logging (console + file)...');
      
      const devResult = await measurePerformance('Development (console + file)', () => {
        data.forEach((entry: any, index: number) => {
          devLogger.info(entry, `Dev ${index}`);
        });
      });
      
      // Wait for all writes
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('\n📊 PRODUCTION vs DEVELOPMENT:');
      console.log(`Production:  ${prodResult.duration}ms  (${Math.round(data.length / prodResult.duration * 1000)} logs/sec)`);
      console.log(`Development: ${devResult.duration}ms  (${Math.round(data.length / devResult.duration * 1000)} logs/sec)`);
      console.log(`Development overhead: ${(devResult.duration / prodResult.duration).toFixed(2)}x slower`);
      
      expect(prodResult.duration).toBeGreaterThan(0);
      expect(devResult.duration).toBeGreaterThan(prodResult.duration);
    });
  });
});