/**
 * Integration tests for Hook Analyzer with real data
 * Feature: api-routes-complete-analysis
 */

import * as path from 'path';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { parseApiHooks } from '../../src/parsers/hooks-parser';
import { parseRoutesFile } from '../../src/parsers/routes-parser';
import { analyzeHooks, generateHookIssueReport } from '../../src/analyzers/hook-analyzer';

describe('Hook Analyzer Integration', () => {
  const projectRoot = path.resolve(__dirname, '../../../..');
  const docPath = path.join(projectRoot, 'API_ROUTES_DOCUMENTATION.md');
  const hooksPath = path.join(projectRoot, 'src/hooks/useApi.ts');
  const routesPath = path.join(projectRoot, 'src/services/api/routes.ts');

  it('should analyze real hooks against documentation', () => {
    // Parse documentation
    const documentation = parseApiDocumentation(docPath);
    expect(documentation).toBeDefined();
    
    // Parse hooks
    const hooks = parseApiHooks(hooksPath);
    expect(hooks).toBeDefined();
    expect(hooks.length).toBeGreaterThan(0);

    // Parse routes
    const parsedRoutes = parseRoutesFile(routesPath);
    expect(parsedRoutes).toBeDefined();
    expect(parsedRoutes.routes.length).toBeGreaterThan(0);

    // Analyze hooks
    const result = analyzeHooks(documentation, hooks, parsedRoutes);

    // Verify analysis result structure
    expect(result).toBeDefined();
    expect(result.issues).toBeDefined();
    expect(result.statistics).toBeDefined();

    // Log statistics for visibility
    console.log('\n=== Hook Analysis Statistics ===');
    console.log(`Total documented endpoints: ${result.statistics.totalDocumentedEndpoints}`);
    console.log(`Total implemented hooks: ${result.statistics.totalImplementedHooks}`);
    console.log(`Missing hooks: ${result.statistics.missingHooks}`);
    console.log(`Incorrect routes: ${result.statistics.incorrectRoutes}`);
    console.log(`Parameter mismatches: ${result.statistics.parameterMismatches}`);
    console.log(`Invalid query keys: ${result.statistics.invalidQueryKeys}`);
    console.log(`Missing cache invalidation: ${result.statistics.missingCacheInvalidation}`);
    console.log(`Deprecated route usage: ${result.statistics.deprecatedRouteUsage}`);

    // Verify statistics are reasonable
    expect(result.statistics.totalImplementedHooks).toBeGreaterThan(0);

    // Generate report
    const report = generateHookIssueReport(result);
    expect(report).toContain('# Hook Analysis Report');
    expect(report).toContain('## Statistics');

    // Log sample issues if any
    if (result.issues.length > 0) {
      console.log('\n=== Sample Issues ===');
      const sampleIssues = result.issues.slice(0, 3);
      for (const issue of sampleIssues) {
        console.log(`\nType: ${issue.type}`);
        console.log(`Priority: ${issue.priority}`);
        if (issue.hook) {
          console.log(`Hook: ${issue.hook}`);
        }
        if (issue.route) {
          console.log(`Route: ${issue.route.endpoint} (${issue.route.method})`);
        }
        if (issue.expected) {
          console.log(`Expected: ${JSON.stringify(issue.expected)}`);
        }
        if (issue.actual) {
          console.log(`Actual: ${JSON.stringify(issue.actual)}`);
        }
      }
    }
  });

  it('should identify specific hook issues', () => {
    const documentation = parseApiDocumentation(docPath);
    const hooks = parseApiHooks(hooksPath);
    const parsedRoutes = parseRoutesFile(routesPath);

    const result = analyzeHooks(documentation, hooks, parsedRoutes);

    // Check for specific issue types
    const missingHooks = result.issues.filter(i => i.type === 'MISSING_HOOK');
    const incorrectRoutes = result.issues.filter(i => i.type === 'INCORRECT_ROUTE');
    const parameterMismatches = result.issues.filter(i => i.type === 'PARAMETER_MISMATCH');
    const invalidQueryKeys = result.issues.filter(i => i.type === 'INVALID_QUERY_KEY');
    const missingCacheInvalidation = result.issues.filter(i => i.type === 'MISSING_CACHE_INVALIDATION');

    console.log('\n=== Issue Breakdown ===');
    console.log(`Missing hooks: ${missingHooks.length}`);
    console.log(`Incorrect routes: ${incorrectRoutes.length}`);
    console.log(`Parameter mismatches: ${parameterMismatches.length}`);
    console.log(`Invalid query keys: ${invalidQueryKeys.length}`);
    console.log(`Missing cache invalidation: ${missingCacheInvalidation.length}`);

    // Verify issue counts match statistics
    expect(missingHooks.length).toBe(result.statistics.missingHooks);
    expect(incorrectRoutes.length).toBe(result.statistics.incorrectRoutes);
    expect(parameterMismatches.length).toBe(result.statistics.parameterMismatches);
    expect(invalidQueryKeys.length).toBe(result.statistics.invalidQueryKeys);
    expect(missingCacheInvalidation.length).toBe(result.statistics.missingCacheInvalidation);
  });

  it('should prioritize issues correctly', () => {
    const documentation = parseApiDocumentation(docPath);
    const hooks = parseApiHooks(hooksPath);
    const parsedRoutes = parseRoutesFile(routesPath);

    const result = analyzeHooks(documentation, hooks, parsedRoutes);

    // Group issues by priority
    const criticalIssues = result.issues.filter(i => i.priority === 'CRITICAL');
    const highIssues = result.issues.filter(i => i.priority === 'HIGH');
    const mediumIssues = result.issues.filter(i => i.priority === 'MEDIUM');
    const lowIssues = result.issues.filter(i => i.priority === 'LOW');

    console.log('\n=== Priority Breakdown ===');
    console.log(`Critical: ${criticalIssues.length}`);
    console.log(`High: ${highIssues.length}`);
    console.log(`Medium: ${mediumIssues.length}`);
    console.log(`Low: ${lowIssues.length}`);

    // Verify all issues have a priority
    expect(criticalIssues.length + highIssues.length + mediumIssues.length + lowIssues.length)
      .toBe(result.issues.length);
  });

  it('should generate actionable recommendations', () => {
    const documentation = parseApiDocumentation(docPath);
    const hooks = parseApiHooks(hooksPath);
    const parsedRoutes = parseRoutesFile(routesPath);

    const result = analyzeHooks(documentation, hooks, parsedRoutes);
    const report = generateHookIssueReport(result);

    // Verify report contains actionable information
    expect(report).toContain('Priority:');
    
    // If there are issues, verify they have expected/actual information
    if (result.issues.length > 0) {
      const issuesWithExpected = result.issues.filter(i => i.expected !== undefined);
      expect(issuesWithExpected.length).toBeGreaterThan(0);
    }
  });
});
