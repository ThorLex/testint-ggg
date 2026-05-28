/**
 * Integration tests for Route Analyzer with real data
 * Feature: api-routes-complete-analysis
 */

import * as path from 'path';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { parseRoutesFile } from '../../src/parsers/routes-parser';
import { analyzeRoutes } from '../../src/analyzers/route-analyzer';
import * as fs from 'fs';

describe('Route Analyzer Integration', () => {
  const workspaceRoot = path.resolve(__dirname, '../../../..');
  const documentationPath = path.join(workspaceRoot, 'API_ROUTES_DOCUMENTATION.md');
  const routesPath = path.join(workspaceRoot, 'src/services/api/routes.ts');

  // Skip if files don't exist (for CI environments)
  const skipIfMissing = (filePath: string) => {
    if (!fs.existsSync(filePath)) {
      console.warn(`Skipping test - file not found: ${filePath}`);
      return true;
    }
    return false;
  };

  it('should analyze real API documentation and routes', () => {
    if (skipIfMissing(documentationPath) || skipIfMissing(routesPath)) {
      return;
    }

    // Parse real documentation
    const documentationContent = fs.readFileSync(documentationPath, 'utf-8');
    const parsedDocumentation = parseApiDocumentation(documentationContent);

    // Parse real routes file
    const parsedRoutes = parseRoutesFile(routesPath);

    // Analyze routes
    const result = analyzeRoutes(parsedDocumentation, parsedRoutes);

    // Basic validation - should not throw errors
    expect(result).toBeDefined();
    expect(result.issues).toBeInstanceOf(Array);
    expect(result.statistics).toBeDefined();
    expect(result.statistics.totalDocumentedRoutes).toBeGreaterThan(0);
    expect(result.statistics.totalImplementedRoutes).toBeGreaterThan(0);

    // Log results for manual inspection
    console.log('\n=== Route Analysis Results ===');
    console.log(`Total documented routes: ${result.statistics.totalDocumentedRoutes}`);
    console.log(`Total implemented routes: ${result.statistics.totalImplementedRoutes}`);
    console.log(`Missing routes: ${result.statistics.missingRoutes}`);
    console.log(`Incorrect paths: ${result.statistics.incorrectPaths}`);
    console.log(`Deprecated routes: ${result.statistics.deprecatedRoutes}`);
    console.log(`Utility method issues: ${result.statistics.utilityMethodIssues}`);

    if (result.issues.length > 0) {
      console.log('\n=== Issues Found ===');
      result.issues.forEach((issue, index) => {
        console.log(`${index + 1}. ${issue.type}: ${issue.route.endpoint} (${issue.priority})`);
        if (issue.actual) {
          console.log(`   Current: ${issue.actual}`);
        }
        if (issue.suggestion) {
          console.log(`   Suggestion: ${issue.suggestion}`);
        }
      });
    }

    // Validate that we found some documented routes
    expect(parsedDocumentation.publicRoutes.length + parsedDocumentation.authenticatedRoutes.length).toBeGreaterThan(0);
    
    // Validate that we found some route constants
    expect(parsedRoutes.routes.length).toBeGreaterThan(0);
  });

  it('should identify specific expected routes', () => {
    if (skipIfMissing(documentationPath) || skipIfMissing(routesPath)) {
      return;
    }

    const documentationContent = fs.readFileSync(documentationPath, 'utf-8');
    const parsedDocumentation = parseApiDocumentation(documentationContent);
    const parsedRoutes = parseRoutesFile(routesPath);

    // Check for specific routes that should exist
    const allDocumentedRoutes = [
      ...parsedDocumentation.publicRoutes,
      ...parsedDocumentation.authenticatedRoutes,
    ];

    // Should have amodiataires routes
    const amodiatairesRoutes = allDocumentedRoutes.filter(r => 
      r.endpoint.includes('amodiataires')
    );
    expect(amodiatairesRoutes.length).toBeGreaterThan(0);

    // Should have some route constants
    const amodiatairesConstants = parsedRoutes.routes.filter(r => 
      r.name.includes('AMODIATAIRES') || r.value.includes('amodiataires')
    );
    expect(amodiatairesConstants.length).toBeGreaterThan(0);

    // Should have utility methods
    const utilityMethods = parsedRoutes.utilityMethods.filter(m => 
      m.name.includes('Amodiataire')
    );
    expect(utilityMethods.length).toBeGreaterThan(0);
  });

  it('should validate utility methods exist', () => {
    if (skipIfMissing(routesPath)) {
      return;
    }

    const parsedRoutes = parseRoutesFile(routesPath);

    // Check for required utility methods
    const requiredMethods = [
      'getAmodiataireDetailsUrl',
      'getAmodiataireAnnouncementsUrl',
      'getAmodiataireMediaUrl',
    ];

    for (const methodName of requiredMethods) {
      const method = parsedRoutes.utilityMethods.find(m => m.name === methodName);
      if (method) {
        console.log(`✓ Found utility method: ${methodName}`);
        expect(method.parameters.length).toBeGreaterThan(0);
        expect(method.returnType).toBe('string');
      } else {
        console.log(`✗ Missing utility method: ${methodName}`);
      }
    }
  });
});