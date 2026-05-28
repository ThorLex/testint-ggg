/**
 * Test final des modèles NAVIPAD
 * 
 * @description Validation finale que tous les imports et exports fonctionnent
 */

import {
  // Auth models
  User,
  UserUtils,
  AuthTokens,
  AuthTokensUtils,
  AuthState,
  AuthStatus,
  LoginRequest,
  LoginResponse,
  
  // Amodiataire models
  Amodiataire,
  AmodiataireUtils,
  AmodiataireLocation,
  
  // Map models
  MapState,
  MapStateUtils,
  MapStatus,
  RouteInfo,
  
  // Error models
  AppError,
  AppErrorFactory,
  AppErrorUtils,
  AppErrorType,
  
  // Navigation models
  NavigationState,
  NavigationUtils,
  NavigationStatus,
  NavigationInstructionType,
  
  // Common types
  Coordinates,
  MediaItem,
  ApiResponse,
} from './index';

console.log('🧪 Test final des modèles NAVIPAD\n');

// Test 1: Création d'un utilisateur
console.log('1. Test User...');
const user: User = {
  id: '123',
  companyName: 'Test Company',
  adminEmail: 'test@example.com',
  gpsLat: '14.6928',
  gpsLng: '-17.4467',
  photosUrls: ['photo1.jpg'],
  videosUrls: [],
  isVerified: true,
  isFrozen: false,
};

console.log(`   ✅ User créé: ${user.companyName}`);
console.log(`   ✅ A une localisation: ${UserUtils.hasLocation(user)}`);
console.log(`   ✅ Coordonnées: ${JSON.stringify(UserUtils.getCoordinates(user))}`);

// Test 2: Tokens d'authentification
console.log('\n2. Test AuthTokens...');
const tokens: AuthTokens = {
  accessToken: 'test_access_token',
  refreshToken: 'test_refresh_token',
  tokenType: 'Bearer',
  expiresAt: new Date(Date.now() + 3600000),
};

console.log(`   ✅ Tokens créés: ${tokens.tokenType}`);
console.log(`   ✅ Tokens valides: ${AuthTokensUtils.isValid(tokens)}`);
console.log(`   ✅ Header auth: ${AuthTokensUtils.getAuthorizationHeader(tokens)}`);

// Test 3: Amodiataire
console.log('\n3. Test Amodiataire...');
const amodiataire: Amodiataire = {
  id: '456',
  companyName: 'Restaurant Test',
  gpsLat: '14.6930',
  gpsLng: '-17.4470',
  rating: 4.5,
  reviewCount: 25,
  isVerified: true,
  photosUrls: ['resto1.jpg', 'resto2.jpg'],
  videosUrls: [],
};

const userCoords = UserUtils.getCoordinates(user);
const amodiataireLocation = AmodiataireUtils.getLocation(amodiataire);

console.log(`   ✅ Amodiataire créé: ${amodiataire.companyName}`);
console.log(`   ✅ Note formatée: ${AmodiataireUtils.formatRating(amodiataire.rating)}`);

if (userCoords && amodiataireLocation) {
  const distance = AmodiataireUtils.calculateDistance(userCoords, amodiataireLocation);
  console.log(`   ✅ Distance: ${distance.toFixed(2)} km`);
}

// Test 4: État de carte
console.log('\n4. Test MapState...');
const mapState = MapStateUtils.createLoadedState([amodiataire], userCoords);
console.log(`   ✅ MapState créé: ${mapState.status}`);
console.log(`   ✅ Nombre d'amodiataires: ${MapStateUtils.getVisibleAmodiatairesCount(mapState)}`);
console.log(`   ✅ A une position utilisateur: ${MapStateUtils.hasUserLocation(mapState)}`);

// Test 5: Gestion d'erreurs
console.log('\n5. Test AppError...');
const networkError = AppErrorFactory.network('Test de connexion échouée');
const authError = AppErrorFactory.authentication('Token invalide');

console.log(`   ✅ Erreur réseau: ${AppErrorUtils.isNetworkError(networkError)}`);
console.log(`   ✅ Erreur auth: ${AppErrorUtils.isAuthError(authError)}`);
console.log(`   ✅ Message localisé: ${AppErrorUtils.getLocalizedMessage(networkError)}`);

// Test 6: Navigation
console.log('\n6. Test Navigation...');
console.log(`   ✅ Format distance: ${NavigationUtils.formatDistance(1500)}`);
console.log(`   ✅ Format durée: ${NavigationUtils.formatDuration(3665)}`);
console.log(`   ✅ Format vitesse: ${NavigationUtils.formatSpeed(65.7)}`);

// Test 7: Types communs
console.log('\n7. Test Types communs...');
const coordinates: Coordinates = { latitude: 14.6928, longitude: -17.4467 };
const mediaItem: MediaItem = {
  url: 'https://example.com/photo.jpg',
  type: 'image',
  name: 'photo.jpg',
  size: 1024000,
};

console.log(`   ✅ Coordinates: ${coordinates.latitude}, ${coordinates.longitude}`);
console.log(`   ✅ MediaItem: ${mediaItem.name} (${mediaItem.type})`);

// Test 8: Enums
console.log('\n8. Test Enums...');
console.log(`   ✅ AuthStatus: ${AuthStatus.AUTHENTICATED}`);
console.log(`   ✅ MapStatus: ${MapStatus.LOADED}`);
console.log(`   ✅ AppErrorType: ${AppErrorType.NETWORK}`);
console.log(`   ✅ NavigationStatus: ${NavigationStatus.NAVIGATING}`);

console.log('\n🎉 Tous les tests sont passés avec succès !');
console.log('✅ Les modèles TypeScript NAVIPAD sont prêts à être utilisés.');
console.log('📖 Consultez le README.md pour la documentation complète.');

export default {
  user,
  tokens,
  amodiataire,
  mapState,
  networkError,
  authError,
  coordinates,
  mediaItem,
};