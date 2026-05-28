/**
 * Report Generator for API Analysis
 * Feature: api-routes-complete-analysis
 * 
 * Compiles results from all analyzers into a comprehensive report:
 * - Aggregates issues from route, type, and hook analyzers
 * - Calculates comprehensive statistics
 * - Prioritizes issues by severity
 * - Generates summary section with key findings
 * - Produces an AnalysisReport structure
 */

import {
  AnalysisReport,
  AnalysisSummary,
  RouteIssue,
  TypeIssue,
  HookIssue,
  ClientIssue,
  Recommendation,
  IssuePriority,
  ValidationWarning,
} from '../../types/core';
import { RouteAnalysisResult } from '../analyzers/route-analyzer';
import { TypeAnalysisResult } from '../analyzers/type-analyzer';
import { HookAnalysisResult } from '../analyzers/hook-analyzer';

/**
 * Input for report generation
 */
export interface ReportGeneratorInput {
  routeAnalysis: RouteAnalysisResult;
  typeAnalysis: TypeAnalysisResult;
  hookAnalysis: HookAnalysisResult;
  clientIssues?: ClientIssue[];
  warnings?: ValidationWarning[];
  filesAnalyzed?: string[];
  filesMissing?: string[];
}

/**
 * Generate a comprehensive analysis report
 */
export function generateAnalysisReport(input: ReportGeneratorInput): AnalysisReport {
  const {
    routeAnalysis,
    typeAnalysis,
    hookAnalysis,
    clientIssues = [],
    warnings = [],
    filesAnalyzed = [],
    filesMissing = [],
  } = input;

  // Aggregate all issues
  const routeIssues = routeAnalysis.issues;
  const typeIssues = typeAnalysis.issues;
  const hookIssues = hookAnalysis.issues;

  // Calculate summary statistics
  const summary = calculateSummary(
    routeAnalysis,
    typeAnalysis,
    hookAnalysis,
    routeIssues,
    typeIssues,
    hookIssues,
    clientIssues
  );

  // Generate recommendations
  const recommendations = generateRecommendations(
    routeIssues,
    typeIssues,
    hookIssues,
    clientIssues
  );

  // Count parse errors
  const parseErrors = warnings.filter(w => w.type === 'PARSE_ERROR').length;

  // Create the report
  const report: AnalysisReport = {
    timestamp: new Date().toISOString(),
    summary,
    routeIssues,
    typeIssues,
    hookIssues,
    clientIssues,
    recommendations,
    warnings,
    metadata: {
      filesAnalyzed,
      filesMissing,
      parseErrors,
    },
  };

  return report;
}

/**
 * Calculate summary statistics for the analysis
 */
function calculateSummary(
  routeAnalysis: RouteAnalysisResult,
  typeAnalysis: TypeAnalysisResult,
  hookAnalysis: HookAnalysisResult,
  routeIssues: RouteIssue[],
  typeIssues: TypeIssue[],
  hookIssues: HookIssue[],
  clientIssues: ClientIssue[]
): AnalysisSummary {
  // Total counts from analyzers
  const totalRoutes = routeAnalysis.statistics.totalDocumentedRoutes;
  const totalInterfaces = typeAnalysis.statistics.totalDocumentedStructures;
  const totalHooks = hookAnalysis.statistics.totalImplementedHooks;

  // Total issues
  const totalIssues = 
    routeIssues.length +
    typeIssues.length +
    hookIssues.length +
    clientIssues.length;

  // Count issues by priority
  const allIssues = [
    ...routeIssues,
    ...typeIssues,
    ...hookIssues,
    ...clientIssues,
  ];

  const issuesByPriority = {
    critical: countIssuesByPriority(allIssues, 'CRITICAL'),
    high: countIssuesByPriority(allIssues, 'HIGH'),
    medium: countIssuesByPriority(allIssues, 'MEDIUM'),
    low: countIssuesByPriority(allIssues, 'LOW'),
  };

  return {
    totalRoutes,
    totalInterfaces,
    totalHooks,
    totalIssues,
    issuesByPriority,
  };
}

/**
 * Count issues by priority level
 */
function countIssuesByPriority(
  issues: Array<RouteIssue | TypeIssue | HookIssue | ClientIssue>,
  priority: IssuePriority
): number {
  return issues.filter(issue => issue.priority === priority).length;
}

/**
 * Generate recommendations for fixing issues
 */
function generateRecommendations(
  routeIssues: RouteIssue[],
  typeIssues: TypeIssue[],
  hookIssues: HookIssue[],
  clientIssues: ClientIssue[]
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Generate recommendations for route issues
  for (const issue of routeIssues) {
    const recommendation = generateRouteRecommendation(issue);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Generate recommendations for type issues
  for (const issue of typeIssues) {
    const recommendation = generateTypeRecommendation(issue);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Generate recommendations for hook issues
  for (const issue of hookIssues) {
    const recommendation = generateHookRecommendation(issue);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Generate recommendations for client issues
  for (const issue of clientIssues) {
    const recommendation = generateClientRecommendation(issue);
    if (recommendation) {
      recommendations.push(recommendation);
    }
  }

  // Sort recommendations by priority
  recommendations.sort((a, b) => {
    const priorityOrder: Record<IssuePriority, number> = {
      CRITICAL: 0,
      HIGH: 1,
      MEDIUM: 2,
      LOW: 3,
    };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return recommendations;
}

/**
 * Generate a recommendation for a route issue
 */
function generateRouteRecommendation(issue: RouteIssue): Recommendation | null {
  switch (issue.type) {
    case 'MISSING_ROUTE':
      const constantName = generateConstantName(issue.route.endpoint);
      return {
        priority: issue.priority,
        category: 'ROUTE',
        title: `Add missing route: ${issue.route.endpoint}`,
        description: `The route ${issue.route.endpoint} (${issue.route.method}) is documented but not found in ApiRoutes.`,
        affectedFiles: ['src/services/api/routes.ts'],
        codeExamples: {
          before: `export class ApiRoutes {
  // ... existing routes
  
  // ${constantName} is missing
}`,
          after: `export class ApiRoutes {
  // ... existing routes
  
${generateRouteConstantCode(issue.route)}
}`,
        },
      };

    case 'INCORRECT_PATH':
      const incorrectConstantName = generateConstantName(issue.actual || '');
      const correctConstantName = generateConstantName(issue.route.endpoint);
      return {
        priority: issue.priority,
        category: 'ROUTE',
        title: `Fix incorrect route path: ${issue.route.endpoint}`,
        description: `The route constant has an incorrect path. Expected: ${issue.route.endpoint}, Actual: ${issue.actual}`,
        affectedFiles: ['src/services/api/routes.ts'],
        codeExamples: {
          before: `  static readonly ${incorrectConstantName} = '${issue.actual}';`,
          after: `  static readonly ${correctConstantName} = '${issue.route.endpoint}';`,
        },
      };

    case 'DEPRECATED_ROUTE':
      return {
        priority: issue.priority,
        category: 'ROUTE',
        title: `Migrate from deprecated route: ${issue.route.endpoint}`,
        description: issue.suggestion || `The route ${issue.route.endpoint} is deprecated and should be migrated.`,
        affectedFiles: ['src/services/api/routes.ts', 'src/hooks/useApi.ts'],
        codeExamples: {
          before: `  /**
   * @deprecated Use the v2 route instead
   */
  static readonly OLD_ROUTE = '${issue.route.endpoint}';`,
          after: `  /**
   * Updated route (API mobile v2)
   */
  static readonly NEW_ROUTE_V2 = '${issue.route.endpoint.replace('/api/public/', '/api/mobile/public/')}';`,
        },
      };

    default:
      return null;
  }
}

/**
 * Generate a recommendation for a type issue
 */
function generateTypeRecommendation(issue: TypeIssue): Recommendation | null {
  switch (issue.type) {
    case 'MISSING_INTERFACE':
      return {
        priority: issue.priority,
        category: 'TYPE',
        title: `Create missing interface: ${issue.interface}`,
        description: `The interface ${issue.interface} is documented but not found in api.ts.`,
        affectedFiles: ['src/types/api.ts'],
        codeExamples: {
          before: `// ${issue.interface} is missing from api.ts`,
          after: generateInterfaceCode(issue.interface, issue.jsonStructure),
        },
      };

    case 'MISSING_PROPERTY':
      const propertyType = typeof issue.expected === 'string' ? issue.expected : 'any';
      const isOptional = issue.expected === true;
      return {
        priority: issue.priority,
        category: 'TYPE',
        title: `Add missing property: ${issue.interface}.${issue.property}`,
        description: `The property ${issue.property} is documented but missing from interface ${issue.interface}.`,
        affectedFiles: ['src/types/api.ts'],
        codeExamples: {
          before: `export interface ${issue.interface} {
  // ... existing properties
  // ${issue.property} is missing
}`,
          after: `export interface ${issue.interface} {
  // ... existing properties
  ${issue.property}${isOptional ? '?' : ''}: ${propertyType};
}`,
        },
      };

    case 'TYPE_MISMATCH':
      return {
        priority: issue.priority,
        category: 'TYPE',
        title: `Fix type mismatch: ${issue.interface}.${issue.property}`,
        description: `The property ${issue.property} has incorrect type. Expected: ${issue.expected}, Actual: ${issue.actual}`,
        affectedFiles: ['src/types/api.ts'],
        codeExamples: {
          before: `export interface ${issue.interface} {
  ${issue.property}: ${issue.actual};
}`,
          after: `export interface ${issue.interface} {
  ${issue.property}: ${issue.expected};
}`,
        },
      };

    case 'OPTIONALITY_MISMATCH':
      return {
        priority: issue.priority,
        category: 'TYPE',
        title: `Fix optionality: ${issue.interface}.${issue.property}`,
        description: `The property ${issue.property} has incorrect optionality. Expected optional: ${issue.expected}, Actual optional: ${issue.actual}`,
        affectedFiles: ['src/types/api.ts'],
        codeExamples: {
          before: `export interface ${issue.interface} {
  ${issue.property}${issue.actual ? '?' : ''}: PropertyType;
}`,
          after: `export interface ${issue.interface} {
  ${issue.property}${issue.expected ? '?' : ''}: PropertyType;
}`,
        },
      };

    default:
      return null;
  }
}

/**
 * Generate a recommendation for a hook issue
 */
function generateHookRecommendation(issue: HookIssue): Recommendation | null {
  switch (issue.type) {
    case 'MISSING_HOOK':
      if (!issue.route) return null;
      const hookName = generateHookName(issue.route.endpoint, issue.route.method);
      return {
        priority: issue.priority,
        category: 'HOOK',
        title: `Create missing hook for: ${issue.route.endpoint}`,
        description: `No hook found for endpoint ${issue.route.endpoint} (${issue.route.method}).`,
        affectedFiles: ['src/hooks/useApi.ts'],
        codeExamples: {
          before: `// Hook ${hookName} is missing for ${issue.route.method} ${issue.route.endpoint}`,
          after: generateHookCode(issue.route),
        },
      };

    case 'INCORRECT_ROUTE':
      return {
        priority: issue.priority,
        category: 'HOOK',
        title: `Fix incorrect route in hook: ${issue.hook}`,
        description: `Hook ${issue.hook} uses incorrect route. Expected: ${issue.expected}, Actual: ${issue.actual}`,
        affectedFiles: ['src/hooks/useApi.ts'],
        codeExamples: {
          before: `export function ${issue.hook}() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.${issue.actual}),
  });
}`,
          after: `export function ${issue.hook}() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.${issue.expected}),
  });
}`,
        },
      };

    case 'PARAMETER_MISMATCH':
      return {
        priority: issue.priority,
        category: 'HOOK',
        title: `Fix parameter mismatch in hook: ${issue.hook}`,
        description: `Hook ${issue.hook} has incorrect parameters. Expected: ${JSON.stringify(issue.expected)}, Actual: ${JSON.stringify(issue.actual)}`,
        affectedFiles: ['src/hooks/useApi.ts'],
        codeExamples: {
          before: `export function ${issue.hook}() {
  return useQuery({
    queryKey: ['key'],
    queryFn: () => get(ApiRoutes.ROUTE),
  });
}`,
          after: `export function ${issue.hook}(params?: QueryParams) {
  return useQuery({
    queryKey: ['key', params],
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE, params)),
  });
}`,
        },
      };

    case 'INVALID_QUERY_KEY':
      return {
        priority: issue.priority,
        category: 'HOOK',
        title: `Fix query key in hook: ${issue.hook}`,
        description: `Hook ${issue.hook} has invalid query key. ${issue.expected}`,
        affectedFiles: ['src/hooks/useApi.ts'],
        codeExamples: {
          before: `export function ${issue.hook}(id: string) {
  return useQuery({
    queryKey: ['data'], // Not unique, missing id
    queryFn: () => get(\`/api/data/\${id}\`),
  });
}`,
          after: `export function ${issue.hook}(id: string) {
  return useQuery({
    queryKey: ['data', 'detail', id], // Unique and includes id
    queryFn: () => get(\`/api/data/\${id}\`),
  });
}`,
        },
      };

    case 'MISSING_CACHE_INVALIDATION':
      return {
        priority: issue.priority,
        category: 'HOOK',
        title: `Add cache invalidation to mutation: ${issue.hook}`,
        description: `Mutation hook ${issue.hook} is missing cache invalidation.`,
        affectedFiles: ['src/hooks/useApi.ts'],
        codeExamples: {
          before: `export function ${issue.hook}() {
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    // Missing onSuccess with cache invalidation
  });
}`,
          after: `export function ${issue.hook}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      post(ApiRoutes.ROUTE, data),
    onSuccess: () => {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['relevant', 'key'] });
    },
  });
}`,
        },
      };

    default:
      return null;
  }
}

/**
 * Generate a recommendation for a client issue
 */
function generateClientRecommendation(issue: ClientIssue): Recommendation | null {
  let before = '';
  let after = '';

  // Generate more specific code examples based on the issue type
  if (issue.component.includes('interceptor')) {
    if (issue.component.includes('X-API-Key')) {
      before = `// Missing X-API-Key interceptor
client.interceptors.request.use((config) => {
  // No API key header
  return config;
});`;
      after = `// Add X-API-Key interceptor
client.interceptors.request.use((config) => {
  config.headers['X-API-Key'] = process.env.EXPO_PUBLIC_API_KEY;
  return config;
});`;
    } else if (issue.component.includes('Authorization')) {
      before = `// Missing Authorization interceptor
client.interceptors.request.use((config) => {
  // No auth token header
  return config;
});`;
      after = `// Add Authorization interceptor
client.interceptors.request.use(async (config) => {
  const token = await getAuthToken();
  if (token) {
    config.headers['Authorization'] = \`Bearer \${token}\`;
  }
  return config;
});`;
    }
  } else if (issue.component.includes('error') || issue.component.includes('401')) {
    before = `// Missing 401 error handling
client.interceptors.response.use(
  (response) => response,
  (error) => {
    // No token refresh logic
    return Promise.reject(error);
  }
);`;
    after = `// Add 401 error handling with token refresh
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        const newToken = await refreshAuthToken();
        error.config.headers['Authorization'] = \`Bearer \${newToken}\`;
        return client.request(error.config);
      } catch (refreshError) {
        // Redirect to login
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);`;
  } else if (issue.component.includes('baseURL')) {
    before = `// Missing or incorrect baseURL
const client = axios.create({
  // baseURL not configured
});`;
    after = `// Configure baseURL
const client = axios.create({
  baseURL: ApiRoutes.BASE_URL,
  timeout: 10000,
});`;
  }

  // Fallback to expected value if available
  if (!after && issue.expected) {
    after = String(issue.expected);
  }

  // Final fallback
  if (!after) {
    after = '// Fix client configuration as described';
  }

  return {
    priority: issue.priority,
    category: 'CLIENT',
    title: `Fix client configuration: ${issue.component}`,
    description: issue.description,
    affectedFiles: ['src/services/api/client.ts'],
    codeExamples: {
      before: before || undefined,
      after: after,
    },
  };
}

/**
 * Generate code for a route constant
 */
function generateRouteConstantCode(route: any): string {
  const constantName = generateConstantName(route.endpoint);
  const comment = route.description ? `  /**\n   * ${route.description}\n   */\n` : '';
  return `${comment}  static readonly ${constantName} = '${route.endpoint}';`;
}

/**
 * Generate code for an interface
 */
function generateInterfaceCode(interfaceName: string, jsonStructure: any): string {
  if (!jsonStructure || jsonStructure.type !== 'object' || !jsonStructure.properties) {
    return `export interface ${interfaceName} {\n  // TODO: Define properties based on documentation\n}`;
  }

  let code = `export interface ${interfaceName} {\n`;
  
  for (const [propName, propDef] of Object.entries(jsonStructure.properties)) {
    const prop = propDef as any;
    const optional = prop.optional ? '?' : '';
    const type = prop.type || 'any';
    code += `  ${propName}${optional}: ${type};\n`;
  }
  
  code += '}';
  return code;
}

/**
 * Generate code for a hook
 */
function generateHookCode(route: any): string {
  const hookName = generateHookName(route.endpoint, route.method);
  const isQuery = route.method === 'GET';
  const hookType = isQuery ? 'useQuery' : 'useMutation';
  const queryKey = generateQueryKey(route.endpoint);

  if (isQuery) {
    return `export function ${hookName}(params?: QueryParams) {
  return useQuery({
    queryKey: ${JSON.stringify(queryKey)},
    queryFn: () => get(ApiRoutes.getFullUrl(ApiRoutes.ROUTE_CONSTANT, params)),
    staleTime: 5 * 60 * 1000,
  });
}`;
  } else {
    return `export function ${hookName}() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: RequestType) =>
      ${route.method.toLowerCase()}(ApiRoutes.ROUTE_CONSTANT, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${JSON.stringify(queryKey.slice(0, 2))} });
    },
  });
}`;
  }
}

/**
 * Generate a constant name from an endpoint
 */
function generateConstantName(endpoint: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(1);

  if (parts.includes('public')) {
    const relevantParts = parts.slice(parts.indexOf('public'));
    return relevantParts.map(part => part.toUpperCase()).join('_');
  }

  if (parts.includes('mobile')) {
    const relevantParts = parts.slice(parts.indexOf('mobile') + 1);
    return relevantParts.map(part => part.toUpperCase()).join('_');
  }

  return parts.map(part => part.toUpperCase()).join('_');
}

/**
 * Generate a hook name from an endpoint and method
 */
function generateHookName(endpoint: string, method: string): string {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(-2);

  const baseName = parts
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('');

  const prefix = method === 'GET' ? 'use' : 
                 method === 'POST' ? 'useCreate' :
                 method === 'PUT' ? 'useUpdate' :
                 method === 'DELETE' ? 'useDelete' : 'use';

  return `${prefix}${baseName}`;
}

/**
 * Generate a query key from an endpoint
 */
function generateQueryKey(endpoint: string): string[] {
  const parts = endpoint
    .split('/')
    .filter(part => part && !part.startsWith(':'))
    .slice(-2);

  return parts.map(part => part.toLowerCase());
}

/**
 * Format public routes section with detailed issue information
 */
function formatPublicRoutesSection(report: AnalysisReport): string {
  const publicRouteIssues = report.routeIssues.filter(
    issue => issue.route.isPublic
  );

  if (publicRouteIssues.length === 0) {
    return '## Public Routes\n\n✅ All public routes are correctly implemented.\n\n';
  }

  let markdown = '## Public Routes\n\n';
  markdown += `**Total Issues:** ${publicRouteIssues.length}\n\n`;

  // Count by severity
  const severityBreakdown = {
    critical: publicRouteIssues.filter(i => i.priority === 'CRITICAL').length,
    high: publicRouteIssues.filter(i => i.priority === 'HIGH').length,
    medium: publicRouteIssues.filter(i => i.priority === 'MEDIUM').length,
    low: publicRouteIssues.filter(i => i.priority === 'LOW').length,
  };

  markdown += '**Severity Breakdown:**\n';
  if (severityBreakdown.critical > 0) markdown += `- Critical: ${severityBreakdown.critical}\n`;
  if (severityBreakdown.high > 0) markdown += `- High: ${severityBreakdown.high}\n`;
  if (severityBreakdown.medium > 0) markdown += `- Medium: ${severityBreakdown.medium}\n`;
  if (severityBreakdown.low > 0) markdown += `- Low: ${severityBreakdown.low}\n`;
  markdown += '\n';

  // Group by issue type
  const missingRoutes = publicRouteIssues.filter(i => i.type === 'MISSING_ROUTE');
  const incorrectPaths = publicRouteIssues.filter(i => i.type === 'INCORRECT_PATH');
  const deprecatedRoutes = publicRouteIssues.filter(i => i.type === 'DEPRECATED_ROUTE');

  if (missingRoutes.length > 0) {
    markdown += '### Missing Public Routes\n\n';
    for (const issue of missingRoutes) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  if (incorrectPaths.length > 0) {
    markdown += '### Incorrect Public Route Paths\n\n';
    for (const issue of incorrectPaths) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  if (deprecatedRoutes.length > 0) {
    markdown += '### Deprecated Public Routes\n\n';
    for (const issue of deprecatedRoutes) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  return markdown;
}

/**
 * Format authenticated routes section with detailed issue information
 */
function formatAuthenticatedRoutesSection(report: AnalysisReport): string {
  const authRouteIssues = report.routeIssues.filter(
    issue => !issue.route.isPublic
  );

  if (authRouteIssues.length === 0) {
    return '## Authenticated Routes\n\n✅ All authenticated routes are correctly implemented.\n\n';
  }

  let markdown = '## Authenticated Routes\n\n';
  markdown += `**Total Issues:** ${authRouteIssues.length}\n\n`;

  // Count by severity
  const severityBreakdown = {
    critical: authRouteIssues.filter(i => i.priority === 'CRITICAL').length,
    high: authRouteIssues.filter(i => i.priority === 'HIGH').length,
    medium: authRouteIssues.filter(i => i.priority === 'MEDIUM').length,
    low: authRouteIssues.filter(i => i.priority === 'LOW').length,
  };

  markdown += '**Severity Breakdown:**\n';
  if (severityBreakdown.critical > 0) markdown += `- Critical: ${severityBreakdown.critical}\n`;
  if (severityBreakdown.high > 0) markdown += `- High: ${severityBreakdown.high}\n`;
  if (severityBreakdown.medium > 0) markdown += `- Medium: ${severityBreakdown.medium}\n`;
  if (severityBreakdown.low > 0) markdown += `- Low: ${severityBreakdown.low}\n`;
  markdown += '\n';

  // Group by issue type
  const missingRoutes = authRouteIssues.filter(i => i.type === 'MISSING_ROUTE');
  const incorrectPaths = authRouteIssues.filter(i => i.type === 'INCORRECT_PATH');
  const deprecatedRoutes = authRouteIssues.filter(i => i.type === 'DEPRECATED_ROUTE');

  if (missingRoutes.length > 0) {
    markdown += '### Missing Authenticated Routes\n\n';
    for (const issue of missingRoutes) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  if (incorrectPaths.length > 0) {
    markdown += '### Incorrect Authenticated Route Paths\n\n';
    for (const issue of incorrectPaths) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  if (deprecatedRoutes.length > 0) {
    markdown += '### Deprecated Authenticated Routes\n\n';
    for (const issue of deprecatedRoutes) {
      markdown += formatRouteIssueDetail(issue);
    }
  }

  return markdown;
}

/**
 * Format interfaces section with detailed issue information
 */
function formatInterfacesSection(report: AnalysisReport): string {
  if (report.typeIssues.length === 0) {
    return '## TypeScript Interfaces\n\n✅ All interfaces are correctly implemented.\n\n';
  }

  let markdown = '## TypeScript Interfaces\n\n';
  markdown += `**Total Issues:** ${report.typeIssues.length}\n\n`;

  // Count by severity
  const severityBreakdown = {
    critical: report.typeIssues.filter(i => i.priority === 'CRITICAL').length,
    high: report.typeIssues.filter(i => i.priority === 'HIGH').length,
    medium: report.typeIssues.filter(i => i.priority === 'MEDIUM').length,
    low: report.typeIssues.filter(i => i.priority === 'LOW').length,
  };

  markdown += '**Severity Breakdown:**\n';
  if (severityBreakdown.critical > 0) markdown += `- Critical: ${severityBreakdown.critical}\n`;
  if (severityBreakdown.high > 0) markdown += `- High: ${severityBreakdown.high}\n`;
  if (severityBreakdown.medium > 0) markdown += `- Medium: ${severityBreakdown.medium}\n`;
  if (severityBreakdown.low > 0) markdown += `- Low: ${severityBreakdown.low}\n`;
  markdown += '\n';

  // Group by issue type
  const missingInterfaces = report.typeIssues.filter(i => i.type === 'MISSING_INTERFACE');
  const missingProperties = report.typeIssues.filter(i => i.type === 'MISSING_PROPERTY');
  const typeMismatches = report.typeIssues.filter(i => i.type === 'TYPE_MISMATCH');
  const optionalityMismatches = report.typeIssues.filter(i => i.type === 'OPTIONALITY_MISMATCH');

  if (missingInterfaces.length > 0) {
    markdown += '### Missing Interfaces\n\n';
    for (const issue of missingInterfaces) {
      markdown += formatTypeIssueDetail(issue);
    }
  }

  if (missingProperties.length > 0) {
    markdown += '### Missing Properties\n\n';
    for (const issue of missingProperties) {
      markdown += formatTypeIssueDetail(issue);
    }
  }

  if (typeMismatches.length > 0) {
    markdown += '### Type Mismatches\n\n';
    for (const issue of typeMismatches) {
      markdown += formatTypeIssueDetail(issue);
    }
  }

  if (optionalityMismatches.length > 0) {
    markdown += '### Optionality Mismatches\n\n';
    for (const issue of optionalityMismatches) {
      markdown += formatTypeIssueDetail(issue);
    }
  }

  return markdown;
}

/**
 * Format hooks section with detailed issue information
 */
function formatHooksSection(report: AnalysisReport): string {
  if (report.hookIssues.length === 0) {
    return '## React Query Hooks\n\n✅ All hooks are correctly implemented.\n\n';
  }

  let markdown = '## React Query Hooks\n\n';
  markdown += `**Total Issues:** ${report.hookIssues.length}\n\n`;

  // Count by severity
  const severityBreakdown = {
    critical: report.hookIssues.filter(i => i.priority === 'CRITICAL').length,
    high: report.hookIssues.filter(i => i.priority === 'HIGH').length,
    medium: report.hookIssues.filter(i => i.priority === 'MEDIUM').length,
    low: report.hookIssues.filter(i => i.priority === 'LOW').length,
  };

  markdown += '**Severity Breakdown:**\n';
  if (severityBreakdown.critical > 0) markdown += `- Critical: ${severityBreakdown.critical}\n`;
  if (severityBreakdown.high > 0) markdown += `- High: ${severityBreakdown.high}\n`;
  if (severityBreakdown.medium > 0) markdown += `- Medium: ${severityBreakdown.medium}\n`;
  if (severityBreakdown.low > 0) markdown += `- Low: ${severityBreakdown.low}\n`;
  markdown += '\n';

  // Group by issue type
  const missingHooks = report.hookIssues.filter(i => i.type === 'MISSING_HOOK');
  const incorrectRoutes = report.hookIssues.filter(i => i.type === 'INCORRECT_ROUTE');
  const parameterMismatches = report.hookIssues.filter(i => i.type === 'PARAMETER_MISMATCH');
  const invalidQueryKeys = report.hookIssues.filter(i => i.type === 'INVALID_QUERY_KEY');
  const missingCacheInvalidation = report.hookIssues.filter(i => i.type === 'MISSING_CACHE_INVALIDATION');

  if (missingHooks.length > 0) {
    markdown += '### Missing Hooks\n\n';
    for (const issue of missingHooks) {
      markdown += formatHookIssueDetail(issue);
    }
  }

  if (incorrectRoutes.length > 0) {
    markdown += '### Incorrect Routes in Hooks\n\n';
    for (const issue of incorrectRoutes) {
      markdown += formatHookIssueDetail(issue);
    }
  }

  if (parameterMismatches.length > 0) {
    markdown += '### Parameter Mismatches\n\n';
    for (const issue of parameterMismatches) {
      markdown += formatHookIssueDetail(issue);
    }
  }

  if (invalidQueryKeys.length > 0) {
    markdown += '### Invalid Query Keys\n\n';
    for (const issue of invalidQueryKeys) {
      markdown += formatHookIssueDetail(issue);
    }
  }

  if (missingCacheInvalidation.length > 0) {
    markdown += '### Missing Cache Invalidation\n\n';
    for (const issue of missingCacheInvalidation) {
      markdown += formatHookIssueDetail(issue);
    }
  }

  return markdown;
}

/**
 * Format client configuration section with detailed issue information
 */
function formatClientConfigurationSection(report: AnalysisReport): string {
  if (report.clientIssues.length === 0) {
    return '## Client Configuration\n\n✅ Client configuration is correct.\n\n';
  }

  let markdown = '## Client Configuration\n\n';
  markdown += `**Total Issues:** ${report.clientIssues.length}\n\n`;

  // Count by severity
  const severityBreakdown = {
    critical: report.clientIssues.filter(i => i.priority === 'CRITICAL').length,
    high: report.clientIssues.filter(i => i.priority === 'HIGH').length,
    medium: report.clientIssues.filter(i => i.priority === 'MEDIUM').length,
    low: report.clientIssues.filter(i => i.priority === 'LOW').length,
  };

  markdown += '**Severity Breakdown:**\n';
  if (severityBreakdown.critical > 0) markdown += `- Critical: ${severityBreakdown.critical}\n`;
  if (severityBreakdown.high > 0) markdown += `- High: ${severityBreakdown.high}\n`;
  if (severityBreakdown.medium > 0) markdown += `- Medium: ${severityBreakdown.medium}\n`;
  if (severityBreakdown.low > 0) markdown += `- Low: ${severityBreakdown.low}\n`;
  markdown += '\n';

  // Group by issue type
  const missingInterceptors = report.clientIssues.filter(i => i.type === 'MISSING_INTERCEPTOR');
  const missingErrorHandlers = report.clientIssues.filter(i => i.type === 'MISSING_ERROR_HANDLER');
  const incorrectConfig = report.clientIssues.filter(i => i.type === 'INCORRECT_CONFIG');

  if (missingInterceptors.length > 0) {
    markdown += '### Missing Interceptors\n\n';
    for (const issue of missingInterceptors) {
      markdown += formatClientIssueDetail(issue);
    }
  }

  if (missingErrorHandlers.length > 0) {
    markdown += '### Missing Error Handlers\n\n';
    for (const issue of missingErrorHandlers) {
      markdown += formatClientIssueDetail(issue);
    }
  }

  if (incorrectConfig.length > 0) {
    markdown += '### Incorrect Configuration\n\n';
    for (const issue of incorrectConfig) {
      markdown += formatClientIssueDetail(issue);
    }
  }

  return markdown;
}

/**
 * Generate component migration code example
 */
function generateComponentMigrationExample(componentType: string): { before: string; after: string } {
  switch (componentType) {
    case 'hook-migration':
      return {
        before: `export function AmodiataireDetailsPage({ id }: Props) {
  const { data: amodiataire, isLoading } = useAmodiataireDetails(id);
  
  if (isLoading) return <LoadingSpinner />;
  if (!amodiataire) return <ErrorMessage />;
  
  return (
    <View>
      <Text>{amodiataire.raisonSociale}</Text>
      <Text>{amodiataire.adresse}</Text>
      {amodiataire.photos?.map(photo => (
        <Image key={photo} source={{ uri: photo }} />
      ))}
    </View>
  );
}`,
        after: `export function AmodiataireDetailsPage({ id }: Props) {
  const { data, isLoading } = useAmodiataireDetail(id);
  
  if (isLoading) return <LoadingSpinner />;
  if (!data?.amodiataire) return <ErrorMessage />;
  
  const { amodiataire } = data;
  
  return (
    <View>
      <Text>{amodiataire.lot.raisonSociale}</Text>
      <Text>{amodiataire.lot.adresse}</Text>
      {amodiataire.media.images.map(image => (
        <Image key={image.id} source={{ uri: image.url }} />
      ))}
    </View>
  );
}`,
      };
    
    case 'property-migration':
      return {
        before: `export function MediaGallery({ amodiataire }: Props) {
  const photos = amodiataire.photos || [];
  const videos = amodiataire.videos || [];
  
  return (
    <View>
      {photos.map(photo => (
        <Image key={photo} source={{ uri: photo }} />
      ))}
      {videos.map(video => (
        <Video key={video} source={{ uri: video }} />
      ))}
    </View>
  );
}`,
        after: `export function MediaGallery({ amodiataire }: Props) {
  const images = amodiataire.media.images || [];
  const videos = amodiataire.media.videos || [];
  
  return (
    <View>
      {images.map(image => (
        <Image 
          key={image.id} 
          source={{ uri: image.url }}
          alt={image.altText}
        />
      ))}
      {videos.map(video => (
        <Video 
          key={video.id} 
          source={{ uri: video.url }}
          poster={video.thumbnailUrl}
        />
      ))}
    </View>
  );
}`,
      };
    
    case 'interface-migration':
      return {
        before: `interface Props {
  amodiataire: AmodiatairDetails; // Old interface
}

export function Component({ amodiataire }: Props) {
  return (
    <View>
      <Text>{amodiataire.raisonSociale}</Text>
      <Text>{amodiataire.numeroLot}</Text>
    </View>
  );
}`,
        after: `interface Props {
  amodiataire: AmodiataireDetail; // New interface
}

export function Component({ amodiataire }: Props) {
  return (
    <View>
      <Text>{amodiataire.lot.raisonSociale}</Text>
      <Text>{amodiataire.lot.numeroLot}</Text>
    </View>
  );
}`,
      };
    
    default:
      return {
        before: '// Component using old API structure',
        after: '// Component updated to use new API structure',
      };
  }
}

/**
 * Format component migration section
 */
function formatComponentMigrationSection(report: AnalysisReport): string {
  // Identify components that need migration based on deprecated routes and hooks
  const deprecatedRouteIssues = report.routeIssues.filter(i => i.type === 'DEPRECATED_ROUTE');
  const componentsNeedingMigration = new Set<string>();

  // Extract component names from recommendations
  for (const rec of report.recommendations) {
    if (rec.category === 'COMPONENT' || rec.title.includes('component') || rec.title.includes('Component')) {
      rec.affectedFiles.forEach(file => {
        if (file.includes('components/')) {
          componentsNeedingMigration.add(file);
        }
      });
    }
  }

  if (componentsNeedingMigration.size === 0 && deprecatedRouteIssues.length === 0) {
    return '## Component Migration\n\n✅ No components require migration.\n\n';
  }

  let markdown = '## Component Migration\n\n';
  
  if (deprecatedRouteIssues.length > 0) {
    markdown += `**Components using deprecated routes:** ${deprecatedRouteIssues.length} route(s) deprecated\n\n`;
    markdown += 'The following deprecated routes may be used by components:\n\n';
    for (const issue of deprecatedRouteIssues) {
      markdown += `- \`${issue.route.method} ${issue.route.endpoint}\`\n`;
      if (issue.suggestion) {
        markdown += `  - ${issue.suggestion}\n`;
      }
    }
    markdown += '\n';
  }

  if (componentsNeedingMigration.size > 0) {
    markdown += '### Components Requiring Updates\n\n';
    for (const component of Array.from(componentsNeedingMigration)) {
      markdown += `#### ${component}\n\n`;
      markdown += '**Affected Files:**\n';
      markdown += `- ${component}\n\n`;
      markdown += '**Recommendations:**\n';
      markdown += '- Review usage of deprecated hooks and routes\n';
      markdown += '- Update to use new API interfaces\n';
      markdown += '- Test thoroughly after migration\n\n';
    }
  }

  // Add migration examples
  markdown += '### Migration Examples\n\n';
  
  markdown += '#### Example 1: Hook Migration\n\n';
  markdown += 'Migrating from deprecated `useAmodiataireDetails` to new `useAmodiataireDetail`:\n\n';
  const hookExample = generateComponentMigrationExample('hook-migration');
  markdown += '**Before:**\n```typescript\n';
  markdown += hookExample.before;
  markdown += '\n```\n\n';
  markdown += '**After:**\n```typescript\n';
  markdown += hookExample.after;
  markdown += '\n```\n\n';
  
  markdown += '#### Example 2: Property Access Migration\n\n';
  markdown += 'Migrating from flat property structure to nested media structure:\n\n';
  const propertyExample = generateComponentMigrationExample('property-migration');
  markdown += '**Before:**\n```typescript\n';
  markdown += propertyExample.before;
  markdown += '\n```\n\n';
  markdown += '**After:**\n```typescript\n';
  markdown += propertyExample.after;
  markdown += '\n```\n\n';
  
  markdown += '#### Example 3: Interface Migration\n\n';
  markdown += 'Updating component props to use new interface:\n\n';
  const interfaceExample = generateComponentMigrationExample('interface-migration');
  markdown += '**Before:**\n```typescript\n';
  markdown += interfaceExample.before;
  markdown += '\n```\n\n';
  markdown += '**After:**\n```typescript\n';
  markdown += interfaceExample.after;
  markdown += '\n```\n\n';

  return markdown;
}

/**
 * Format detailed route issue information
 */
function formatRouteIssueDetail(issue: RouteIssue): string {
  let markdown = `#### ${issue.route.method} ${issue.route.endpoint}\n\n`;
  markdown += `**Priority:** ${issue.priority}\n\n`;
  markdown += `**Description:** ${issue.route.description}\n\n`;
  
  if (issue.type === 'MISSING_ROUTE') {
    markdown += '**Issue:** Route is documented but not found in ApiRoutes\n\n';
    markdown += '**Recommendation:** Add the following constant to ApiRoutes:\n\n';
    
    // Generate recommendation to get code examples
    const recommendation = generateRouteRecommendation(issue);
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || generateRouteConstantCode(issue.route);
    markdown += '\n```\n\n';
  } else if (issue.type === 'INCORRECT_PATH') {
    markdown += `**Issue:** Route path mismatch\n`;
    markdown += `- Expected: \`${issue.route.endpoint}\`\n`;
    markdown += `- Actual: \`${issue.actual}\`\n\n`;
    markdown += '**Recommendation:** Update the route constant to match the documentation.\n\n';
    
    const recommendation = generateRouteRecommendation(issue);
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'DEPRECATED_ROUTE') {
    markdown += '**Issue:** Route is deprecated\n\n';
    if (issue.suggestion) {
      markdown += `**Recommendation:** ${issue.suggestion}\n\n`;
    }
    
    const recommendation = generateRouteRecommendation(issue);
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    if (recommendation?.codeExamples.after) {
      markdown += '**After:**\n```typescript\n';
      markdown += recommendation.codeExamples.after;
      markdown += '\n```\n\n';
    }
  }

  markdown += '**Affected Files:**\n';
  markdown += '- src/services/api/routes.ts\n\n';
  markdown += '---\n\n';

  return markdown;
}

/**
 * Format detailed type issue information
 */
function formatTypeIssueDetail(issue: TypeIssue): string {
  let markdown = `#### ${issue.interface}`;
  if (issue.property) {
    markdown += `.${issue.property}`;
  }
  markdown += '\n\n';
  
  markdown += `**Priority:** ${issue.priority}\n\n`;
  
  const recommendation = generateTypeRecommendation(issue);
  
  if (issue.type === 'MISSING_INTERFACE') {
    markdown += `**Issue:** Interface \`${issue.interface}\` is documented but not found in api.ts\n\n`;
    markdown += '**Recommendation:** Create the interface:\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || generateInterfaceCode(issue.interface, issue.jsonStructure);
    markdown += '\n```\n\n';
  } else if (issue.type === 'MISSING_PROPERTY') {
    markdown += `**Issue:** Property \`${issue.property}\` is documented but missing from interface\n\n`;
    markdown += '**Recommendation:** Add the property to the interface:\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'TYPE_MISMATCH') {
    markdown += `**Issue:** Property type mismatch\n`;
    markdown += `- Expected: \`${issue.expected}\`\n`;
    markdown += `- Actual: \`${issue.actual}\`\n\n`;
    markdown += '**Recommendation:** Update the property type to match the documentation.\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'OPTIONALITY_MISMATCH') {
    markdown += `**Issue:** Property optionality mismatch\n`;
    markdown += `- Expected optional: \`${issue.expected}\`\n`;
    markdown += `- Actual optional: \`${issue.actual}\`\n\n`;
    markdown += '**Recommendation:** Update the property optionality marker.\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  }

  markdown += '**Affected Files:**\n';
  markdown += '- src/types/api.ts\n\n';
  markdown += '---\n\n';

  return markdown;
}

/**
 * Format detailed hook issue information
 */
function formatHookIssueDetail(issue: HookIssue): string {
  let markdown = '';
  
  if (issue.hook) {
    markdown += `#### ${issue.hook}\n\n`;
  } else if (issue.route) {
    markdown += `#### Hook for ${issue.route.method} ${issue.route.endpoint}\n\n`;
  }
  
  markdown += `**Priority:** ${issue.priority}\n\n`;
  
  const recommendation = generateHookRecommendation(issue);
  
  if (issue.type === 'MISSING_HOOK') {
    if (!issue.route) return '';
    markdown += `**Issue:** No hook found for endpoint \`${issue.route.method} ${issue.route.endpoint}\`\n\n`;
    markdown += '**Recommendation:** Create the hook:\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || generateHookCode(issue.route);
    markdown += '\n```\n\n';
  } else if (issue.type === 'INCORRECT_ROUTE') {
    markdown += `**Issue:** Hook uses incorrect route\n`;
    markdown += `- Expected: \`${issue.expected}\`\n`;
    markdown += `- Actual: \`${issue.actual}\`\n\n`;
    markdown += '**Recommendation:** Update the hook to use the correct route constant.\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'PARAMETER_MISMATCH') {
    markdown += `**Issue:** Hook parameters don't match documentation\n`;
    markdown += `- Expected: \`${JSON.stringify(issue.expected)}\`\n`;
    markdown += `- Actual: \`${JSON.stringify(issue.actual)}\`\n\n`;
    markdown += '**Recommendation:** Update hook parameters to match the documented API.\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'INVALID_QUERY_KEY') {
    markdown += `**Issue:** Hook has invalid or non-unique query key\n\n`;
    markdown += '**Recommendation:** Ensure query key is unique and includes all relevant parameters.\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  } else if (issue.type === 'MISSING_CACHE_INVALIDATION') {
    markdown += `**Issue:** Mutation hook is missing cache invalidation\n\n`;
    markdown += '**Recommendation:** Add cache invalidation in onSuccess callback:\n\n';
    
    if (recommendation?.codeExamples.before) {
      markdown += '**Before:**\n```typescript\n';
      markdown += recommendation.codeExamples.before;
      markdown += '\n```\n\n';
    }
    
    markdown += '**After:**\n```typescript\n';
    markdown += recommendation?.codeExamples.after || '';
    markdown += '\n```\n\n';
  }

  markdown += '**Affected Files:**\n';
  markdown += '- src/hooks/useApi.ts\n\n';
  markdown += '---\n\n';

  return markdown;
}

/**
 * Format detailed client issue information
 */
function formatClientIssueDetail(issue: ClientIssue): string {
  let markdown = `#### ${issue.component}\n\n`;
  markdown += `**Priority:** ${issue.priority}\n\n`;
  markdown += `**Issue:** ${issue.description}\n\n`;
  
  const recommendation = generateClientRecommendation(issue);
  
  if (recommendation?.codeExamples.before) {
    markdown += '**Before:**\n```typescript\n';
    markdown += recommendation.codeExamples.before;
    markdown += '\n```\n\n';
  }
  
  markdown += '**After:**\n```typescript\n';
  markdown += recommendation?.codeExamples.after || '';
  markdown += '\n```\n\n';

  markdown += '**Affected Files:**\n';
  markdown += '- src/services/api/client.ts\n\n';
  markdown += '---\n\n';

  return markdown;
}

/**
 * Format the analysis report as markdown
 */
export function formatReportAsMarkdown(report: AnalysisReport): string {
  let markdown = '# API Analysis Report\n\n';
  markdown += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;

  // Summary section
  markdown += '## Summary\n\n';
  markdown += `- **Total Routes:** ${report.summary.totalRoutes}\n`;
  markdown += `- **Total Interfaces:** ${report.summary.totalInterfaces}\n`;
  markdown += `- **Total Hooks:** ${report.summary.totalHooks}\n`;
  markdown += `- **Total Issues:** ${report.summary.totalIssues}\n\n`;

  markdown += '### Issues by Priority\n\n';
  markdown += `- **Critical:** ${report.summary.issuesByPriority.critical}\n`;
  markdown += `- **High:** ${report.summary.issuesByPriority.high}\n`;
  markdown += `- **Medium:** ${report.summary.issuesByPriority.medium}\n`;
  markdown += `- **Low:** ${report.summary.issuesByPriority.low}\n\n`;

  // Key findings
  markdown += '## Key Findings\n\n';
  
  if (report.summary.issuesByPriority.critical > 0) {
    markdown += `⚠️ **${report.summary.issuesByPriority.critical} critical issues** require immediate attention.\n\n`;
  }
  
  if (report.routeIssues.length > 0) {
    markdown += `- **${report.routeIssues.length} route issues** found\n`;
  }
  
  if (report.typeIssues.length > 0) {
    markdown += `- **${report.typeIssues.length} type issues** found\n`;
  }
  
  if (report.hookIssues.length > 0) {
    markdown += `- **${report.hookIssues.length} hook issues** found\n`;
  }
  
  if (report.clientIssues.length > 0) {
    markdown += `- **${report.clientIssues.length} client issues** found\n`;
  }
  
  markdown += '\n';

  // Detailed sections for each category
  markdown += formatPublicRoutesSection(report);
  markdown += formatAuthenticatedRoutesSection(report);
  markdown += formatInterfacesSection(report);
  markdown += formatHooksSection(report);
  markdown += formatClientConfigurationSection(report);
  markdown += formatComponentMigrationSection(report);

  // Recommendations section
  if (report.recommendations.length > 0) {
    markdown += '## Recommendations\n\n';
    
    const criticalRecs = report.recommendations.filter(r => r.priority === 'CRITICAL');
    const highRecs = report.recommendations.filter(r => r.priority === 'HIGH');
    const mediumRecs = report.recommendations.filter(r => r.priority === 'MEDIUM');
    const lowRecs = report.recommendations.filter(r => r.priority === 'LOW');

    if (criticalRecs.length > 0) {
      markdown += '### Critical Priority\n\n';
      markdown += formatRecommendations(criticalRecs);
    }

    if (highRecs.length > 0) {
      markdown += '### High Priority\n\n';
      markdown += formatRecommendations(highRecs);
    }

    if (mediumRecs.length > 0) {
      markdown += '### Medium Priority\n\n';
      markdown += formatRecommendations(mediumRecs);
    }

    if (lowRecs.length > 0) {
      markdown += '### Low Priority\n\n';
      markdown += formatRecommendations(lowRecs);
    }
  }

  return markdown;
}

/**
 * Format recommendations as markdown
 */
function formatRecommendations(recommendations: Recommendation[]): string {
  let markdown = '';

  for (const rec of recommendations) {
    markdown += `#### ${rec.title}\n\n`;
    markdown += `**Category:** ${rec.category}\n\n`;
    markdown += `${rec.description}\n\n`;
    markdown += `**Affected Files:**\n`;
    for (const file of rec.affectedFiles) {
      markdown += `- ${file}\n`;
    }
    markdown += '\n';

    if (rec.codeExamples.before || rec.codeExamples.after) {
      markdown += '**Code Example:**\n\n';
      
      if (rec.codeExamples.before) {
        markdown += '```typescript\n// Before\n';
        markdown += rec.codeExamples.before;
        markdown += '\n```\n\n';
      }
      
      if (rec.codeExamples.after) {
        markdown += '```typescript\n// After\n';
        markdown += rec.codeExamples.after;
        markdown += '\n```\n\n';
      }
    }
  }

  return markdown;
}
