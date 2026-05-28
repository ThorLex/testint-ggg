const fs = require('fs');
const path = require('path');

// Import the compiled parser
const { parseApiDocumentation } = require('./dist/src/parsers/documentation-parser');

const docPath = path.join(process.cwd(), 'API_ROUTES_DOCUMENTATION.md');
const markdown = fs.readFileSync(docPath, 'utf-8');

console.log('Parsing documentation...\n');

const result = parseApiDocumentation(markdown);

console.log('=== RESULTS ===');
console.log('Public routes:', result.publicRoutes.length);
console.log('Authenticated routes:', result.authenticatedRoutes.length);
console.log('Error codes:', result.errorCodes.length);
console.log('Response structures:', Object.keys(result.responseStructures).length);

if (result.publicRoutes.length > 0) {
  console.log('\n=== PUBLIC ROUTES ===');
  result.publicRoutes.forEach((route, i) => {
    console.log(`${i + 1}. ${route.method} ${route.endpoint}`);
    console.log(`   Query params: ${route.queryParams?.length || 0}`);
    console.log(`   Path params: ${route.pathParams?.length || 0}`);
  });
}

if (result.errorCodes.length > 0) {
  console.log('\n=== ERROR CODES ===');
  result.errorCodes.forEach(error => {
    console.log(`${error.code}: ${error.message}`);
  });
}
