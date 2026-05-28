/**
 * Integration test for Type Analyzer
 * Feature: api-routes-complete-analysis
 * 
 * Tests the complete interface comparison logic with realistic data
 */

import { analyzeTypes, generateTypeIssueReport } from '../../src/analyzers/type-analyzer';
import { parseApiTypes } from '../../src/parsers/types-parser';

describe('Type Analyzer Integration', () => {
  it('should analyze types from real documentation and code', () => {
    // This test verifies that the type analyzer can:
    // 1. Compare documented JSON structures with TypeScript interfaces
    // 2. Detect missing interfaces
    // 3. Detect missing properties in interfaces
    // 4. Detect type mismatches (string vs number, etc.)
    // 5. Detect optionality mismatches (required vs optional)
    // 6. Validate nested structures

    const mockDocumentation = {
      publicRoutes: [],
      authenticatedRoutes: [],
      responseStructures: {
        'AmodiataireDetailResponse': {
          type: 'object' as const,
          properties: {
            'success': { type: 'boolean', optional: false },
            'amodiataire': { 
              type: 'AmodiataireDetail', 
              optional: false,
              nested: {
                type: 'object' as const,
                properties: {
                  'id': { type: 'string', optional: false },
                  'userId': { type: 'string', optional: false },
                  'lot': { type: 'LotDetail', optional: false },
                  'profile': { type: 'ProfileDetail', optional: false },
                  'media': { type: 'MediaCollection', optional: false },
                  'stats': { type: 'MediaStats', optional: false },
                },
              },
            },
          },
        },
        'LotDetail': {
          type: 'object' as const,
          properties: {
            'numeroLot': { type: 'string', optional: false },
            'raisonSociale': { type: 'string', optional: false },
            'adresse': { type: 'string', optional: false },
            'superficie': { type: 'number', optional: false },
          },
        },
      },
      errorCodes: [],
    };

    const mockInterfaces = [
      {
        name: 'AmodiataireDetailResponse',
        properties: [
          { name: 'success', type: 'boolean', optional: false },
          { name: 'amodiataire', type: 'AmodiataireDetail', optional: false },
        ],
      },
      {
        name: 'AmodiataireDetail',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'userId', type: 'string', optional: false },
          { name: 'lot', type: 'LotDetail', optional: false },
          { name: 'profile', type: 'ProfileDetail', optional: false },
          { name: 'media', type: 'MediaCollection', optional: false },
          // Missing 'stats' property - should be detected
        ],
      },
      {
        name: 'LotDetail',
        properties: [
          { name: 'numeroLot', type: 'string', optional: false },
          { name: 'raisonSociale', type: 'string', optional: false },
          { name: 'adresse', type: 'string', optional: false },
          // Missing 'superficie' property - should be detected
        ],
      },
    ];

    const result = analyzeTypes(mockDocumentation, mockInterfaces);

    console.log('\n=== Type Analysis Results ===\n');
    console.log(`Total documented structures: ${result.statistics.totalDocumentedStructures}`);
    console.log(`Total implemented interfaces: ${result.statistics.totalImplementedInterfaces}`);
    console.log(`Missing interfaces: ${result.statistics.missingInterfaces}`);
    console.log(`Missing properties: ${result.statistics.missingProperties}`);
    console.log(`Type mismatches: ${result.statistics.typeMismatches}`);
    console.log(`Optionality mismatches: ${result.statistics.optionalityMismatches}`);

    // Should detect missing properties
    expect(result.statistics.missingProperties).toBeGreaterThan(0);

    // Should find the missing 'stats' property in AmodiataireDetail
    const statsIssue = result.issues.find(
      issue => issue.type === 'MISSING_PROPERTY' && 
               issue.interface === 'AmodiataireDetail' && 
               issue.property === 'stats'
    );
    expect(statsIssue).toBeDefined();
    expect(statsIssue?.priority).toBe('HIGH');

    // Should find the missing 'superficie' property in LotDetail
    const superficieIssue = result.issues.find(
      issue => issue.type === 'MISSING_PROPERTY' && 
               issue.interface === 'LotDetail' && 
               issue.property === 'superficie'
    );
    expect(superficieIssue).toBeDefined();

    console.log('\n=== Issues Found ===\n');
    result.issues.forEach((issue, index) => {
      console.log(`${index + 1}. ${issue.type}: ${issue.interface}${issue.property ? '.' + issue.property : ''} (${issue.priority})`);
      if (issue.expected !== undefined) {
        console.log(`   Expected: ${JSON.stringify(issue.expected)}`);
      }
      if (issue.actual !== undefined) {
        console.log(`   Actual: ${JSON.stringify(issue.actual)}`);
      }
    });

    // Generate report
    const report = generateTypeIssueReport(result);
    expect(report).toContain('# Type Analysis Report');
    expect(report).toContain('MISSING PROPERTY');
  });

  it('should handle nested structure validation', () => {
    const mockDocumentation = {
      publicRoutes: [],
      authenticatedRoutes: [],
      responseStructures: {
        'UserProfile': {
          type: 'object' as const,
          properties: {
            'id': { type: 'string', optional: false },
            'address': {
              type: 'Address',
              optional: false,
              nested: {
                type: 'object' as const,
                properties: {
                  'street': { type: 'string', optional: false },
                  'city': { type: 'string', optional: false },
                  'zipCode': { type: 'string', optional: false },
                  'country': { type: 'string', optional: false },
                },
              },
            },
          },
        },
      },
      errorCodes: [],
    };

    const mockInterfaces = [
      {
        name: 'UserProfile',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'address', type: 'Address', optional: false },
        ],
      },
      {
        name: 'Address',
        properties: [
          { name: 'street', type: 'string', optional: false },
          { name: 'city', type: 'string', optional: false },
          // Missing 'zipCode' and 'country' properties
        ],
      },
    ];

    const result = analyzeTypes(mockDocumentation, mockInterfaces);

    // Should detect missing properties in nested structure
    expect(result.statistics.missingProperties).toBe(2);

    const zipCodeIssue = result.issues.find(
      issue => issue.interface === 'Address' && issue.property === 'zipCode'
    );
    expect(zipCodeIssue).toBeDefined();

    const countryIssue = result.issues.find(
      issue => issue.interface === 'Address' && issue.property === 'country'
    );
    expect(countryIssue).toBeDefined();
  });

  it('should detect type and optionality mismatches', () => {
    const mockDocumentation = {
      publicRoutes: [],
      authenticatedRoutes: [],
      responseStructures: {
        'Product': {
          type: 'object' as const,
          properties: {
            'id': { type: 'string', optional: false },
            'price': { type: 'number', optional: false },
            'description': { type: 'string', optional: true },
          },
        },
      },
      errorCodes: [],
    };

    const mockInterfaces = [
      {
        name: 'Product',
        properties: [
          { name: 'id', type: 'string', optional: false },
          { name: 'price', type: 'string', optional: false }, // Wrong type
          { name: 'description', type: 'string', optional: false }, // Wrong optionality
        ],
      },
    ];

    const result = analyzeTypes(mockDocumentation, mockInterfaces);

    // Should detect type mismatch
    expect(result.statistics.typeMismatches).toBe(1);
    const typeMismatch = result.issues.find(
      issue => issue.type === 'TYPE_MISMATCH' && issue.property === 'price'
    );
    expect(typeMismatch).toBeDefined();
    expect(typeMismatch?.expected).toBe('number');
    expect(typeMismatch?.actual).toBe('string');

    // Should detect optionality mismatch
    expect(result.statistics.optionalityMismatches).toBe(1);
    const optionalityMismatch = result.issues.find(
      issue => issue.type === 'OPTIONALITY_MISMATCH' && issue.property === 'description'
    );
    expect(optionalityMismatch).toBeDefined();
    expect(optionalityMismatch?.expected).toBe(true);
    expect(optionalityMismatch?.actual).toBe(false);
  });
});
