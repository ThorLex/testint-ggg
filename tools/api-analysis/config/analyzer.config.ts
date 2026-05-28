/**
 * Configuration for API analysis tool
 * Feature: api-routes-complete-analysis
 */

export interface AnalyzerConfig {
  // Files to analyze
  files: {
    documentation: string;
    routes: string;
    types: string;
    hooks: string;
    client: string;
  };
  
  // Analysis options
  options: {
    // Ignore certain routes
    ignoreRoutes?: string[];
    
    // Ignore certain interfaces
    ignoreInterfaces?: string[];
    
    // Minimum severity level for the report
    minSeverity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    
    // Generate code examples
    generateCodeExamples?: boolean;
    
    // Check deprecated routes
    checkDeprecated?: boolean;
    
    // Check cache invalidation
    checkCacheInvalidation?: boolean;
  };
  
  // Output configuration
  output: {
    // Report format (json, html, markdown)
    format: 'json' | 'html' | 'markdown';
    
    // Output file path
    path: string;
    
    // Generate update plan
    generateUpdatePlan?: boolean;
  };
}

/**
 * Default configuration for the analyzer
 */
export const defaultConfig: AnalyzerConfig = {
  files: {
    documentation: '../../API_ROUTES_DOCUMENTATION.md',
    routes: '../../src/services/api/routes.ts',
    types: '../../src/types/api.ts',
    hooks: '../../src/hooks/useApi.ts',
    client: '../../src/services/api/client.ts',
  },
  options: {
    minSeverity: 'LOW',
    generateCodeExamples: true,
    checkDeprecated: true,
    checkCacheInvalidation: true,
  },
  output: {
    format: 'json',
    path: 'tools/api-analysis/reports/analysis-report.json',
    generateUpdatePlan: true,
  },
};
