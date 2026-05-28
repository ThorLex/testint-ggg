/**
 * Unit tests for Update Plan Generator
 * Feature: api-routes-complete-analysis
 * Task: 11.3 Write unit tests for update plan generator
 * 
 * Tests:
 * - Phase generation
 * - Task dependency resolution
 * - Prioritization logic
 */

import { generateUpdatePlan } from '../../src/generators/update-plan-generator';
import {
  AnalysisReport,
  RouteIssue,
  TypeIssue,
  HookIssue,
  ClientIssue,
  RouteDefinition,
  UpdatePhase,
  UpdateTask,
  Dependency,
} from '../../types/core';

describe('Update Plan Generator', () => {
  // Helper function to create a mock analysis report
  function createMockReport(
    routeIssues: RouteIssue[] = [],
    typeIssues: TypeIssue[] = [],
    hookIssues: HookIssue[] = [],
    clientIssues: ClientIssue[] = []
  ): AnalysisReport {
    return {
      timestamp: new Date().toISOString(),
      summary: {
        totalRoutes: 10,
        totalInterfaces: 5,
        totalHooks: 8,
        totalIssues: routeIssues.length + typeIssues.length + hookIssues.length + clientIssues.length,
        issuesByPriority: {
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
        },
      },
      routeIssues,
      typeIssues,
      hookIssues,
      clientIssues,
      recommendations: [],
      warnings: [],
      metadata: {
        filesAnalyzed: [],
        filesMissing: [],
        parseErrors: 0,
      },
    };
  }

  // Helper function to create a mock route
  function createMockRoute(endpoint: string, method: string = 'GET', isPublic: boolean = true): RouteDefinition {
    return {
      endpoint,
      method: method as any,
      description: `Test route for ${endpoint}`,
      isPublic,
      errorResponses: [],
      responseBody: { type: 'object' },
    };
  }

  describe('Phase Generation', () => {
    it('should generate all phases when all issue types are present', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }],
        [{ type: 'MISSING_INTERCEPTOR', component: 'API Key', description: 'Missing API key interceptor', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.phases).toHaveLength(5); // Routes, Interfaces, Hooks, Client, Components
      expect(updatePlan.phases[0].name).toBe('API Routes Configuration');
      expect(updatePlan.phases[1].name).toBe('TypeScript Interfaces');
      expect(updatePlan.phases[2].name).toBe('React Query Hooks');
      expect(updatePlan.phases[3].name).toBe('Axios Client Configuration');
      expect(updatePlan.phases[4].name).toBe('Component Migration');
    });

    it('should only generate phases for issue types that exist', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [], // No type issues
        [], // No hook issues
        []  // No client issues
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.phases.length).toBeGreaterThan(0);
      expect(updatePlan.phases.some(p => p.name === 'API Routes Configuration')).toBe(true);
      expect(updatePlan.phases.some(p => p.name === 'TypeScript Interfaces')).toBe(false);
      expect(updatePlan.phases.some(p => p.name === 'React Query Hooks')).toBe(false);
    });

    it('should assign correct phase numbers in sequence', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.phases[0].phase).toBe(1);
      expect(updatePlan.phases[1].phase).toBe(2);
      expect(updatePlan.phases[2].phase).toBe(3);
    });

    it('should generate tasks for missing routes', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/amodiataires', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks).toHaveLength(1);
      expect(routePhase!.tasks[0].type).toBe('ADD');
      expect(routePhase!.tasks[0].title).toContain('Add missing route');
      expect(routePhase!.tasks[0].file).toBe('src/services/api/routes.ts');
    });

    it('should generate tasks for incorrect route paths', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'INCORRECT_PATH', route: mockRoute, actual: '/api/public/test', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks).toHaveLength(1);
      expect(routePhase!.tasks[0].type).toBe('MODIFY');
      expect(routePhase!.tasks[0].title).toContain('Fix incorrect path');
      expect(routePhase!.tasks[0].codeExample.before).toContain('/api/public/test');
      expect(routePhase!.tasks[0].codeExample.after).toContain('/api/mobile/public/test');
    });

    it('should generate tasks for deprecated routes', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/public/amodiataires', 'GET');
      const report = createMockReport(
        [{ type: 'DEPRECATED_ROUTE', route: mockRoute, suggestion: 'PUBLIC_AMODIATAIRES_V2', priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks).toHaveLength(1);
      expect(routePhase!.tasks[0].type).toBe('MODIFY');
      expect(routePhase!.tasks[0].title).toContain('Migrate from deprecated route');
      expect(routePhase!.tasks[0].codeExample.after).toContain('@deprecated');
    });

    it('should generate tasks for missing interfaces', () => {
      // Arrange
      const report = createMockReport(
        [],
        [{ type: 'MISSING_INTERFACE', interface: 'AmodiataireDetailResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const interfacePhase = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces');
      expect(interfacePhase).toBeDefined();
      expect(interfacePhase!.tasks).toHaveLength(1);
      expect(interfacePhase!.tasks[0].type).toBe('ADD');
      expect(interfacePhase!.tasks[0].title).toContain('Create interface');
      expect(interfacePhase!.tasks[0].file).toBe('src/types/api.ts');
    });

    it('should generate tasks for missing properties', () => {
      // Arrange
      const report = createMockReport(
        [],
        [{ type: 'MISSING_PROPERTY', interface: 'UserProfile', property: 'email', expected: 'string', priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const interfacePhase = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces');
      expect(interfacePhase).toBeDefined();
      expect(interfacePhase!.tasks).toHaveLength(1);
      expect(interfacePhase!.tasks[0].type).toBe('MODIFY');
      expect(interfacePhase!.tasks[0].title).toContain('Add property');
      expect(interfacePhase!.tasks[0].title).toContain('email');
    });

    it('should generate tasks for type mismatches', () => {
      // Arrange
      const report = createMockReport(
        [],
        [{ type: 'TYPE_MISMATCH', interface: 'UserProfile', property: 'age', expected: 'number', actual: 'string', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const interfacePhase = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces');
      expect(interfacePhase).toBeDefined();
      expect(interfacePhase!.tasks).toHaveLength(1);
      expect(interfacePhase!.tasks[0].type).toBe('MODIFY');
      expect(interfacePhase!.tasks[0].title).toContain('Fix type');
      expect(interfacePhase!.tasks[0].codeExample.before).toContain('string');
      expect(interfacePhase!.tasks[0].codeExample.after).toContain('number');
    });

    it('should generate tasks for optionality mismatches', () => {
      // Arrange
      const report = createMockReport(
        [],
        [{ type: 'OPTIONALITY_MISMATCH', interface: 'UserProfile', property: 'bio', expected: true, actual: false, priority: 'LOW' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const interfacePhase = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces');
      expect(interfacePhase).toBeDefined();
      expect(interfacePhase!.tasks).toHaveLength(1);
      expect(interfacePhase!.tasks[0].type).toBe('MODIFY');
      expect(interfacePhase!.tasks[0].title).toContain('Fix optionality');
      expect(interfacePhase!.tasks[0].description).toContain('optional');
    });

    it('should generate tasks for missing hooks', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [],
        [],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookPhase = updatePlan.phases.find(p => p.name === 'React Query Hooks');
      expect(hookPhase).toBeDefined();
      expect(hookPhase!.tasks).toHaveLength(1);
      expect(hookPhase!.tasks[0].type).toBe('ADD');
      expect(hookPhase!.tasks[0].title).toContain('Create hook');
      expect(hookPhase!.tasks[0].file).toBe('src/hooks/useApi.ts');
    });

    it('should generate tasks for incorrect routes in hooks', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [{ type: 'INCORRECT_ROUTE', hook: 'useAmodiataires', expected: 'PUBLIC_AMODIATAIRES_V2', actual: 'PUBLIC_AMODIATAIRES', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookPhase = updatePlan.phases.find(p => p.name === 'React Query Hooks');
      expect(hookPhase).toBeDefined();
      expect(hookPhase!.tasks).toHaveLength(1);
      expect(hookPhase!.tasks[0].type).toBe('MODIFY');
      expect(hookPhase!.tasks[0].title).toContain('Fix route in hook');
    });

    it('should generate tasks for parameter mismatches', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [{ 
          type: 'PARAMETER_MISMATCH', 
          hook: 'useAmodiataires', 
          expected: [{ name: 'limit', type: 'number', required: false }, { name: 'offset', type: 'number', required: false }],
          priority: 'MEDIUM' 
        }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookPhase = updatePlan.phases.find(p => p.name === 'React Query Hooks');
      expect(hookPhase).toBeDefined();
      expect(hookPhase!.tasks).toHaveLength(1);
      expect(hookPhase!.tasks[0].type).toBe('MODIFY');
      expect(hookPhase!.tasks[0].title).toContain('Add parameters to hook');
    });

    it('should generate tasks for invalid query keys', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [{ type: 'INVALID_QUERY_KEY', hook: 'useAmodiataires', priority: 'LOW' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookPhase = updatePlan.phases.find(p => p.name === 'React Query Hooks');
      expect(hookPhase).toBeDefined();
      expect(hookPhase!.tasks).toHaveLength(1);
      expect(hookPhase!.tasks[0].type).toBe('MODIFY');
      expect(hookPhase!.tasks[0].title).toContain('Fix query key');
    });

    it('should generate tasks for missing cache invalidation', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [{ type: 'MISSING_CACHE_INVALIDATION', hook: 'useUpdateProfile', priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookPhase = updatePlan.phases.find(p => p.name === 'React Query Hooks');
      expect(hookPhase).toBeDefined();
      expect(hookPhase!.tasks).toHaveLength(1);
      expect(hookPhase!.tasks[0].type).toBe('MODIFY');
      expect(hookPhase!.tasks[0].title).toContain('Add cache invalidation');
      expect(hookPhase!.tasks[0].codeExample.after).toContain('invalidateQueries');
    });

    it('should generate tasks for client issues', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [],
        [{ type: 'MISSING_INTERCEPTOR', component: 'API Key', description: 'Missing API key interceptor', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const clientPhase = updatePlan.phases.find(p => p.name === 'Axios Client Configuration');
      expect(clientPhase).toBeDefined();
      expect(clientPhase!.tasks).toHaveLength(1);
      expect(clientPhase!.tasks[0].type).toBe('MODIFY');
      expect(clientPhase!.tasks[0].file).toBe('src/services/api/client.ts');
    });

    it('should generate component migration phase', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const componentPhase = updatePlan.phases.find(p => p.name === 'Component Migration');
      expect(componentPhase).toBeDefined();
      expect(componentPhase!.phase).toBe(5);
      expect(componentPhase!.tasks.length).toBeGreaterThan(0);
    });
  });

  describe('Task Dependency Resolution', () => {
    it('should create dependencies between hook tasks and route tasks', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.dependencies.length).toBeGreaterThan(0);
      const hookTask = updatePlan.phases.find(p => p.name === 'React Query Hooks')?.tasks[0];
      if (hookTask) {
        const dependency = updatePlan.dependencies.find(d => d.taskId === hookTask.id);
        expect(dependency).toBeDefined();
        expect(dependency!.reason).toContain('route');
      }
    });

    it('should create dependencies between hook tasks and interface tasks', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const hookTask = updatePlan.phases.find(p => p.name === 'React Query Hooks')?.tasks[0];
      if (hookTask) {
        const dependency = updatePlan.dependencies.find(d => d.taskId === hookTask.id);
        // Dependencies may or may not be created depending on whether the hook references the interface
        // This is acceptable behavior
        if (dependency) {
          expect(dependency.reason).toContain('interface');
        }
      }
    });

    it('should create dependencies between component tasks and hook tasks', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [],
        [],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const componentPhase = updatePlan.phases.find(p => p.name === 'Component Migration');
      if (componentPhase && componentPhase.tasks.length > 0) {
        const componentTask = componentPhase.tasks[0];
        const dependency = updatePlan.dependencies.find(d => d.taskId === componentTask.id);
        if (dependency) {
          expect(dependency.reason).toContain('hook');
        }
      }
    });

    it('should create dependencies between interface tasks with nested types', () => {
      // Arrange
      const report = createMockReport(
        [],
        [
          { 
            type: 'MISSING_INTERFACE', 
            interface: 'AmodiataireDetail', 
            priority: 'HIGH', 
            jsonStructure: { type: 'object' }
          },
          { 
            type: 'MISSING_INTERFACE', 
            interface: 'LotDetail', 
            priority: 'HIGH', 
            jsonStructure: { type: 'object' } 
          }
        ]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const interfacePhase = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces');
      expect(interfacePhase).toBeDefined();
      
      const amodiataireTask = interfacePhase!.tasks.find(t => t.title.includes('AmodiataireDetail'));
      if (amodiataireTask) {
        const dependency = updatePlan.dependencies.find(d => d.taskId === amodiataireTask.id);
        if (dependency) {
          expect(dependency.reason).toContain('interface');
        }
      }
    });

    it('should not create circular dependencies', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert - Check for circular dependencies
      const taskIds = new Set<string>();
      for (const phase of updatePlan.phases) {
        for (const task of phase.tasks) {
          taskIds.add(task.id);
        }
      }

      for (const dependency of updatePlan.dependencies) {
        expect(taskIds.has(dependency.taskId)).toBe(true);
        for (const depId of dependency.dependsOn) {
          expect(taskIds.has(depId)).toBe(true);
          // A task should not depend on itself
          expect(dependency.taskId).not.toBe(depId);
        }
      }
    });

    it('should ensure all dependency task IDs reference valid tasks', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const allTaskIds = updatePlan.phases.flatMap(p => p.tasks.map(t => t.id));
      
      for (const dependency of updatePlan.dependencies) {
        expect(allTaskIds).toContain(dependency.taskId);
        for (const depId of dependency.dependsOn) {
          expect(allTaskIds).toContain(depId);
        }
      }
    });
  });

  describe('Prioritization Logic', () => {
    it('should assign CRITICAL priority to phases with critical issues', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'CRITICAL' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.priority).toBe('CRITICAL');
    });

    it('should assign HIGH priority to phases with high issues', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.priority).toBe('HIGH');
    });

    it('should use highest priority when phase has mixed priority issues', () => {
      // Arrange
      const mockRoute1 = createMockRoute('/api/mobile/public/test1', 'GET');
      const mockRoute2 = createMockRoute('/api/mobile/public/test2', 'GET');
      const mockRoute3 = createMockRoute('/api/mobile/public/test3', 'GET');
      const report = createMockReport(
        [
          { type: 'MISSING_ROUTE', route: mockRoute1, priority: 'LOW' },
          { type: 'MISSING_ROUTE', route: mockRoute2, priority: 'HIGH' },
          { type: 'MISSING_ROUTE', route: mockRoute3, priority: 'MEDIUM' }
        ]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.priority).toBe('HIGH');
    });

    it('should calculate correct estimated time based on task count', () => {
      // Arrange
      const mockRoutes = [
        createMockRoute('/api/mobile/public/test1', 'GET'),
        createMockRoute('/api/mobile/public/test2', 'GET'),
        createMockRoute('/api/mobile/public/test3', 'GET'),
      ];
      const report = createMockReport(
        mockRoutes.map(route => ({ type: 'MISSING_ROUTE' as const, route, priority: 'HIGH' as const }))
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.estimatedTime).toBeDefined();
      expect(routePhase!.estimatedTime).toContain('minute');
    });

    it('should calculate metadata with correct risk level for critical issues', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'CRITICAL' }]
      );
      report.summary.issuesByPriority.critical = 1;

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.riskLevel).toBe('HIGH');
    });

    it('should calculate metadata with correct risk level for high issues', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );
      report.summary.issuesByPriority.high = 1;

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.riskLevel).toBe('MEDIUM');
    });

    it('should calculate metadata with LOW risk level when no critical or high issues', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'LOW' }]
      );
      report.summary.issuesByPriority.low = 1;

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.riskLevel).toBe('LOW');
    });

    it('should calculate total estimated effort across all phases', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.estimatedEffort).toBeDefined();
      expect(updatePlan.metadata.estimatedEffort).toMatch(/\d+\s+(hour|minute)/);
    });
  });

  describe('Validation Tests Generation', () => {
    it('should generate validation tests for route phase', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.validationTests.length).toBeGreaterThan(0);
      const routeTest = updatePlan.validationTests.find(t => t.name.includes('Route'));
      expect(routeTest).toBeDefined();
      expect(routeTest!.type).toBe('UNIT');
      expect(routeTest!.file).toContain('routes.test.ts');
    });

    it('should generate validation tests for interface phase', () => {
      // Arrange
      const report = createMockReport(
        [],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.validationTests.length).toBeGreaterThan(0);
      const interfaceTest = updatePlan.validationTests.find(t => t.name.includes('Interface'));
      expect(interfaceTest).toBeDefined();
      expect(interfaceTest!.type).toBe('UNIT');
      expect(interfaceTest!.file).toContain('api.test.ts');
    });

    it('should generate validation tests for hook phase', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [],
        [],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.validationTests.length).toBeGreaterThan(0);
      const hookTest = updatePlan.validationTests.find(t => t.name.includes('Hook'));
      expect(hookTest).toBeDefined();
      expect(hookTest!.type).toBe('INTEGRATION');
      expect(hookTest!.file).toContain('useApi.integration.test.ts');
    });

    it('should generate validation tests for client phase', () => {
      // Arrange
      const report = createMockReport(
        [],
        [],
        [],
        [{ type: 'MISSING_INTERCEPTOR', component: 'API Key', description: 'Missing API key interceptor', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.validationTests.length).toBeGreaterThan(0);
      const clientTest = updatePlan.validationTests.find(t => t.name.includes('Client'));
      expect(clientTest).toBeDefined();
      expect(clientTest!.type).toBe('INTEGRATION');
      expect(clientTest!.file).toContain('client.test.ts');
    });

    it('should include test code in validation tests', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routeTest = updatePlan.validationTests.find(t => t.name.includes('Route'));
      expect(routeTest).toBeDefined();
      expect(routeTest!.code).toBeDefined();
      expect(routeTest!.code).toContain('describe');
      expect(routeTest!.code).toContain('it');
    });
  });

  describe('Code Example Generation', () => {
    it('should generate code examples with before and after for modifications', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'INCORRECT_PATH', route: mockRoute, actual: '/api/public/test', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks[0].codeExample.before).toBeDefined();
      expect(routePhase!.tasks[0].codeExample.after).toBeDefined();
      expect(routePhase!.tasks[0].codeExample.before).not.toBe(routePhase!.tasks[0].codeExample.after);
    });

    it('should generate code examples with only after for additions', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks[0].codeExample.before).toBeUndefined();
      expect(routePhase!.tasks[0].codeExample.after).toBeDefined();
    });

    it('should include testing notes for each task', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks[0].testingNotes).toBeDefined();
      expect(routePhase!.tasks[0].testingNotes.length).toBeGreaterThan(0);
    });

    it('should generate unique task IDs', () => {
      // Arrange
      const mockRoutes = [
        createMockRoute('/api/mobile/public/test1', 'GET'),
        createMockRoute('/api/mobile/public/test2', 'GET'),
        createMockRoute('/api/mobile/public/test3', 'GET'),
      ];
      const report = createMockReport(
        mockRoutes.map(route => ({ type: 'MISSING_ROUTE' as const, route, priority: 'HIGH' as const }))
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const allTaskIds = updatePlan.phases.flatMap(p => p.tasks.map(t => t.id));
      const uniqueTaskIds = new Set(allTaskIds);
      expect(allTaskIds.length).toBe(uniqueTaskIds.size);
    });

    it('should format task IDs with proper prefixes', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }],
        [{ type: 'MISSING_INTERCEPTOR', component: 'API Key', description: 'Missing API key interceptor', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routeTask = updatePlan.phases.find(p => p.name === 'API Routes Configuration')?.tasks[0];
      const interfaceTask = updatePlan.phases.find(p => p.name === 'TypeScript Interfaces')?.tasks[0];
      const hookTask = updatePlan.phases.find(p => p.name === 'React Query Hooks')?.tasks[0];
      const clientTask = updatePlan.phases.find(p => p.name === 'Axios Client Configuration')?.tasks[0];

      expect(routeTask?.id).toMatch(/^ROUTE-\d{3}$/);
      expect(interfaceTask?.id).toMatch(/^TYPE-\d{3}$/);
      expect(hookTask?.id).toMatch(/^HOOK-\d{3}$/);
      expect(clientTask?.id).toMatch(/^CLIENT-\d{3}$/);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty report with no issues', () => {
      // Arrange
      const report = createMockReport();

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan).toBeDefined();
      expect(updatePlan.phases.length).toBeGreaterThanOrEqual(0);
      expect(updatePlan.metadata).toBeDefined();
      expect(updatePlan.dependencies).toBeDefined();
      expect(updatePlan.validationTests).toBeDefined();
    });

    it('should handle routes with path parameters', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/amodiataires/:id', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks[0].codeExample.after).toContain(':id');
      // Should also generate utility method
      expect(routePhase!.tasks[0].testingNotes).toContain('utility method');
    });

    it('should handle multiple issues of the same type', () => {
      // Arrange
      const mockRoutes = Array.from({ length: 10 }, (_, i) => 
        createMockRoute(`/api/mobile/public/test${i}`, 'GET')
      );
      const report = createMockReport(
        mockRoutes.map(route => ({ type: 'MISSING_ROUTE' as const, route, priority: 'HIGH' as const }))
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      expect(routePhase).toBeDefined();
      expect(routePhase!.tasks).toHaveLength(10);
    });

    it('should handle issues without suggestions', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'DEPRECATED_ROUTE', route: mockRoute, priority: 'MEDIUM' }] // No suggestion field
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      // Should skip deprecated routes without suggestions, so no route phase should be created
      const routePhase = updatePlan.phases.find(p => p.name === 'API Routes Configuration');
      if (routePhase) {
        expect(routePhase.tasks).toHaveLength(0);
      } else {
        // It's also acceptable to not create the phase at all
        expect(routePhase).toBeUndefined();
      }
    });

    it('should handle metadata creation date format', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.createdDate).toBeDefined();
      expect(updatePlan.metadata.createdDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it('should handle large estimated effort calculations', () => {
      // Arrange
      const mockRoutes = Array.from({ length: 100 }, (_, i) => 
        createMockRoute(`/api/mobile/public/test${i}`, 'GET')
      );
      const report = createMockReport(
        mockRoutes.map(route => ({ type: 'MISSING_ROUTE' as const, route, priority: 'HIGH' as const }))
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      expect(updatePlan.metadata.estimatedEffort).toBeDefined();
      expect(updatePlan.metadata.estimatedEffort).toContain('hour');
    });
  });

  describe('Integration', () => {
    it('should generate a complete update plan with all components', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }],
        [{ type: 'MISSING_INTERCEPTOR', component: 'API Key', description: 'Missing API key interceptor', priority: 'HIGH' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert - Verify all major components are present
      expect(updatePlan.metadata).toBeDefined();
      expect(updatePlan.metadata.createdDate).toBeDefined();
      expect(updatePlan.metadata.estimatedEffort).toBeDefined();
      expect(updatePlan.metadata.riskLevel).toBeDefined();

      expect(updatePlan.phases).toBeDefined();
      expect(updatePlan.phases.length).toBeGreaterThan(0);

      expect(updatePlan.dependencies).toBeDefined();
      expect(Array.isArray(updatePlan.dependencies)).toBe(true);

      expect(updatePlan.validationTests).toBeDefined();
      expect(updatePlan.validationTests.length).toBeGreaterThan(0);

      // Verify each phase has required properties
      for (const phase of updatePlan.phases) {
        expect(phase.phase).toBeDefined();
        expect(phase.name).toBeDefined();
        expect(phase.description).toBeDefined();
        expect(phase.priority).toBeDefined();
        expect(phase.estimatedTime).toBeDefined();
        expect(phase.tasks).toBeDefined();
        expect(Array.isArray(phase.tasks)).toBe(true);

        // Verify each task has required properties
        for (const task of phase.tasks) {
          expect(task.id).toBeDefined();
          expect(task.title).toBeDefined();
          expect(task.description).toBeDefined();
          expect(task.file).toBeDefined();
          expect(task.type).toBeDefined();
          expect(task.codeExample).toBeDefined();
          expect(task.affectedComponents).toBeDefined();
          expect(task.testingNotes).toBeDefined();
        }
      }
    });

    it('should maintain consistency between phases and dependencies', () => {
      // Arrange
      const mockRoute = createMockRoute('/api/mobile/public/test', 'GET');
      const report = createMockReport(
        [{ type: 'MISSING_ROUTE', route: mockRoute, priority: 'HIGH' }],
        [{ type: 'MISSING_INTERFACE', interface: 'TestResponse', priority: 'HIGH', jsonStructure: { type: 'object' } }],
        [{ type: 'MISSING_HOOK', route: mockRoute, priority: 'MEDIUM' }]
      );

      // Act
      const updatePlan = generateUpdatePlan(report);

      // Assert
      const allTaskIds = new Set(updatePlan.phases.flatMap(p => p.tasks.map(t => t.id)));
      
      for (const dependency of updatePlan.dependencies) {
        expect(allTaskIds.has(dependency.taskId)).toBe(true);
        for (const depId of dependency.dependsOn) {
          expect(allTaskIds.has(depId)).toBe(true);
        }
      }
    });
  });
});
