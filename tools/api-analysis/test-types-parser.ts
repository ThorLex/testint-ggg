/**
 * Quick test script to verify the types parser works with the actual api.ts file
 */

import * as path from 'path';
import { parseApiTypes, findInterface, findProperty } from './src/parsers/types-parser';

const projectRoot = path.join(__dirname, '..', '..');
const apiTypesPath = path.join(projectRoot, 'src', 'types', 'api.ts');

console.log('Parsing api.ts from:', apiTypesPath);
console.log('');

const interfaces = parseApiTypes(apiTypesPath);

console.log(`Found ${interfaces.length} interfaces\n`);

// Show first 10 interfaces
console.log('First 10 interfaces:');
interfaces.slice(0, 10).forEach(iface => {
  console.log(`  - ${iface.name} (${iface.properties.length} properties)`);
  if (iface.extends) {
    console.log(`    extends: ${iface.extends.join(', ')}`);
  }
});

console.log('\n--- Detailed view of AmodiataireDetail ---');
const amodiataireDetail = findInterface(interfaces, 'AmodiataireDetail');
if (amodiataireDetail) {
  console.log(`Interface: ${amodiataireDetail.name}`);
  if (amodiataireDetail.comment) {
    console.log(`Comment: ${amodiataireDetail.comment}`);
  }
  console.log('Properties:');
  amodiataireDetail.properties.forEach(prop => {
    const optional = prop.optional ? '?' : '';
    console.log(`  ${prop.name}${optional}: ${prop.type}`);
    if (prop.comment) {
      console.log(`    // ${prop.comment}`);
    }
  });
}

console.log('\n--- Detailed view of MediaDetail ---');
const mediaDetail = findInterface(interfaces, 'MediaDetail');
if (mediaDetail) {
  console.log(`Interface: ${mediaDetail.name}`);
  if (mediaDetail.comment) {
    console.log(`Comment: ${mediaDetail.comment}`);
  }
  console.log('Properties:');
  mediaDetail.properties.forEach(prop => {
    const optional = prop.optional ? '?' : '';
    console.log(`  ${prop.name}${optional}: ${prop.type}`);
  });
}

console.log('\n--- Interfaces with inheritance ---');
const withInheritance = interfaces.filter(iface => iface.extends && iface.extends.length > 0);
console.log(`Found ${withInheritance.length} interfaces with inheritance:`);
withInheritance.forEach(iface => {
  console.log(`  ${iface.name} extends ${iface.extends!.join(', ')}`);
});

console.log('\n✓ Parser test completed successfully!');
