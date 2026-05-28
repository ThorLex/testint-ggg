/**
 * Unit tests for routes parser
 * Feature: api-routes-complete-analysis
 */

import { parseRoutesFile, findRouteByName, findDeprecatedRoutes, groupRoutesByCategory } from '../../src/parsers/routes-parser';
import * as path from 'path';

describe('Routes Parser', () => {
  // Path from tools/api-analysis/__tests__/parsers/ to src/services/api/routes.ts
  const routesFilePath = path.resolve(__dirname, '../../../../src/services/api/routes.ts');
  
  let parsedRoutes: ReturnType<typeof parseRoutesFile>;

  beforeAll(() => {
    parsedRoutes = parseRoutesFile(routesFilePath);
  });

  describe('parseRoutesFile', () => {
    it('should parse the routes file without errors', () => {
      expect(parsedRoutes).toBeDefined();
      expect(parsedRoutes.routes).toBeInstanceOf(Array);
      expect(parsedRoutes.utilityMethods).toBeInstanceOf(Array);
    });

    it('should extract BASE_URL constant', () => {
      expect(parsedRoutes.baseUrl).toBeDefined();
      expect(typeof parsedRoutes.baseUrl).toBe('string');
    });

    it('should extract API_KEY constant', () => {
      expect(parsedRoutes.apiKey).toBeDefined();
      expect(typeof parsedRoutes.apiKey).toBe('string');
    });

    it('should extract all route constants', () => {
      expect(parsedRoutes.routes.length).toBeGreaterThan(0);
      
      // Check for some known routes
      const routeNames = parsedRoutes.routes.map(r => r.name);
      expect(routeNames).toContain('PUBLIC_AMODIATAIRES_V2');
      expect(routeNames).toContain('PUBLIC_AMODIATAIRE_DETAILS_V2');
      expect(routeNames).toContain('PROFILE');
      expect(routeNames).toContain('MEDIA');
    });

    it('should extract route values correctly', () => {
      const publicAmodiatairesV2 = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRES_V2');
      expect(publicAmodiatairesV2).toBeDefined();
      expect(publicAmodiatairesV2?.value).toBe('/api/mobile/public/amodiataires');

      const profile = findRouteByName(parsedRoutes.routes, 'PROFILE');
      expect(profile).toBeDefined();
      expect(profile?.value).toBe('/api/mobile/profile');
    });

    it('should extract utility methods', () => {
      expect(parsedRoutes.utilityMethods.length).toBeGreaterThan(0);
      
      const methodNames = parsedRoutes.utilityMethods.map(m => m.name);
      expect(methodNames).toContain('getAmodiataireDetailsUrl');
      expect(methodNames).toContain('getAmodiataireAnnouncementsUrl');
      expect(methodNames).toContain('getAmodiataireMediaUrl');
      expect(methodNames).toContain('getFullUrl');
      expect(methodNames).toContain('buildQueryParams');
    });

    it('should extract method parameters correctly', () => {
      const getDetailsMethod = parsedRoutes.utilityMethods.find(
        m => m.name === 'getAmodiataireDetailsUrl'
      );
      
      expect(getDetailsMethod).toBeDefined();
      expect(getDetailsMethod?.parameters).toHaveLength(1);
      expect(getDetailsMethod?.parameters[0].name).toBe('id');
      expect(getDetailsMethod?.parameters[0].type).toBe('string');
    });

    it('should extract method return types correctly', () => {
      const getDetailsMethod = parsedRoutes.utilityMethods.find(
        m => m.name === 'getAmodiataireDetailsUrl'
      );
      
      expect(getDetailsMethod).toBeDefined();
      expect(getDetailsMethod?.returnType).toBe('string');
    });

    it('should identify which route a utility method uses', () => {
      const getDetailsMethod = parsedRoutes.utilityMethods.find(
        m => m.name === 'getAmodiataireDetailsUrl'
      );
      
      expect(getDetailsMethod).toBeDefined();
      expect(getDetailsMethod?.usesRoute).toBe('PUBLIC_AMODIATAIRE_DETAILS_V2');
    });

    it('should extract JSDoc comments', () => {
      const publicAmodiatairesV2 = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRES_V2');
      expect(publicAmodiatairesV2?.comment).toBeDefined();
      expect(publicAmodiatairesV2?.comment).toContain('Liste de tous les amodiataires');
    });

    it('should identify deprecated routes', () => {
      const deprecatedRoutes = findDeprecatedRoutes(parsedRoutes.routes);
      
      // The old routes should be marked as deprecated in comments
      // Check if any routes are marked as deprecated
      expect(Array.isArray(deprecatedRoutes)).toBe(true);
    });
  });

  describe('findRouteByName', () => {
    it('should find a route by name', () => {
      const route = findRouteByName(parsedRoutes.routes, 'PROFILE');
      expect(route).toBeDefined();
      expect(route?.name).toBe('PROFILE');
      expect(route?.value).toBe('/api/mobile/profile');
    });

    it('should return undefined for non-existent route', () => {
      const route = findRouteByName(parsedRoutes.routes, 'NON_EXISTENT_ROUTE');
      expect(route).toBeUndefined();
    });
  });

  describe('findDeprecatedRoutes', () => {
    it('should return an array', () => {
      const deprecated = findDeprecatedRoutes(parsedRoutes.routes);
      expect(Array.isArray(deprecated)).toBe(true);
    });

    it('should only include routes marked as deprecated', () => {
      const deprecated = findDeprecatedRoutes(parsedRoutes.routes);
      deprecated.forEach(route => {
        expect(route.deprecated).toBe(true);
      });
    });
  });

  describe('groupRoutesByCategory', () => {
    it('should group routes into categories', () => {
      const grouped = groupRoutesByCategory(parsedRoutes.routes);
      
      expect(grouped).toHaveProperty('base');
      expect(grouped).toHaveProperty('auth');
      expect(grouped).toHaveProperty('public');
      expect(grouped).toHaveProperty('authenticated');
      expect(grouped).toHaveProperty('media');
      expect(grouped).toHaveProperty('map');
      expect(grouped).toHaveProperty('google');
      expect(grouped).toHaveProperty('deprecated');
      expect(grouped).toHaveProperty('other');
    });

    it('should categorize BASE_URL correctly', () => {
      const grouped = groupRoutesByCategory(parsedRoutes.routes);
      const baseRoute = grouped.base.find(r => r.name === 'BASE_URL');
      expect(baseRoute).toBeDefined();
    });

    it('should categorize public routes correctly', () => {
      const grouped = groupRoutesByCategory(parsedRoutes.routes);
      const publicRoute = grouped.public.find(r => r.name === 'PUBLIC_AMODIATAIRES_V2');
      expect(publicRoute).toBeDefined();
    });

    it('should categorize authenticated routes correctly', () => {
      const grouped = groupRoutesByCategory(parsedRoutes.routes);
      const authRoute = grouped.authenticated.find(r => r.name === 'PROFILE');
      expect(authRoute).toBeDefined();
    });

    it('should categorize auth routes correctly', () => {
      const grouped = groupRoutesByCategory(parsedRoutes.routes);
      const loginRoute = grouped.auth.find(r => r.name === 'LOGIN');
      expect(loginRoute).toBeDefined();
    });
  });

  describe('Specific route validations', () => {
    it('should correctly parse PUBLIC_AMODIATAIRE_DETAILS_V2', () => {
      const route = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRE_DETAILS_V2');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/public/amodiataires/:id');
    });

    it('should correctly parse PUBLIC_AMODIATAIRES_NEARBY', () => {
      const route = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRES_NEARBY');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/public/amodiataires/nearby');
    });

    it('should correctly parse PUBLIC_AMODIATAIRE_ANNOUNCEMENTS', () => {
      const route = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRE_ANNOUNCEMENTS');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/public/amodiataires/:id/announcements');
    });

    it('should correctly parse PUBLIC_AMODIATAIRE_MEDIA', () => {
      const route = findRouteByName(parsedRoutes.routes, 'PUBLIC_AMODIATAIRE_MEDIA');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/public/amodiataires/:id/media');
    });

    it('should correctly parse MEDIA_DELETE', () => {
      const route = findRouteByName(parsedRoutes.routes, 'MEDIA_DELETE');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/media/:mediaId');
    });

    it('should correctly parse MEDIA_SUBMIT_VALIDATION', () => {
      const route = findRouteByName(parsedRoutes.routes, 'MEDIA_SUBMIT_VALIDATION');
      expect(route).toBeDefined();
      expect(route?.value).toBe('/api/mobile/media/submit-validation');
    });
  });

  describe('Utility method validations', () => {
    it('should correctly parse getAmodiataireAnnouncementsUrl', () => {
      const method = parsedRoutes.utilityMethods.find(
        m => m.name === 'getAmodiataireAnnouncementsUrl'
      );
      
      expect(method).toBeDefined();
      expect(method?.parameters).toHaveLength(2);
      expect(method?.parameters[0].name).toBe('id');
      expect(method?.parameters[0].type).toBe('string');
      expect(method?.parameters[1].name).toBe('params');
      expect(method?.usesRoute).toBe('PUBLIC_AMODIATAIRE_ANNOUNCEMENTS');
    });

    it('should correctly parse getAmodiataireMediaUrl', () => {
      const method = parsedRoutes.utilityMethods.find(
        m => m.name === 'getAmodiataireMediaUrl'
      );
      
      expect(method).toBeDefined();
      expect(method?.parameters).toHaveLength(2);
      expect(method?.parameters[0].name).toBe('id');
      expect(method?.parameters[0].type).toBe('string');
      expect(method?.parameters[1].name).toBe('params');
      expect(method?.usesRoute).toBe('PUBLIC_AMODIATAIRE_MEDIA');
    });

    it('should correctly parse getFullUrl', () => {
      const method = parsedRoutes.utilityMethods.find(
        m => m.name === 'getFullUrl'
      );
      
      expect(method).toBeDefined();
      expect(method?.parameters).toHaveLength(2);
      expect(method?.parameters[0].name).toBe('endpoint');
      expect(method?.parameters[0].type).toBe('string');
      expect(method?.parameters[1].name).toBe('queryParams');
      expect(method?.returnType).toBe('string');
    });

    it('should correctly parse buildQueryParams', () => {
      const method = parsedRoutes.utilityMethods.find(
        m => m.name === 'buildQueryParams'
      );
      
      expect(method).toBeDefined();
      expect(method?.parameters).toHaveLength(1);
      expect(method?.parameters[0].name).toBe('params');
      expect(method?.returnType).toBe('string');
    });
  });
});
