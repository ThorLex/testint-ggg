/**
 * Property-Based Tests for Hook Analyzer
 * Feature: api-routes-complete-analysis, Task 6.3
 * 
 * Property 6: Hook Existence for Endpoints - For any documented API endpoint, 
 * a corresponding React Query hook MUST exist in useApi.ts that uses the correct 
 * route constant from ApiRoutes.
 * 
 * Property 7: Deprecated Route Detection - For any hook that uses a route constant 
 * marked as deprecated in ApiRoutes, the analysis MUST identify that hook for 
 * migration to the recommended v2 route.
 * 
 * Property 8: Query Parameter Consistency - For any documented endpoint with query 
 * parameters, the corresponding hook MUST accept parameters that match the documented 
 * parameter names and types.
 * 
 * Property 9: Cache Invalidation for Mutations - For any mutation hook (POST, PUT, 
 * DELETE operations), the hook MUST call queryClient.invalidateQueries with the 
 * appropriate query keys upon successful mutation.
 * 
 * Property 10: Query Key Uniqueness - For any React Query hook, the query key MUST 
 * be unique and include all parameters that differentiate cached data (e.g., ID, 
 * search params, filters).
 * 
 * **Validates: Requirements 5.1 (Property 6), Requirements 5.7 (Property 7), 
 * Requirements 7.1-7.5 (Property 8), Requirements 14.1-14.6 (Property 9), 
 * Requirements 13.1-13.8 (Property 10)**
 */

import fc from 'fast-check';
import * as path from 'path';
import * as fs from 'fs';
import { analyzeHooks } from '../../src/analyzers/hook-analyzer';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { parseApiHooks } from '../../src/parsers/hooks-parser';
import { parseRoutesFile } from '../../src/parsers/routes-parser';
import {
  ParsedDocumentation,
  RouteDefinition,
  HookDefinition,
} from '../../types/core';
import { ParsedRoutes } from '../../src/parsers/routes-parser';

describe('Property-Based Tests for Hook Analyzer', () => {
  
  // Paths to actual files
  const DOCS_PATH = path.resolve(__dirname, '../../../../API_ROUTES_DOCUMENTATION.md');
  const HOOKS_PATH = path.resolve(__dirname, '../../../../src/hooks/useApi.ts');
  const ROUTES_PATH = path.resolve(__dirname, '../../../../src/services/api/routes.ts');

  // Load real data once for all tests
  let realDocumentation: ParsedDocumentation;
  let realHooks: HookDefinition[];
  let realParsedRoutes: ParsedRoutes;

  beforeAll(() => {
    // Parse real documentation, hooks, and routes
    const documentationContent = fs.readFileSync(DOCS_PATH, 'utf-8');
    realDocumentation = parseApiDocumentation(documentationContent);
    realHooks = parseApiHooks(HOOKS_PATH);
    realParsedRoutes = parseRoutesFile(ROUTES_PATH);
  });

  /**
   * Property 6: Hook Existence for Endpoints
   * 
   * For any documented API endpoint, a corresponding React Query hook MUST exist
   * in useApi.ts that uses the correct route constant from ApiRoutes.
   * 
   * **Validates: Requirements 5.1**
   */
  describe('Property 6: Hook Existence for Endpoints', () => {
    it('should find a matching hook for any documented endpoint', () => {
      fc.assert(
        fc.property(
          // Generate test cases from all documented routes (public + authenticated)
          fc.constantFrom(
            ...realDocumentation.publicRoutes,
            ...realDocumentation.authenticatedRoutes
          ),
          (documentedRoute) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this specific route has a MISSING_HOOK issue
            const hasMissingHookIssue = result.issues.some(
              issue => 
                issue.type === 'MISSING_HOOK' && 
                issue.route?.endpoint === documentedRoute.endpoint &&
                issue.route?.method === documentedRoute.method
            );
            
            // If there's a missing hook issue, the property fails
            // (we expect all documented endpoints to have matching hooks)
            if (hasMissingHookIssue) {
              // Log for debugging
              console.log(`Missing hook found for: ${documentedRoute.method} ${documentedRoute.endpoint}`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect missing hooks when hook implementation is incomplete', () => {
      fc.assert(
        fc.property(
          // Generate arbitrary subsets of hooks (simulating incomplete implementation)
          fc.integer({ min: 0, max: Math.max(1, realHooks.length - 1) }),
          (numHooksToKeep) => {
            // Create a modified hooks array with only a subset
            const hookSubset = realHooks.slice(0, numHooksToKeep);
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, hookSubset, realParsedRoutes);
            
            // The number of missing hooks should be at least the difference
            // between total documented routes and implemented hooks
            const totalDocumented = realDocumentation.publicRoutes.length + 
                                   realDocumentation.authenticatedRoutes.length;
            
            // Property: If we have significantly fewer hooks than documented endpoints,
            // we should have missing hook issues
            if (numHooksToKeep < totalDocumented / 2) {
              return result.statistics.missingHooks > 0;
            }
            
            // For cases with more hooks, we can't guarantee missing hooks
            // because the analyzer uses fuzzy matching
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify hooks use correct route constants from ApiRoutes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks),
          (hook) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this hook has an INCORRECT_ROUTE issue
            const hasIncorrectRouteIssue = result.issues.some(
              issue => 
                issue.type === 'INCORRECT_ROUTE' && 
                issue.hook === hook.name &&
                !issue.actual?.includes('deprecated') // Exclude deprecated route issues
            );
            
            // Property: Hooks should use correct route constants
            // If there's an incorrect route issue, the property fails
            if (hasIncorrectRouteIssue) {
              console.log(`Hook ${hook.name} uses incorrect route constant`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 7: Deprecated Route Detection
   * 
   * For any hook that uses a route constant marked as deprecated in ApiRoutes,
   * the analysis MUST identify that hook for migration to the recommended v2 route.
   * 
   * **Validates: Requirements 5.7**
   */
  describe('Property 7: Deprecated Route Detection', () => {
    it('should detect hooks using deprecated route constants', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks),
          (hook) => {
            // Check if the hook uses a deprecated route
            const routeConstant = realParsedRoutes.routes.find(r => r.name === hook.endpoint);
            
            if (!routeConstant || !routeConstant.deprecated) {
              // Hook doesn't use a deprecated route, skip
              return true;
            }
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if the analyzer detected the deprecated route usage
            const hasDeprecatedIssue = result.issues.some(
              issue => 
                issue.type === 'INCORRECT_ROUTE' && 
                issue.hook === hook.name &&
                issue.actual?.includes('deprecated')
            );
            
            // Property: If a hook uses a deprecated route, it should be detected
            if (!hasDeprecatedIssue) {
              console.log(`Hook ${hook.name} uses deprecated route ${routeConstant.name} but was not detected`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should identify all hooks using deprecated routes for migration', () => {
      // Run analyzer with real data
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Find all deprecated routes
      const deprecatedRoutes = realParsedRoutes.routes.filter(r => r.deprecated);
      
      // Find all hooks using deprecated routes
      const hooksUsingDeprecated = realHooks.filter(hook =>
        deprecatedRoutes.some(route => route.name === hook.endpoint)
      );
      
      // Count deprecated route issues
      const deprecatedIssues = result.issues.filter(
        issue => 
          issue.type === 'INCORRECT_ROUTE' && 
          issue.actual?.includes('deprecated')
      );
      
      // Property: The number of deprecated issues should match the number of hooks
      // using deprecated routes
      expect(deprecatedIssues.length).toBe(hooksUsingDeprecated.length);
    });

    it('should not flag hooks using non-deprecated routes', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks),
          (hook) => {
            // Check if the hook uses a non-deprecated route
            const routeConstant = realParsedRoutes.routes.find(r => r.name === hook.endpoint);
            
            if (!routeConstant || routeConstant.deprecated) {
              // Hook uses deprecated route or route not found, skip
              return true;
            }
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if the analyzer incorrectly flagged this as deprecated
            const hasDeprecatedIssue = result.issues.some(
              issue => 
                issue.type === 'INCORRECT_ROUTE' && 
                issue.hook === hook.name &&
                issue.actual?.includes('deprecated')
            );
            
            // Property: Non-deprecated hooks should not be flagged
            if (hasDeprecatedIssue) {
              console.log(`Hook ${hook.name} incorrectly flagged as using deprecated route`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Property 8: Query Parameter Consistency
   * 
   * For any documented endpoint with query parameters, the corresponding hook MUST
   * accept parameters that match the documented parameter names and types.
   * 
   * **Validates: Requirements 7.1-7.5**
   */
  describe('Property 8: Query Parameter Consistency', () => {
    it('should verify hooks accept parameters for endpoints with query params', () => {
      fc.assert(
        fc.property(
          // Generate test cases from routes with query parameters
          fc.constantFrom(
            ...realDocumentation.publicRoutes.filter(r => r.queryParams && r.queryParams.length > 0),
            ...realDocumentation.authenticatedRoutes.filter(r => r.queryParams && r.queryParams.length > 0)
          ),
          (documentedRoute) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if there's a parameter mismatch issue for this route
            const hasParameterIssue = result.issues.some(
              issue => 
                issue.type === 'PARAMETER_MISMATCH' && 
                issue.route?.endpoint === documentedRoute.endpoint
            );
            
            // Property: Routes with query params should have hooks that accept parameters
            // If there's a parameter mismatch, the property fails
            if (hasParameterIssue) {
              console.log(`Parameter mismatch for: ${documentedRoute.method} ${documentedRoute.endpoint}`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect when hooks do not accept required query parameters', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks),
          (hook) => {
            // Create a modified hook without parameters
            const modifiedHook: HookDefinition = {
              ...hook,
              parameters: [], // Remove all parameters
            };
            
            const modifiedHooks = realHooks.map(h => 
              h.name === hook.name ? modifiedHook : h
            );
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, modifiedHooks, realParsedRoutes);
            
            // Find the documented route for this hook
            const allRoutes = [
              ...realDocumentation.publicRoutes,
              ...realDocumentation.authenticatedRoutes,
            ];
            
            const matchingRoute = allRoutes.find(route => {
              const hookNameLower = hook.name.toLowerCase();
              const endpointParts = route.endpoint
                .split('/')
                .filter(p => p && !p.startsWith(':'))
                .slice(-2);
              return endpointParts.some(part => hookNameLower.includes(part.toLowerCase()));
            });
            
            // If the route has query params, we should detect a parameter mismatch
            if (matchingRoute && matchingRoute.queryParams && matchingRoute.queryParams.length > 0) {
              const hasParameterIssue = result.issues.some(
                issue => 
                  issue.type === 'PARAMETER_MISMATCH' && 
                  issue.hook === hook.name
              );
              
              return hasParameterIssue;
            }
            
            // If no query params, no issue expected
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate parameter consistency across all documented endpoints', () => {
      // Run analyzer with real data
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Count routes with query parameters
      const routesWithParams = [
        ...realDocumentation.publicRoutes,
        ...realDocumentation.authenticatedRoutes,
      ].filter(r => r.queryParams && r.queryParams.length > 0);
      
      // Count parameter mismatch issues
      const parameterIssues = result.issues.filter(
        issue => issue.type === 'PARAMETER_MISMATCH'
      );
      
      // Property: Statistics should accurately reflect parameter issues
      expect(result.statistics.parameterMismatches).toBe(parameterIssues.length);
    });
  });

  /**
   * Property 9: Cache Invalidation for Mutations
   * 
   * For any mutation hook (POST, PUT, DELETE operations), the hook MUST call
   * queryClient.invalidateQueries with the appropriate query keys upon successful mutation.
   * 
   * **Validates: Requirements 14.1-14.6**
   */
  describe('Property 9: Cache Invalidation for Mutations', () => {
    it('should verify all mutation hooks have cache invalidation', () => {
      fc.assert(
        fc.property(
          // Generate test cases from mutation hooks
          fc.constantFrom(...realHooks.filter(h => h.type === 'mutation')),
          (mutationHook) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this mutation has a MISSING_CACHE_INVALIDATION issue
            const hasCacheIssue = result.issues.some(
              issue => 
                issue.type === 'MISSING_CACHE_INVALIDATION' && 
                issue.hook === mutationHook.name
            );
            
            // Property: All mutations should have cache invalidation
            // If there's a missing cache invalidation issue, the property fails
            if (hasCacheIssue) {
              console.log(`Mutation ${mutationHook.name} missing cache invalidation`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect mutations without cache invalidation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks.filter(h => h.type === 'mutation')),
          (mutationHook) => {
            // Create a modified mutation without cache invalidation
            const modifiedHook: HookDefinition = {
              ...mutationHook,
              invalidatesCache: undefined, // Remove cache invalidation
            };
            
            const modifiedHooks = realHooks.map(h => 
              h.name === mutationHook.name ? modifiedHook : h
            );
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, modifiedHooks, realParsedRoutes);
            
            // Check if the analyzer detected the missing cache invalidation
            const hasCacheIssue = result.issues.some(
              issue => 
                issue.type === 'MISSING_CACHE_INVALIDATION' && 
                issue.hook === mutationHook.name
            );
            
            // Property: Mutations without cache invalidation should be detected
            if (!hasCacheIssue) {
              console.log(`Mutation ${mutationHook.name} without cache invalidation was not detected`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should not flag query hooks for missing cache invalidation', () => {
      fc.assert(
        fc.property(
          // Generate test cases from query hooks (not mutations)
          fc.constantFrom(...realHooks.filter(h => h.type === 'query')),
          (queryHook) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this query hook was incorrectly flagged for cache invalidation
            const hasCacheIssue = result.issues.some(
              issue => 
                issue.type === 'MISSING_CACHE_INVALIDATION' && 
                issue.hook === queryHook.name
            );
            
            // Property: Query hooks should not be flagged for cache invalidation
            if (hasCacheIssue) {
              console.log(`Query hook ${queryHook.name} incorrectly flagged for cache invalidation`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate cache invalidation statistics are accurate', () => {
      // Run analyzer with real data
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Count mutations without cache invalidation
      const mutationsWithoutCache = realHooks.filter(
        h => h.type === 'mutation' && (!h.invalidatesCache || h.invalidatesCache.length === 0)
      );
      
      // Count cache invalidation issues
      const cacheIssues = result.issues.filter(
        issue => issue.type === 'MISSING_CACHE_INVALIDATION'
      );
      
      // Property: Statistics should match actual issues
      expect(result.statistics.missingCacheInvalidation).toBe(cacheIssues.length);
      expect(cacheIssues.length).toBe(mutationsWithoutCache.length);
    });
  });

  /**
   * Property 10: Query Key Uniqueness
   * 
   * For any React Query hook, the query key MUST be unique and include all parameters
   * that differentiate cached data (e.g., ID, search params, filters).
   * 
   * **Validates: Requirements 13.1-13.8**
   */
  describe('Property 10: Query Key Uniqueness', () => {
    it('should verify query keys are unique across all hooks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks.filter(h => h.type === 'query' && h.queryKey)),
          (queryHook) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this hook has an INVALID_QUERY_KEY issue related to uniqueness
            const hasUniquenessIssue = result.issues.some(
              issue => 
                issue.type === 'INVALID_QUERY_KEY' && 
                issue.hook === queryHook.name &&
                typeof issue.actual === 'string' &&
                issue.actual.includes('Shared with')
            );
            
            // Property: Query keys should be unique
            // If there's a uniqueness issue, the property fails
            if (hasUniquenessIssue) {
              console.log(`Query hook ${queryHook.name} has non-unique query key`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should verify query keys include parameters for cache differentiation', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(
            ...realHooks.filter(h => 
              h.type === 'query' && 
              h.queryKey && 
              h.parameters && 
              h.parameters.length > 0
            )
          ),
          (queryHook) => {
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Check if this hook has an INVALID_QUERY_KEY issue related to parameters
            const hasParameterIssue = result.issues.some(
              issue => 
                issue.type === 'INVALID_QUERY_KEY' && 
                issue.hook === queryHook.name &&
                typeof issue.expected === 'string' &&
                issue.expected.includes('parameters')
            );
            
            // Property: Query keys should include parameters when hook has parameters
            // If there's a parameter issue, the property fails
            if (hasParameterIssue) {
              console.log(`Query hook ${queryHook.name} query key missing parameters`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect duplicate query keys across different hooks', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...realHooks.filter(h => h.type === 'query' && h.queryKey)),
          fc.constantFrom(...realHooks.filter(h => h.type === 'query' && h.queryKey)),
          (hook1, hook2) => {
            if (hook1.name === hook2.name) {
              // Same hook, skip
              return true;
            }
            
            // Create modified hooks with identical query keys
            const sharedQueryKey = ['shared', 'key'];
            const modifiedHook1: HookDefinition = {
              ...hook1,
              queryKey: sharedQueryKey,
            };
            const modifiedHook2: HookDefinition = {
              ...hook2,
              queryKey: sharedQueryKey,
            };
            
            const modifiedHooks = realHooks.map(h => {
              if (h.name === hook1.name) return modifiedHook1;
              if (h.name === hook2.name) return modifiedHook2;
              return h;
            });
            
            // Run the analyzer
            const result = analyzeHooks(realDocumentation, modifiedHooks, realParsedRoutes);
            
            // Check if the analyzer detected the duplicate query keys
            const hasDuplicateIssue = result.issues.some(
              issue => 
                issue.type === 'INVALID_QUERY_KEY' && 
                (issue.hook === hook1.name || issue.hook === hook2.name) &&
                typeof issue.actual === 'string' &&
                issue.actual.includes('Shared with')
            );
            
            // Property: Duplicate query keys should be detected
            if (!hasDuplicateIssue) {
              console.log(`Duplicate query keys for ${hook1.name} and ${hook2.name} not detected`);
              return false;
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should validate query key statistics are accurate', () => {
      // Run analyzer with real data
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Count query key issues
      const queryKeyIssues = result.issues.filter(
        issue => issue.type === 'INVALID_QUERY_KEY'
      );
      
      // Property: Statistics should match actual issues
      expect(result.statistics.invalidQueryKeys).toBe(queryKeyIssues.length);
    });
  });

  /**
   * Integration property: Complete hook analysis should be consistent
   */
  describe('Integration Property: Hook Analysis Consistency', () => {
    it('should produce consistent results across multiple runs with same input', () => {
      fc.assert(
        fc.property(
          fc.constant(null), // No random input needed
          () => {
            // Run analyzer multiple times
            const result1 = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            const result2 = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
            
            // Property: Results should be identical
            return (
              result1.statistics.totalDocumentedEndpoints === result2.statistics.totalDocumentedEndpoints &&
              result1.statistics.totalImplementedHooks === result2.statistics.totalImplementedHooks &&
              result1.statistics.missingHooks === result2.statistics.missingHooks &&
              result1.statistics.incorrectRoutes === result2.statistics.incorrectRoutes &&
              result1.statistics.parameterMismatches === result2.statistics.parameterMismatches &&
              result1.statistics.invalidQueryKeys === result2.statistics.invalidQueryKeys &&
              result1.statistics.missingCacheInvalidation === result2.statistics.missingCacheInvalidation &&
              result1.issues.length === result2.issues.length
            );
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should have statistics that match the actual issues found', () => {
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Count issues by type
      const missingHookCount = result.issues.filter(
        i => i.type === 'MISSING_HOOK'
      ).length;
      
      const incorrectRouteCount = result.issues.filter(
        i => i.type === 'INCORRECT_ROUTE'
      ).length;
      
      const parameterMismatchCount = result.issues.filter(
        i => i.type === 'PARAMETER_MISMATCH'
      ).length;
      
      const invalidQueryKeyCount = result.issues.filter(
        i => i.type === 'INVALID_QUERY_KEY'
      ).length;
      
      const missingCacheCount = result.issues.filter(
        i => i.type === 'MISSING_CACHE_INVALIDATION'
      ).length;
      
      // Property: Statistics should match actual issue counts
      expect(result.statistics.missingHooks).toBe(missingHookCount);
      expect(result.statistics.incorrectRoutes).toBe(incorrectRouteCount);
      expect(result.statistics.parameterMismatches).toBe(parameterMismatchCount);
      expect(result.statistics.invalidQueryKeys).toBe(invalidQueryKeyCount);
      expect(result.statistics.missingCacheInvalidation).toBe(missingCacheCount);
    });

    it('should validate total issues count matches sum of all issue types', () => {
      const result = analyzeHooks(realDocumentation, realHooks, realParsedRoutes);
      
      // Sum all issue type counts
      const totalIssues = 
        result.statistics.missingHooks +
        result.statistics.incorrectRoutes +
        result.statistics.parameterMismatches +
        result.statistics.invalidQueryKeys +
        result.statistics.missingCacheInvalidation;
      
      // Property: Total should match actual issues array length
      expect(result.issues.length).toBe(totalIssues);
    });
  });
});
