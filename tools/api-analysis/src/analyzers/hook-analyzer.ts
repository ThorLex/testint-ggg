/**
 * Hook Analyzer for React Query Hooks Comparison
 * Feature: api-routes-complete-analysis
 * 
 * Compares documented endpoints with existing hooks to identify:
 * - Missing hooks for documented endpoints
 * - Hooks using incorrect route constants
 * - Query parameters that don't match documentation
 * - Query keys that aren't unique or don't include relevant parameters
 * - Hooks using deprecated routes
 * - Mutation hooks missing cache invalidation
 */

import {
  ParsedDocumentation,
  RouteDefinition,
  HookIssue,
  HookDefinition,
  IssuePriority,
  ParamDefinition,
  ParamInfo,
} from '../../types/core';
import { ParsedRoutes } from '../parsers/routes-parser';
import { normalizeRoutePath, routePathsMatch } from '../normalizers/data-normalizer';

/**
 * Hook analysis result
 */
export interface HookAnalysisResult {
  issues: HookIssue[];
  statistics: {
    totalDocumentedEndpoints: number;
    totalImplementedHooks: number;
    missingHooks: number;
    incorrectRoutes: number;
    parameterMismatches: number;
    invalidQueryKeys: number;
    missingCacheInvalidation: number;
    deprecatedRouteUsage: number;
  };
}

/**
 * Analyze hooks by comparing documentation with implementation
 */
export function analyzeHooks(
  documentation: ParsedDocumentation,
  hooks: HookDefinition[],
  parsedRoutes: ParsedRoutes
): HookAnalysisResult {
  const issues: HookIssue[] = [];

  // Combine all documented routes
  const allDocumentedRoutes = [
    ...documentation.publicRoutes,
    ...documentation.authenticatedRoutes,
  ];

  // 1. Check for missing hooks (documented endpoints without hooks)
  const missingHookIssues = findMissingHooks(allDocumentedRoutes, hooks);
  issues.push(...missingHookIssues);

  // 2. Validate hooks use correct route constants
  const incorrectRouteIssues = validateHookRoutes(hooks, allDocumentedRoutes, parsedRoutes);
  issues.push(...incorrectRouteIssues);

  // 3. Validate query parameters match documentation
  const parameterIssues = validateQueryParameters(hooks, allDocumentedRoutes);
  issues.push(...parameterIssues);

  // 4. Validate query keys are unique and include relevant parameters
  const queryKeyIssues = validateQueryKeys(hooks);
  issues.push(...queryKeyIssues);

  // 5. Detect deprecated route usage in hooks
  const deprecatedRouteIssues = detectDeprecatedRouteUsage(hooks, parsedRoutes);
  issues.push(...deprecatedRouteIssues);

  // 6. Validate mutation hooks have cache invalidation
  const cacheInvalidationIssues = validateCacheInvalidation(hooks);
  issues.push(...cacheInvalidationIssues);

  // Calculate statistics
  const statistics = {
    totalDocumentedEndpoints: allDocumentedRoutes.length,
    totalImplementedHooks: hooks.length,
    missingHooks: issues.filter(i => i.type === 'MISSING_HOOK').length,
    incorrectRoutes: issues.filter(i => i.type === 'INCORRECT_ROUTE').length,
    parameterMismatches: issues.filter(i => i.type === 'PARAMETER_MISMATCH').length,
    invalidQueryKeys: issues.filter(i => i.type === 'INVALID_QUERY_KEY').length,
    missingCacheInvalidation: issues.filter(i => i.type === 'MISSING_CACHE_INVALIDATION').length,
    deprecatedRouteUsage: issues.filter(i => i.type === 'INCORRECT_ROUTE' && i.actual?.includes('deprecated')).length,
  };

  return {
    issues,
    statistics,
  };
}

/**
 * Find documented endpoints that don't have corresponding hooks
 */
function findMissingHooks(
  documentedRoutes: RouteDefinition[],
  hooks: HookDefinition[]
): HookIssue[] {
  const issues: HookIssue[] = [];

  for (const route of documentedRoutes) {
    const matchingHook = findMatchingHook(route, hooks);

    if (!matchingHook) {
      issues.push({
        type: 'MISSING_HOOK',
        route,
        priority: determinePriority(route),
      });
    }
  }

  return issues;
}

/**
 * Validate that hooks use the correct route constants
 */
function validateHookRoutes(
  hooks: HookDefinition[],
  documentedRoutes: RouteDefinition[],
  parsedRoutes: ParsedRoutes
): HookIssue[] {
  const issues: HookIssue[] = [];

  for (const hook of hooks) {
    // Find the documented route this hook should correspond to
    const expectedRoute = findRouteForHook(hook, documentedRoutes);
    
    if (!expectedRoute) {
      // Hook exists but no documented route found - might be a custom hook
      continue;
    }

    // Check if the hook uses the correct route constant
    const routeConstant = parsedRoutes.routes.find(r => r.name === hook.endpoint);
    
    if (!routeConstant) {
      // Hook uses a route constant that doesn't exist
      issues.push({
        type: 'INCORRECT_ROUTE',
        hook: hook.name,
        route: expectedRoute,
        expected: expectedRoute.endpoint,
        actual: hook.endpoint,
        priority: 'HIGH',
      });
      continue;
    }

    // Validate the route constant value matches the documented endpoint
    const normalizedExpected = normalizeRoutePath(expectedRoute.endpoint);
    const normalizedActual = normalizeRoutePath(routeConstant.value);

    if (!routePathsMatch(normalizedExpected, normalizedActual)) {
      issues.push({
        type: 'INCORRECT_ROUTE',
        hook: hook.name,
        route: expectedRoute,
        expected: expectedRoute.endpoint,
        actual: routeConstant.value,
        priority: 'HIGH',
      });
    }
  }

  return issues;
}

/**
 * Validate that query parameters match documentation
 */
function validateQueryParameters(
  hooks: HookDefinition[],
  documentedRoutes: RouteDefinition[]
): HookIssue[] {
  const issues: HookIssue[] = [];

  for (const hook of hooks) {
    const expectedRoute = findRouteForHook(hook, documentedRoutes);
    
    if (!expectedRoute || !expectedRoute.queryParams || expectedRoute.queryParams.length === 0) {
      continue;
    }

    // Check if hook accepts parameters
    if (!hook.parameters || hook.parameters.length === 0) {
      issues.push({
        type: 'PARAMETER_MISMATCH',
        hook: hook.name,
        route: expectedRoute,
        expected: expectedRoute.queryParams,
        actual: [],
        priority: 'MEDIUM',
      });
      continue;
    }

    // Validate parameter types and names
    const parameterIssue = validateParameterMatch(
      hook,
      expectedRoute.queryParams,
      hook.parameters
    );

    if (parameterIssue) {
      issues.push(parameterIssue);
    }
  }

  return issues;
}

/**
 * Validate that query keys are unique and include relevant parameters
 */
function validateQueryKeys(hooks: HookDefinition[]): HookIssue[] {
  const issues: HookIssue[] = [];
  const queryKeyMap = new Map<string, HookDefinition[]>();

  for (const hook of hooks) {
    if (hook.type !== 'query' || !hook.queryKey) {
      continue;
    }

    // Check if query key includes parameters when hook has parameters
    if (hook.parameters && hook.parameters.length > 0) {
      const hasParamsInKey = hook.queryKey.some(key => 
        typeof key === 'string' && hook.parameters?.some(p => key.includes(p.name))
      );

      if (!hasParamsInKey && hook.queryKey.length < 3) {
        issues.push({
          type: 'INVALID_QUERY_KEY',
          hook: hook.name,
          expected: 'Query key should include parameters for cache differentiation',
          actual: hook.queryKey,
          priority: 'MEDIUM',
        });
      }
    }

    // Track query keys for uniqueness check
    const keyString = JSON.stringify(hook.queryKey.slice(0, 2)); // Compare first 2 elements
    if (!queryKeyMap.has(keyString)) {
      queryKeyMap.set(keyString, []);
    }
    queryKeyMap.get(keyString)!.push(hook);
  }

  // Check for duplicate query keys
  for (const [keyString, hooksWithKey] of queryKeyMap.entries()) {
    if (hooksWithKey.length > 1) {
      for (const hook of hooksWithKey) {
        issues.push({
          type: 'INVALID_QUERY_KEY',
          hook: hook.name,
          expected: 'Query key should be unique',
          actual: `Shared with: ${hooksWithKey.filter(h => h.name !== hook.name).map(h => h.name).join(', ')}`,
          priority: 'HIGH',
        });
      }
    }
  }

  return issues;
}

/**
 * Detect hooks using deprecated routes
 */
function detectDeprecatedRouteUsage(
  hooks: HookDefinition[],
  parsedRoutes: ParsedRoutes
): HookIssue[] {
  const issues: HookIssue[] = [];

  for (const hook of hooks) {
    const routeConstant = parsedRoutes.routes.find(r => r.name === hook.endpoint);
    
    if (routeConstant && routeConstant.deprecated) {
      // Create a mock route for the issue
      const mockRoute: RouteDefinition = {
        endpoint: routeConstant.value,
        method: 'GET',
        description: `Hook ${hook.name} uses deprecated route ${routeConstant.name}`,
        isPublic: routeConstant.value.includes('/public/'),
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      issues.push({
        type: 'INCORRECT_ROUTE',
        hook: hook.name,
        route: mockRoute,
        expected: 'Use non-deprecated route constant',
        actual: `${routeConstant.name} (deprecated)`,
        priority: 'HIGH',
      });
    }
  }

  return issues;
}

/**
 * Validate that mutation hooks have cache invalidation
 */
function validateCacheInvalidation(hooks: HookDefinition[]): HookIssue[] {
  const issues: HookIssue[] = [];

  for (const hook of hooks) {
    if (hook.type !== 'mutation') {
      continue;
    }

    // Check if mutation has cache invalidation
    if (!hook.invalidatesCache || hook.invalidatesCache.length === 0) {
      issues.push({
        type: 'MISSING_CACHE_INVALIDATION',
        hook: hook.name,
        expected: 'Mutation should invalidate relevant query caches',
        priority: 'HIGH',
      });
    }
  }

  return issues;
}

/**
 * Find a matching hook for a documented route
 */
function findMatchingHook(
  route: RouteDefinition,
  hooks: HookDefinition[]
): HookDefinition | null {
  // Try to match by endpoint pattern
  for (const hook of hooks) {
    if (isHookForRoute(hook, route)) {
      return hook;
    }
  }

  return null;
}

/**
 * Find the documented route that a hook should correspond to
 */
function findRouteForHook(
  hook: HookDefinition,
  documentedRoutes: RouteDefinition[]
): RouteDefinition | null {
  for (const route of documentedRoutes) {
    if (isHookForRoute(hook, route)) {
      return route;
    }
  }

  return null;
}

/**
 * Check if a hook corresponds to a specific route
 */
function isHookForRoute(hook: HookDefinition, route: RouteDefinition): boolean {
  // Match by hook name pattern
  const hookNameLower = hook.name.toLowerCase();
  const endpointParts = route.endpoint
    .split('/')
    .filter(p => p && !p.startsWith(':'))
    .slice(-2); // Take last 2 meaningful parts

  // Check if hook name contains endpoint parts
  const matchesEndpoint = endpointParts.some(part => 
    hookNameLower.includes(part.toLowerCase())
  );

  if (!matchesEndpoint) {
    return false;
  }

  // Match by method type
  if (route.method === 'GET' && hook.type !== 'query') {
    return false;
  }

  if (['POST', 'PUT', 'DELETE'].includes(route.method) && hook.type !== 'mutation') {
    return false;
  }

  return true;
}

/**
 * Validate that hook parameters match documented query parameters
 */
function validateParameterMatch(
  hook: HookDefinition,
  expectedParams: ParamDefinition[],
  actualParams: ParamInfo[]
): HookIssue | null {
  // Check if hook has a params parameter (common pattern)
  const paramsParam = actualParams.find(p => 
    p.name === 'params' || p.name.toLowerCase().includes('params')
  );

  if (!paramsParam) {
    // Hook doesn't accept params but should
    return {
      type: 'PARAMETER_MISMATCH',
      hook: hook.name,
      expected: expectedParams.map(p => p.name),
      actual: actualParams.map(p => p.name),
      priority: 'MEDIUM',
    };
  }

  // If params parameter exists, assume it's correctly typed
  // (detailed type checking would require more complex analysis)
  return null;
}

/**
 * Determine the priority of a hook issue
 */
function determinePriority(route: RouteDefinition): IssuePriority {
  // Critical: Authentication and core user routes
  if (route.endpoint.includes('/auth/') || 
      route.endpoint.includes('/profile') ||
      route.endpoint.includes('/login')) {
    return 'CRITICAL';
  }

  // High: Mutation endpoints (POST, PUT, DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(route.method)) {
    return 'HIGH';
  }

  // High: Core data endpoints
  if (route.endpoint.includes('/media') || 
      route.endpoint.includes('/announcements')) {
    return 'HIGH';
  }

  // Medium: Public query endpoints
  if (route.isPublic && route.method === 'GET') {
    return 'MEDIUM';
  }

  // Low: Other endpoints
  return 'LOW';
}

/**
 * Generate a detailed report for hook issues
 */
export function generateHookIssueReport(result: HookAnalysisResult): string {
  const { issues, statistics } = result;

  let report = '# Hook Analysis Report\n\n';

  // Statistics
  report += '## Statistics\n\n';
  report += `- Total documented endpoints: ${statistics.totalDocumentedEndpoints}\n`;
  report += `- Total implemented hooks: ${statistics.totalImplementedHooks}\n`;
  report += `- Missing hooks: ${statistics.missingHooks}\n`;
  report += `- Incorrect routes: ${statistics.incorrectRoutes}\n`;
  report += `- Parameter mismatches: ${statistics.parameterMismatches}\n`;
  report += `- Invalid query keys: ${statistics.invalidQueryKeys}\n`;
  report += `- Missing cache invalidation: ${statistics.missingCacheInvalidation}\n`;
  report += `- Deprecated route usage: ${statistics.deprecatedRouteUsage}\n\n`;

  // Issues by type
  const issuesByType = groupIssuesByType(issues);

  for (const [type, typeIssues] of Object.entries(issuesByType)) {
    if (typeIssues.length > 0) {
      report += `## ${type.replace(/_/g, ' ')} (${typeIssues.length})\n\n`;

      for (const issue of typeIssues) {
        if (issue.hook) {
          report += `### Hook: ${issue.hook}\n`;
        } else if (issue.route) {
          report += `### Endpoint: ${issue.route.endpoint} (${issue.route.method})\n`;
        }

        report += `**Priority:** ${issue.priority}\n`;

        if (issue.route && !issue.hook) {
          report += `**Description:** ${issue.route.description}\n`;
        }

        if (issue.expected !== undefined) {
          report += `**Expected:** ${JSON.stringify(issue.expected)}\n`;
        }

        if (issue.actual !== undefined) {
          report += `**Actual:** ${JSON.stringify(issue.actual)}\n`;
        }

        report += '\n';
      }
    }
  }

  return report;
}

/**
 * Group issues by type for reporting
 */
function groupIssuesByType(issues: HookIssue[]): Record<string, HookIssue[]> {
  const grouped: Record<string, HookIssue[]> = {
    MISSING_HOOK: [],
    INCORRECT_ROUTE: [],
    PARAMETER_MISMATCH: [],
    INVALID_QUERY_KEY: [],
    MISSING_CACHE_INVALIDATION: [],
  };

  for (const issue of issues) {
    if (!grouped[issue.type]) {
      grouped[issue.type] = [];
    }
    grouped[issue.type].push(issue);
  }

  return grouped;
}
