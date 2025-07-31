#!/usr/bin/env node

// debug-server.js
// Script para verificar qué está pasando con tu servidor

const fs = require('fs');
const { spawn } = require('child_process');

console.log('🔍 Debuggeando tu servidor NestJS...\n');

// Paso 1: Verificar que el archivo existe
const mainFile = './dist/main.js';
if (!fs.existsSync(mainFile)) {
  console.error('❌ No existe ./dist/main.js');
  console.error('💡 Ejecutá: npm run build');
  process.exit(1);
}

console.log('✅ ./dist/main.js existe');

// Paso 2: Ejecutar el servidor directamente y capturar su output
console.log('🚀 Ejecutando tu servidor directamente...\n');

const serverProcess = spawn('node', ['dist/main.js'], {
  stdio: ['inherit', 'pipe', 'pipe']
});

let serverOutput = '';
let serverError = '';
let serverReady = false;

// Capturar stdout
serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  serverOutput += output;
  process.stdout.write(output); // Mostrar en tiempo real
  
  // Detectar si el servidor está listo
  if (output.includes('listening') || 
      output.includes('Application is running') ||
      output.includes('Server running') ||
      output.includes('started')) {
    serverReady = true;
    
    // Esperar un poco y hacer test de conectividad
    setTimeout(testConnectivity, 2000);
  }
});

// Capturar stderr
serverProcess.stderr.on('data', (data) => {
  const error = data.toString();
  serverError += error;
  process.stderr.write(`🔴 ${error}`);
});

// Cuando el proceso termine
serverProcess.on('close', (code) => {
  console.log(`\n📊 Servidor terminó con código: ${code}`);
  
  if (code !== 0) {
    console.log('\n❌ Tu servidor no se está levantando correctamente');
    console.log('\n📝 Output completo:');
    console.log(serverOutput);
    
    if (serverError) {
      console.log('\n🔴 Errores:');
      console.log(serverError);
    }
  }
  
  process.exit(code);
});

// Función para testear conectividad
function testConnectivity() {
  console.log('\n🔌 Testeando conectividad...');
  
  // Extraer puerto del output (si está)
  const portMatch = serverOutput.match(/(?:port|:)\s*(\d+)/i);
  const port = portMatch ? portMatch[1] : '3000';
  
  console.log(`🎯 Probando puerto ${port}...`);
  
  // Test con curl
  const curlProcess = spawn('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', `http://localhost:${port}/`]);
  
  curlProcess.on('close', (code) => {
    if (code === 0) {
      console.log(`✅ Servidor responde en puerto ${port}!`);
      console.log(`\n🎯 Tu servidor está funcionando correctamente`);
      console.log(`📊 Podés usar el elu.js ahora`);
      
      // Test básico de autocannon
      console.log(`\n🧪 Test básico con autocannon:`);
      const testProcess = spawn('autocannon', ['-c', '1', '-d', '3', `http://localhost:${port}/`], {
        stdio: 'inherit'
      });
      
      testProcess.on('close', () => {
        console.log(`\n✅ Todo funciona! Matá este proceso y usá el elu.js`);
        process.exit(0);
      });
      
    } else {
      console.log(`❌ No se puede conectar al puerto ${port}`);
      console.log(`💡 Verificá el puerto en el output del servidor`);
    }
  });
}

// Matar el servidor después de 30 segundos si no está listo
setTimeout(() => {
  if (!serverReady) {
    console.log('\n⏰ Timeout: El servidor no mostró mensaje de "listo" en 30 segundos');
    console.log('\n📝 Output capturado:');
    console.log(serverOutput);
    
    if (serverError) {
      console.log('\n🔴 Errores capturados:');
      console.log(serverError);
    }
    
    serverProcess.kill();
  }
}, 30000);

// Cleanup al salir
process.on('SIGINT', () => {
  console.log('\n🛑 Matando servidor...');
  serverProcess.kill();
  process.exit(0);
});