/**
 * Core TypeScript interfaces for API analysis tool
 * Feature: api-routes-complete-analysis
 */

// ============================================================================
// Parsed Documentation Types
// ============================================================================

/**
 * Parsed documentation structure containing all API information
 */
export interface ParsedDocumentation {
  publicRoutes: RouteDefinition[];
  authenticatedRoutes: RouteDefinition[];
  responseStructures: Record<string, JsonStructure>;
  errorCodes: ErrorDefinition[];
}

/**
 * Definition of a single API route from documentation
 */
export interface RouteDefinition {
  endpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  isPublic: boolean;
  queryParams?: ParamDefinition[];
  pathParams?: ParamDefinition[];
  requestBody?: JsonStructure;
  responseBody: JsonStructure;
  errorResponses: ErrorResponse[];
}

/**
 * Definition of a parameter (query or path)
 */
export interface ParamDefinition {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description?: string;
  defaultValue?: any;
}

/**
 * JSON structure parsed from documentation
 */
export interface JsonStructure {
  type: 'object' | 'array' | 'string' | 'number' | 'boolean';
  properties?: Record<string, PropertyDefinition>;
  items?: JsonStructure;
}

/**
 * Definition of a property within a JSON structure
 */
export interface PropertyDefinition {
  type: string;
  optional: boolean;
  description?: string;
  nested?: JsonStructure;
}

/**
 * Error response definition
 */
export interface ErrorResponse {
  code: number;
  structure: JsonStructure;
  description: string;
}

/**
 * Error code definition
 */
export interface ErrorDefinition {
  code: number;
  message: string;
  description: string;
}

// ============================================================================
// Parsed Codebase Types
// ============================================================================

/**
 * Parsed codebase structure containing all implementation details
 */
export interface ParsedCodebase {
  routes: RouteConstant[];
  interfaces: InterfaceDefinition[];
  hooks: HookDefinition[];
  client: ClientConfiguration;
}

/**
 * Route constant from ApiRoutes class
 */
export interface RouteConstant {
  name: string;
  value: string;
  deprecated?: boolean;
  comment?: string;
}

/**
 * TypeScript interface definition
 */
export interface InterfaceDefinition {
  name: string;
  properties: PropertyInfo[];
  extends?: string[];
  comment?: string;
}

/**
 * Property information from TypeScript interface
 */
export interface PropertyInfo {
  name: string;
  type: string;
  optional: boolean;
  comment?: string;
}

/**
 * React Query hook definition
 */
export interface HookDefinition {
  name: string;
  type: 'query' | 'mutation';
  endpoint: string;
  queryKey?: any[];
  parameters?: ParamInfo[];
  invalidatesCache?: string[][];
  returnType?: string;
}

/**
 * Parameter information for hooks
 */
export interface ParamInfo {
  name: string;
  type: string;
  optional: boolean;
}

/**
 * Axios client configuration
 */
export interface ClientConfiguration {
  baseURL?: string;
  interceptors: {
    request: InterceptorInfo[];
    response: InterceptorInfo[];
  };
  errorHandlers: ErrorHandlerInfo[];
}

/**
 * Interceptor information
 */
export interface InterceptorInfo {
  type: 'request' | 'response';
  description: string;
  handles?: string[];
}

/**
 * Error handler information
 */
export interface ErrorHandlerInfo {
  errorCode: number;
  handler: string;
  description: string;
}

// ============================================================================
// Analysis Issue Types
// ============================================================================

/**
 * Route-related issue
 */
export interface RouteIssue {
  type: 'MISSING_ROUTE' | 'INCORRECT_PATH' | 'DEPRECATED_ROUTE';
  route: RouteDefinition;
  actual?: string;
  suggestion?: string;
  priority: IssuePriority;
}

/**
 * Type/Interface-related issue
 */
export interface TypeIssue {
  type: 'MISSING_INTERFACE' | 'MISSING_PROPERTY' | 'TYPE_MISMATCH' | 'OPTIONALITY_MISMATCH';
  interface: string;
  property?: string;
  expected?: any;
  actual?: any;
  jsonStructure?: JsonStructure;
  priority: IssuePriority;
}

/**
 * Hook-related issue
 */
export interface HookIssue {
  type: 'MISSING_HOOK' | 'INCORRECT_ROUTE' | 'PARAMETER_MISMATCH' | 
        'INVALID_QUERY_KEY' | 'MISSING_CACHE_INVALIDATION';
  hook?: string;
  route?: RouteDefinition;
  expected?: any;
  actual?: any;
  priority: IssuePriority;
}

/**
 * Client configuration issue
 */
export interface ClientIssue {
  type: 'MISSING_INTERCEPTOR' | 'MISSING_ERROR_HANDLER' | 'INCORRECT_CONFIG' |
        'MISSING_X_API_KEY_INTERCEPTOR' | 'MISSING_AUTHORIZATION_INTERCEPTOR' |
        'MISSING_401_ERROR_HANDLER' | 'MISSING_TOKEN_REFRESH' |
        'MISSING_BASE_URL' | 'INCORRECT_BASE_URL' | 'MISSING_ERROR_RESPONSE_STRUCTURE';
  component: string;
  description: string;
  expected?: any;
  actual?: any;
  priority: IssuePriority;
  requirement?: string;
}

/**
 * Issue priority levels
 */
export type IssuePriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

// ============================================================================
// Analysis Report Types
// ============================================================================

/**
 * Validation warning collected during analysis
 */
export interface ValidationWarning {
  type: 'PARSE_ERROR' | 'MISSING_FILE' | 'INCONSISTENCY' | 'VALIDATION_ERROR';
  file?: string;
  message: string;
  details?: any;
  severity?: 'WARNING' | 'ERROR';
}

/**
 * Complete analysis report
 */
export interface AnalysisReport {
  timestamp: string;
  summary: AnalysisSummary;
  routeIssues: RouteIssue[];
  typeIssues: TypeIssue[];
  hookIssues: HookIssue[];
  clientIssues: ClientIssue[];
  recommendations: Recommendation[];
  warnings: ValidationWarning[];
  metadata: {
    filesAnalyzed: string[];
    filesMissing: string[];
    parseErrors: number;
  };
}

/**
 * Summary statistics for the analysis
 */
export interface AnalysisSummary {
  totalRoutes: number;
  totalInterfaces: number;
  totalHooks: number;
  totalIssues: number;
  issuesByPriority: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

/**
 * Recommendation for fixing an issue
 */
export interface Recommendation {
  priority: IssuePriority;
  category: 'ROUTE' | 'TYPE' | 'HOOK' | 'CLIENT' | 'COMPONENT';
  title: string;
  description: string;
  affectedFiles: string[];
  codeExamples: {
    before?: string;
    after: string;
  };
}

// ============================================================================
// Update Plan Types
// ============================================================================

/**
 * Complete update plan
 */
export interface UpdatePlan {
  metadata: UpdatePlanMetadata;
  phases: UpdatePhase[];
  dependencies: Dependency[];
  validationTests: ValidationTest[];
}

/**
 * Update plan metadata
 */
export interface UpdatePlanMetadata {
  createdDate: string;
  estimatedEffort: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

/**
 * Update phase containing related tasks
 */
export interface UpdatePhase {
  phase: number;
  name: string;
  description: string;
  priority: IssuePriority;
  estimatedTime: string;
  tasks: UpdateTask[];
}

/**
 * Individual update task
 */
export interface UpdateTask {
  id: string;
  title: string;
  description: string;
  file: string;
  type: 'ADD' | 'MODIFY' | 'DELETE' | 'REFACTOR';
  codeExample: {
    before?: string;
    after: string;
  };
  affectedComponents: string[];
  testingNotes: string;
}

/**
 * Task dependency
 */
export interface Dependency {
  taskId: string;
  dependsOn: string[];
  reason: string;
}

/**
 * Validation test
 */
export interface ValidationTest {
  name: string;
  description: string;
  type: 'UNIT' | 'INTEGRATION' | 'E2E';
  file: string;
  code: string;
}
