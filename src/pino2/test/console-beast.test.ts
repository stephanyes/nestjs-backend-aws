// console-beast.test.ts
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { 
  createBasicLogger,
  performanceLogger,
  developmentLogger,
  productionLogger,
  appLogger
} from '../simple-logger';

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

describe('Your Logger - Beast Mode Console Performance', () => {
  
  it('tests YOUR basic logger with beast mode (100 entries)', async () => {
    const data = loadTestData('large-num-keys-large-values', '100.json');
    
    // ✅ Using YOUR createBasicLogger
    const logger = createBasicLogger();
    
    console.log('\n🔥 YOUR BASIC LOGGER - BEAST MODE');
    console.log(`📊 About to log ${data.length} entries of ~${JSON.stringify(data[0]).length} chars each`);
    console.log('⚠️  Console spam using YOUR logger...\n');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = await measurePerformance('Your Basic Logger', () => {
      data.forEach((entry: any, index: number) => {
        logger.info(entry, `Your logger ${index + 1}`);
      });
    });
    
    console.log('\n📊 YOUR BASIC LOGGER RESULTS:');
    console.log(`Duration: ${result.duration}ms`);
    console.log(`Memory change: ${result.memory}MB`);
    console.log(`Throughput: ${Math.round(data.length / result.duration * 1000)} logs/sec`);
    console.log(`Avg per log: ${(result.duration / data.length).toFixed(4)}ms`);
    
    expect(result.duration).toBeGreaterThan(0);
  });
  
  it('compares YOUR different loggers with beast mode', async () => {
    const data = loadTestData('large-num-keys-large-values', '100.json');
    
    console.log('\n🔬 COMPARING YOUR LOGGER TYPES:');
    
    // Test YOUR performanceLogger
    const perfLogger = performanceLogger();
    const perfResult = await measurePerformance('Your Performance Logger', () => {
      data.forEach((entry: any, index: number) => {
        perfLogger.info(entry, `Perf ${index + 1}`);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test YOUR developmentLogger
    const devLogger = developmentLogger();
    const devResult = await measurePerformance('Your Development Logger', () => {
      data.forEach((entry: any, index: number) => {
        devLogger.info(entry, `Dev ${index + 1}`);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Test YOUR appLogger
    const appLoggerInstance = appLogger({
      console: true,
      pretty: false // No pretty to avoid extra overhead
    });
    const appResult = await measurePerformance('Your App Logger', () => {
      data.forEach((entry: any, index: number) => {
        appLoggerInstance.info(entry, `App ${index + 1}`);
      });
    });
    
    console.log('\n📊 YOUR LOGGER COMPARISON:');
    console.log(`Performance Logger: ${perfResult.duration}ms (${Math.round(data.length / perfResult.duration * 1000)} logs/sec)`);
    console.log(`Development Logger: ${devResult.duration}ms (${Math.round(data.length / devResult.duration * 1000)} logs/sec)`);
    console.log(`App Logger:         ${appResult.duration}ms (${Math.round(data.length / appResult.duration * 1000)} logs/sec)`);
    
    console.log('\n📈 PERFORMANCE RATIOS:');
    console.log(`Dev vs Perf: ${(devResult.duration / perfResult.duration).toFixed(2)}x slower`);
    console.log(`App vs Perf: ${(appResult.duration / perfResult.duration).toFixed(2)}x slower`);
    
    expect(perfResult.duration).toBeGreaterThan(0);
    expect(devResult.duration).toBeGreaterThan(0);
    expect(appResult.duration).toBeGreaterThan(0);
  });
  
  it('tests YOUR production logger vs development logger', async () => {
    const data = loadTestData('large-num-keys-large-values', '100.json');
    
    console.log('\n🏭 YOUR PRODUCTION vs DEVELOPMENT:');
    
    // YOUR productionLogger (file only)
    const prodLogger = productionLogger();
    const prodResult = await measurePerformance('Your Production Logger', () => {
      data.forEach((entry: any, index: number) => {
        prodLogger.info(entry, `Prod ${index + 1}`);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 200)); // Wait for file writes
    
    // YOUR developmentLogger (console + pretty)
    const devLogger = developmentLogger();
    const devResult = await measurePerformance('Your Development Logger', () => {
      data.forEach((entry: any, index: number) => {
        devLogger.info(entry, `Dev ${index + 1}`);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('\n📊 YOUR PROD vs DEV COMPARISON:');
    console.log(`Production (file):  ${prodResult.duration}ms (${Math.round(data.length / prodResult.duration * 1000)} logs/sec)`);
    console.log(`Development (pretty): ${devResult.duration}ms (${Math.round(data.length / devResult.duration * 1000)} logs/sec)`);
    console.log(`Development overhead: ${(devResult.duration / prodResult.duration).toFixed(2)}x slower`);
    
    expect(prodResult.duration).toBeGreaterThan(0);
    expect(devResult.duration).toBeGreaterThan(prodResult.duration);
  });
});