const { performance, PerformanceObserver } = require('perf_hooks');
const { monitorEventLoopDelay } = require('perf_hooks');

class EventLoopMonitor {
  constructor(options = {}) {
    this.options = {
      logInterval: options.logInterval || 5000, // Log cada 5 segundos
      histogram: options.histogram || true,
      gc: options.gc || true,
      functions: options.functions || true,
      ...options
    };
    
    this.stats = {
      eventLoopDelay: null,
      gcStats: [],
      functionTimes: new Map(),
      httpRequests: [],
      asyncOperations: []
    };
    
    this.histogram = null;
    this.observers = [];
    this.logTimer = null;
  }

  start() {
    console.log('🚀 Iniciando monitoreo del Event Loop...');
    
    // 1. Monitor de delay del event loop
    if (this.options.histogram) {
      this.setupEventLoopHistogram();
    }
    
    // 2. Monitor de Garbage Collection
    if (this.options.gc) {
      this.setupGCMonitor();
    }
    
    // 3. Monitor de funciones/operaciones
    if (this.options.functions) {
      this.setupFunctionMonitor();
    }
    
    // 4. Monitor de operaciones HTTP
    this.setupHTTPMonitor();
    
    // 5. Monitor de operaciones asíncronas
    this.setupAsyncMonitor();
    
    // 6. Logging periódico
    this.startPeriodicLogging();
    
    // 7. Graceful shutdown
    this.setupShutdown();
  }

  setupEventLoopHistogram() {
    this.histogram = monitorEventLoopDelay({ resolution: 20 });
    this.histogram.enable();
    
    console.log('📊 Event Loop Histogram habilitado');
  }

  setupGCMonitor() {
    const gcObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.stats.gcStats.push({
          type: this.getGCType(entry.detail?.kind),
          duration: entry.duration,
          timestamp: Date.now(),
          startTime: entry.startTime
        });
        
        // Mantener solo los últimos 100 eventos GC
        if (this.stats.gcStats.length > 100) {
          this.stats.gcStats = this.stats.gcStats.slice(-50);
        }
      }
    });
    
    gcObserver.observe({ type: 'gc', buffered: true });
    this.observers.push(gcObserver);
    
    console.log('🗑️  Garbage Collection Monitor habilitado');
  }

  setupFunctionMonitor() {
    const functionObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.stats.functionTimes.set(entry.name, {
          duration: entry.duration,
          timestamp: Date.now(),
          startTime: entry.startTime
        });
      }
    });
    
    functionObserver.observe({ type: 'function', buffered: true });
    functionObserver.observe({ type: 'measure', buffered: true });
    this.observers.push(functionObserver);
    
    console.log('⚡ Function Performance Monitor habilitado');
  }

  setupHTTPMonitor() {
    const httpObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'http') {
          this.stats.httpRequests.push({
            url: entry.name,
            duration: entry.duration,
            timestamp: Date.now(),
            startTime: entry.startTime
          });
          
          // Mantener solo las últimas 50 requests
          if (this.stats.httpRequests.length > 50) {
            this.stats.httpRequests = this.stats.httpRequests.slice(-25);
          }
        }
      }
    });
    
    try {
      httpObserver.observe({ type: 'http', buffered: true });
      this.observers.push(httpObserver);
      console.log('🌐 HTTP Monitor habilitado');
    } catch (e) {
      console.log('ℹ️  HTTP Monitor no disponible en esta versión de Node');
    }
  }

  setupAsyncMonitor() {
    const asyncObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.stats.asyncOperations.push({
          name: entry.name,
          duration: entry.duration,
          timestamp: Date.now(),
          startTime: entry.startTime,
          type: entry.entryType
        });
        
        // Mantener solo las últimas 100 operaciones
        if (this.stats.asyncOperations.length > 100) {
          this.stats.asyncOperations = this.stats.asyncOperations.slice(-50);
        }
      }
    });
    
    try {
      asyncObserver.observe({ type: 'async_hooks', buffered: true });
      this.observers.push(asyncObserver);
      console.log('🔄 Async Operations Monitor habilitado');
    } catch (e) {
      // async_hooks no siempre está disponible como performance entry
      console.log('ℹ️  Async Hooks Monitor no disponible');
    }
  }

  startPeriodicLogging() {
    this.logTimer = setInterval(() => {
      this.logCurrentStats();
    }, this.options.logInterval);
    
    console.log(`📝 Logging periódico iniciado (cada ${this.options.logInterval}ms)`);
  }

  logCurrentStats() {
    const stats = this.getCurrentStats();
    const timestamp = new Date().toISOString();
    
    // Crear log estructurado para archivo
    const logEntry = {
      timestamp,
      eventLoop: stats.eventLoopDelay ? {
        min: parseFloat(stats.eventLoopDelay.min.toFixed(2)),
        max: parseFloat(stats.eventLoopDelay.max.toFixed(2)),
        mean: parseFloat(stats.eventLoopDelay.mean.toFixed(2)),
        p95: parseFloat(stats.eventLoopDelay.p95.toFixed(2)),
        p99: parseFloat(stats.eventLoopDelay.p99.toFixed(2)),
        // Indicadores de salud
        healthy: stats.eventLoopDelay.mean < 2,
        warning: stats.eventLoopDelay.mean > 10,
        critical: stats.eventLoopDelay.mean > 50
      } : null,
      memory: (() => {
        const memUsage = process.memoryUsage();
        return {
          rss: parseFloat((memUsage.rss / 1024 / 1024).toFixed(2)),
          heapUsed: parseFloat((memUsage.heapUsed / 1024 / 1024).toFixed(2)),
          heapTotal: parseFloat((memUsage.heapTotal / 1024 / 1024).toFixed(2)),
          external: parseFloat((memUsage.external / 1024 / 1024).toFixed(2))
        };
      })(),
      gc: stats.recentGC.length > 0 ? this.summarizeGC(stats.recentGC) : {},
      cpu: (() => {
        const cpuUsage = process.cpuUsage();
        return {
          user: parseFloat((cpuUsage.user / 1000).toFixed(2)),
          system: parseFloat((cpuUsage.system / 1000).toFixed(2))
        };
      })()
    };
    
    // Escribir a archivo si está configurado
    if (this.options.logFile) {
      const fs = require('fs');
      try {
        fs.appendFileSync(this.options.logFile, JSON.stringify(logEntry) + '\n');
      } catch (error) {
        console.error('Error escribiendo log:', error.message);
      }
    }
    
    // Log resumido en consola solo si no hay archivo configurado
    if (!this.options.logFile) {
      console.log('\n=== 📊 EVENT LOOP STATS ===');
      console.log(`Timestamp: ${timestamp}`);
      
      if (stats.eventLoopDelay) {
        const status = stats.eventLoopDelay.mean < 2 ? '🟢' : 
                      stats.eventLoopDelay.mean < 10 ? '🟡' : '🔴';
        console.log(`\n🔄 Event Loop ${status}:`);
        console.log(`  Mean: ${stats.eventLoopDelay.mean.toFixed(2)}ms | P95: ${stats.eventLoopDelay.p95.toFixed(2)}ms | P99: ${stats.eventLoopDelay.p99.toFixed(2)}ms`);
      }
      
      const memUsage = process.memoryUsage();
      console.log(`\n💾 Memory: ${(memUsage.heapUsed / 1024 / 1024).toFixed(1)}MB used / ${(memUsage.rss / 1024 / 1024).toFixed(1)}MB RSS`);
      console.log('============================\n');
    } else {
      // Log mínimo en consola cuando se guarda en archivo
      const status = stats.eventLoopDelay?.mean < 2 ? '🟢' : 
                    stats.eventLoopDelay?.mean < 10 ? '🟡' : '🔴';
      const mean = stats.eventLoopDelay?.mean.toFixed(2) || 'N/A';
      const memory = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
      
      console.log(`${status} EL: ${mean}ms | Mem: ${memory}MB | Logged to: ${this.options.logFile}`);
    }
  }

  getCurrentStats() {
    const stats = {
      timestamp: Date.now(),
      eventLoopDelay: null,
      recentGC: [],
      recentHTTP: [],
      recentAsync: []
    };
    
    // Event Loop Delay
    if (this.histogram) {
      stats.eventLoopDelay = {
        min: this.histogram.min / 1000000, // Convert to ms
        max: this.histogram.max / 1000000,
        mean: this.histogram.mean / 1000000,
        stddev: this.histogram.stddev / 1000000,
        p50: this.histogram.percentile(50) / 1000000,
        p95: this.histogram.percentile(95) / 1000000,
        p99: this.histogram.percentile(99) / 1000000
      };
      
      // Reset para el próximo período
      this.histogram.reset();
    }
    
    // Recent events (últimos 5 segundos)
    const fiveSecondsAgo = Date.now() - 5000;
    
    stats.recentGC = this.stats.gcStats.filter(gc => gc.timestamp > fiveSecondsAgo);
    stats.recentHTTP = this.stats.httpRequests.filter(req => req.timestamp > fiveSecondsAgo);
    stats.recentAsync = this.stats.asyncOperations.filter(op => op.timestamp > fiveSecondsAgo);
    
    return stats;
  }

  // Método para medir funciones específicas
  measureFunction(name, fn) {
    return (...args) => {
      const mark1 = `${name}-start`;
      const mark2 = `${name}-end`;
      
      performance.mark(mark1);
      
      const result = fn(...args);
      
      if (result && typeof result.then === 'function') {
        // Es una Promise
        return result.finally(() => {
          performance.mark(mark2);
          performance.measure(name, mark1, mark2);
        });
      } else {
        // Función síncrona
        performance.mark(mark2);
        performance.measure(name, mark1, mark2);
        return result;
      }
    };
  }

  // Método para medir bloques de código
  async measureAsync(name, asyncFn) {
    const mark1 = `${name}-start`;
    const mark2 = `${name}-end`;
    
    performance.mark(mark1);
    
    try {
      const result = await asyncFn();
      performance.mark(mark2);
      performance.measure(name, mark1, mark2);
      return result;
    } catch (error) {
      performance.mark(mark2);
      performance.measure(`${name}-error`, mark1, mark2);
      throw error;
    }
  }

  summarizeGC(gcEvents) {
    const summary = {};
    
    gcEvents.forEach(gc => {
      if (!summary[gc.type]) {
        summary[gc.type] = { count: 0, totalTime: 0 };
      }
      summary[gc.type].count++;
      summary[gc.type].totalTime += gc.duration;
    });
    
    return summary;
  }

  getGCType(kind) {
    const types = {
      1: 'Scavenge',
      2: 'Mark-Sweep-Compact',
      4: 'Incremental Marking',
      8: 'Weak Phantom',
      15: 'All'
    };
    return types[kind] || `Unknown(${kind})`;
  }

  setupShutdown() {
    const cleanup = () => {
      console.log('\n🛑 Deteniendo Event Loop Monitor...');
      
      if (this.logTimer) {
        clearInterval(this.logTimer);
      }
      
      if (this.histogram) {
        this.histogram.disable();
      }
      
      this.observers.forEach(observer => {
        observer.disconnect();
      });
      
      // Log final
      this.logCurrentStats();
      
      console.log('✅ Event Loop Monitor detenido');
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    process.on('beforeExit', cleanup);
  }

  stop() {
    if (this.logTimer) {
      clearInterval(this.logTimer);
    }
    
    if (this.histogram) {
      this.histogram.disable();
    }
    
    this.observers.forEach(observer => {
      observer.disconnect();
    });
  }
}

module.exports = EventLoopMonitor;