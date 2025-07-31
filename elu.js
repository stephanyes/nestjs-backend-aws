#!/usr/bin/env node

// start-with-monitoring.js
// Script para levantar tu servidor NestJS con monitoreo del Event Loop

const EventLoopMonitor = require('./eventloop-monitor');
const path = require('path');

// IMPORTANTE: Cargar variables de entorno ANTES que NestJS
require('dotenv').config();

// Detectar tu archivo principal - busca main.js o index.js en dist
let mainFile = process.argv[2];
if (!mainFile) {
  const fs = require('fs');
  if (fs.existsSync('./dist/main.js')) {
    mainFile = './dist/main.js';
  } else if (fs.existsSync('./dist/index.js')) {
    mainFile = './dist/index.js';
  } else {
    console.error('❌ No se encontró ./dist/main.js ni ./dist/index.js');
    console.log('💡 Uso: node start-with-monitoring.js <ruta-a-tu-servidor>');
    process.exit(1);
  }
}

console.log(`🚀 Iniciando servidor NestJS ${mainFile} con monitoreo del Event Loop...`);
console.log(`🔧 Puerto configurado: ${process.env.PORT || '3000'}`);

// Para NestJS, no interceptamos modules automáticamente
// porque puede causar problemas con el DI container

// Manejar shutdown graceful
const cleanup = () => {
  console.log('\n🛑 Cerrando servidor y monitor...');
  if (global.eventLoopMonitor) {
    global.eventLoopMonitor.stop();
  }
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);

// Manejar errores
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  if (global.eventLoopMonitor) {
    global.eventLoopMonitor.stop();
  }
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection:', reason);
  if (global.eventLoopMonitor) {
    global.eventLoopMonitor.stop();
  }
  process.exit(1);
});

// PASO 1: Cargar tu servidor NestJS PRIMERO (sin monitoreo)
try {
  const appPath = path.resolve(mainFile);
  console.log(`📦 Cargando servidor NestJS desde: ${appPath}`);
  
  // Interceptar console.log para detectar cuando el servidor esté listo
  const originalLog = console.log;
  let serverReady = false;
  
  console.log = function(...args) {
    const message = args.join(' ');
    
    // Mostrar el mensaje original
    originalLog.apply(console, args);
    
    // Detectar mensajes típicos de NestJS cuando está listo
    if (message.includes('listening on') || 
        message.includes('Application is running on') ||
        message.includes('server started') ||
        message.includes('Server running on') ||
        message.includes('Nest application successfully started') ||
        message.includes(':3000') ||
        message.includes('port 3000')) {
      
      if (!serverReady) {
        serverReady = true;
        console.log = originalLog; // Restaurar console.log
        originalLog(`✅ Servidor NestJS detectado como LISTO!`);
        
        // Verificar conectividad antes de iniciar monitoreo
        setTimeout(verifyAndStartMonitoring, 2000);
      }
    }
  };
  
  // Función para verificar conectividad y luego iniciar monitoreo
  function verifyAndStartMonitoring() {
    const { spawn } = require('child_process');
    const port = process.env.PORT || '3000';
    
    console.log(`🔌 Verificando que el servidor responda en puerto ${port}...`);
    
    const curlProcess = spawn('curl', ['-s', '-m', '3', '-o', '/dev/null', '-w', '%{http_code}', `http://localhost:${port}/`]);
    
    let responseCode = '';
    curlProcess.stdout.on('data', (data) => {
      responseCode = data.toString().trim();
    });
    
    curlProcess.on('close', (code) => {
      if (code === 0 && responseCode) {
        console.log(`✅ Servidor responde en puerto ${port} con código: ${responseCode}`);
        startMonitoring();
      } else {
        console.log(`⚠️  No se pudo verificar conectividad en puerto ${port}, iniciando monitoreo anyway...`);
        startMonitoring();
      }
    });
    
    curlProcess.on('error', (err) => {
      console.log(`⚠️  Error verificando conectividad: ${err.message}, iniciando monitoreo anyway...`);
      startMonitoring();
    });
  }
  
  // Función para iniciar monitoreo
  function startMonitoring() {
    console.log(`🎯 Iniciando monitoreo del Event Loop...\n`);
    
    // Configurar archivo de log
    const logFile = process.env.EL_LOG_FILE || './event-loop.log';
    
    // Configurar el monitor DESPUÉS de que NestJS esté cargado
    const monitor = new EventLoopMonitor({
      logInterval: 5000, // Cada 5 segundos para load testing
      logFile: logFile, // Escribir a archivo
      histogram: true,
      gc: true,
      functions: false // No interceptamos funciones en NestJS
    });
    
    // Guardar referencia global para cleanup
    global.eventLoopMonitor = monitor;
    
    // Iniciar el monitor
    monitor.start();
    
    const port = process.env.PORT || '3000';
    console.log(`📊 Monitoreo activo → logs en: ${logFile}`);
    console.log(`💡 Tip: tail -f ${logFile} | jq . (para ver logs en tiempo real)`);
    console.log(`🔥 Listo para load testing!`);
    console.log(`🎯 Comando de prueba: autocannon -c 10 -d 30 -R 100 http://localhost:${port}/\n`);
  }
  
  // Cargar el servidor
  require(appPath);
  
  // Fallback: Si no detectamos mensaje de "listo" en 15 segundos, iniciar monitoreo anyway
  setTimeout(() => {
    if (!serverReady) {
      console.log(`⚠️  No se detectó mensaje de servidor listo en 15 segundos, iniciando monitoreo anyway...`);
      console.log = originalLog; // Restaurar console.log
      startMonitoring();
    }
  }, 15000);
  
} catch (error) {
  console.error('❌ Error cargando el servidor NestJS:');
  console.error('   ', error.message);
  console.error('\n💡 Debug:');
  console.error('   1. ¿Funciona "node dist/main.js" solo?');
  console.error('   2. ¿Está configurado el puerto en .env?');
  console.error('   3. ¿Hay algún error en los logs?');
  console.error('\n🔍 Probá primero:');
  console.error('   node dist/main.js');
  console.error('   curl http://localhost:3000/');
  process.exit(1);
}