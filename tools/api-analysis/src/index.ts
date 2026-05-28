/**
 * API Analysis Tool Entry Point
 * Feature: api-routes-complete-analysis
 * 
 * This tool analyzes the Navipad API implementation against the official
 * API_ROUTES_DOCUMENTATION.md to identify inconsistencies.
 */

import { defaultConfig } from '../config/analyzer.config';
import { parseApiDocumentation } from './parsers/documentation-parser';
import { parseRoutesFile } from './parsers/routes-parser';
import { parseApiTypes } from './parsers/types-parser';
import { parseApiHooks } from './parsers/hooks-parser';
import { analyzeRoutes } from './analyzers/route-analyzer';
import { analyzeTypes } from './analyzers/type-analyzer';
import { analyzeHooks } from './analyzers/hook-analyzer';
import { generateAnalysisReport } from './generators/report-generator';
import type { AnalysisReport, ParsedDocumentation, ValidationWarning } from '../types/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Main analysis function
 * 
 * Coordinates all parsers and analyzers to produce a comprehensive analysis report.
 * Handles errors gracefully and validates results for consistency.
 * 
 * @returns Promise<AnalysisReport> - Complete analysis report with all findings
 * @throws Error if critical files are missing or analysis cannot proceed
 */
export async function analyzeAPI(): Promise<AnalysisReport> {
  console.log('🔍 Starting comprehensive API analysis...');
  console.log('Configuration:', defaultConfig);
  
  const warnings: ValidationWarning[] = [];
  const filesAnalyzed: string[] = [];
  const filesMissing: string[] = [];
  
  try {
    // Step 1: Parse API Documentation
    console.log('\n📖 Step 1: Parsing API documentation...');
    const parsedDocumentation = await parseDocumentation(warnings, filesAnalyzed, filesMissing);
    
    // Step 2: Parse Routes File
    console.log('\n🛣️  Step 2: Parsing routes.ts file...');
    const parsedRoutes = await parseRoutes(warnings, filesAnalyzed, filesMissing);
    
    // Step 3: Parse Types File
    console.log('\n📝 Step 3: Parsing api.ts types file...');
    const parsedTypes = await parseTypes(warnings, filesAnalyzed, filesMissing);
    
    // Step 4: Parse Hooks File
    console.log('\n🪝 Step 4: Parsing useApi.ts hooks file...');
    const parsedHooks = await parseHooks(warnings, filesAnalyzed, filesMissing);
    
    // Step 5: Run Route Analyzer
    console.log('\n🔍 Step 5: Analyzing routes...');
    const routeAnalysis = analyzeRoutes(parsedDocumentation, parsedRoutes);
    console.log(`   Found ${routeAnalysis.issues.length} route issues`);
    
    // Step 6: Run Type Analyzer
    console.log('\n🔍 Step 6: Analyzing TypeScript interfaces...');
    const typeAnalysis = analyzeTypes(parsedDocumentation, parsedTypes.interfaces);
    console.log(`   Found ${typeAnalysis.issues.length} type issues`);
    
    // Step 7: Run Hook Analyzer
    console.log('\n🔍 Step 7: Analyzing React Query hooks...');
    const hookAnalysis = analyzeHooks(parsedDocumentation, parsedHooks.hooks, parsedRoutes);
    console.log(`   Found ${hookAnalysis.issues.length} hook issues`);
    
    // Step 8: Validate Analysis Results
    console.log('\n✅ Step 8: Validating analysis results...');
    validateAnalysisResults(
      parsedDocumentation,
      routeAnalysis,
      typeAnalysis,
      hookAnalysis,
      warnings,
      filesAnalyzed,
      filesMissing
    );
    
    // Step 9: Generate Comprehensive Report
    console.log('\n📊 Step 9: Generating comprehensive report...');
    const report = generateAnalysisReport({
      routeAnalysis,
      typeAnalysis,
      hookAnalysis,
      clientIssues: [], // TODO: Implement client analyzer in Task 7
      warnings,
      filesAnalyzed,
      filesMissing,
    });
    
    // Display warnings if any
    if (warnings.length > 0) {
      console.log('\n⚠️  Warnings encountered during analysis:');
      warnings.forEach((warning, index) => {
        const icon = warning.severity === 'ERROR' ? '❌' : '⚠️';
        console.log(`   ${index + 1}. ${icon} [${warning.type}] ${warning.message}`);
        if (warning.file) {
          console.log(`      File: ${warning.file}`);
        }
      });
    }
    
    console.log('\n✅ Analysis complete!');
    console.log(`   Files analyzed: ${filesAnalyzed.length}`);
    console.log(`   Files missing: ${filesMissing.length}`);
    console.log(`   Parse errors: ${report.metadata.parseErrors}`);
    console.log(`   Total issues found: ${report.summary.totalIssues}`);
    console.log(`   Critical: ${report.summary.issuesByPriority.critical}`);
    console.log(`   High: ${report.summary.issuesByPriority.high}`);
    console.log(`   Medium: ${report.summary.issuesByPriority.medium}`);
    console.log(`   Low: ${report.summary.issuesByPriority.low}`);
    
    return report;
  } catch (error) {
    console.error('\n❌ Analysis failed with critical error:', error);
    
    // Log all warnings collected before the error
    if (warnings.length > 0) {
      console.error('\n⚠️  Warnings before failure:');
      warnings.forEach((warning, index) => {
        console.error(`   ${index + 1}. [${warning.type}] ${warning.message}`);
      });
    }
    
    throw error;
  }
}

/**
 * Parse API documentation with error handling
 */
async function parseDocumentation(
  warnings: ValidationWarning[],
  filesAnalyzed: string[],
  filesMissing: string[]
): Promise<ParsedDocumentation> {
  const documentationPath = path.resolve(defaultConfig.files.documentation);
  
  // Check if file exists
  if (!fs.existsSync(documentationPath)) {
    filesMissing.push(documentationPath);
    const error = new Error(`CRITICAL: Documentation file not found: ${documentationPath}`);
    warnings.push({
      type: 'MISSING_FILE',
      file: documentationPath,
      message: error.message,
      severity: 'ERROR',
    });
    throw error;
  }
  
  try {
    const documentationContent = fs.readFileSync(documentationPath, 'utf-8');
    const parsedDocumentation = parseApiDocumentation(documentationContent);
    
    filesAnalyzed.push(documentationPath);
    
    console.log(`   ✓ Found ${parsedDocumentation.publicRoutes.length} public routes`);
    console.log(`   ✓ Found ${parsedDocumentation.authenticatedRoutes.length} authenticated routes`);
    console.log(`   ✓ Found ${Object.keys(parsedDocumentation.responseStructures).length} response structures`);
    
    // Validate parsed documentation
    if (parsedDocumentation.publicRoutes.length === 0 && parsedDocumentation.authenticatedRoutes.length === 0) {
      warnings.push({
        type: 'PARSE_ERROR',
        file: documentationPath,
        message: 'No routes found in documentation. This may indicate a parsing issue.',
        severity: 'WARNING',
      });
    }
    
    return parsedDocumentation;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push({
      type: 'PARSE_ERROR',
      file: documentationPath,
      message: `Failed to parse documentation: ${message}`,
      details: error,
      severity: 'ERROR',
    });
    throw new Error(`Failed to parse API documentation: ${message}`);
  }
}

/**
 * Parse routes file with error handling
 */
async function parseRoutes(
  warnings: ValidationWarning[],
  filesAnalyzed: string[],
  filesMissing: string[]
): Promise<any> {
  const routesPath = path.resolve(defaultConfig.files.routes);
  
  // Check if file exists
  if (!fs.existsSync(routesPath)) {
    filesMissing.push(routesPath);
    const warning: ValidationWarning = {
      type: 'MISSING_FILE',
      file: routesPath,
      message: 'Routes file not found. Analysis will continue with empty routes.',
      severity: 'WARNING',
    };
    warnings.push(warning);
    console.log(`   ⚠️  ${warning.message}`);
    
    // Return empty structure to allow analysis to continue
    return { routes: [], utilityMethods: [] };
  }
  
  try {
    const parsedRoutes = parseRoutesFile(routesPath);
    
    filesAnalyzed.push(routesPath);
    
    console.log(`   ✓ Found ${parsedRoutes.routes.length} route constants`);
    console.log(`   ✓ Found ${parsedRoutes.utilityMethods.length} utility methods`);
    
    return parsedRoutes;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push({
      type: 'PARSE_ERROR',
      file: routesPath,
      message: `Failed to parse routes file: ${message}`,
      details: error,
      severity: 'ERROR',
    });
    
    // Return empty structure to allow analysis to continue
    console.log(`   ⚠️  Parse error, continuing with empty routes`);
    return { routes: [], utilityMethods: [] };
  }
}

/**
 * Parse types file with error handling
 */
async function parseTypes(
  warnings: ValidationWarning[],
  filesAnalyzed: string[],
  filesMissing: string[]
): Promise<any> {
  const typesPath = path.resolve(defaultConfig.files.types);
  
  // Check if file exists
  if (!fs.existsSync(typesPath)) {
    filesMissing.push(typesPath);
    const warning: ValidationWarning = {
      type: 'MISSING_FILE',
      file: typesPath,
      message: 'Types file not found. Analysis will continue with empty types.',
      severity: 'WARNING',
    };
    warnings.push(warning);
    console.log(`   ⚠️  ${warning.message}`);
    
    // Return empty structure to allow analysis to continue
    return { interfaces: [] };
  }
  
  try {
    const parsedTypes = parseApiTypes(typesPath);
    
    filesAnalyzed.push(typesPath);
    
    console.log(`   ✓ Found ${parsedTypes.length} interface definitions`);
    
    return { interfaces: parsedTypes };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push({
      type: 'PARSE_ERROR',
      file: typesPath,
      message: `Failed to parse types file: ${message}`,
      details: error,
      severity: 'ERROR',
    });
    
    // Return empty structure to allow analysis to continue
    console.log(`   ⚠️  Parse error, continuing with empty types`);
    return { interfaces: [] };
  }
}

/**
 * Parse hooks file with error handling
 */
async function parseHooks(
  warnings: ValidationWarning[],
  filesAnalyzed: string[],
  filesMissing: string[]
): Promise<any> {
  const hooksPath = path.resolve(defaultConfig.files.hooks);
  
  // Check if file exists
  if (!fs.existsSync(hooksPath)) {
    filesMissing.push(hooksPath);
    const warning: ValidationWarning = {
      type: 'MISSING_FILE',
      file: hooksPath,
      message: 'Hooks file not found. Analysis will continue with empty hooks.',
      severity: 'WARNING',
    };
    warnings.push(warning);
    console.log(`   ⚠️  ${warning.message}`);
    
    // Return empty structure to allow analysis to continue
    return { hooks: [] };
  }
  
  try {
    const parsedHooks = parseApiHooks(hooksPath);
    
    filesAnalyzed.push(hooksPath);
    
    console.log(`   ✓ Found ${parsedHooks.length} hook definitions`);
    
    return { hooks: parsedHooks };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    warnings.push({
      type: 'PARSE_ERROR',
      file: hooksPath,
      message: `Failed to parse hooks file: ${message}`,
      details: error,
      severity: 'ERROR',
    });
    
    // Return empty structure to allow analysis to continue
    console.log(`   ⚠️  Parse error, continuing with empty hooks`);
    return { hooks: [] };
  }
}

/**
 * Validate analysis results for consistency
 * 
 * Ensures that:
 * - All required files were analyzed
 * - Analysis results are internally consistent
 * - No contradictory findings exist
 */
function validateAnalysisResults(
  parsedDocumentation: ParsedDocumentation,
  routeAnalysis: any,
  typeAnalysis: any,
  hookAnalysis: any,
  warnings: ValidationWarning[],
  filesAnalyzed: string[],
  filesMissing: string[]
): void {
  // Validate that all required files were analyzed
  const requiredFiles = [
    defaultConfig.files.documentation,
    defaultConfig.files.routes,
    defaultConfig.files.types,
    defaultConfig.files.hooks,
  ];
  
  const missingRequiredFiles = requiredFiles.filter(file => {
    const resolvedPath = path.resolve(file);
    return !filesAnalyzed.includes(resolvedPath);
  });
  
  if (missingRequiredFiles.length > 0) {
    warnings.push({
      type: 'VALIDATION_ERROR',
      message: `Missing required files for complete analysis: ${missingRequiredFiles.join(', ')}`,
      severity: 'WARNING',
    });
  }
  
  // Validate that we have documentation to compare against
  const totalDocumentedRoutes = 
    parsedDocumentation.publicRoutes.length + 
    parsedDocumentation.authenticatedRoutes.length;
  
  if (totalDocumentedRoutes === 0) {
    warnings.push({
      type: 'VALIDATION_ERROR',
      message: 'No routes found in documentation. Cannot perform meaningful analysis.',
      severity: 'ERROR',
    });
  }
  
  // Validate route analysis consistency
  if (routeAnalysis.statistics.totalDocumentedRoutes !== totalDocumentedRoutes) {
    warnings.push({
      type: 'INCONSISTENCY',
      message: `Route count mismatch: Documentation has ${totalDocumentedRoutes} routes, but analyzer counted ${routeAnalysis.statistics.totalDocumentedRoutes}`,
      severity: 'WARNING',
    });
  }
  
  // Validate that all issues have priorities
  const allIssues = [
    ...routeAnalysis.issues,
    ...typeAnalysis.issues,
    ...hookAnalysis.issues,
  ];
  
  const issuesWithoutPriority = allIssues.filter(issue => !issue.priority);
  if (issuesWithoutPriority.length > 0) {
    warnings.push({
      type: 'VALIDATION_ERROR',
      message: `${issuesWithoutPriority.length} issues found without priority assignment`,
      severity: 'WARNING',
    });
  }
  
  // Validate that response structures have corresponding type analysis
  const documentedStructures = Object.keys(parsedDocumentation.responseStructures);
  if (documentedStructures.length > 0 && typeAnalysis.statistics.totalDocumentedStructures === 0) {
    warnings.push({
      type: 'INCONSISTENCY',
      message: `Documentation defines ${documentedStructures.length} response structures, but type analyzer found none`,
      severity: 'WARNING',
    });
  }
  
  console.log(`   ✓ Validation complete`);
  const criticalWarnings = warnings.filter(w => w.severity === 'ERROR');
  if (criticalWarnings.length === 0) {
    console.log(`   ✓ No critical validation errors detected`);
  } else {
    console.log(`   ⚠️  ${criticalWarnings.length} critical validation errors detected`);
  }
}

// Export types for use by other modules
export * from '../types/core';
export * from '../config/analyzer.config';
export * from './analyzers';

// Export parsers
export * from './parsers/documentation-parser';
export * from './parsers/routes-parser';
export * from './parsers/types-parser';
export * from './parsers/hooks-parser';
export * from './parsers/client-parser';

// Export generators
export * from './generators/report-generator';

/**
 * CLI execution - Run analysis if executed directly
 */
if (require.main === module) {
  analyzeAPI()
    .then((report) => {
      console.log('\n' + '='.repeat(80));
      console.log('📊 ANALYSIS REPORT SUMMARY');
      console.log('='.repeat(80));
      console.log(`\nTimestamp: ${report.timestamp}`);
      console.log(`\nTotal Routes Documented: ${report.summary.totalRoutes}`);
      console.log(`Total Interfaces Documented: ${report.summary.totalInterfaces}`);
      console.log(`Total Hooks Implemented: ${report.summary.totalHooks}`);
      console.log(`\nTotal Issues Found: ${report.summary.totalIssues}`);
      console.log(`\nIssues by Priority:`);
      console.log(`  🔴 Critical: ${report.summary.issuesByPriority.critical}`);
      console.log(`  🟠 High:     ${report.summary.issuesByPriority.high}`);
      console.log(`  🟡 Medium:   ${report.summary.issuesByPriority.medium}`);
      console.log(`  🟢 Low:      ${report.summary.issuesByPriority.low}`);
      
      // Display route issues
      if (report.routeIssues.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('🛣️  ROUTE ISSUES');
        console.log('-'.repeat(80));
        report.routeIssues.slice(0, 10).forEach((issue, index) => {
          const priorityIcon = 
            issue.priority === 'CRITICAL' ? '🔴' :
            issue.priority === 'HIGH' ? '🟠' :
            issue.priority === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`\n${index + 1}. ${priorityIcon} [${issue.type}] ${issue.route.method} ${issue.route.endpoint}`);
          if (issue.suggestion) {
            console.log(`   💡 ${issue.suggestion}`);
          }
        });
        if (report.routeIssues.length > 10) {
          console.log(`\n   ... and ${report.routeIssues.length - 10} more route issues`);
        }
      }
      
      // Display type issues
      if (report.typeIssues.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('📝 TYPE ISSUES');
        console.log('-'.repeat(80));
        report.typeIssues.slice(0, 10).forEach((issue, index) => {
          const priorityIcon = 
            issue.priority === 'CRITICAL' ? '🔴' :
            issue.priority === 'HIGH' ? '🟠' :
            issue.priority === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`\n${index + 1}. ${priorityIcon} [${issue.type}] ${issue.interface}${issue.property ? `.${issue.property}` : ''}`);
        });
        if (report.typeIssues.length > 10) {
          console.log(`\n   ... and ${report.typeIssues.length - 10} more type issues`);
        }
      }
      
      // Display hook issues
      if (report.hookIssues.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('🪝 HOOK ISSUES');
        console.log('-'.repeat(80));
        report.hookIssues.slice(0, 10).forEach((issue, index) => {
          const priorityIcon = 
            issue.priority === 'CRITICAL' ? '🔴' :
            issue.priority === 'HIGH' ? '🟠' :
            issue.priority === 'MEDIUM' ? '🟡' : '🟢';
          const hookName = issue.hook || (issue.route ? `Hook for ${issue.route.endpoint}` : 'Unknown');
          console.log(`\n${index + 1}. ${priorityIcon} [${issue.type}] ${hookName}`);
        });
        if (report.hookIssues.length > 10) {
          console.log(`\n   ... and ${report.hookIssues.length - 10} more hook issues`);
        }
      }
      
      // Display top recommendations
      if (report.recommendations.length > 0) {
        console.log('\n' + '-'.repeat(80));
        console.log('💡 TOP RECOMMENDATIONS');
        console.log('-'.repeat(80));
        report.recommendations.slice(0, 5).forEach((rec, index) => {
          const priorityIcon = 
            rec.priority === 'CRITICAL' ? '🔴' :
            rec.priority === 'HIGH' ? '🟠' :
            rec.priority === 'MEDIUM' ? '🟡' : '🟢';
          console.log(`\n${index + 1}. ${priorityIcon} [${rec.category}] ${rec.title}`);
          console.log(`   ${rec.description}`);
          console.log(`   Files: ${rec.affectedFiles.join(', ')}`);
        });
        if (report.recommendations.length > 5) {
          console.log(`\n   ... and ${report.recommendations.length - 5} more recommendations`);
        }
      }
      
      console.log('\n' + '='.repeat(80));
      console.log('✅ Analysis complete! See full report for details.');
      console.log('='.repeat(80) + '\n');
      
      // Exit with error code if critical issues found
      if (report.summary.issuesByPriority.critical > 0) {
        console.log('⚠️  Critical issues detected. Please address them before proceeding.\n');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n' + '='.repeat(80));
      console.error('❌ ANALYSIS FAILED');
      console.error('='.repeat(80));
      console.error(`\nError: ${error.message}`);
      if (error.stack) {
        console.error(`\nStack trace:\n${error.stack}`);
      }
      console.error('\n' + '='.repeat(80) + '\n');
      process.exit(1);
    });
}
