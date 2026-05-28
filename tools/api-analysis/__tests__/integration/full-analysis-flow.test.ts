/**
 * Integration Tests for Full Analysis Flow
 * Feature: api-routes-complete-analysis, Task 12.3
 * 
 * Tests the complete analysis pipeline from documentation parsing to report generation.
 * Validates error handling scenarios and ensures the analysis works end-to-end.
 * 
 * Note: These tests use the real parsers and analyzers with sample data to verify
 * the complete integration of the analysis pipeline.
 */

import { analyzeAPI } from '../../src/index';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import { analyzeRoutes } from '../../src/analyzers/route-analyzer';
import { analyzeTypes } from '../../src/analyzers/type-analyzer';
import { analyzeHooks } from '../../src/analyzers/hook-analyzer';
import { generateAnalysisReport } from '../../src/generators/report-generator';
import type { AnalysisReport, ParsedDocumentation } from '../../types/core';
import * as fs from 'fs';

// Mock only the file system
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Full Analysis Flow Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Complete Analysis Pipeline', () => {
    it('should parse documentation and generate a complete report', () => {
      // Arrange: Sample documentation
      const sampleDoc = getSampleDocumentation();
      
      // Act: Parse documentation
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Assert: Verify parsing worked
      expect(parsedDoc).toBeDefined();
      expect(parsedDoc.publicRoutes.length).toBeGreaterThan(0);
      expect(parsedDoc.authenticatedRoutes.length).toBeGreaterThan(0);
      expect(Object.keys(parsedDoc.responseStructures).length).toBeGreaterThan(0);
    });

    it('should detect missing routes when comparing documentation to implementation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Mock implementation with missing routes
      const mockRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            isDeprecated: false,
          },
          // Missing: /api/mobile/public/amodiataires/:id
          // Missing: /api/mobile/profile
        ],
        utilityMethods: [],
      };
      
      // Act: Analyze routes
      const analysis = analyzeRoutes(parsedDoc, mockRoutes);
      
      // Assert: Should detect missing routes
      expect(analysis.issues.length).toBeGreaterThan(0);
      
      const missingRouteIssues = analysis.issues.filter(
        issue => issue.type === 'MISSING_ROUTE'
      );
      
      expect(missingRouteIssues.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should detect missing interfaces when comparing documentation to implementation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Mock implementation with missing interfaces
      const mockInterfaces = [
        {
          name: 'AmodiatairesListResponse',
          properties: [
            { name: 'success', type: 'boolean', optional: false },
            { name: 'count', type: 'number', optional: false },
          ],
        },
        // Missing: AmodiataireDetailResponse
        // Missing: ProfileResponse
      ];
      
      // Act: Analyze types
      const analysis = analyzeTypes(parsedDoc, mockInterfaces);
      
      // Assert: Should detect missing interfaces
      expect(analysis.issues.length).toBeGreaterThan(0);
      
      const missingInterfaceIssues = analysis.issues.filter(
        issue => issue.type === 'MISSING_INTERFACE'
      );
      
      expect(missingInterfaceIssues.length).toBeGreaterThanOrEqual(2);
    });

    it('should detect missing hooks when comparing documentation to implementation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Mock implementation with missing hooks
      const mockHooks = [
        {
          name: 'useAmodiataires',
          endpoint: '/api/mobile/public/amodiataires',
          method: 'GET',
          type: 'query' as const,
          queryKey: ['amodiataires', 'list'],
        },
        // Missing: useAmodiataireDetail
        // Missing: useProfile
      ];
      
      const mockRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            isDeprecated: false,
          },
        ],
        utilityMethods: [],
      };
      
      // Act: Analyze hooks
      const analysis = analyzeHooks(parsedDoc, mockHooks, mockRoutes);
      
      // Assert: Should detect missing hooks
      expect(analysis.issues.length).toBeGreaterThan(0);
      
      const missingHookIssues = analysis.issues.filter(
        issue => issue.type === 'MISSING_HOOK'
      );
      
      expect(missingHookIssues.length).toBeGreaterThanOrEqual(2);
    });
    
    it('should generate a comprehensive report from analysis results', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      const mockRoutes = {
        routes: [],
        utilityMethods: [],
      };
      
      const routeAnalysis = analyzeRoutes(parsedDoc, mockRoutes);
      const typeAnalysis = analyzeTypes(parsedDoc, []);
      const hookAnalysis = analyzeHooks(parsedDoc, [], mockRoutes);
      
      // Act: Generate report
      const report = generateAnalysisReport({
        routeAnalysis,
        typeAnalysis,
        hookAnalysis,
        clientIssues: [],
        warnings: [],
        filesAnalyzed: ['test.md'],
        filesMissing: [],
      });
      
      // Assert: Verify report structure
      expect(report).toBeDefined();
      expect(report.timestamp).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.totalIssues).toBeGreaterThan(0);
      expect(report.summary.issuesByPriority).toBeDefined();
      expect(Array.isArray(report.routeIssues)).toBe(true);
      expect(Array.isArray(report.typeIssues)).toBe(true);
      expect(Array.isArray(report.hookIssues)).toBe(true);
      expect(Array.isArray(report.recommendations)).toBe(true);
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle missing documentation file gracefully', async () => {
      // Arrange: Documentation file doesn't exist
      mockFs.existsSync.mockImplementation((filePath: any) => {
        const pathStr = String(filePath);
        return !pathStr.includes('API_ROUTES_DOCUMENTATION.md');
      });
      
      // Act & Assert: Should throw error for missing critical file
      await expect(analyzeAPI()).rejects.toThrow(/Documentation file not found/);
    });
    
    it('should handle malformed documentation gracefully', () => {
      // Arrange: Malformed documentation
      const malformedDoc = 'This is not valid markdown with API routes';
      
      // Act: Parse documentation
      const parsedDoc = parseApiDocumentation(malformedDoc);
      
      // Assert: Should return empty structures
      expect(parsedDoc.publicRoutes.length).toBe(0);
      expect(parsedDoc.authenticatedRoutes.length).toBe(0);
    });
    
    it('should handle empty implementation gracefully', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      const emptyRoutes = { routes: [], utilityMethods: [] };
      const emptyInterfaces: any[] = [];
      const emptyHooks: any[] = [];
      
      // Act: Analyze with empty implementation
      const routeAnalysis = analyzeRoutes(parsedDoc, emptyRoutes);
      const typeAnalysis = analyzeTypes(parsedDoc, emptyInterfaces);
      const hookAnalysis = analyzeHooks(parsedDoc, emptyHooks, emptyRoutes);
      
      // Assert: Should detect all as missing
      expect(routeAnalysis.issues.length).toBeGreaterThan(0);
      expect(typeAnalysis.issues.length).toBeGreaterThan(0);
      expect(hookAnalysis.issues.length).toBeGreaterThan(0);
      
      // All issues should be MISSING_* type
      expect(routeAnalysis.issues.every(i => i.type === 'MISSING_ROUTE')).toBe(true);
      expect(typeAnalysis.issues.every(i => i.type === 'MISSING_INTERFACE')).toBe(true);
      expect(hookAnalysis.issues.every(i => i.type === 'MISSING_HOOK')).toBe(true);
    });
  });

  describe('Sample Documentation Tests', () => {
    it('should correctly parse all routes from sample documentation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      
      // Act
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Assert: Verify all expected routes are parsed
      expect(parsedDoc.publicRoutes.length).toBeGreaterThanOrEqual(2);
      expect(parsedDoc.authenticatedRoutes.length).toBeGreaterThanOrEqual(2);
      
      // Verify specific routes exist
      const amodiatairesRoute = parsedDoc.publicRoutes.find(
        r => r.endpoint === '/api/mobile/public/amodiataires'
      );
      expect(amodiatairesRoute).toBeDefined();
      expect(amodiatairesRoute?.method).toBe('GET');
      
      const profileRoute = parsedDoc.authenticatedRoutes.find(
        r => r.endpoint === '/api/mobile/profile' && r.method === 'GET'
      );
      expect(profileRoute).toBeDefined();
    });
    
    it('should correctly parse response structures from sample documentation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      
      // Act
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Assert: Verify response structures are parsed
      expect(Object.keys(parsedDoc.responseStructures).length).toBeGreaterThan(0);
      
      // Verify specific structures exist
      expect(parsedDoc.responseStructures['AmodiatairesListResponse']).toBeDefined();
      expect(parsedDoc.responseStructures['AmodiataireDetailResponse']).toBeDefined();
      expect(parsedDoc.responseStructures['ProfileResponse']).toBeDefined();
    });
    
    it('should detect inconsistencies in sample implementation', () => {
      // Arrange
      const sampleDoc = getSampleDocumentation();
      const parsedDoc = parseApiDocumentation(sampleDoc);
      
      // Mock implementation with various issues
      const mockRoutes = {
        routes: [
          {
            name: 'PUBLIC_AMODIATAIRES_V2',
            value: '/api/mobile/public/amodiataires',
            isDeprecated: false,
          },
          {
            name: 'PUBLIC_AMODIATAIRE_DETAILS',
            value: '/api/public/amodiataires/:id', // Wrong path (missing /mobile)
            isDeprecated: false,
          },
          // Missing: /api/mobile/profile routes
        ],
        utilityMethods: [],
      };
      
      const mockInterfaces = [
        {
          name: 'AmodiatairesListResponse',
          properties: [
            { name: 'success', type: 'boolean', optional: false },
            // Missing: count, total, amodiataires properties
          ],
        },
        // Missing: AmodiataireDetailResponse, ProfileResponse
      ];
      
      const mockHooks = [
        {
          name: 'useAmodiataires',
          endpoint: '/api/mobile/public/amodiataires',
          method: 'GET',
          type: 'query' as const,
        },
        // Missing: other hooks
      ];
      
      // Act: Analyze all aspects
      const routeAnalysis = analyzeRoutes(parsedDoc, mockRoutes);
      const typeAnalysis = analyzeTypes(parsedDoc, mockInterfaces);
      const hookAnalysis = analyzeHooks(parsedDoc, mockHooks, mockRoutes);
      
      // Assert: Should detect multiple types of issues
      expect(routeAnalysis.issues.length).toBeGreaterThan(0);
      expect(typeAnalysis.issues.length).toBeGreaterThan(0);
      expect(hookAnalysis.issues.length).toBeGreaterThan(0);
      
      // Verify specific issue types
      const missingRoutes = routeAnalysis.issues.filter(i => i.type === 'MISSING_ROUTE');
      const incorrectPaths = routeAnalysis.issues.filter(i => i.type === 'INCORRECT_PATH');
      const missingInterfaces = typeAnalysis.issues.filter(i => i.type === 'MISSING_INTERFACE');
      const missingProperties = typeAnalysis.issues.filter(i => i.type === 'MISSING_PROPERTY');
      const missingHooks = hookAnalysis.issues.filter(i => i.type === 'MISSING_HOOK');
      
      expect(missingRoutes.length).toBeGreaterThan(0);
      expect(incorrectPaths.length).toBeGreaterThan(0);
      expect(missingInterfaces.length).toBeGreaterThan(0);
      expect(missingProperties.length).toBeGreaterThan(0);
      expect(missingHooks.length).toBeGreaterThan(0);
    });
  });
});

/**
 * Helper function to generate sample documentation for testing
 */
function getSampleDocumentation(): string {
  return `
# API Routes Documentation

## Public Routes (v2)

### GET /api/mobile/public/amodiataires
Returns list of amodiataires with pagination support.

**Query Parameters:**
- limit (optional): Number of results per page (default: 20)
- offset (optional): Pagination offset (default: 0)
- search (optional): Search term to filter results

**Response:** AmodiatairesListResponse
\`\`\`json
{
  "success": true,
  "count": 10,
  "total": 100,
  "amodiataires": [
    {
      "id": "uuid",
      "raisonSociale": "Farm Name",
      "adresse": "123 Farm Road"
    }
  ]
}
\`\`\`

### GET /api/mobile/public/amodiataires/:id
Returns detailed information about a specific amodiataire.

**Path Parameters:**
- id (required): UUID of the amodiataire

**Response:** AmodiataireDetailResponse
\`\`\`json
{
  "success": true,
  "amodiataire": {
    "id": "uuid",
    "userId": "uuid",
    "lot": {
      "numeroLot": "123",
      "raisonSociale": "Farm Name",
      "adresse": "123 Farm Road"
    },
    "profile": {
      "biography": "About the farm",
      "phone": "+33123456789"
    },
    "media": {
      "images": [],
      "videos": [],
      "documents": []
    }
  }
}
\`\`\`

## Authenticated Routes

### GET /api/mobile/profile
Returns the authenticated user's profile information.

**Authentication:** Required (Bearer token)

**Response:** ProfileResponse
\`\`\`json
{
  "id": "uuid",
  "email": "user@example.com",
  "lot": {
    "numeroLot": "123",
    "raisonSociale": "Farm Name"
  }
}
\`\`\`

### PUT /api/mobile/profile
Updates the authenticated user's profile.

**Authentication:** Required (Bearer token)

**Request Body:** ProfileUpdateRequest
\`\`\`json
{
  "biography": "Updated biography",
  "phone": "+33123456789"
}
\`\`\`

**Response:** ProfileUpdateResponse
\`\`\`json
{
  "success": true,
  "profile": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
\`\`\`

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
\`\`\`json
{
  "success": false,
  "error": "Invalid request parameters"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "success": false,
  "error": "Authentication required"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "success": false,
  "error": "Resource not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "success": false,
  "error": "Internal server error"
}
\`\`\`
  `;
}
