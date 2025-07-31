#!/usr/bin/env node

// debug-event-loop.js
// Herramienta para encontrar QUÉ está bloqueando el Event Loop

const { performance, PerformanceObserver } = require('perf_hooks');
const { monitorEventLoopDelay } = require('perf_hooks');

console.log('🔍 DEBUGGING EVENT LOOP - Buscando el culpable...\n');

// 1. Monitor básico de Event Loop
const histogram = monitorEventLoopDelay({ resolution: 20 });
histogram.enable();

// 2. Interceptar timers para detectar operaciones pesadas
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;
const originalSetImmediate = global.setImmediate;

let timerCount = 0;
const activeTimers = new Map();

global.setTimeout = function(fn, delay, ...args) {
  const id = ++timerCount;
  const start = performance.now();
  
  const wrappedFn = function() {
    const duration = performance.now() - start;
    if (duration > 5) {
      console.log(`⏰ setTimeout ${id} tardó ${duration.toFixed(2)}ms`);
    }
    activeTimers.delete(id);
    return fn.apply(this, arguments);
  };
  
  activeTimers.set(id, { type: 'setTimeout', delay, start });
  return originalSetTimeout.call(this, wrappedFn, delay, ...args);
};

global.setInterval = function(fn, delay, ...args) {
  const id = ++timerCount;
  
  const wrappedFn = function() {
    const start = performance.now();
    const result = fn.apply(this, arguments);
    const duration = performance.now() - start;
    
    if (duration > 5) {
      console.log(`🔄 setInterval ${id} tardó ${duration.toFixed(2)}ms`);
    }
    
    return result;
  };
  
  activeTimers.set(id, { type: 'setInterval', delay });
  return originalSetInterval.call(this, wrappedFn, delay, ...args);
};

// 3. Interceptar operaciones de I/O
const fs = require('fs');
const originalReadFileSync = fs.readFileSync;
const originalWriteFileSync = fs.writeFileSync;

fs.readFileSync = function(...args) {
  const start = performance.now();
  const result = originalReadFileSync.apply(this, args);
  const duration = performance.now() - start;
  
  if (duration > 1) {
    console.log(`📖 fs.readFileSync tardó ${duration.toFixed(2)}ms - ${args[0]}`);
  }
  
  return result;
};

fs.writeFileSync = function(...args) {
  const start = performance.now();
  const result = originalWriteFileSync.apply(this, args);
  const duration = performance.now() - start;
  
  if (duration > 1) {
    console.log(`📝 fs.writeFileSync tardó ${duration.toFixed(2)}ms - ${args[0]}`);
  }
  
  return result;
};

// 4. Interceptar JSON operations
const originalStringify = JSON.stringify;
const originalParse = JSON.parse;

JSON.stringify = function(...args) {
  const start = performance.now();
  const result = originalStringify.apply(this, args);
  const duration = performance.now() - start;
  
  if (duration > 1) {
    console.log(`🔧 JSON.stringify tardó ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

JSON.parse = function(...args) {
  const start = performance.now();
  const result = originalParse.apply(this, args);
  const duration = performance.now() - start;
  
  if (duration > 1) {
    console.log(`🔧 JSON.parse tardó ${duration.toFixed(2)}ms`);
  }
  
  return result;
};

// 5. Monitor de CPU usage por tick
let lastCpuUsage = process.cpuUsage();
setInterval(() => {
  const currentCpuUsage = process.cpuUsage(lastCpuUsage);
  const userMs = currentCpuUsage.user / 1000;
  const systemMs = currentCpuUsage.system / 1000;
  
  if (userMs > 10 || systemMs > 10) {
    console.log(`🔥 CPU spike: User ${userMs.toFixed(1)}ms, System ${systemMs.toFixed(1)}ms`);
  }
  
  lastCpuUsage = process.cpuUsage();
}, 1000);

// 6. Reportar Event Loop delay cada 3 segundos
setInterval(() => {
  const delay = {
    min: histogram.min / 1000000,
    max: histogram.max / 1000000,
    mean: histogram.mean / 1000000,
    p99: histogram.percentile(99) / 1000000
  };
  
  console.log(`\n📊 Event Loop: Mean ${delay.mean.toFixed(2)}ms | P99 ${delay.p99.toFixed(2)}ms`);
  console.log(`🎯 Timers activos: ${activeTimers.size}`);
  
  // Mostrar timers más viejos
  const oldTimers = Array.from(activeTimers.entries())
    .filter(([id, timer]) => timer.start && (performance.now() - timer.start) > 5000)
    .slice(0, 3);
    
  if (oldTimers.length > 0) {
    console.log('⏰ Timers viejos:');
    oldTimers.forEach(([id, timer]) => {
      const age = performance.now() - timer.start;
      console.log(`   Timer ${id}: ${timer.type}, ${age.toFixed(0)}ms old`);
    });
  }
  
  histogram.reset();
}, 3000);

// 7. Detectar operaciones síncronas largas
const originalConsoleLog = console.log;
let logCallCount = 0;

console.log = function(...args) {
  logCallCount++;
  
  if (logCallCount % 100 === 0) {
    console.log(`📊 ${logCallCount} logs llamados`);
  }
  
  return originalConsoleLog.apply(this, args);
};

console.log('🎯 Interceptores instalados. Cargando tu aplicación...\n');

// 8. Cargar tu aplicación
require('dotenv').config();

try {
  console.log('📦 Cargando NestJS...');
  require('./dist/main.js');
  
  setTimeout(() => {
    console.log('\n🔍 RESUMEN después de 10 segundos:');
    console.log(`   Timers activos: ${activeTimers.size}`);
    console.log(`   Logs emitidos: ${logCallCount}`);
    
    if (activeTimers.size > 0) {
      console.log('\n⏰ Timers detectados:');
      activeTimers.forEach((timer, id) => {
        console.log(`   ${id}: ${timer.type} cada ${timer.delay}ms`);
      });
    }
  }, 10000);
  
} catch (error) {
  console.error('❌ Error cargando aplicación:', error);
  process.exit(1);
}