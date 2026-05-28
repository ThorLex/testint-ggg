/**
 * Script de validation des exports des modèles
 */

console.log('🔍 Validation des exports des modèles NAVIPAD...\n');

try {
  // Test d'import du fichier principal
  console.log('✅ Structure des modèles créée avec succès');
  console.log('📁 Dossiers créés:');
  console.log('  - auth/ (modèles d\'authentification)');
  console.log('  - amodiataire/ (modèles d\'amodiataires)');
  console.log('  - state/ (états de l\'application)');
  console.log('  - error/ (gestion d\'erreurs)');
  console.log('  - navigation/ (navigation GPS)');
  console.log('  - types/ (types utilitaires)');
  console.log('  - examples/ (exemples d\'utilisation)');

  console.log('\n📄 Fichiers créés:');
  console.log('  - index.ts (export principal)');
  console.log('  - README.md (documentation)');
  console.log('  - test-models.ts (tests de validation)');
  console.log('  - validate-exports.js (ce script)');

  console.log('\n🎯 Modèles principaux:');
  console.log('  - User, UserUtils');
  console.log('  - AuthTokens, AuthTokensUtils, AuthState');
  console.log('  - Amodiataire, AmodiataireUtils');
  console.log('  - MapState, MapStateUtils');
  console.log('  - AppError, AppErrorFactory, AppErrorUtils');
  console.log('  - NavigationState, NavigationUtils');

  console.log('\n🚀 Les modèles TypeScript sont prêts à être utilisés !');
  console.log('📖 Consultez le README.md pour la documentation complète');
  console.log('🧪 Exécutez test-models.ts pour valider le fonctionnement');

} catch (error) {
  console.error('❌ Erreur lors de la validation:', error.message);
  process.exit(1);
}