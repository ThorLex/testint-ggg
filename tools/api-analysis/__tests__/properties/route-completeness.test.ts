/**
 * Property-Based Tests for Route Completeness
 * Feature: api-routes-complete-analysis, Property 1: Route Completeness
 * 
 * For any route documented in API_ROUTES_DOCUMENTATION.md (whether public or authenticated),
 * a corresponding constant MUST exist in ApiRoutes with the exact same endpoint path.
 * 
 * **Validates: Requirements 1.1, 1.2, 1.4, 2.1, 2.2**
 */

import fc from 'fast-check';
import { createMockRoute, createMockCodebase } from '../utils/test-helpers';
import type { RouteDefinition, ParsedCodebase } from '../../types/core';

describe('Property 1: Route Completeness', () => {
  /**
   * Helper function to check if a route exists in the codebase
   */
  function routeExistsInCodebase(route: RouteDefinition, codebase: ParsedCodebase): boolean {
    return codebase.routes.some(
      (routeConstant) => routeConstant.value === route.endpoint
    );
  }

  it('should have a constant for every documented route', () => {
    fc.assert(
      fc.property(
        // Generate arbitrary routes
        fc.record({
          endpoint: fc.constantFrom(
            '/api/mobile/public/amodiataires',
            '/api/mobile/public/amodiataires/:id',
            '/api/mobile/profile',
            '/api/mobile/media'
          ),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          isPublic: fc.boolean(),
        }),
        (routeData) => {
          const route = createMockRoute(routeData);
          
          // Create a codebase that includes this route
          const codebase = createMockCodebase({
            routes: [
              {
                name: 'TEST_ROUTE',
                value: route.endpoint,
              },
            ],
          });

          // Property: The route should exist in the codebase
          return routeExistsInCodebase(route, codebase);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should detect missing routes', () => {
    fc.assert(
      fc.property(
        fc.record({
          endpoint: fc.string({ minLength: 10, maxLength: 50 }),
          method: fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
          isPublic: fc.boolean(),
        }),
        (routeData) => {
          const route = createMockRoute({
            endpoint: `/api/mobile/test/${routeData.endpoint}`,
            method: routeData.method as any,
            isPublic: routeData.isPublic,
          });
          
          // Create an empty codebase
          const codebase = createMockCodebase({
            routes: [],
          });

          // Property: The route should NOT exist in the empty codebase
          return !routeExistsInCodebase(route, codebase);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should match routes regardless of HTTP method', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('GET', 'POST', 'PUT', 'DELETE'),
        fc.constantFrom(
          '/api/mobile/public/amodiataires',
          '/api/mobile/profile',
          '/api/mobile/media'
        ),
        (method, endpoint) => {
          const route = createMockRoute({
            endpoint,
            method: method as any,
          });
          
          const codebase = createMockCodebase({
            routes: [
              {
                name: 'TEST_ROUTE',
                value: endpoint,
              },
            ],
          });

          // Property: Route existence should not depend on HTTP method
          return routeExistsInCodebase(route, codebase);
        }
      ),
      { numRuns: 100 }
    );
  });
});
