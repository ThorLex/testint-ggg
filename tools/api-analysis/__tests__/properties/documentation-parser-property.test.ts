/**
 * Property-Based Tests for Documentation Parser
 * Feature: api-routes-complete-analysis, Property 1: Route Completeness - Documentation Parsing
 * 
 * For any route documented in API_ROUTES_DOCUMENTATION.md, the parser MUST correctly extract:
 * - All route endpoints
 * - HTTP methods
 * - Public vs authenticated routes
 * - Query parameters and path parameters
 * 
 * **Validates: Requirements 1.1, 2.1**
 * 
 * NOTE: These tests validate the parser's EXPECTED behavior. If tests fail, it indicates
 * the parser needs to be fixed to correctly extract routes from the documentation.
 */

import fc from 'fast-check';
import * as fs from 'fs';
import * as path from 'path';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import type { ParsedDocumentation, RouteDefinition } from '../../types/core';

describe('Property 1: Route Completeness - Documentation Parsing', () => {
  let actualDocumentation: string;
  let parsedDoc: ParsedDocumentation;

  beforeAll(() => {
    // Read the actual API_ROUTES_DOCUMENTATION.md file from project root
    const docPath = path.join(process.cwd(), '..', '..', 'API_ROUTES_DOCUMENTATION.md');
    actualDocumentation = fs.readFileSync(docPath, 'utf-8');
    parsedDoc = parseApiDocumentation(actualDocumentation);
    
    // Debug: Log what was parsed
    console.log('\n=== Documentation Parser Results ===');
    console.log(`Public routes extracted: ${parsedDoc.publicRoutes.length}`);
    console.log(`Authenticated routes extracted: ${parsedDoc.authenticatedRoutes.length}`);
    console.log(`Error codes extracted: ${parsedDoc.errorCodes.length}`);
    console.log(`Response structures: ${Object.keys(parsedDoc.responseStructures).length}`);
    
    if (parsedDoc.publicRoutes.length > 0) {
      console.log('\nFirst public route:');
      console.log(`  Endpoint: ${parsedDoc.publicRoutes[0].endpoint}`);
      console.log(`  Method: ${parsedDoc.publicRoutes[0].method}`);
    }
    if (parsedDoc.authenticatedRoutes.length > 0) {
      console.log('\nFirst authenticated route:');
      console.log(`  Endpoint: ${parsedDoc.authenticatedRoutes[0].endpoint}`);
      console.log(`  Method: ${parsedDoc.authenticatedRoutes[0].method}`);
    }
    console.log('=====================================\n');
  });

  /**
   * Property: Parser must extract routes from documentation
   * 
   * The documentation contains multiple routes (at least 5 based on manual inspection).
   * The parser should extract all of them.
   */
  it('should extract routes from the documentation', () => {
    const totalRoutes = parsedDoc.publicRoutes.length + parsedDoc.authenticatedRoutes.length;
    
    // The actual API_ROUTES_DOCUMENTATION.md has at least 8 routes:
    // Public: /amodiataires, /amodiataires/:id, /amodiataires/nearby, 
    //         /amodiataires/:id/announcements, /amodiataires/:id/media
    // Authenticated: /profile (GET), /profile (PUT), /media (POST), /media (GET),
    //                /media/:mediaId (DELETE), /media/submit-validation (POST),
    //                /announcements (POST), /announcements (GET)
    expect(totalRoutes).toBeGreaterThanOrEqual(8);
  });

  /**
   * Property: Parser must be idempotent
   * 
   * Parsing the same documentation multiple times should produce
   * identical results.
   */
  it('should produce identical results when parsing the same documentation', () => {
    fc.assert(
      fc.property(
        fc.constant(actualDocumentation),
        (markdown) => {
          const parsed1 = parseApiDocumentation(markdown);
          const parsed2 = parseApiDocumentation(markdown);
          
          // Property: Same input should produce same output
          const samePublicRoutesCount = parsed1.publicRoutes.length === parsed2.publicRoutes.length;
          const sameAuthRoutesCount = parsed1.authenticatedRoutes.length === parsed2.authenticatedRoutes.length;
          const sameErrorCodesCount = parsed1.errorCodes.length === parsed2.errorCodes.length;
          
          return samePublicRoutesCount && sameAuthRoutesCount && sameErrorCodesCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: All extracted routes must have valid structure
   * 
   * This test only runs if routes were actually extracted.
   */
  describe('Route Structure Validation (if routes extracted)', () => {
    it('should extract routes with valid endpoints and methods', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - this indicates a parser bug that needs to be fixed');
        // Fail the test to indicate the parser needs fixing
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      // Validate each extracted route
      allRoutes.forEach((route, index) => {
        expect(route.endpoint).toBeDefined();
        expect(route.endpoint.length).toBeGreaterThan(0);
        expect(['GET', 'POST', 'PUT', 'DELETE']).toContain(route.method);
        expect(typeof route.isPublic).toBe('boolean');
      });
    });

    it('should correctly distinguish public vs authenticated routes', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      // Property: Routes with '/public/' should be in publicRoutes
      parsedDoc.publicRoutes.forEach(route => {
        expect(route.isPublic).toBe(true);
      });
      
      // Property: Routes without '/public/' should be in authenticatedRoutes
      parsedDoc.authenticatedRoutes.forEach(route => {
        expect(route.isPublic).toBe(false);
      });
    });

    it('should extract path parameters from routes with :param syntax', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      // Find routes with path parameters
      const routesWithPathParams = allRoutes.filter(r => r.endpoint.includes(':'));
      
      if (routesWithPathParams.length > 0) {
        routesWithPathParams.forEach(route => {
          const pathParamMatches = route.endpoint.match(/:(\w+)/g);
          expect(pathParamMatches).toBeDefined();
          expect(route.pathParams).toBeDefined();
          
          if (pathParamMatches && route.pathParams) {
            // Each :param in the endpoint should have a corresponding pathParam
            const expectedParams = pathParamMatches.map(p => p.substring(1));
            expectedParams.forEach(paramName => {
              const found = route.pathParams?.some(p => p.name === paramName);
              expect(found).toBe(true);
            });
          }
        });
      }
    });

    it('should extract query parameters with correct types', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      // Find routes with query parameters
      const routesWithQueryParams = allRoutes.filter(r => r.queryParams && r.queryParams.length > 0);
      
      if (routesWithQueryParams.length > 0) {
        routesWithQueryParams.forEach(route => {
          route.queryParams?.forEach(param => {
            expect(param.name).toBeDefined();
            expect(param.name.length).toBeGreaterThan(0);
            expect(['string', 'number', 'boolean']).toContain(param.type);
            expect(typeof param.required).toBe('boolean');
          });
        });
      }
    });

    it('should extract valid response body structures', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      // Find routes with response bodies
      const routesWithResponses = allRoutes.filter(r => r.responseBody);
      
      if (routesWithResponses.length > 0) {
        routesWithResponses.forEach(route => {
          expect(route.responseBody).toBeDefined();
          expect(['object', 'array', 'string', 'number', 'boolean']).toContain(route.responseBody!.type);
          
          if (route.responseBody!.type === 'object') {
            expect(route.responseBody!.properties).toBeDefined();
          }
        });
      }
    });

    it('should extract endpoints with valid URL patterns', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      allRoutes.forEach(route => {
        // Endpoint must start with '/'
        expect(route.endpoint.startsWith('/')).toBe(true);
        
        // Endpoint must not contain spaces
        expect(route.endpoint.includes(' ')).toBe(false);
        
        // Endpoint should follow URL path pattern
        expect(route.endpoint).toMatch(/^\/[\w\-\/:]*$/);
      });
    });

    it('should correctly identify required vs optional parameters', () => {
      const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
      
      if (allRoutes.length === 0) {
        console.warn('⚠️  Parser extracted 0 routes - skipping validation');
        expect(allRoutes.length).toBeGreaterThan(0);
        return;
      }
      
      allRoutes.forEach(route => {
        // Property: Path parameters should always be required
        route.pathParams?.forEach(param => {
          expect(param.required).toBe(true);
        });
        
        // Property: Query parameters can be optional or required
        route.queryParams?.forEach(param => {
          expect(typeof param.required).toBe('boolean');
        });
      });
    });
  });

  /**
   * Property: Parser must extract unique routes
   * 
   * No two routes should have the exact same endpoint and method combination.
   */
  it('should extract unique route endpoints', () => {
    const allRoutes = [...parsedDoc.publicRoutes, ...parsedDoc.authenticatedRoutes];
    
    if (allRoutes.length === 0) {
      console.warn('⚠️  Parser extracted 0 routes - skipping validation');
      expect(allRoutes.length).toBeGreaterThan(0);
      return;
    }
    
    const routeKeys = allRoutes.map(r => `${r.method} ${r.endpoint}`);
    const uniqueKeys = new Set(routeKeys);
    
    expect(routeKeys.length).toBe(uniqueKeys.size);
  });

  /**
   * Integration tests: Verify specific known routes are extracted
   */
  describe('Known Routes Verification', () => {
    it('should extract the amodiataires list route', () => {
      const listRoute = parsedDoc.publicRoutes.find(
        r => r.endpoint.includes('/amodiataires') && !r.endpoint.includes(':') && !r.endpoint.includes('nearby')
      );
      
      if (!listRoute) {
        console.warn('⚠️  Parser did not extract /amodiataires route - parser needs fixing');
      }
      
      expect(listRoute).toBeDefined();
      expect(listRoute?.method).toBe('GET');
      expect(listRoute?.isPublic).toBe(true);
    });

    it('should extract the amodiataire detail route', () => {
      const detailRoute = parsedDoc.publicRoutes.find(
        r => r.endpoint.includes('/amodiataires/:id') && !r.endpoint.includes('announcements') && !r.endpoint.includes('media')
      );
      
      if (!detailRoute) {
        console.warn('⚠️  Parser did not extract /amodiataires/:id route - parser needs fixing');
      }
      
      expect(detailRoute).toBeDefined();
      expect(detailRoute?.method).toBe('GET');
      expect(detailRoute?.pathParams?.some(p => p.name === 'id')).toBe(true);
    });

    it('should extract at least 8 routes from the documentation', () => {
      const totalRoutes = parsedDoc.publicRoutes.length + parsedDoc.authenticatedRoutes.length;
      
      if (totalRoutes < 8) {
        console.warn(`⚠️  Parser extracted only ${totalRoutes} routes, expected at least 8 - parser needs fixing`);
      }
      
      expect(totalRoutes).toBeGreaterThanOrEqual(8);
    });
  });
});
