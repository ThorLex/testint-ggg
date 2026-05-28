/**
 * Unit tests for Hook Analyzer
 * Feature: api-routes-complete-analysis
 */

import { analyzeHooks, generateHookIssueReport } from '../../src/analyzers/hook-analyzer';
import {
  ParsedDocumentation,
  HookDefinition,
  RouteDefinition,
} from '../../types/core';
import { ParsedRoutes } from '../../src/parsers/routes-parser';

describe('Hook Analyzer', () => {
  describe('analyzeHooks', () => {
    it('should detect missing hooks for documented endpoints', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires',
            method: 'GET',
            description: 'Get all amodiataires',
            isPublic: true,
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      expect(result.issues).toHaveLength(1);
      expect(result.issues[0].type).toBe('MISSING_HOOK');
      expect(result.issues[0].route?.endpoint).toBe('/api/mobile/public/amodiataires');
      expect(result.statistics.missingHooks).toBe(1);
    });

    it('should detect hooks using incorrect route constants', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires',
            method: 'GET',
            description: 'Get all amodiataires',
            isPublic: true,
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useAmodiataires',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_V2',
          queryKey: ['amodiataires', 'list'],
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/public/amodiataires', // Wrong path
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const incorrectRouteIssues = result.issues.filter(i => i.type === 'INCORRECT_ROUTE');
      expect(incorrectRouteIssues.length).toBeGreaterThan(0);
      expect(result.statistics.incorrectRoutes).toBeGreaterThan(0);
    });

    it('should detect missing cache invalidation in mutation hooks', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [
          {
            endpoint: '/api/mobile/profile',
            method: 'PUT',
            description: 'Update profile',
            isPublic: false,
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useUpdateProfile',
          type: 'mutation',
          endpoint: 'PROFILE',
          // No invalidatesCache property
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PROFILE',
            value: '/api/mobile/profile',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const cacheIssues = result.issues.filter(i => i.type === 'MISSING_CACHE_INVALIDATION');
      expect(cacheIssues).toHaveLength(1);
      expect(cacheIssues[0].hook).toBe('useUpdateProfile');
      expect(result.statistics.missingCacheInvalidation).toBe(1);
    });

    it('should detect deprecated route usage in hooks', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useOldAmodiataires',
          type: 'query',
          endpoint: 'AMODIATAIRES_OLD',
          queryKey: ['amodiataires', 'old'],
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'AMODIATAIRES_OLD',
            value: '/api/public/amodiataires',
            deprecated: true,
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const deprecatedIssues = result.issues.filter(
        i => i.type === 'INCORRECT_ROUTE' && i.actual?.includes('deprecated')
      );
      expect(deprecatedIssues).toHaveLength(1);
      expect(deprecatedIssues[0].hook).toBe('useOldAmodiataires');
    });

    it('should detect invalid query keys (not unique)', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useAmodiataires',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_V2',
          queryKey: ['amodiataires', 'list'],
        },
        {
          name: 'useAmodiatairesAlternate',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_V2',
          queryKey: ['amodiataires', 'list'], // Same key
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const queryKeyIssues = result.issues.filter(i => i.type === 'INVALID_QUERY_KEY');
      expect(queryKeyIssues.length).toBeGreaterThan(0);
    });

    it('should detect query keys missing parameters', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires',
            method: 'GET',
            description: 'Get amodiataires with search',
            isPublic: true,
            queryParams: [
              { name: 'search', type: 'string', required: false },
              { name: 'limit', type: 'number', required: false },
            ],
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useAmodiataires',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_V2',
          queryKey: ['amodiataires'], // Missing params in key
          parameters: [
            { name: 'params', type: 'SearchParams', optional: true },
          ],
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const queryKeyIssues = result.issues.filter(i => i.type === 'INVALID_QUERY_KEY');
      expect(queryKeyIssues.length).toBeGreaterThan(0);
    });

    it('should validate parameter matching', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires/nearby',
            method: 'GET',
            description: 'Get nearby amodiataires',
            isPublic: true,
            queryParams: [
              { name: 'lat', type: 'number', required: true },
              { name: 'lng', type: 'number', required: true },
              { name: 'radius', type: 'number', required: false },
            ],
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useNearbyAmodiataires',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_NEARBY',
          queryKey: ['amodiataires', 'nearby'],
          parameters: [], // Missing params parameter
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_NEARBY',
            value: '/api/mobile/public/amodiataires/nearby',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      const paramIssues = result.issues.filter(i => i.type === 'PARAMETER_MISMATCH');
      expect(paramIssues.length).toBeGreaterThan(0);
    });

    it('should not report issues for correctly implemented hooks', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires',
            method: 'GET',
            description: 'Get all amodiataires',
            isPublic: true,
            queryParams: [
              { name: 'limit', type: 'number', required: false },
              { name: 'offset', type: 'number', required: false },
            ],
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [
          {
            endpoint: '/api/mobile/profile',
            method: 'PUT',
            description: 'Update profile',
            isPublic: false,
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [
        {
          name: 'useAmodiataires',
          type: 'query',
          endpoint: 'PUBLIC_AMODIATAIRES_V2',
          queryKey: ['amodiataires', 'list', 'params'],
          parameters: [
            { name: 'params', type: 'SearchParams', optional: true },
          ],
        },
        {
          name: 'useUpdateProfile',
          type: 'mutation',
          endpoint: 'PROFILE',
          invalidatesCache: [['profile', 'me']],
        },
      ];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
          },
          {
            name: 'PROFILE',
            value: '/api/mobile/profile',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);

      // Should have minimal or no issues for correctly implemented hooks
      expect(result.statistics.missingCacheInvalidation).toBe(0);
      expect(result.statistics.incorrectRoutes).toBe(0);
    });
  });

  describe('generateHookIssueReport', () => {
    it('should generate a readable report', () => {
      const documentation: ParsedDocumentation = {
        publicRoutes: [
          {
            endpoint: '/api/mobile/public/amodiataires',
            method: 'GET',
            description: 'Get all amodiataires',
            isPublic: true,
            errorResponses: [],
            responseBody: { type: 'object' },
          },
        ],
        authenticatedRoutes: [],
        responseStructures: {},
        errorCodes: [],
      };

      const hooks: HookDefinition[] = [];

      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeHooks(documentation, hooks, parsedRoutes);
      const report = generateHookIssueReport(result);

      expect(report).toContain('# Hook Analysis Report');
      expect(report).toContain('## Statistics');
      expect(report).toContain('Total documented endpoints:');
      expect(report).toContain('Missing hooks:');
    });
  });
});
