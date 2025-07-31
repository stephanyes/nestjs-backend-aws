#!/usr/bin/env node

// diagnose-nestjs.js
// Script para diagnosticar problemas con tu servidor NestJS

const fs = require('fs');
const path = require('path');

console.log('🔍 Diagnosticando tu setup de NestJS...\n');

// 1. Verificar archivos
console.log('📁 Verificando archivos:');
const distPath = './dist';
const mainFile = './dist/main.js';
const indexFile = './dist/index.js';

if (!fs.existsSync(distPath)) {
  console.log('❌ Carpeta ./dist no existe');
  console.log('💡 Ejecutá: npm run build');
  process.exit(1);
} else {
  console.log('✅ Carpeta ./dist existe');
}

if (fs.existsSync(mainFile)) {
  console.log('✅ ./dist/main.js existe');
} else if (fs.existsSync(indexFile)) {
  console.log('✅ ./dist/index.js existe');
} else {
  console.log('❌ No se encuentra ./dist/main.js ni ./dist/index.js');
  console.log('💡 Ejecutá: npm run build');
  process.exit(1);
}

// 2. Verificar package.json
console.log('\n📦 Verificando dependencias:');
try {
  const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
  
  const requiredDeps = ['@nestjs/core', 'pino'];
  const optionalDeps = ['pino-http', 'pino-pretty'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} instalado`);
    } else {
      console.log(`❌ ${dep} NO encontrado`);
    }
  });
  
  optionalDeps.forEach(dep => {
    if (packageJson.dependencies?.[dep] || packageJson.devDependencies?.[dep]) {
      console.log(`✅ ${dep} instalado`);
    } else {
      console.log(`⚠️  ${dep} no instalado (opcional)`);
    }
  });
  
} catch (error) {
  console.log('❌ Error leyendo package.json:', error.message);
}

// 3. Verificar si node_modules existe
console.log('\n📚 Verificando node_modules:');
if (fs.existsSync('./node_modules')) {
  console.log('✅ node_modules existe');
  
  // Verificar pino específicamente
  if (fs.existsSync('./node_modules/pino')) {
    console.log('✅ Pino instalado');
  } else {
    console.log('❌ Pino NO instalado');
    console.log('💡 Ejecutá: npm install pino');
  }
  
  if (fs.existsSync('./node_modules/pino-http')) {
    console.log('✅ Pino-http instalado');
  } else {
    console.log('⚠️  Pino-http no instalado');
  }
  
} else {
  console.log('❌ node_modules no existe');
  console.log('💡 Ejecutá: npm install');
  process.exit(1);
}

// 4. Probar cargar el servidor sin monitoreo
console.log('\n🧪 Probando cargar tu servidor...');
try {
  const serverPath = fs.existsSync(mainFile) ? mainFile : indexFile;
  console.log(`Intentando cargar: ${serverPath}`);
  
  // Capturar errores específicos
  process.on('uncaughtException', (error) => {
    if (error.message.includes('stringifySym')) {
      console.log('\n❌ Error específico de Pino detectado!');
      console.log('🔧 Soluciones:');
      console.log('   1. Verificá la versión de pino y pino-http sean compatibles');
      console.log('   2. Ejecutá: npm install pino@latest pino-http@latest');
      console.log('   3. Limpiá node_modules: rm -rf node_modules && npm install');
      console.log('   4. Si usás pino-http, verificá que esté bien configurado');
      process.exit(1);
    } else {
      console.log('\n❌ Error inesperado:', error.message);
      console.log('Stack trace:', error.stack);
      process.exit(1);
    }
  });
  
  console.log('Cargando servidor...');
  require(path.resolve(serverPath));
  
  // Si llegamos aquí, el servidor cargó bien
  setTimeout(() => {
    console.log('\n✅ Tu servidor se carga correctamente!');
    console.log('🎯 Ahora podés usar: node elu.js');
    process.exit(0);
  }, 2000);
  
} catch (error) {
  console.log('\n❌ Error cargando el servidor:');
  console.log('   ', error.message);
  
  if (error.message.includes('stringifySym')) {
    console.log('\n🔧 Este es un problema de compatibilidad de Pino');
    console.log('Ejecutá estos comandos:');
    console.log('  npm install pino@latest pino-http@latest');
    console.log('  npm run build');
    console.log('  node elu.js');
  }
  
  process.exit(1);
}