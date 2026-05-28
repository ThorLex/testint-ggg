/**
 * Unit tests for Report Generator
 * Feature: api-routes-complete-analysis
 */

import {
  generateAnalysisReport,
  formatReportAsMarkdown,
  ReportGeneratorInput,
} from '../../src/generators/report-generator';
import {
  RouteIssue,
  TypeIssue,
  HookIssue,
  ClientIssue,
  RouteDefinition,
} from '../../types/core';
import { RouteAnalysisResult } from '../../src/analyzers/route-analyzer';
import { TypeAnalysisResult } from '../../src/analyzers/type-analyzer';
import { HookAnalysisResult } from '../../src/analyzers/hook-analyzer';

describe('Report Generator', () => {
  describe('generateAnalysisReport', () => {
    it('should generate a complete analysis report with all sections', () => {
      // Arrange
      const mockRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/test',
        method: 'GET',
        description: 'Test route',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const routeAnalysis: RouteAnalysisResult = {
        issues: [
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'HIGH',
            suggestion: 'Add missing route',
          },
        ],
        statistics: {
          totalDocumentedRoutes: 10,
          totalImplementedRoutes: 9,
          missingRoutes: 1,
          incorrectPaths: 0,
          deprecatedRoutes: 0,
          utilityMethodIssues: 0,
        },
      };

      const typeAnalysis: TypeAnalysisResult = {
        issues: [
          {
            type: 'MISSING_INTERFACE',
            interface: 'TestResponse',
            priority: 'HIGH',
            jsonStructure: { type: 'object' },
          },
        ],
        statistics: {
          totalDocumentedStructures: 5,
          totalImplementedInterfaces: 4,
          missingInterfaces: 1,
          missingProperties: 0,
          typeMismatches: 0,
          optionalityMismatches: 0,
        },
      };

      const hookAnalysis: HookAnalysisResult = {
        issues: [
          {
            type: 'MISSING_HOOK',
            route: mockRoute,
            priority: 'MEDIUM',
          },
        ],
        statistics: {
          totalDocumentedEndpoints: 10,
          totalImplementedHooks: 9,
          missingHooks: 1,
          incorrectRoutes: 0,
          parameterMismatches: 0,
          invalidQueryKeys: 0,
          missingCacheInvalidation: 0,
          deprecatedRouteUsage: 0,
        },
      };

      const input: ReportGeneratorInput = {
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.routeIssues).toHaveLength(1);
      expect(report.typeIssues).toHaveLength(1);
      expect(report.hookIssues).toHaveLength(1);
      expect(report.clientIssues).toHaveLength(0);
      expect(report.recommendations).toBeDefined();
    });

    it('should calculate correct summary statistics', () => {
      // Arrange
      const routeAnalysis: RouteAnalysisResult = {
        issues: [],
        statistics: {
          totalDocumentedRoutes: 15,
          totalImplementedRoutes: 15,
          missingRoutes: 0,
          incorrectPaths: 0,
          deprecatedRoutes: 0,
          utilityMethodIssues: 0,
        },
      };

      const typeAnalysis: TypeAnalysisResult = {
        issues: [],
        statistics: {
          totalDocumentedStructures: 20,
          totalImplementedInterfaces: 20,
          missingInterfaces: 0,
          missingProperties: 0,
          typeMismatches: 0,
          optionalityMismatches: 0,
        },
      };

      const hookAnalysis: HookAnalysisResult = {
        issues: [],
        statistics: {
          totalDocumentedEndpoints: 15,
          totalImplementedHooks: 15,
          missingHooks: 0,
          incorrectRoutes: 0,
          parameterMismatches: 0,
          invalidQueryKeys: 0,
          missingCacheInvalidation: 0,
          deprecatedRouteUsage: 0,
        },
      };

      const input: ReportGeneratorInput = {
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.summary.totalRoutes).toBe(15);
      expect(report.summary.totalInterfaces).toBe(20);
      expect(report.summary.totalHooks).toBe(15);
      expect(report.summary.totalIssues).toBe(0);
      expect(report.summary.issuesByPriority.critical).toBe(0);
      expect(report.summary.issuesByPriority.high).toBe(0);
      expect(report.summary.issuesByPriority.medium).toBe(0);
      expect(report.summary.issuesByPriority.low).toBe(0);
    });

    it('should count issues by priority correctly', () => {
      // Arrange
      const mockRoute: RouteDefinition = {
        endpoint: '/api/test',
        method: 'GET',
        description: 'Test',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const routeAnalysis: RouteAnalysisResult = {
        issues: [
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'CRITICAL',
          },
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'HIGH',
          },
        ],
        statistics: {
          totalDocumentedRoutes: 10,
          totalImplementedRoutes: 8,
          missingRoutes: 2,
          incorrectPaths: 0,
          deprecatedRoutes: 0,
          utilityMethodIssues: 0,
        },
      };

      const typeAnalysis: TypeAnalysisResult = {
        issues: [
          {
            type: 'MISSING_PROPERTY',
            interface: 'Test',
            property: 'prop',
            priority: 'MEDIUM',
          },
        ],
        statistics: {
          totalDocumentedStructures: 5,
          totalImplementedInterfaces: 5,
          missingInterfaces: 0,
          missingProperties: 1,
          typeMismatches: 0,
          optionalityMismatches: 0,
        },
      };

      const hookAnalysis: HookAnalysisResult = {
        issues: [
          {
            type: 'MISSING_HOOK',
            route: mockRoute,
            priority: 'LOW',
          },
        ],
        statistics: {
          totalDocumentedEndpoints: 10,
          totalImplementedHooks: 9,
          missingHooks: 1,
          incorrectRoutes: 0,
          parameterMismatches: 0,
          invalidQueryKeys: 0,
          missingCacheInvalidation: 0,
          deprecatedRouteUsage: 0,
        },
      };

      const input: ReportGeneratorInput = {
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.summary.totalIssues).toBe(4);
      expect(report.summary.issuesByPriority.critical).toBe(1);
      expect(report.summary.issuesByPriority.high).toBe(1);
      expect(report.summary.issuesByPriority.medium).toBe(1);
      expect(report.summary.issuesByPriority.low).toBe(1);
    });

    it('should generate recommendations for all issue types', () => {
      // Arrange
      const mockRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/test',
        method: 'GET',
        description: 'Test route',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const routeAnalysis: RouteAnalysisResult = {
        issues: [
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'HIGH',
          },
        ],
        statistics: {
          totalDocumentedRoutes: 10,
          totalImplementedRoutes: 9,
          missingRoutes: 1,
          incorrectPaths: 0,
          deprecatedRoutes: 0,
          utilityMethodIssues: 0,
        },
      };

      const typeAnalysis: TypeAnalysisResult = {
        issues: [
          {
            type: 'MISSING_INTERFACE',
            interface: 'TestResponse',
            priority: 'HIGH',
            jsonStructure: { type: 'object' },
          },
        ],
        statistics: {
          totalDocumentedStructures: 5,
          totalImplementedInterfaces: 4,
          missingInterfaces: 1,
          missingProperties: 0,
          typeMismatches: 0,
          optionalityMismatches: 0,
        },
      };

      const hookAnalysis: HookAnalysisResult = {
        issues: [
          {
            type: 'MISSING_HOOK',
            route: mockRoute,
            priority: 'MEDIUM',
          },
        ],
        statistics: {
          totalDocumentedEndpoints: 10,
          totalImplementedHooks: 9,
          missingHooks: 1,
          incorrectRoutes: 0,
          parameterMismatches: 0,
          invalidQueryKeys: 0,
          missingCacheInvalidation: 0,
          deprecatedRouteUsage: 0,
        },
      };

      const input: ReportGeneratorInput = {
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.recommendations).toHaveLength(3);
      expect(report.recommendations[0].category).toBe('ROUTE');
      expect(report.recommendations[1].category).toBe('TYPE');
      expect(report.recommendations[2].category).toBe('HOOK');
    });

    it('should sort recommendations by priority', () => {
      // Arrange
      const mockRoute: RouteDefinition = {
        endpoint: '/api/test',
        method: 'GET',
        description: 'Test',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const routeAnalysis: RouteAnalysisResult = {
        issues: [
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'LOW',
          },
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'CRITICAL',
          },
          {
            type: 'MISSING_ROUTE',
            route: mockRoute,
            priority: 'MEDIUM',
          },
        ],
        statistics: {
          totalDocumentedRoutes: 10,
          totalImplementedRoutes: 7,
          missingRoutes: 3,
          incorrectPaths: 0,
          deprecatedRoutes: 0,
          utilityMethodIssues: 0,
        },
      };

      const typeAnalysis: TypeAnalysisResult = {
        issues: [],
        statistics: {
          totalDocumentedStructures: 5,
          totalImplementedInterfaces: 5,
          missingInterfaces: 0,
          missingProperties: 0,
          typeMismatches: 0,
          optionalityMismatches: 0,
        },
      };

      const hookAnalysis: HookAnalysisResult = {
        issues: [],
        statistics: {
          totalDocumentedEndpoints: 10,
          totalImplementedHooks: 10,
          missingHooks: 0,
          incorrectRoutes: 0,
          parameterMismatches: 0,
          invalidQueryKeys: 0,
          missingCacheInvalidation: 0,
          deprecatedRouteUsage: 0,
        },
      };

      const input: ReportGeneratorInput = {
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.recommendations).toHaveLength(3);
      expect(report.recommendations[0].priority).toBe('CRITICAL');
      expect(report.recommendations[1].priority).toBe('MEDIUM');
      expect(report.recommendations[2].priority).toBe('LOW');
    });
  });

  describe('formatReportAsMarkdown', () => {
    it('should format report as markdown with all sections', () => {
      // Arrange
      const mockRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/test',
        method: 'GET',
        description: 'Test route',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const report = {
        timestamp: new Date('2024-01-01T00:00:00Z').toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 3,
          issuesByPriority: {
            critical: 1,
            high: 1,
            medium: 1,
            low: 0,
          },
        },
        routeIssues: [
          {
            type: 'MISSING_ROUTE' as const,
            route: mockRoute,
            priority: 'HIGH' as const,
          },
        ],
        typeIssues: [],
        hookIssues: [],
        clientIssues: [],
        recommendations: [
          {
            priority: 'HIGH' as const,
            category: 'ROUTE' as const,
            title: 'Add missing route',
            description: 'Route is missing',
            affectedFiles: ['src/services/api/routes.ts'],
            codeExamples: {
              after: 'static readonly TEST = "/api/test";',
            },
          },
        ],
        warnings: [],
        metadata: {
          filesAnalyzed: [],
          filesMissing: [],
          parseErrors: 0,
        },
      };

      // Act
      const markdown = formatReportAsMarkdown(report);

      // Assert
      expect(markdown).toContain('# API Analysis Report');
      expect(markdown).toContain('## Summary');
      expect(markdown).toContain('**Total Routes:** 10');
      expect(markdown).toContain('**Total Interfaces:** 5');
      expect(markdown).toContain('**Total Hooks:** 8');
      expect(markdown).toContain('**Total Issues:** 3');
      expect(markdown).toContain('## Key Findings');
      expect(markdown).toContain('## Recommendations');
      expect(markdown).toContain('### High Priority');
      expect(markdown).toContain('Add missing route');
    });

    it('should include critical warning when critical issues exist', () => {
      // Arrange
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 1,
          issuesByPriority: {
            critical: 1,
            high: 0,
            medium: 0,
            low: 0,
          },
        },
        routeIssues: [],
        typeIssues: [],
        hookIssues: [],
        clientIssues: [],
        recommendations: [],
        warnings: [],
        metadata: {
          filesAnalyzed: [],
          filesMissing: [],
          parseErrors: 0,
        },
      };

      // Act
      const markdown = formatReportAsMarkdown(report);

      // Assert
      expect(markdown).toContain('⚠️ **1 critical issues** require immediate attention');
    });

    it('should format code examples correctly', () => {
      // Arrange
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 1,
          issuesByPriority: {
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
          },
        },
        routeIssues: [],
        typeIssues: [],
        hookIssues: [],
        clientIssues: [],
        recommendations: [
          {
            priority: 'HIGH' as const,
            category: 'TYPE' as const,
            title: 'Fix type',
            description: 'Type mismatch',
            affectedFiles: ['src/types/api.ts'],
            codeExamples: {
              before: 'prop: string;',
              after: 'prop: number;',
            },
          },
        ],
        warnings: [],
        metadata: {
          filesAnalyzed: [],
          filesMissing: [],
          parseErrors: 0,
        },
      };

      // Act
      const markdown = formatReportAsMarkdown(report);

      // Assert
      expect(markdown).toContain('```typescript');
      expect(markdown).toContain('// Before');
      expect(markdown).toContain('prop: string;');
      expect(markdown).toContain('// After');
      expect(markdown).toContain('prop: number;');
    });

    it('should include detailed sections for each category', () => {
      // Arrange
      const publicRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/test',
        method: 'GET',
        description: 'Public test route',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const authRoute: RouteDefinition = {
        endpoint: '/api/mobile/profile',
        method: 'GET',
        description: 'Auth test route',
        isPublic: false,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 6,
          issuesByPriority: {
            critical: 1,
            high: 2,
            medium: 2,
            low: 1,
          },
        },
        routeIssues: [
          {
            type: 'MISSING_ROUTE' as const,
            route: publicRoute,
            priority: 'HIGH' as const,
          },
          {
            type: 'INCORRECT_PATH' as const,
            route: authRoute,
            actual: '/api/profile',
            priority: 'MEDIUM' as const,
          },
        ],
        typeIssues: [
          {
            type: 'MISSING_INTERFACE' as const,
            interface: 'TestResponse',
            priority: 'HIGH' as const,
            jsonStructure: { type: 'object' as const },
          },
          {
            type: 'MISSING_PROPERTY' as const,
            interface: 'UserProfile',
            property: 'email',
            expected: 'string',
            priority: 'MEDIUM' as const,
          },
        ],
        hookIssues: [
          {
            type: 'MISSING_HOOK' as const,
            route: publicRoute,
            priority: 'HIGH' as const,
          },
          {
            type: 'MISSING_CACHE_INVALIDATION' as const,
            hook: 'useUpdateProfile',
            priority: 'MEDIUM' as const,
          },
        ],
        clientIssues: [],
        recommendations: [],
        warnings: [],
        metadata: {
          filesAnalyzed: [],
          filesMissing: [],
          parseErrors: 0,
        },
      };

      // Act
      const markdown = formatReportAsMarkdown(report);

      // Assert - Check for detailed section headers
      expect(markdown).toContain('## Public Routes');
      expect(markdown).toContain('## Authenticated Routes');
      expect(markdown).toContain('## TypeScript Interfaces');
      expect(markdown).toContain('## React Query Hooks');
      expect(markdown).toContain('## Client Configuration');
      expect(markdown).toContain('## Component Migration');

      // Check for severity breakdowns
      expect(markdown).toContain('**Severity Breakdown:**');
      expect(markdown).toContain('**Total Issues:**');

      // Check for subsections
      expect(markdown).toContain('### Missing Public Routes');
      expect(markdown).toContain('### Incorrect Authenticated Route Paths');
      expect(markdown).toContain('### Missing Interfaces');
      expect(markdown).toContain('### Missing Properties');
      expect(markdown).toContain('### Missing Hooks');
      expect(markdown).toContain('### Missing Cache Invalidation');

      // Check for issue details
      expect(markdown).toContain('Public test route');
      expect(markdown).toContain('Auth test route');
      expect(markdown).toContain('TestResponse');
      expect(markdown).toContain('UserProfile');
      expect(markdown).toContain('useUpdateProfile');

      // Check for affected files
      expect(markdown).toContain('**Affected Files:**');
      expect(markdown).toContain('src/services/api/routes.ts');
      expect(markdown).toContain('src/types/api.ts');
      expect(markdown).toContain('src/hooks/useApi.ts');
    });
  });
});
