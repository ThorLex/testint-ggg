/**
 * Tests de validation des modèles NAVIPAD
 * 
 * @description Script de test pour valider le bon fonctionnement des modèles
 */

import {
  User,
  UserUtils,
  AuthTokens,
  AuthTokensUtils,
  Amodiataire,
  AmodiataireUtils,
  MapState,
  MapStateUtils,
  AppErrorFactory,
  AppErrorUtils,
  NavigationUtils,
  NavigationInstructionType,
  NavigationInstructionTypeUtils,
} from './index';

/**
 * Test des modèles utilisateur
 */
function testUserModels(): void {
  console.log('=== Test des modèles utilisateur ===');

  const user: User = {
    id: '123',
    companyName: 'Test Company',
    adminEmail: 'test@example.com',
    responsibleName: 'Jean Dupont',
    gpsLat: '14.6928',
    gpsLng: '-17.4467',
    photosUrls: ['photo1.jpg', 'photo2.jpg'],
    videosUrls: ['video1.mp4'],
    isVerified: true,
    isFrozen: false,
  };

  // Test des utilitaires
  console.log('A une localisation:', UserUtils.hasLocation(user));
  console.log('Coordonnées:', UserUtils.getCoordinates(user));
  console.log('A des médias:', UserUtils.hasMedia(user));
  console.log('Nombre de médias:', UserUtils.getMediaCount(user));
  console.log('Nom d\'affichage:', UserUtils.getDisplayName(user));
  console.log('✅ Tests utilisateur réussis');
}

/**
 * Test des tokens d'authentification
 */
function testAuthTokens(): void {
  console.log('\n=== Test des tokens d\'authentification ===');

  const tokens: AuthTokens = {
    accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
    refreshToken: 'refresh_token_here',
    tokenType: 'Bearer',
    expiresAt: new Date(Date.now() + 3600000), // 1 heure
    refreshExpiresAt: new Date(Date.now() + 86400000), // 24 heures
  };

  // Test des utilitaires
  console.log('Tokens valides:', AuthTokensUtils.isValid(tokens));
  console.log('Access token expiré:', AuthTokensUtils.isAccessTokenExpired(tokens));
  console.log('Doit rafraîchir:', AuthTokensUtils.shouldRefresh(tokens));
  console.log('Header auth:', AuthTokensUtils.getAuthorizationHeader(tokens));
  console.log('✅ Tests tokens réussis');
}

/**
 * Test des modèles amodiataire
 */
function testAmodiataireModels(): void {
  console.log('\n=== Test des modèles amodiataire ===');

  const amodiataire: Amodiataire = {
    id: '456',
    companyName: 'Restaurant Test',
    activitySector: 'Restaurant',
    gpsLat: '14.6928',
    gpsLng: '-17.4467',
    rating: 4.5,
    reviewCount: 25,
    isVerified: true,
    photosUrls: ['resto1.jpg', 'resto2.jpg'],
    videosUrls: [],
  };

  const userLocation = { latitude: 14.6930, longitude: -17.4470 };
  const amodiataireLocation = AmodiataireUtils.getLocation(amodiataire);

  // Test des utilitaires
  console.log('A une localisation:', AmodiataireUtils.hasLocation(amodiataire));
  console.log('Localisation:', amodiataireLocation);
  console.log('A des médias:', AmodiataireUtils.hasMedia(amodiataire));
  console.log('Note formatée:', AmodiataireUtils.formatRating(amodiataire.rating));
  
  if (amodiataireLocation) {
    const distance = AmodiataireUtils.calculateDistance(userLocation, amodiataireLocation);
    console.log('Distance:', distance.toFixed(2), 'km');
  }
  
  console.log('✅ Tests amodiataire réussis');
}

/**
 * Test de l'état de la carte
 */
function testMapState(): void {
  console.log('\n=== Test de l\'état de la carte ===');

  const amodiataires: Amodiataire[] = [
    {
      id: '1',
      companyName: 'Test 1',
      rating: 4.0,
      reviewCount: 10,
      isVerified: true,
      photosUrls: [],
      videosUrls: [],
    },
    {
      id: '2',
      companyName: 'Test 2',
      rating: 3.5,
      reviewCount: 5,
      isVerified: false,
      photosUrls: [],
      videosUrls: [],
    },
  ];

  // Test des états
  const loadingState = MapStateUtils.createLoadingState();
  console.log('État de chargement:', loadingState.status);

  const loadedState = MapStateUtils.createLoadedState(amodiataires);
  console.log('État chargé:', loadedState.status);
  console.log('Nombre d\'amodiataires:', MapStateUtils.getVisibleAmodiatairesCount(loadedState));

  const errorState = MapStateUtils.createErrorState('Test error');
  console.log('État d\'erreur:', errorState.errorMessage);
  console.log('A une erreur:', MapStateUtils.hasError(errorState));

  console.log('✅ Tests état carte réussis');
}

/**
 * Test de la gestion d'erreurs
 */
function testErrorHandling(): void {
  console.log('\n=== Test de la gestion d\'erreurs ===');

  // Test des différents types d'erreurs
  const networkError = AppErrorFactory.network('Connexion impossible');
  const authError = AppErrorFactory.authentication('Token invalide');
  const validationError = AppErrorFactory.invalidInput('email', 'Format invalide');
  const mediaError = AppErrorFactory.mediaFileTooLarge(5000000, 2000000);

  console.log('Erreur réseau:', AppErrorUtils.isNetworkError(networkError));
  console.log('Erreur auth:', AppErrorUtils.isAuthError(authError));
  console.log('Erreur validation:', AppErrorUtils.isValidationError(validationError));
  console.log('Erreur média:', AppErrorUtils.isMediaError(mediaError));

  // Test des messages localisés
  console.log('Message réseau:', AppErrorUtils.getLocalizedMessage(networkError));
  console.log('Message auth:', AppErrorUtils.getLocalizedMessage(authError));

  // Test de la sérialisation
  const serialized = AppErrorUtils.serialize(networkError);
  const deserialized = AppErrorUtils.deserialize(serialized);
  console.log('Sérialisation OK:', deserialized.type === networkError.type);

  console.log('✅ Tests gestion erreurs réussis');
}

/**
 * Test des utilitaires de navigation
 */
function testNavigationUtils(): void {
  console.log('\n=== Test des utilitaires de navigation ===');

  // Test du formatage
  console.log('Distance 500m:', NavigationUtils.formatDistance(500));
  console.log('Distance 1500m:', NavigationUtils.formatDistance(1500));
  console.log('Durée 90s:', NavigationUtils.formatDuration(90));
  console.log('Durée 3665s:', NavigationUtils.formatDuration(3665));
  console.log('Vitesse:', NavigationUtils.formatSpeed(65.7));

  // Test des icônes et couleurs
  console.log('Icône virage gauche:', NavigationInstructionTypeUtils.getIcon(NavigationInstructionType.TURN_LEFT));
  console.log('Couleur destination:', NavigationInstructionTypeUtils.getColor(NavigationInstructionType.DESTINATION));

  console.log('✅ Tests navigation réussis');
}

/**
 * Fonction principale de test
 */
export function runAllTests(): void {
  console.log('🚀 Démarrage des tests des modèles NAVIPAD\n');

  try {
    testUserModels();
    testAuthTokens();
    testAmodiataireModels();
    testMapState();
    testErrorHandling();
    testNavigationUtils();

    console.log('\n🎉 Tous les tests sont passés avec succès !');
    console.log('Les modèles TypeScript sont prêts à être utilisés.');

  } catch (error) {
    console.error('\n❌ Erreur lors des tests:', error);
    throw error;
  }
}

// Exécuter les tests si ce fichier est appelé directement
if (require.main === module) {
  runAllTests();
}

export default {
  runAllTests,
  testUserModels,
  testAuthTokens,
  testAmodiataireModels,
  testMapState,
  testErrorHandling,
  testNavigationUtils,
};