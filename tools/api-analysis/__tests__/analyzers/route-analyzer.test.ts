/**
 * Tests for Route Analyzer
 * Feature: api-routes-complete-analysis
 */

import { analyzeRoutes, generateRouteIssueReport } from '../../src/analyzers/route-analyzer';
import {
  ParsedDocumentation,
  RouteDefinition,
} from '../../types/core';
import { ParsedRoutes } from '../../src/parsers/routes-parser';

describe('Route Analyzer', () => {
  // Mock documented routes
  const mockDocumentedRoutes: RouteDefinition[] = [
    {
      endpoint: '/api/mobile/public/amodiataires',
      method: 'GET',
      description: 'List all amodiataires',
      isPublic: true,
      errorResponses: [],
      responseBody: { type: 'object' },
    },
    {
      endpoint: '/api/mobile/public/amodiataires/:id',
      method: 'GET',
      description: 'Get amodiataire details',
      isPublic: true,
      errorResponses: [],
      responseBody: { type: 'object' },
    },
    {
      endpoint: '/api/mobile/profile',
      method: 'GET',
      description: 'Get user profile',
      isPublic: false,
      errorResponses: [],
      responseBody: { type: 'object' },
    },
  ];

  const mockDocumentation: ParsedDocumentation = {
    publicRoutes: mockDocumentedRoutes.filter(r => r.isPublic),
    authenticatedRoutes: mockDocumentedRoutes.filter(r => !r.isPublic),
    responseStructures: {},
    errorCodes: [],
  };

  describe('analyzeRoutes', () => {
    it('should detect missing routes', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            deprecated: false,
          },
          // Missing PUBLIC_AMODIATAIRE_DETAILS_V2 and PROFILE
        ],
        utilityMethods: [],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);

      // Should detect missing PROFILE route and incorrect path for amodiataire details
      // Plus utility method issues
      expect(result.issues.length).toBeGreaterThanOrEqual(2);
      
      const missingRoutes = result.issues.filter(i => 
        i.type === 'MISSING_ROUTE' && !i.route.description.includes('utility method')
      );
      expect(missingRoutes).toHaveLength(1); // Only PROFILE is truly missing
      expect(missingRoutes[0].route.endpoint).toBe('/api/mobile/profile');
      
      const incorrectPaths = result.issues.filter(i => i.type === 'INCORRECT_PATH');
      expect(incorrectPaths).toHaveLength(1); // amodiataire details has wrong path
      expect(incorrectPaths[0].route.endpoint).toBe('/api/mobile/public/amodiataires/:id');
      
      expect(result.statistics.missingRoutes).toBe(1);
      expect(result.statistics.incorrectPaths).toBe(1);
    });

    it('should detect incorrect paths', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            deprecated: false,
          },
          {
            name: 'PUBLIC_AMODIATAIRE_DETAILS_V2',
            value: '/api/mobile/public/amodiataires/:id',
            deprecated: false,
          },
          {
            name: 'PROFILE',
            value: '/api/mobile/user/profile', // Wrong path
            deprecated: false,
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);

      const incorrectPathIssues = result.issues.filter(i => i.type === 'INCORRECT_PATH');
      expect(incorrectPathIssues).toHaveLength(1); // Only PROFILE should be incorrect
      expect(incorrectPathIssues[0].route.endpoint).toBe('/api/mobile/profile');
      expect(incorrectPathIssues[0].actual).toBe('/api/mobile/user/profile');
      
      expect(result.statistics.incorrectPaths).toBe(1);
    });

    it('should detect deprecated routes', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            deprecated: false,
          },
          {
            name: 'OLD_AMODIATAIRES',
            value: '/api/public/amodiataires/mobile',
            deprecated: true,
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);

      const deprecatedIssues = result.issues.filter(i => i.type === 'DEPRECATED_ROUTE');
      expect(deprecatedIssues).toHaveLength(1);
      expect(deprecatedIssues[0].route.endpoint).toBe('/api/public/amodiataires/mobile');
      
      expect(result.statistics.deprecatedRoutes).toBe(1);
    });

    it('should validate utility methods', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRE_DETAILS_V2',
            value: '/api/mobile/public/amodiataires/:id',
            deprecated: false,
          },
        ],
        utilityMethods: [
          {
            name: 'getAmodiataireDetailsUrl',
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'string',
            usesRoute: 'PUBLIC_AMODIATAIRE_DETAILS_V2',
          },
          // Missing getAmodiataireAnnouncementsUrl and getAmodiataireMediaUrl
        ],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);

      const utilityMethodIssues = result.issues.filter(i => 
        i.type === 'MISSING_ROUTE' && 
        i.route.description.includes('utility method')
      );
      expect(utilityMethodIssues).toHaveLength(2); // Missing 2 utility methods
      
      expect(result.statistics.utilityMethodIssues).toBe(2);
    });

    it('should handle complete matching routes', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            deprecated: false,
          },
          {
            name: 'PUBLIC_AMODIATAIRE_DETAILS_V2',
            value: '/api/mobile/public/amodiataires/:id',
            deprecated: false,
          },
          {
            name: 'PROFILE',
            value: '/api/mobile/profile',
            deprecated: false,
          },
        ],
        utilityMethods: [
          {
            name: 'getAmodiataireDetailsUrl',
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'string',
            usesRoute: 'PUBLIC_AMODIATAIRE_DETAILS_V2',
          },
          {
            name: 'getAmodiataireAnnouncementsUrl',
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'string',
            usesRoute: 'PUBLIC_AMODIATAIRE_ANNOUNCEMENTS',
          },
          {
            name: 'getAmodiataireMediaUrl',
            parameters: [{ name: 'id', type: 'string' }],
            returnType: 'string',
            usesRoute: 'PUBLIC_AMODIATAIRE_MEDIA',
          },
        ],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);

      // Should have no missing route or incorrect path issues
      const nonUtilityIssues = result.issues.filter(i => 
        !(i.type === 'MISSING_ROUTE' && i.route.description.includes('utility method'))
      );
      expect(nonUtilityIssues).toHaveLength(0);
      
      expect(result.statistics.missingRoutes).toBe(0);
      expect(result.statistics.incorrectPaths).toBe(0);
      expect(result.statistics.deprecatedRoutes).toBe(0);
    });
  });

  describe('generateRouteIssueReport', () => {
    it('should generate a readable report', () => {
      const parsedRoutes: ParsedRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            deprecated: false,
          },
        ],
        utilityMethods: [],
      };

      const result = analyzeRoutes(mockDocumentation, parsedRoutes);
      const report = generateRouteIssueReport(result);

      expect(report).toContain('# Route Analysis Report');
      expect(report).toContain('## Statistics');
      expect(report).toContain('Total documented routes: 3');
      expect(report).toContain('Missing routes: 1'); // Only PROFILE is missing
      expect(report).toContain('Incorrect paths: 1'); // amodiataire details has incorrect path
      expect(report).toContain('## MISSING ROUTE');
      expect(report).toContain('/api/mobile/profile');
      expect(report).toContain('## INCORRECT PATH');
      expect(report).toContain('/api/mobile/public/amodiataires/:id');
    });
  });

  describe('priority assignment', () => {
    it('should assign correct priorities to different route types', () => {
      const authRoute: RouteDefinition = {
        endpoint: '/api/auth/login',
        method: 'POST',
        description: 'User login',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const profileRoute: RouteDefinition = {
        endpoint: '/api/mobile/profile',
        method: 'GET',
        description: 'Get profile',
        isPublic: false,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const publicRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/amodiataires',
        method: 'GET',
        description: 'List amodiataires',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const mockDoc: ParsedDocumentation = {
        publicRoutes: [authRoute, publicRoute],
        authenticatedRoutes: [profileRoute],
        responseStructures: {},
        errorCodes: [],
      };

      const parsedRoutes: ParsedRoutes = {
        routes: [], // No routes to trigger missing route issues
        utilityMethods: [],
      };

      const result = analyzeRoutes(mockDoc, parsedRoutes);

      const authIssue = result.issues.find(i => i.route.endpoint === '/api/auth/login');
      const profileIssue = result.issues.find(i => i.route.endpoint === '/api/mobile/profile');
      const publicIssue = result.issues.find(i => i.route.endpoint === '/api/mobile/public/amodiataires');

      expect(authIssue?.priority).toBe('CRITICAL');
      expect(profileIssue?.priority).toBe('HIGH');
      expect(publicIssue?.priority).toBe('MEDIUM');
    });
  });
});