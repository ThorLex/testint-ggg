const fs = require('fs');
const path = require('path');

// Read and parse the documentation
const docPath = path.join(process.cwd(), 'API_ROUTES_DOCUMENTATION.md');
const markdown = fs.readFileSync(docPath, 'utf-8');

// Simple parser to check what's in the file
const lines = markdown.split('\n');
let routeCount = 0;
let endpointCount = 0;

console.log('=== ANALYZING API_ROUTES_DOCUMENTATION.md ===\n');

for (let i = 0; i < Math.min(lines.length, 100); i++) {
  const line = lines[i];
  
  if (line.match(/^###\s+\d+\./)) {
    routeCount++;
    console.log(`Line ${i}: ROUTE HEADER - ${line}`);
  }
  
  if (line.includes('**Endpoint:**')) {
    endpointCount++;
    console.log(`Line ${i}: ENDPOINT - ${line}`);
  }
}

console.log(`\nTotal route headers found (first 100 lines): ${routeCount}`);
console.log(`Total endpoints found (first 100 lines): ${endpointCount}`);
console.log(`\nTotal lines in file: ${lines.length}`);
