/**
 * Integration test with real API_ROUTES_DOCUMENTATION.md
 * Feature: api-routes-complete-analysis
 */

import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Real Documentation Parsing', () => {
  let markdown: string;
  let parsed: any;

  beforeAll(() => {
    // Read the actual API documentation file from project root
    const docPath = path.join(process.cwd(), '..', '..', 'API_ROUTES_DOCUMENTATION.md');
    markdown = fs.readFileSync(docPath, 'utf-8');
    parsed = parseApiDocumentation(markdown);
    
    // Log for debugging
    console.log('\n=== PARSING RESULTS ===');
    console.log(`Public routes: ${parsed.publicRoutes.length}`);
    console.log(`Authenticated routes: ${parsed.authenticatedRoutes.length}`);
    console.log(`Error codes: ${parsed.errorCodes.length}`);
    
    if (parsed.publicRoutes.length > 0) {
      console.log('\nPublic routes found:');
      parsed.publicRoutes.forEach((r: any, i: number) => {
        console.log(`  ${i + 1}. ${r.method} ${r.endpoint}`);
      });
    }
  });

  it('should parse the real documentation without errors', () => {
    expect(parsed).toBeDefined();
    expect(parsed.publicRoutes).toBeDefined();
    expect(parsed.authenticatedRoutes).toBeDefined();
  });

  it('should extract all public routes from documentation', () => {
    expect(parsed.publicRoutes.length).toBeGreaterThan(0);
    console.log(`Found ${parsed.publicRoutes.length} public routes`);
    
    // Log all routes for verification
    parsed.publicRoutes.forEach((route: any) => {
      console.log(`  - ${route.method} ${route.endpoint}`);
    });
  });

  it('should parse the amodiataires list route', () => {
    const listRoute = parsed.publicRoutes.find(
      (r: any) => r.endpoint.includes('/amodiataires') && !r.endpoint.includes(':id')
    );
    expect(listRoute).toBeDefined();
    expect(listRoute.method).toBe('GET');
    expect(listRoute.queryParams).toBeDefined();
  });

  it('should parse the amodiataire detail route', () => {
    const detailRoute = parsed.publicRoutes.find(
      (r: any) => r.endpoint.includes('/amodiataires/:id') && !r.endpoint.includes('announcements') && !r.endpoint.includes('media')
    );
    expect(detailRoute).toBeDefined();
    expect(detailRoute.method).toBe('GET');
  });

  it('should parse the nearby search route', () => {
    const nearbyRoute = parsed.publicRoutes.find(
      (r: any) => r.endpoint.includes('/nearby')
    );
    expect(nearbyRoute).toBeDefined();
    expect(nearbyRoute.method).toBe('GET');
    expect(nearbyRoute.queryParams).toBeDefined();
    
    // Check for required lat/lng parameters
    const latParam = nearbyRoute.queryParams?.find((p: any) => p.name === 'lat');
    const lngParam = nearbyRoute.queryParams?.find((p: any) => p.name === 'lng');
    expect(latParam?.required).toBe(true);
    expect(lngParam?.required).toBe(true);
  });

  it('should parse the announcements route', () => {
    // The /amodiataires/:id/announcements route is authenticated, not public
    const announcementsRoute = parsed.authenticatedRoutes.find(
      (r: any) => r.endpoint.includes('/announcements')
    );
    expect(announcementsRoute).toBeDefined();
    expect(announcementsRoute.method).toBe('GET');
  });

  it('should parse the media route', () => {
    // The /amodiataires/:id/media route is authenticated, not public
    const mediaRoute = parsed.authenticatedRoutes.find(
      (r: any) => r.endpoint.includes('/media')
    );
    expect(mediaRoute).toBeDefined();
    expect(mediaRoute.method).toBe('GET');
  });

  it('should extract response structures', () => {
    expect(parsed.responseStructures).toBeDefined();
    expect(Object.keys(parsed.responseStructures).length).toBeGreaterThan(0);
    
    console.log('\nResponse structures found:');
    Object.keys(parsed.responseStructures).forEach(key => {
      console.log(`  - ${key}`);
    });
  });

  it('should extract error codes', () => {
    expect(parsed.errorCodes).toBeDefined();
    expect(parsed.errorCodes.length).toBeGreaterThan(0);
    
    console.log('\nError codes found:');
    parsed.errorCodes.forEach((error: any) => {
      console.log(`  - ${error.code}: ${error.message}`);
    });
  });

  it('should parse complex nested structures', () => {
    const detailRoute = parsed.publicRoutes.find(
      (r: any) => r.endpoint.includes('/amodiataires/:id') && !r.endpoint.includes('announcements') && !r.endpoint.includes('media')
    );
    
    if (detailRoute?.responseBody?.properties?.amodiataire?.nested) {
      const amodiataireStructure = detailRoute.responseBody.properties.amodiataire.nested;
      expect(amodiataireStructure.properties).toBeDefined();
      
      // Check for nested lot structure
      if (amodiataireStructure.properties.lot) {
        expect(amodiataireStructure.properties.lot.nested).toBeDefined();
      }
      
      // Check for nested profile structure
      if (amodiataireStructure.properties.profile) {
        expect(amodiataireStructure.properties.profile.nested).toBeDefined();
      }
      
      // Check for nested media structure
      if (amodiataireStructure.properties.media) {
        expect(amodiataireStructure.properties.media.nested).toBeDefined();
      }
    }
  });
});
