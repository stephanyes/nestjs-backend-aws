#!/usr/bin/env node

// debug-timer-stacks.js
// Rastrear exactamente QUÉ está ejecutando cada timer

const { performance } = require('perf_hooks');

console.log('🔍 RASTREANDO STACK TRACES DE TIMERS...\n');

// Interceptar timers y capturar stack traces CORRECTAMENTE
const originalSetTimeout = global.setTimeout;
const originalSetInterval = global.setInterval;

let timerCount = 0;
const timerInfo = new Map();

global.setTimeout = function(fn, delay, ...args) {
  const id = ++timerCount;
  
  // Capturar stack trace DEL CALLER, no del wrapper
  const error = new Error();
  Error.captureStackTrace(error, global.setTimeout);
  const creationStack = error.stack;
  
  // Extraer información del caller
  const callerInfo = getCallerInfo(creationStack);
  
  console.log(`\n⏰ setTimeout ${id} creado (${delay}ms):`);
  console.log(`📍 ${callerInfo}`);
  
  const wrappedFn = function() {
    const start = performance.now();
    
    try {
      const result = fn.apply(this, arguments);
      
      const duration = performance.now() - start;
      if (duration > 1) {
        console.log(`\n🔥 setTimeout ${id} EJECUTÓ por ${duration.toFixed(2)}ms`);
        console.log(`📍 Era de: ${callerInfo}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ Error en setTimeout ${id}:`, error.message);
    }
  };
  
  timerInfo.set(id, { 
    type: 'setTimeout', 
    delay, 
    caller: callerInfo,
    created: Date.now()
  });
  
  return originalSetTimeout.call(this, wrappedFn, delay, ...args);
};

global.setInterval = function(fn, delay, ...args) {
  const id = ++timerCount;
  
  // Capturar stack trace DEL CALLER
  const error = new Error();
  Error.captureStackTrace(error, global.setInterval);
  const creationStack = error.stack;
  
  const callerInfo = getCallerInfo(creationStack);
  
  console.log(`\n🔄 setInterval ${id} creado (cada ${delay}ms):`);
  console.log(`📍 ${callerInfo}`);
  
  let executionCount = 0;
  
  const wrappedFn = function() {
    executionCount++;
    const start = performance.now();
    
    try {
      const result = fn.apply(this, arguments);
      
      const duration = performance.now() - start;
      if (duration > 1) {
        console.log(`\n🔥 setInterval ${id} (exec #${executionCount}) tardó ${duration.toFixed(2)}ms`);
        console.log(`📍 Era de: ${callerInfo}`);
      }
      
      return result;
    } catch (error) {
      console.log(`❌ Error en setInterval ${id}:`, error.message);
    }
  };
  
  timerInfo.set(id, { 
    type: 'setInterval', 
    delay, 
    caller: callerInfo,
    created: Date.now()
  });
  
  return originalSetInterval.call(this, wrappedFn, delay, ...args);
};

// Función para extraer información útil del stack trace
function getCallerInfo(stack) {
  const lines = stack.split('\n');
  
  // Buscar primera línea que sea tu código (no node_modules, no este script)
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    
    if (line.includes('debug-timer') || line.includes('node_modules')) {
      continue; // Skip wrapper y node_modules
    }
    
    // Si contiene /dist/ es tu código compilado
    if (line.includes('/dist/')) {
      return line.trim();
    }
    
    // Si contiene tu path del proyecto
    if (line.includes('nestjs-aws-dynamodb') && 
        !line.includes('node_modules') && 
        !line.includes('debug-timer')) {
      return line.trim();
    }
  }
  
  // Fallback: mostrar las primeras líneas no-node_modules
  for (let i = 1; i < Math.min(lines.length, 5); i++) {
    const line = lines[i];
    if (!line.includes('node_modules') && !line.includes('debug-timer')) {
      return line.trim();
    }
  }
  
  return 'No se pudo identificar el caller';
}

// Cargar aplicación
require('dotenv').config();

console.log('📦 Cargando NestJS con rastreador de timers...\n');

try {
  require('./dist/main.js');
  
  setTimeout(() => {
    console.log('\n🎯 RESUMEN FINAL:');
    console.log(`Total de timers creados: ${timerCount}\n`);
    
    console.log('📈 Todos los timers detectados:');
    timerInfo.forEach((info, id) => {
      console.log(`\n   Timer ${id}: ${info.type} - ${info.delay}ms`);
      console.log(`   📍 ${info.caller}`);
    });
      
  }, 10000);
  
} catch (error) {
  console.error('❌ Error:', error);
}