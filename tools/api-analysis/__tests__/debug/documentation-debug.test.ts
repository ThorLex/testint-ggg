/**
 * Debug test for documentation parser
 */

import * as path from 'path';
import * as fs from 'fs';
import { parseApiDocumentation } from '../../src/parsers/documentation-parser';

describe('Documentation Parser Debug', () => {
  it('should parse real documentation', () => {
    const workspaceRoot = path.resolve(__dirname, '../../../..');
    const documentationPath = path.join(workspaceRoot, 'API_ROUTES_DOCUMENTATION.md');
    
    if (!fs.existsSync(documentationPath)) {
      console.log('Documentation file not found, skipping test');
      return;
    }

    const content = fs.readFileSync(documentationPath, 'utf-8');
    console.log('Documentation content length:', content.length);
    console.log('First 500 chars:', content.substring(0, 500));
    
    const parsed = parseApiDocumentation(content);
    
    console.log('Parsed results:');
    console.log('- Public routes:', parsed.publicRoutes.length);
    console.log('- Authenticated routes:', parsed.authenticatedRoutes.length);
    console.log('- Response structures:', Object.keys(parsed.responseStructures).length);
    console.log('- Error codes:', parsed.errorCodes.length);
    
    if (parsed.publicRoutes.length > 0) {
      console.log('First public route:', parsed.publicRoutes[0]);
    }
    
    if (parsed.authenticatedRoutes.length > 0) {
      console.log('First authenticated route:', parsed.authenticatedRoutes[0]);
    }
  });
});