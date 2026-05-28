/**
 * Debug test to see what's being parsed
 */

import { parseApiDocumentation } from '../../src/parsers/documentation-parser';
import * as fs from 'fs';
import * as path from 'path';

describe('Debug Parser', () => {
  it('should show what is parsed', () => {
    const docPath = path.join(process.cwd(), '..', '..', 'API_ROUTES_DOCUMENTATION.md');
    const markdown = fs.readFileSync(docPath, 'utf-8');
    const parsed = parseApiDocumentation(markdown);
    
    console.log('\n=== PARSED RESULTS ===');
    console.log('Public routes:', parsed.publicRoutes.length);
    console.log('Authenticated routes:', parsed.authenticatedRoutes.length);
    console.log('Error codes:', parsed.errorCodes.length);
    console.log('Response structures:', Object.keys(parsed.responseStructures).length);
    
    console.log('\n=== PUBLIC ROUTES ===');
    parsed.publicRoutes.forEach((route, i) => {
      console.log(`\n${i + 1}. ${route.method} ${route.endpoint}`);
      console.log(`   Description: ${route.description}`);
      console.log(`   Query params: ${route.queryParams?.length || 0}`);
      console.log(`   Path params: ${route.pathParams?.length || 0}`);
      console.log(`   Has response body: ${!!route.responseBody}`);
    });
    
    console.log('\n=== AUTHENTICATED ROUTES ===');
    parsed.authenticatedRoutes.forEach((route, i) => {
      console.log(`\n${i + 1}. ${route.method} ${route.endpoint}`);
    });
    
    console.log('\n=== ERROR CODES ===');
    parsed.errorCodes.forEach(error => {
      console.log(`${error.code}: ${error.message}`);
    });
  });
});
