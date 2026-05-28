/**
 * Route Analyzer for API Routes Comparison
 * Feature: api-routes-complete-analysis
 * 
 * Compares documented routes with ApiRoutes constants to identify:
 * - Missing routes (documented but not in code)
 * - Incorrect paths (constant value doesn't match documentation)
 * - Deprecated route usage
 * - Utility method URL generation validation
 */

import {
  ParsedDocumentation,
  RouteDefinition,
  RouteIssue,
  IssuePriority,
} from '../../types/core';
import { ParsedRoutes, UtilityMethod } from '../parsers/routes-parser';
import { normalizeRoutePath, routePathsMatch } from '../normalizers/data-normalizer';

/**
 * Route analysis result
 */
export interface RouteAnalysisResult {
  issues: RouteIssue[];
  statistics: {
    totalDocumentedRoutes: number;
    totalImplementedRoutes: number;
    missingRoutes: number;
    incorrectPaths: number;
    deprecatedRoutes: number;
    utilityMethodIssues: number;
  };
}

/**
 * Analyze routes by comparing documentation with implementation
 */
export function analyzeRoutes(
  documentation: ParsedDocumentation,
  parsedRoutes: ParsedRoutes
): RouteAnalysisResult {
  const issues: RouteIssue[] = [];
  
  // Combine all documented routes
  const allDocumentedRoutes = [
    ...documentation.publicRoutes,
    ...documentation.authenticatedRoutes,
  ];

  // 1. Check for missing routes (documented but not in code)
  const missingRouteIssues = findMissingRoutes(allDocumentedRoutes, parsedRoutes);
  issues.push(...missingRouteIssues);

  // 2. Check for incorrect paths (constant value doesn't match documentation)
  const incorrectPathIssues = findIncorrectPaths(allDocumentedRoutes, parsedRoutes);
  issues.push(...incorrectPathIssues);

  // 3. Check deprecated routes
  const deprecatedRouteIssues = findDeprecatedRouteIssues(parsedRoutes);
  issues.push(...deprecatedRouteIssues);

  // 4. Validate utility method URL generation
  const utilityMethodIssues = validateUtilityMethods(
    allDocumentedRoutes,
    parsedRoutes.utilityMethods,
    parsedRoutes.routes
  );
  issues.push(...utilityMethodIssues);

  // Calculate statistics - separate by issue type
  const missingRouteCount = issues.filter(i => i.type === 'MISSING_ROUTE' && !i.route.description.includes('utility method')).length;
  const incorrectPathCount = issues.filter(i => i.type === 'INCORRECT_PATH').length;
  const deprecatedRouteCount = issues.filter(i => i.type === 'DEPRECATED_ROUTE').length;
  const utilityMethodCount = issues.filter(i => i.type === 'MISSING_ROUTE' && i.route.description.includes('utility method')).length;

  const statistics = {
    totalDocumentedRoutes: allDocumentedRoutes.length,
    totalImplementedRoutes: parsedRoutes.routes.length,
    missingRoutes: missingRouteCount,
    incorrectPaths: incorrectPathCount,
    deprecatedRoutes: deprecatedRouteCount,
    utilityMethodIssues: utilityMethodCount,
  };

  return {
    issues,
    statistics,
  };
}

/**
 * Find routes that are documented but missing from ApiRoutes
 */
function findMissingRoutes(
  documentedRoutes: RouteDefinition[],
  parsedRoutes: ParsedRoutes
): RouteIssue[] {
  const issues: RouteIssue[] = [];

  for (const docRoute of documentedRoutes) {
    const matchingConstant = findMatchingRouteConstant(docRoute, parsedRoutes.routes);
    
    if (!matchingConstant) {
      issues.push({
        type: 'MISSING_ROUTE',
        route: docRoute,
        priority: determinePriority(docRoute),
        suggestion: generateRouteConstantSuggestion(docRoute),
      });
    }
  }

  return issues;
}

/**
 * Find routes where the constant value doesn't match the documented endpoint
 */
function findIncorrectPaths(
  documentedRoutes: RouteDefinition[],
  parsedRoutes: ParsedRoutes
): RouteIssue[] {
  const issues: RouteIssue[] = [];

  for (const docRoute of documentedRoutes) {
    const matchingConstant = findMatchingRouteConstant(docRoute, parsedRoutes.routes);
    
    if (matchingConstant) {
      const normalizedDocPath = normalizeRoutePath(docRoute.endpoint);
      const normalizedConstantPath = normalizeRoutePath(matchingConstant.value);
      
      // Check if paths match exactly or with parameter variations
      if (!routePathsMatch(normalizedDocPath, normalizedConstantPath)) {
        issues.push({
          type: 'INCORRECT_PATH',
          route: docRoute,
          actual: matchingConstant.value,
          priority: 'HIGH',
          suggestion: `Update ${matchingConstant.name} from "${matchingConstant.value}" to "${docRoute.endpoint}"`,
        });
      }
    }
  }

  return issues;
}

/**
 * Find deprecated routes that should be flagged
 */
function findDeprecatedRouteIssues(parsedRoutes: ParsedRoutes): RouteIssue[] {
  const issues: RouteIssue[] = [];

  for (const route of parsedRoutes.routes) {
    if (route.deprecated) {
      // Create a mock route definition for the deprecated route
      const mockRoute: RouteDefinition = {
        endpoint: route.value,
        method: 'GET', // Default method
        description: `Deprecated route: ${route.name}`,
        isPublic: route.value.includes('/public/'),
        errorResponses: [],
        responseBody: { type: 'object' },
      };

      issues.push({
        type: 'DEPRECATED_ROUTE',
        route: mockRoute,
        priority: 'MEDIUM',
        suggestion: `Consider migrating from deprecated route ${route.name}`,
      });
    }
  }

  return issues;
}

/**
 * Validate utility methods generate correct URLs
 */
function validateUtilityMethods(
  documentedRoutes: RouteDefinition[],
  utilityMethods: UtilityMethod[],
  routeConstants: any[]
): RouteIssue[] {
  const issues: RouteIssue[] = [];

  // Check specific utility methods mentioned in requirements
  const requiredUtilityMethods = [
    'getAmodiataireDetailsUrl',
    'getAmodiataireAnnouncementsUrl', 
    'getAmodiataireMediaUrl',
  ];

  for (const methodName of requiredUtilityMethods) {
    const method = utilityMethods.find(m => m.name === methodName);
    
    if (!method) {
      // Only create issues for utility methods if we have documented routes that would need them
      const relatedRoute = findRelatedDocumentedRoute(methodName, documentedRoutes);
      if (relatedRoute) {
        const mockRoute: RouteDefinition = {
          endpoint: relatedRoute.endpoint,
          method: 'GET',
          description: `Missing utility method: ${methodName}`,
          isPublic: true,
          errorResponses: [],
          responseBody: { type: 'object' },
        };

        issues.push({
          type: 'MISSING_ROUTE',
          route: mockRoute,
          priority: 'HIGH',
          suggestion: `Implement missing utility method: ${methodName}`,
        });
      }
      continue;
    }

    // Validate that the method uses the correct route constant
    if (method.usesRoute) {
      const routeConstant = routeConstants.find(r => r.name === method.usesRoute);
      if (routeConstant) {
        // Find the corresponding documented route
        const expectedRoute = findExpectedRouteForUtilityMethod(methodName, documentedRoutes);
        if (expectedRoute) {
          const normalizedConstantPath = normalizeRoutePath(routeConstant.value);
          const normalizedExpectedPath = normalizeRoutePath(expectedRoute.endpoint);
          
          if (!routePathsMatch(normalizedConstantPath, normalizedExpectedPath)) {
            issues.push({
              type: 'INCORRECT_PATH',
              route: expectedRoute,
              actual: routeConstant.value,
              priority: 'HIGH',
              suggestion: `Utility method ${methodName} uses ${method.usesRoute} with incorrect path`,
            });
          }
        }
      }
    }
  }

  return issues;
}

/**
 * Find a related documented route for a utility method
 */
function findRelatedDocumentedRoute(
  methodName: string,
  documentedRoutes: RouteDefinition[]
): RouteDefinition | null {
  // Only create utility method issues if there's a base amodiataire details route
  const baseRoute = documentedRoutes.find(r => 
    r.endpoint.includes('amodiataires/:id') && 
    !r.endpoint.includes('/announcements') && 
    !r.endpoint.includes('/media')
  );
  
  return baseRoute || null;
}

/**
 * Find a matching route constant for a documented route
 */
function findMatchingRouteConstant(
  docRoute: RouteDefinition,
  routeConstants: any[]
): any | null {
  const normalizedDocPath = normalizeRoutePath(docRoute.endpoint);

  // First, try exact path matching (including parameter format normalization)
  for (const constant of routeConstants) {
    const normalizedConstantPath = normalizeRoutePath(constant.value);
    if (routePathsMatch(normalizedDocPath, normalizedConstantPath)) {
      return constant;
    }
  }

  // Then, try matching by route pattern/name for more flexible matching
  const routePattern = extractRoutePattern(docRoute.endpoint);
  for (const constant of routeConstants) {
    const constantPattern = extractRoutePattern(constant.value);
    if (routePattern === constantPattern) {
      return constant;
    }
  }

  // Try matching by constant name patterns
  for (const constant of routeConstants) {
    if (isRouteNameMatch(docRoute.endpoint, constant.name)) {
      return constant;
    }
  }

  // Finally, try partial matching for similar routes
  for (const constant of routeConstants) {
    if (isPartialMatch(docRoute.endpoint, constant.value)) {
      return constant;
    }
  }

  return null;
}

/**
 * Check if a route matches a constant name pattern
 */
function isRouteNameMatch(endpoint: string, constantName: string): boolean {
  // Handle specific cases
  if (endpoint.includes('/profile') && constantName === 'PROFILE') {
    return true;
  }
  
  if (endpoint.includes('/amodiataires') && constantName.includes('AMODIATAIRES')) {
    return true;
  }
  
  if (endpoint.includes('/media') && constantName.includes('MEDIA')) {
    return true;
  }
  
  if (endpoint.includes('/announcements') && constantName.includes('ANNOUNCEMENTS')) {
    return true;
  }
  
  return false;
}

/**
 * Check if two routes are a partial match (same base path, different parameters)
 */
function isPartialMatch(docEndpoint: string, constantValue: string): boolean {
  // Remove parameters and compare base paths
  const docBase = docEndpoint.replace(/\/:[^/]+/g, '').replace(/\/\{[^}]+\}/g, '');
  const constantBase = constantValue.replace(/\/:[^/]+/g, '').replace(/\/\{[^}]+\}/g, '');
  
  return docBase === constantBase;
}

/**
 * Extract a pattern from a route endpoint for matching
 * Example: /api/mobile/public/amodiataires/:id -> AMODIATAIRES_ID
 */
function extractRoutePattern(endpoint: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(-2); // Take last 2 meaningful parts
  
  return parts
    .map(part => part.toUpperCase())
    .join('_');
}

/**
 * Determine the priority of a route issue
 */
function determinePriority(route: RouteDefinition): IssuePriority {
  // Critical: Authentication routes
  if (route.endpoint.includes('/auth/') || route.endpoint.includes('/login') || route.endpoint.includes('/logout')) {
    return 'CRITICAL';
  }

  // High: Core API routes (profile, media, announcements)
  if (route.endpoint.includes('/profile') || 
      route.endpoint.includes('/media') || 
      route.endpoint.includes('/announcements')) {
    return 'HIGH';
  }

  // Medium: Public routes
  if (route.isPublic) {
    return 'MEDIUM';
  }

  // Low: Other routes
  return 'LOW';
}

/**
 * Generate a suggestion for a missing route constant
 */
function generateRouteConstantSuggestion(route: RouteDefinition): string {
  const constantName = generateConstantName(route.endpoint);
  return `Add missing route constant: static readonly ${constantName} = '${route.endpoint}';`;
}

/**
 * Generate a constant name from an endpoint
 * Example: /api/mobile/public/amodiataires -> PUBLIC_AMODIATAIRES
 */
function generateConstantName(endpoint: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(1); // Remove empty first part

  // Handle special cases
  if (parts.includes('public')) {
    const relevantParts = parts.slice(parts.indexOf('public'));
    return relevantParts
      .map(part => part.toUpperCase())
      .join('_');
  }

  if (parts.includes('mobile')) {
    const relevantParts = parts.slice(parts.indexOf('mobile') + 1);
    return relevantParts
      .map(part => part.toUpperCase())
      .join('_');
  }

  return parts
    .map(part => part.toUpperCase())
    .join('_');
}

/**
 * Get the expected suffix for a utility method
 */
function getUtilityMethodSuffix(methodName: string): string {
  if (methodName.includes('Announcements')) {
    return '/announcements';
  }
  if (methodName.includes('Media')) {
    return '/media';
  }
  return '';
}

/**
 * Find the expected documented route for a utility method
 */
function findExpectedRouteForUtilityMethod(
  methodName: string,
  documentedRoutes: RouteDefinition[]
): RouteDefinition | null {
  const suffix = getUtilityMethodSuffix(methodName);
  
  for (const route of documentedRoutes) {
    if (route.endpoint.includes('amodiataires/:id') && 
        (suffix === '' || route.endpoint.endsWith(suffix))) {
      return route;
    }
  }

  return null;
}

/**
 * Generate a detailed report for route issues
 */
export function generateRouteIssueReport(result: RouteAnalysisResult): string {
  const { issues, statistics } = result;
  
  let report = '# Route Analysis Report\n\n';
  
  // Statistics
  report += '## Statistics\n\n';
  report += `- Total documented routes: ${statistics.totalDocumentedRoutes}\n`;
  report += `- Total implemented routes: ${statistics.totalImplementedRoutes}\n`;
  report += `- Missing routes: ${statistics.missingRoutes}\n`;
  report += `- Incorrect paths: ${statistics.incorrectPaths}\n`;
  report += `- Deprecated routes: ${statistics.deprecatedRoutes}\n`;
  report += `- Utility method issues: ${statistics.utilityMethodIssues}\n\n`;

  // Issues by type
  const issuesByType = groupIssuesByType(issues);
  
  for (const [type, typeIssues] of Object.entries(issuesByType)) {
    if (typeIssues.length > 0) {
      report += `## ${type.replace('_', ' ')} (${typeIssues.length})\n\n`;
      
      for (const issue of typeIssues) {
        report += `### ${issue.route.endpoint} (${issue.route.method})\n`;
        report += `**Priority:** ${issue.priority}\n`;
        report += `**Description:** ${issue.route.description}\n`;
        
        if (issue.actual) {
          report += `**Current value:** ${issue.actual}\n`;
        }
        
        if (issue.suggestion) {
          report += `**Suggestion:** ${issue.suggestion}\n`;
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
function groupIssuesByType(issues: RouteIssue[]): Record<string, RouteIssue[]> {
  const grouped: Record<string, RouteIssue[]> = {
    MISSING_ROUTE: [],
    INCORRECT_PATH: [],
    DEPRECATED_ROUTE: [],
  };

  for (const issue of issues) {
    if (!grouped[issue.type]) {
      grouped[issue.type] = [];
    }
    grouped[issue.type].push(issue);
  }

  return grouped;
}