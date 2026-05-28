/**
 * Detailed unit tests for Report Generator
 * Feature: api-routes-complete-analysis
 * Task: 10.4 - Test report structure generation, prioritization logic, and code example generation
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

describe('Report Generator - Detailed Tests', () => {
  describe('Report Structure Generation', () => {
    it('should generate report with correct timestamp format', () => {
      // Arrange
      const input = createMinimalInput();
      const beforeTime = new Date().toISOString();

      // Act
      const report = generateAnalysisReport(input);
      const afterTime = new Date().toISOString();

      // Assert
      expect(report.timestamp).toBeDefined();
      expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(report.timestamp >= beforeTime).toBe(true);
      expect(report.timestamp <= afterTime).toBe(true);
    });

    it('should generate report with all required sections', () => {
      // Arrange
      const input = createCompleteInput();

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report).toHaveProperty('timestamp');
      expect(report).toHaveProperty('summary');
      expect(report).toHaveProperty('routeIssues');
      expect(report).toHaveProperty('typeIssues');
      expect(report).toHaveProperty('hookIssues');
      expect(report).toHaveProperty('clientIssues');
      expect(report).toHaveProperty('recommendations');
    });

    it('should generate summary with accurate statistics', () => {
      // Arrange
      const input: ReportGeneratorInput = {
        routeAnalysis: {
          issues: [
            createRouteIssue('MISSING_ROUTE', 'CRITICAL'),
            createRouteIssue('INCORRECT_PATH', 'HIGH'),
          ],
          statistics: {
            totalDocumentedRoutes: 25,
            totalImplementedRoutes: 23,
            missingRoutes: 1,
            incorrectPaths: 1,
            deprecatedRoutes: 0,
            utilityMethodIssues: 0,
          },
        },
        typeAnalysis: {
          issues: [
            createTypeIssue('MISSING_INTERFACE', 'HIGH'),
          ],
          statistics: {
            totalDocumentedStructures: 15,
            totalImplementedInterfaces: 14,
            missingInterfaces: 1,
            missingProperties: 0,
            typeMismatches: 0,
            optionalityMismatches: 0,
          },
        },
        hookAnalysis: {
          issues: [
            createHookIssue('MISSING_HOOK', 'MEDIUM'),
          ],
          statistics: {
            totalDocumentedEndpoints: 25,
            totalImplementedHooks: 24,
            missingHooks: 1,
            incorrectRoutes: 0,
            parameterMismatches: 0,
            invalidQueryKeys: 0,
            missingCacheInvalidation: 0,
            deprecatedRouteUsage: 0,
          },
        },
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.summary.totalRoutes).toBe(25);
      expect(report.summary.totalInterfaces).toBe(15);
      expect(report.summary.totalHooks).toBe(24);
      expect(report.summary.totalIssues).toBe(4);
      expect(report.summary.issuesByPriority.critical).toBe(1);
      expect(report.summary.issuesByPriority.high).toBe(2);
      expect(report.summary.issuesByPriority.medium).toBe(1);
      expect(report.summary.issuesByPriority.low).toBe(0);
    });


    it('should handle empty issues correctly', () => {
      // Arrange
      const input = createMinimalInput();

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.routeIssues).toHaveLength(0);
      expect(report.typeIssues).toHaveLength(0);
      expect(report.hookIssues).toHaveLength(0);
      expect(report.clientIssues).toHaveLength(0);
      expect(report.recommendations).toHaveLength(0);
      expect(report.summary.totalIssues).toBe(0);
    });

    it('should include client issues when provided', () => {
      // Arrange
      const clientIssues: ClientIssue[] = [
        {
          type: 'MISSING_INTERCEPTOR',
          component: 'X-API-Key interceptor',
          description: 'Missing X-API-Key header interceptor',
          priority: 'HIGH',
        },
      ];

      const input: ReportGeneratorInput = {
        ...createMinimalInput(),
        clientIssues,
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.clientIssues).toHaveLength(1);
      expect(report.summary.totalIssues).toBe(1);
    });
  });

  describe('Prioritization Logic', () => {
    it('should prioritize CRITICAL issues first', () => {
      // Arrange
      const input: ReportGeneratorInput = {
        routeAnalysis: {
          issues: [
            createRouteIssue('MISSING_ROUTE', 'LOW'),
            createRouteIssue('MISSING_ROUTE', 'CRITICAL'),
            createRouteIssue('MISSING_ROUTE', 'MEDIUM'),
            createRouteIssue('MISSING_ROUTE', 'HIGH'),
          ],
          statistics: createDefaultRouteStats(),
        },
        typeAnalysis: {
          issues: [],
          statistics: createDefaultTypeStats(),
        },
        hookAnalysis: {
          issues: [],
          statistics: createDefaultHookStats(),
        },
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.recommendations).toHaveLength(4);
      expect(report.recommendations[0].priority).toBe('CRITICAL');
      expect(report.recommendations[1].priority).toBe('HIGH');
      expect(report.recommendations[2].priority).toBe('MEDIUM');
      expect(report.recommendations[3].priority).toBe('LOW');
    });


    it('should maintain priority order across different issue types', () => {
      // Arrange
      const input: ReportGeneratorInput = {
        routeAnalysis: {
          issues: [createRouteIssue('MISSING_ROUTE', 'MEDIUM')],
          statistics: createDefaultRouteStats(),
        },
        typeAnalysis: {
          issues: [createTypeIssue('MISSING_INTERFACE', 'CRITICAL')],
          statistics: createDefaultTypeStats(),
        },
        hookAnalysis: {
          issues: [createHookIssue('MISSING_HOOK', 'HIGH')],
          statistics: createDefaultHookStats(),
        },
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.recommendations).toHaveLength(3);
      expect(report.recommendations[0].priority).toBe('CRITICAL');
      expect(report.recommendations[0].category).toBe('TYPE');
      expect(report.recommendations[1].priority).toBe('HIGH');
      expect(report.recommendations[1].category).toBe('HOOK');
      expect(report.recommendations[2].priority).toBe('MEDIUM');
      expect(report.recommendations[2].category).toBe('ROUTE');
    });

    it('should count issues by priority correctly with mixed types', () => {
      // Arrange
      const input: ReportGeneratorInput = {
        routeAnalysis: {
          issues: [
            createRouteIssue('MISSING_ROUTE', 'CRITICAL'),
            createRouteIssue('INCORRECT_PATH', 'HIGH'),
          ],
          statistics: createDefaultRouteStats(),
        },
        typeAnalysis: {
          issues: [
            createTypeIssue('MISSING_INTERFACE', 'HIGH'),
            createTypeIssue('MISSING_PROPERTY', 'MEDIUM'),
          ],
          statistics: createDefaultTypeStats(),
        },
        hookAnalysis: {
          issues: [
            createHookIssue('MISSING_HOOK', 'MEDIUM'),
            createHookIssue('MISSING_CACHE_INVALIDATION', 'LOW'),
          ],
          statistics: createDefaultHookStats(),
        },
      };

      // Act
      const report = generateAnalysisReport(input);

      // Assert
      expect(report.summary.issuesByPriority.critical).toBe(1);
      expect(report.summary.issuesByPriority.high).toBe(2);
      expect(report.summary.issuesByPriority.medium).toBe(2);
      expect(report.summary.issuesByPriority.low).toBe(1);
    });
  });


  describe('Code Example Generation', () => {
    describe('Route Code Examples', () => {
      it('should generate code example for missing route', () => {
        // Arrange
        const mockRoute: RouteDefinition = {
          endpoint: '/api/mobile/public/test',
          method: 'GET',
          description: 'Test endpoint',
          isPublic: true,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [
              {
                type: 'MISSING_ROUTE',
                route: mockRoute,
                priority: 'HIGH',
              },
            ],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('static readonly');
        expect(rec.codeExamples.after).toContain('/api/mobile/public/test');
        expect(rec.codeExamples.before).toContain('// ');
        expect(rec.codeExamples.before).toContain('is missing');
      });

      it('should generate code example for incorrect path', () => {
        // Arrange
        const mockRoute: RouteDefinition = {
          endpoint: '/api/mobile/public/correct',
          method: 'GET',
          description: 'Test endpoint',
          isPublic: true,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [
              {
                type: 'INCORRECT_PATH',
                route: mockRoute,
                actual: '/api/public/incorrect',
                priority: 'HIGH',
              },
            ],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('/api/public/incorrect');
        expect(rec.codeExamples.after).toContain('/api/mobile/public/correct');
      });


      it('should generate code example for deprecated route', () => {
        // Arrange
        const mockRoute: RouteDefinition = {
          endpoint: '/api/public/old',
          method: 'GET',
          description: 'Deprecated endpoint',
          isPublic: true,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [
              {
                type: 'DEPRECATED_ROUTE',
                route: mockRoute,
                priority: 'MEDIUM',
                suggestion: 'Use v2 route instead',
              },
            ],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('@deprecated');
        expect(rec.codeExamples.after).toContain('/api/mobile/public/');
      });
    });

    describe('Type Code Examples', () => {
      it('should generate code example for missing interface', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [
              {
                type: 'MISSING_INTERFACE',
                interface: 'TestResponse',
                priority: 'HIGH',
                jsonStructure: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', optional: false },
                    name: { type: 'string', optional: false },
                  },
                },
              },
            ],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('export interface TestResponse');
        expect(rec.codeExamples.after).toContain('id: string');
        expect(rec.codeExamples.after).toContain('name: string');
      });


      it('should generate code example for missing property', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [
              {
                type: 'MISSING_PROPERTY',
                interface: 'UserProfile',
                property: 'email',
                expected: 'string',
                priority: 'HIGH',
              },
            ],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('// email is missing');
        expect(rec.codeExamples.after).toContain('email: string');
      });

      it('should generate code example for type mismatch', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [
              {
                type: 'TYPE_MISMATCH',
                interface: 'UserProfile',
                property: 'age',
                expected: 'number',
                actual: 'string',
                priority: 'HIGH',
              },
            ],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('age: string');
        expect(rec.codeExamples.after).toContain('age: number');
      });

      it('should generate code example for optionality mismatch', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [
              {
                type: 'OPTIONALITY_MISMATCH',
                interface: 'UserProfile',
                property: 'bio',
                expected: true,
                actual: false,
                priority: 'MEDIUM',
              },
            ],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('bio:');
        expect(rec.codeExamples.before).not.toContain('bio?:');
        expect(rec.codeExamples.after).toContain('bio?:');
      });
    });


    describe('Hook Code Examples', () => {
      it('should generate code example for missing hook', () => {
        // Arrange
        const mockRoute: RouteDefinition = {
          endpoint: '/api/mobile/public/data',
          method: 'GET',
          description: 'Get data',
          isPublic: true,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [
              {
                type: 'MISSING_HOOK',
                route: mockRoute,
                priority: 'MEDIUM',
              },
            ],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('export function');
        expect(rec.codeExamples.after).toContain('useQuery');
        expect(rec.codeExamples.after).toContain('queryKey:');
        expect(rec.codeExamples.after).toContain('queryFn:');
      });

      it('should generate mutation hook code for POST endpoint', () => {
        // Arrange
        const mockRoute: RouteDefinition = {
          endpoint: '/api/mobile/data',
          method: 'POST',
          description: 'Create data',
          isPublic: false,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [
              {
                type: 'MISSING_HOOK',
                route: mockRoute,
                priority: 'MEDIUM',
              },
            ],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('useMutation');
        expect(rec.codeExamples.after).toContain('mutationFn:');
        expect(rec.codeExamples.after).toContain('onSuccess:');
        expect(rec.codeExamples.after).toContain('invalidateQueries');
      });


      it('should generate code example for incorrect route in hook', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [
              {
                type: 'INCORRECT_ROUTE',
                hook: 'useProfile',
                expected: 'PROFILE_V2',
                actual: 'PROFILE_OLD',
                priority: 'HIGH',
              },
            ],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('PROFILE_OLD');
        expect(rec.codeExamples.after).toContain('PROFILE_V2');
      });

      it('should generate code example for missing cache invalidation', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [
              {
                type: 'MISSING_CACHE_INVALIDATION',
                hook: 'useUpdateProfile',
                priority: 'MEDIUM',
              },
            ],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('// Missing onSuccess');
        expect(rec.codeExamples.after).toContain('onSuccess:');
        expect(rec.codeExamples.after).toContain('invalidateQueries');
        expect(rec.codeExamples.after).toContain('queryClient');
      });

      it('should generate code example for invalid query key', () => {
        // Arrange
        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [
              {
                type: 'INVALID_QUERY_KEY',
                hook: 'useData',
                expected: 'Query key should include id parameter',
                priority: 'MEDIUM',
              },
            ],
            statistics: createDefaultHookStats(),
          },
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('queryKey:');
        expect(rec.codeExamples.before).toContain('// Not unique');
        expect(rec.codeExamples.after).toContain('queryKey:');
        expect(rec.codeExamples.after).toContain('id');
      });
    });


    describe('Client Code Examples', () => {
      it('should generate code example for missing X-API-Key interceptor', () => {
        // Arrange
        const clientIssues: ClientIssue[] = [
          {
            type: 'MISSING_INTERCEPTOR',
            component: 'X-API-Key interceptor',
            description: 'Missing X-API-Key header interceptor',
            priority: 'HIGH',
          },
        ];

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
          clientIssues,
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.before).toContain('// Missing X-API-Key');
        expect(rec.codeExamples.after).toContain('X-API-Key');
        expect(rec.codeExamples.after).toContain('interceptors.request.use');
      });

      it('should generate code example for missing Authorization interceptor', () => {
        // Arrange
        const clientIssues: ClientIssue[] = [
          {
            type: 'MISSING_INTERCEPTOR',
            component: 'Authorization interceptor',
            description: 'Missing Authorization header interceptor',
            priority: 'HIGH',
          },
        ];

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
          clientIssues,
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('Authorization');
        expect(rec.codeExamples.after).toContain('Bearer');
      });

      it('should generate code example for missing 401 error handling', () => {
        // Arrange
        const clientIssues: ClientIssue[] = [
          {
            type: 'MISSING_ERROR_HANDLER',
            component: '401 error handler',
            description: 'Missing 401 error handling with token refresh',
            priority: 'HIGH',
          },
        ];

        const input: ReportGeneratorInput = {
          routeAnalysis: {
            issues: [],
            statistics: createDefaultRouteStats(),
          },
          typeAnalysis: {
            issues: [],
            statistics: createDefaultTypeStats(),
          },
          hookAnalysis: {
            issues: [],
            statistics: createDefaultHookStats(),
          },
          clientIssues,
        };

        // Act
        const report = generateAnalysisReport(input);

        // Assert
        expect(report.recommendations).toHaveLength(1);
        const rec = report.recommendations[0];
        expect(rec.codeExamples.after).toContain('401');
        expect(rec.codeExamples.after).toContain('refreshAuthToken');
      });
    });
  });


  describe('Markdown Formatting', () => {
    it('should format public routes section correctly', () => {
      // Arrange
      const publicRoute: RouteDefinition = {
        endpoint: '/api/mobile/public/test',
        method: 'GET',
        description: 'Public test route',
        isPublic: true,
        errorResponses: [],
        responseBody: { type: 'object' },
      };

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
        routeIssues: [
          {
            type: 'MISSING_ROUTE' as const,
            route: publicRoute,
            priority: 'HIGH' as const,
          },
        ],
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
      expect(markdown).toContain('## Public Routes');
      expect(markdown).toContain('**Total Issues:** 1');
      expect(markdown).toContain('### Missing Public Routes');
      expect(markdown).toContain('GET /api/mobile/public/test');
      expect(markdown).toContain('Public test route');
    });

    it('should format authenticated routes section correctly', () => {
      // Arrange
      const authRoute: RouteDefinition = {
        endpoint: '/api/mobile/profile',
        method: 'GET',
        description: 'Get user profile',
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
          totalIssues: 1,
          issuesByPriority: {
            critical: 0,
            high: 1,
            medium: 0,
            low: 0,
          },
        },
        routeIssues: [
          {
            type: 'MISSING_ROUTE' as const,
            route: authRoute,
            priority: 'HIGH' as const,
          },
        ],
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
      expect(markdown).toContain('## Authenticated Routes');
      expect(markdown).toContain('### Missing Authenticated Routes');
      expect(markdown).toContain('GET /api/mobile/profile');
    });


    it('should show success message when no issues exist', () => {
      // Arrange
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 0,
          issuesByPriority: {
            critical: 0,
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
      expect(markdown).toContain('✅ All public routes are correctly implemented');
      expect(markdown).toContain('✅ All authenticated routes are correctly implemented');
      expect(markdown).toContain('✅ All interfaces are correctly implemented');
      expect(markdown).toContain('✅ All hooks are correctly implemented');
      expect(markdown).toContain('✅ Client configuration is correct');
      expect(markdown).toContain('✅ No components require migration');
    });

    it('should format severity breakdown correctly', () => {
      // Arrange
      const report = {
        timestamp: new Date().toISOString(),
        summary: {
          totalRoutes: 10,
          totalInterfaces: 5,
          totalHooks: 8,
          totalIssues: 4,
          issuesByPriority: {
            critical: 1,
            high: 1,
            medium: 1,
            low: 1,
          },
        },
        routeIssues: [
          {
            type: 'MISSING_ROUTE' as const,
            route: createMockRoute(true),
            priority: 'CRITICAL' as const,
          },
          {
            type: 'MISSING_ROUTE' as const,
            route: createMockRoute(true),
            priority: 'HIGH' as const,
          },
          {
            type: 'MISSING_ROUTE' as const,
            route: createMockRoute(true),
            priority: 'MEDIUM' as const,
          },
          {
            type: 'MISSING_ROUTE' as const,
            route: createMockRoute(true),
            priority: 'LOW' as const,
          },
        ],
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
      expect(markdown).toContain('**Severity Breakdown:**');
      expect(markdown).toContain('- Critical: 1');
      expect(markdown).toContain('- High: 1');
      expect(markdown).toContain('- Medium: 1');
      expect(markdown).toContain('- Low: 1');
    });

    it('should include affected files in recommendations', () => {
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
            category: 'ROUTE' as const,
            title: 'Add missing route',
            description: 'Route is missing',
            affectedFiles: [
              'src/services/api/routes.ts',
              'src/hooks/useApi.ts',
            ],
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
      expect(markdown).toContain('**Affected Files:**');
      expect(markdown).toContain('- src/services/api/routes.ts');
      expect(markdown).toContain('- src/hooks/useApi.ts');
    });
  });
});


// Helper functions for creating test data

function createMinimalInput(): ReportGeneratorInput {
  return {
    routeAnalysis: {
      issues: [],
      statistics: createDefaultRouteStats(),
    },
    typeAnalysis: {
      issues: [],
      statistics: createDefaultTypeStats(),
    },
    hookAnalysis: {
      issues: [],
      statistics: createDefaultHookStats(),
    },
  };
}

function createCompleteInput(): ReportGeneratorInput {
  return {
    routeAnalysis: {
      issues: [createRouteIssue('MISSING_ROUTE', 'HIGH')],
      statistics: createDefaultRouteStats(),
    },
    typeAnalysis: {
      issues: [createTypeIssue('MISSING_INTERFACE', 'HIGH')],
      statistics: createDefaultTypeStats(),
    },
    hookAnalysis: {
      issues: [createHookIssue('MISSING_HOOK', 'MEDIUM')],
      statistics: createDefaultHookStats(),
    },
    clientIssues: [
      {
        type: 'MISSING_INTERCEPTOR',
        component: 'Test interceptor',
        description: 'Test description',
        priority: 'HIGH',
      },
    ],
  };
}

function createMockRoute(isPublic: boolean): RouteDefinition {
  return {
    endpoint: isPublic ? '/api/mobile/public/test' : '/api/mobile/test',
    method: 'GET',
    description: 'Test route',
    isPublic,
    errorResponses: [],
    responseBody: { type: 'object' },
  };
}

function createRouteIssue(
  type: 'MISSING_ROUTE' | 'INCORRECT_PATH' | 'DEPRECATED_ROUTE',
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): RouteIssue {
  const route = createMockRoute(true);
  
  if (type === 'INCORRECT_PATH') {
    return {
      type,
      route,
      actual: '/api/public/incorrect',
      priority,
    };
  }
  
  return {
    type,
    route,
    priority,
  };
}

function createTypeIssue(
  type: 'MISSING_INTERFACE' | 'MISSING_PROPERTY' | 'TYPE_MISMATCH' | 'OPTIONALITY_MISMATCH',
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): TypeIssue {
  if (type === 'MISSING_INTERFACE') {
    return {
      type,
      interface: 'TestInterface',
      priority,
      jsonStructure: { type: 'object' },
    };
  }
  
  if (type === 'MISSING_PROPERTY') {
    return {
      type,
      interface: 'TestInterface',
      property: 'testProp',
      expected: 'string',
      priority,
    };
  }
  
  if (type === 'TYPE_MISMATCH') {
    return {
      type,
      interface: 'TestInterface',
      property: 'testProp',
      expected: 'number',
      actual: 'string',
      priority,
    };
  }
  
  return {
    type,
    interface: 'TestInterface',
    property: 'testProp',
    expected: true,
    actual: false,
    priority,
  };
}

function createHookIssue(
  type: 'MISSING_HOOK' | 'INCORRECT_ROUTE' | 'PARAMETER_MISMATCH' | 'INVALID_QUERY_KEY' | 'MISSING_CACHE_INVALIDATION',
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
): HookIssue {
  if (type === 'MISSING_HOOK') {
    return {
      type,
      route: createMockRoute(true),
      priority,
    };
  }
  
  return {
    type,
    hook: 'useTestHook',
    priority,
  };
}

function createDefaultRouteStats() {
  return {
    totalDocumentedRoutes: 10,
    totalImplementedRoutes: 10,
    missingRoutes: 0,
    incorrectPaths: 0,
    deprecatedRoutes: 0,
    utilityMethodIssues: 0,
  };
}

function createDefaultTypeStats() {
  return {
    totalDocumentedStructures: 5,
    totalImplementedInterfaces: 5,
    missingInterfaces: 0,
    missingProperties: 0,
    typeMismatches: 0,
    optionalityMismatches: 0,
  };
}

function createDefaultHookStats() {
  return {
    totalDocumentedEndpoints: 10,
    totalImplementedHooks: 10,
    missingHooks: 0,
    incorrectRoutes: 0,
    parameterMismatches: 0,
    invalidQueryKeys: 0,
    missingCacheInvalidation: 0,
    deprecatedRouteUsage: 0,
  };
}
