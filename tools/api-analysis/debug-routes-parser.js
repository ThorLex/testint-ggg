const { parseRoutesFile } = require('./src/parsers/routes-parser');
const path = require('path');

const routesFilePath = path.resolve(__dirname, '../../src/services/api/routes.ts');
const result = parseRoutesFile(routesFilePath);

const getDetailsMethod = result.utilityMethods.find(m => m.name === 'getAmodiataireDetailsUrl');

console.log('getAmodiataireDetailsUrl method:');
console.log(JSON.stringify(getDetailsMethod, null, 2));

console.log('\nAll utility methods:');
result.utilityMethods.forEach(m => {
  console.log(`- ${m.name}: usesRoute = ${m.usesRoute}`);
});
