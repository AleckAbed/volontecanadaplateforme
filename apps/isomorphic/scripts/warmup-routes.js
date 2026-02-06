/**
 * Script pour pré-compiler les routes principales
 * Élimine la latence de compilation à la demande en mode dev
 * 
 * Usage: node scripts/warmup-routes.js
 */

const routes = [
  'http://localhost:3001',
  'http://localhost:3001/signin',
  'http://localhost:3001/project',
  'http://localhost:3001/analytics',
  'http://localhost:3001/appointment',
  'http://localhost:3001/appointment/list',
  'http://localhost:3001/ecommerce',
  'http://localhost:3001/ecommerce/products',
  'http://localhost:3001/ecommerce/orders',
  'http://localhost:3001/widgets/cards',
  'http://localhost:3001/widgets/charts',
  'http://localhost:3001/forms/profile-settings',
  'http://localhost:3001/social-media',
  'http://localhost:3001/financial',
  'http://localhost:3001/executive',
  // Ajoutez d'autres routes que vous utilisez fréquemment
];

async function checkServerReady() {
  console.log('⏳ Attente du démarrage du serveur...');
  let attempts = 0;
  const maxAttempts = 30;
  
  while (attempts < maxAttempts) {
    try {
      await fetch('http://localhost:3001', { redirect: 'manual' });
      console.log('✅ Serveur prêt!\n');
      return true;
    } catch (error) {
      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
      process.stdout.write('.');
    }
  }
  
  console.log('\n❌ Timeout: Le serveur ne répond pas après 30 secondes');
  return false;
}

async function warmup() {
  const isReady = await checkServerReady();
  if (!isReady) return;
  
  console.log('🔥 Pré-compilation des routes...\n');
  console.log(`📊 ${routes.length} routes à compiler\n`);
  
  let compiled = 0;
  let failed = 0;
  
  for (const route of routes) {
    try {
      const startTime = Date.now();
      const routePath = route.replace('http://localhost:3001', '') || '/';
      process.stdout.write(`📍 [${compiled + failed + 1}/${routes.length}] ${routePath} ... `);
      
      await fetch(route, { 
        redirect: 'manual' // Ignorer les redirections d'auth
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ ${duration}ms`);
      compiled++;
      
      // Petite pause pour ne pas surcharger
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.log(`⚠️  Erreur`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`✨ Warmup terminé!`);
  console.log(`   ✅ ${compiled} routes compilées`);
  if (failed > 0) {
    console.log(`   ⚠️  ${failed} routes en erreur (normal si protégées)`);
  }
  console.log('='.repeat(50));
  console.log('\n🚀 Vous pouvez maintenant naviguer sans latence!\n');
}

warmup().catch(console.error);

